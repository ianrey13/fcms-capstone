// app/auth/trips/active.tsx - Professional Active Trip Screen with Fixed Status Display
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  ScrollView, 
  Modal, 
  Linking, 
  Animated, 
  Dimensions, 
  StatusBar,
  StyleSheet,
  Platform,
  Vibration
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { driverAPI, gpsAPI } from '../../../services/api';

const { width, height } = Dimensions.get('window');

interface Trip {
  trip_ticket_id: number;
  trip_ticket_number: string;
  destination: string;
  trip_date: string;
  status: string;
  vehicle?: {
    plate_number: string;
    vehicle_model: string;
    fuel_type?: string;
  };
  driver?: {
    full_name: string;
  };
  amount_released?: number;
  charge_to?: string;
  purpose?: string;
  estimated_fuel_liters?: number;
  estimated_distance_km?: number;
}

type TrackingState = 'idle' | 'starting' | 'tracking' | 'error' | 'stopping';

export default function ActiveTripScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // State
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  const [locationStatus, setLocationStatus] = useState('Waiting to start');
  const [gpsCount, setGpsCount] = useState(0);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentAccuracy, setCurrentAccuracy] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lastPingTime, setLastPingTime] = useState<string | null>(null);

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tripId = id || trip?.trip_ticket_id;

  const router_back = useRouter();

  useEffect(() => {
    fetchActiveTrip();
    requestLocationPermission();

    return () => {
      cleanupTracking();
    };
  }, []);

  // ✅ Start timer when tracking starts
  useEffect(() => {
    if (trackingState === 'tracking') {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [trackingState]);

  const cleanupTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const fetchActiveTrip = async () => {
    try {
      console.log('Fetching active trip...');
      const response = await driverAPI.getActiveTrip();
      console.log('API Response:', response.data);
      
      const tripData = response.data?.data || response.data;
      console.log('Trip data:', tripData);
      console.log('Trip status:', tripData?.status);
      
      setTrip(tripData);
      
      // If trip is already in_transit, set tracking state to tracking
      if (tripData?.status === 'in_transit') {
        setTrackingState('tracking');
        setLocationStatus('GPS Active - Trip in progress');
        
        // Start sending GPS pings immediately
        const activeTripId = Number(tripId || tripData?.trip_ticket_id);
        if (activeTripId) {
          await sendGpsPing(activeTripId);
          intervalRef.current = setInterval(async () => {
            await sendGpsPing(activeTripId);
          }, 30000);
        }
      }
      
    } catch (error: any) {
      console.error('Failed to fetch active trip:', error);
      Alert.alert(
        'Connection Error',
        'Unable to load trip details. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'GPS tracking is required for trip monitoring and safety compliance.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  const startTracking = async () => {
    if (!tripId && !trip?.trip_ticket_id) {
      Alert.alert('Error', 'Trip ID not found. Please return to dashboard.');
      return;
    }

    setTrackingState('starting');
    setLocationStatus('Initializing GPS...');

    const activeTripId = Number(tripId || trip?.trip_ticket_id);

    try {
      await driverAPI.startTrip(activeTripId);
      setTrackingState('tracking');
      setLocationStatus('GPS Active - Sending location');
      setElapsedTime(0);
      setGpsCount(0);

      if (Platform.OS === 'ios') {
        Vibration.vibrate([0, 100, 50, 100]);
      }

      await sendGpsPing(activeTripId);

      intervalRef.current = setInterval(async () => {
        await sendGpsPing(activeTripId);
      }, 30000);

    } catch (error: any) {
      console.error('Start trip error:', error);
      setTrackingState('error');
      setLocationStatus('Failed to start tracking');

      let errorMsg = 'Failed to start trip. Please try again.';
      if (error.response?.status === 403) {
        errorMsg = 'Trip cannot be started. It may already be in transit.';
      } else if (error.response?.status === 404) {
        errorMsg = 'Trip not found. Please return to dashboard.';
      }

      Alert.alert('Start Failed', errorMsg);
    }
  };

  const sendGpsPing = async (activeTripId: number) => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const accuracy = location.coords.accuracy ?? 0;
      const speed = (location.coords.speed ?? 0) * 3.6;
      const isLowAccuracy = accuracy > 50;

      setCurrentSpeed(speed);
      setCurrentAccuracy(accuracy);

      await gpsAPI.sendPing({
        trip_ticket_id: activeTripId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy_meters: accuracy,
        speed_kmh: speed,
        is_low_accuracy: isLowAccuracy,
      });

      setGpsCount(prev => prev + 1);
      setLastPingTime(new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setLocationStatus(`${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}`);

    } catch (error) {
      console.error('GPS ping error:', error);
      setLocationStatus('Signal weak - retrying...');
    }
  };

  const stopTracking = useCallback(() => {
    cleanupTracking();
    setTrackingState('idle');
    setLocationStatus('Tracking stopped');
    setCurrentSpeed(0);
    setElapsedTime(0);
  }, [cleanupTracking]);

  const handleCompleteTrip = async () => {
    const activeTripId = Number(tripId || trip?.trip_ticket_id);

    Alert.alert(
      'Complete Trip',
      'Have you refueled and uploaded the receipt?\n\nThis action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload Receipt First',
          onPress: () => handleUploadReceipt(),
        },
        {
          text: 'Yes, Complete',
          style: 'destructive',
          onPress: async () => {
            stopTracking();
            try {
              await driverAPI.completeTrip(activeTripId);

              if (Platform.OS === 'ios') {
                Vibration.vibrate([0, 200, 100, 200]);
              }

              Alert.alert(
                'Trip Completed',
                'Your trip has been successfully completed.',
                [{ text: 'OK', onPress: () => router_back.replace('/auth') }]
              );
            } catch (error: any) {
              console.error('Complete trip error:', error);
              Alert.alert('Completion Failed', 'Unable to complete trip. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleUploadReceipt = () => {
    router_back.push({
      pathname: '/auth/receipt',
      params: { 
        id: tripId || trip?.trip_ticket_id,
        tripNumber: trip?.trip_ticket_number 
      }
    });
  };

  const handleGoBack = () => {
    router_back.back();
  };

  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Not specified';
      return date.toLocaleDateString('en-PH', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Not specified';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount || amount === 0) return 'Not released';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // ✅ FIXED: Correct status configuration
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bgColor: string; icon: keyof typeof Ionicons.glyphMap }> = {
      in_transit: { 
        label: 'IN TRANSIT', 
        color: '#22c55e', 
        bgColor: 'rgba(34, 197, 94, 0.15)',
        icon: 'navigate-circle'
      },
      acknowledged: { 
        label: 'READY TO START', 
        color: '#3b82f6', 
        bgColor: 'rgba(59, 130, 246, 0.15)',
        icon: 'checkmark-circle'
      },
      funds_issued: { 
        label: 'AWAITING ACKNOWLEDGMENT', 
        color: '#f59e0b', 
        bgColor: 'rgba(245, 158, 11, 0.15)',
        icon: 'time'
      },
    };
    return configs[status] || { 
      label: status?.toUpperCase()?.replace(/_/g, ' ') || 'UNKNOWN', 
      color: '#6b7280', 
      bgColor: 'rgba(107, 114, 128, 0.15)',
      icon: 'help-circle'
    };
  };

  const getVehicleDisplay = () => {
    if (!trip?.vehicle) return 'Not assigned';
    if (trip.vehicle.plate_number && trip.vehicle.vehicle_model) {
      return `${trip.vehicle.plate_number} • ${trip.vehicle.vehicle_model}`;
    }
    if (trip.vehicle.plate_number) return trip.vehicle.plate_number;
    if (trip.vehicle.vehicle_model) return trip.vehicle.vehicle_model;
    return 'Not assigned';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading trip details...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.emptyGradient}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="car-outline" size={64} color="#475569" />
          </View>
          <Text style={styles.emptyTitle}>No Active Trip</Text>
          <Text style={styles.emptySubtitle}>
            You don't have any active trip at the moment.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router_back.replace('/auth')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.emptyButtonGradient}>
              <Text style={styles.emptyButtonText}>Go to Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const statusConfig = getStatusConfig(trip.status);
  const isTracking = trackingState === 'tracking';
  const isStarting = trackingState === 'starting';
  
  // ✅ Check if action buttons should be shown
  const showStartButton = !isTracking && !isStarting && trip.status !== 'in_transit';
  const showTrackingUI = isTracking || isStarting || trip.status === 'in_transit';

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#1e40af']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Active Trip</Text>
              <Text style={styles.headerSubtitle}>{trip.trip_ticket_number || 'Trip in Progress'}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowHelpModal(true)} style={styles.helpButton} activeOpacity={0.7}>
              <Ionicons name="help-circle-outline" size={24} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Status Badge */}
          <View style={styles.statusBadgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Trip Info Card */}
          <View style={styles.tripCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="information-circle" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.cardTitle}>Trip Details</Text>
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="location-outline" size={16} color="#9ca3af" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Destination</Text>
                  <Text style={styles.detailValue}>{trip.destination || 'Not specified'}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="car-outline" size={16} color="#9ca3af" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Vehicle</Text>
                  <Text style={styles.detailValue}>{getVehicleDisplay()}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Trip Date</Text>
                  <Text style={styles.detailValue}>{formatDate(trip.trip_date)}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="business-outline" size={16} color="#9ca3af" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Charge To</Text>
                  <Text style={styles.detailValue}>{trip.charge_to || 'Department account'}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="document-text-outline" size={16} color="#9ca3af" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Purpose</Text>
                  <Text style={styles.detailValue}>{trip.purpose || 'Official travel'}</Text>
                </View>
              </View>

              {trip.amount_released && Number(trip.amount_released) > 0 && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons name="cash-outline" size={16} color="#059669" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Amount Released</Text>
                    <Text style={[styles.detailValue, styles.amountValue]}>
                      {formatCurrency(trip.amount_released)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* GPS Tracking Card - Show when tracking or trip is in_transit */}
          {showTrackingUI && (
            <View style={styles.trackingCard}>
              <LinearGradient
                colors={['#1e293b', '#0f172a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.trackingGradient}
              >
                <View style={styles.trackingHeader}>
                  <View style={styles.trackingTitleRow}>
                    <View style={[styles.trackingDot, { backgroundColor: isTracking ? '#22c55e' : '#3b82f6' }]} />
                    <View>
                      <Text style={styles.trackingTitle}>
                        {isStarting ? 'Initializing...' : 'GPS Tracking Active'}
                      </Text>
                      <Text style={styles.trackingSubtitle}>
                        {isStarting ? 'Acquiring satellite signal' : 'Sending location every 30 seconds'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.pingBadge}>
                    <Text style={styles.pingBadgeText}>{gpsCount} pings</Text>
                  </View>
                </View>

                <View style={styles.timerContainer}>
                  <Text style={styles.timerLabel}>Elapsed Time</Text>
                  <Text style={styles.timerValue}>{formatElapsedTime(elapsedTime)}</Text>
                </View>

                <View style={styles.speedometerContainer}>
                  <View style={styles.speedometerHeader}>
                    <Ionicons name="speedometer-outline" size={18} color="#60a5fa" />
                    <Text style={styles.speedometerLabel}>Current Speed</Text>
                  </View>
                  <View style={styles.speedDisplay}>
                    <Text style={styles.speedValue}>{Math.round(currentSpeed)}</Text>
                    <Text style={styles.speedUnit}>km/h</Text>
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Ionicons name="location-outline" size={16} color="#6b7280" />
                    <Text style={styles.statLabel}>Accuracy</Text>
                    <Text style={styles.statValue}>{Math.round(currentAccuracy)}m</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Ionicons name="time-outline" size={16} color="#6b7280" />
                    <Text style={styles.statLabel}>Last Ping</Text>
                    <Text style={styles.statValue}>{lastPingTime || '--:--:--'}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Ionicons name="refresh-outline" size={16} color="#6b7280" />
                    <Text style={styles.statLabel}>Interval</Text>
                    <Text style={styles.statValue}>30s</Text>
                  </View>
                </View>

                <View style={styles.locationStatusContainer}>
                  <Ionicons name="navigate-outline" size={14} color="#6b7280" />
                  <Text style={styles.locationStatusText} numberOfLines={1}>
                    {locationStatus}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {showStartButton && (
              <TouchableOpacity onPress={startTracking} activeOpacity={0.8} style={styles.actionButton}>
                <LinearGradient colors={['#059669', '#047857']} style={styles.actionGradient}>
                  <Ionicons name="play-circle" size={24} color="white" />
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>START TRIP</Text>
                    <Text style={styles.actionSubtitle}>Begin GPS tracking</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {isStarting && (
              <View style={styles.startingButton}>
                <ActivityIndicator size="small" color="#22c55e" />
                <Text style={styles.startingText}>Initializing GPS...</Text>
              </View>
            )}

            <TouchableOpacity onPress={handleUploadReceipt} activeOpacity={0.8} style={styles.actionButton}>
              <LinearGradient colors={['#d97706', '#b45309']} style={styles.actionGradient}>
                <Ionicons name="camera" size={24} color="white" />
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>UPLOAD RECEIPT</Text>
                  <Text style={styles.actionSubtitle}>Take photo of fuel receipt</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCompleteTrip} activeOpacity={0.8} style={styles.actionButton}>
              <LinearGradient colors={['#dc2626', '#b91c1c']} style={styles.actionGradient}>
                <MaterialCommunityIcons name="flag-checkered" size={24} color="white" />
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>COMPLETE TRIP</Text>
                  <Text style={styles.actionSubtitle}>Finish and close trip</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Help Modal */}
        <Modal visible={showHelpModal} transparent={true} animationType="fade" onRequestClose={() => setShowHelpModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Trip Guide</Text>
                <TouchableOpacity onPress={() => setShowHelpModal(false)} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={22} color="white" />
                </TouchableOpacity>
              </LinearGradient>

              <View style={styles.modalContent}>
                {[
                  { step: '1', icon: 'navigate-circle-outline', color: '#3b82f6', bgColor: '#dbeafe', title: 'GPS Tracking', description: 'GPS sends your location every 30 seconds. Keep the app open.' },
                  { step: '2', icon: 'camera-outline', color: '#d97706', bgColor: '#fef3c7', title: 'Receipt Upload', description: 'Take a clear photo of your fuel receipt after refueling.' },
                  { step: '3', icon: 'flag-outline', color: '#dc2626', bgColor: '#fee2e2', title: 'Complete Trip', description: 'Only complete the trip AFTER uploading the receipt.' },
                ].map((item, index) => (
                  <View key={index} style={styles.guideItem}>
                    <View style={[styles.guideIconContainer, { backgroundColor: item.bgColor }]}>
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <View style={styles.guideContent}>
                      <Text style={styles.guideTitle}>{item.title}</Text>
                      <Text style={styles.guideDescription}>{item.description}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.modalButton} onPress={() => setShowHelpModal(false)}>
                <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.modalButtonGradient}>
                  <Text style={styles.modalButtonText}>Got it</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingContainer: { flex: 1 },
  loadingGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: 'rgba(255, 255, 255, 0.7)', marginTop: 16, fontSize: 15, fontWeight: '500' },

  emptyContainer: { flex: 1 },
  emptyGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIconContainer: { width: 100, height: 100, borderRadius: 28, backgroundColor: 'rgba(255, 255, 255, 0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  emptyButton: { borderRadius: 14, overflow: 'hidden' },
  emptyButtonGradient: { paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center' },
  emptyButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },

  statusBadgeContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },

  tripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 20,
  },
  amountValue: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 15,
  },

  trackingCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  trackingGradient: {
    padding: 20,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  trackingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  trackingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  trackingSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    fontWeight: '500',
  },
  pingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4ade80',
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  speedometerContainer: {
    marginBottom: 16,
  },
  speedometerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  speedometerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  speedDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 12,
  },
  speedValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  speedUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    marginLeft: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  locationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  locationStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    flex: 1,
  },

  actionsContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  startingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
  },
  startingText: {
    color: '#22c55e',
    fontSize: 15,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 20,
    gap: 16,
  },
  guideItem: {
    flexDirection: 'row',
    gap: 14,
  },
  guideIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideContent: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  guideDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
  },
  modalButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});