// app/auth/(tabs)/index.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator, 
  Alert,
  Animated,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { driverAPI } from '../../../services/api';
import { storage } from '../../../utils/storage';
import EventEmitter from '../../../utils/eventEmitter';
import GasSlipModal from '../components/GasSlipModal';
// ✅ ADD TOAST
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================

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
  amount_released?: number;
}

type StatusConfig = {
  bg: string;
  bgLight: string;
  text: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  actionGradient: [string, string];
  borderColor: string;
};

// ============================================
// COMPONENT
// ============================================

export default function DriverDashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [selectedGasSlip, setSelectedGasSlip] = useState<any>(null);
  const [showGasSlipModal, setShowGasSlipModal] = useState(false);
  const [acknowledging, setAcknowledging] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];
  
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // LIFE CYCLE
  // ============================================

  useEffect(() => {
    loadUser();
    fetchTrips();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    // ============================================
    // ✅ EVENT LISTENERS WITH TOAST
    // ============================================

    const handleNewNotification = (data: any) => {
      console.log('📨 Dashboard: New notification event received!', data?.notification_type);
      
      // Show toast for general notifications
      if (data?.message) {
        Toast.show({
          type: 'default',
          text1: '📨 New Notification',
          text2: data.message,
        });
      }
      
      fetchTrips();
    };

   const handleFundRelease = (data: any) => {
  console.log('💰 Dashboard: Fund release event received!', data);
  console.log('💰 Showing toast for fund release...');
  
  // ✅ SHOW TOAST
  Toast.show({
    type: 'fundRelease',
    text1: '💰 Fund Released!',
    text2: data?.message || 'Trip funds have been released. Start your trip now!',
    props: {
      onPress: () => {
        console.log('👆 Toast pressed - navigating to active trip');
        router.push('/auth/trips/active');
      },
    },
  });
  
  // Refresh trips after showing toast
  setTimeout(() => {
    fetchTrips();
  }, 500);
};

    const handleTripAssigned = (data: any) => {
      console.log('🚗 Dashboard: Trip assigned event received!', data);
      
      // ✅ SHOW TRIP ASSIGNMENT TOAST
      Toast.show({
        type: 'tripAssigned',
        text1: '🚗 New Trip Assigned!',
        text2: data?.message || 'A new trip has been assigned to you.',
        props: {
          onPress: () => {
            router.push('/auth/trips/active');
          },
        },
      });
      
      fetchTrips();
    };

    console.log('📢 Dashboard: Registering event listeners...');
    EventEmitter.on('new-notification', handleNewNotification);
    EventEmitter.on('fund_released', handleFundRelease);
    EventEmitter.on('trip_assigned', handleTripAssigned);

    // ============================================
    // ✅ POLLING FALLBACK (Refresh every 30 seconds)
    // ============================================
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      console.log('🔄 Dashboard: Auto-refresh polling...');
      fetchTrips();
    }, 30000);

    // ============================================
    // CLEANUP
    // ============================================

    return () => {
      console.log('🧹 Dashboard: Cleaning up...');
      EventEmitter.off('new-notification', handleNewNotification);
      EventEmitter.off('fund_released', handleFundRelease);
      EventEmitter.off('trip_assigned', handleTripAssigned);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('📱 Dashboard focused - refreshing...');
      fetchTrips();
      loadUser();
    }, [])
  );

  // ============================================
  // DATA FETCHING
  // ============================================

  const loadUser = async () => {
    try {
      const userStr = await storage.getItem('fcms_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const displayName = user?.full_name || 
                           user?.name || 
                           (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : null) ||
                           user?.username ||
                           user?.email?.split('@')[0] ||
                           'Driver';
        setUserName(displayName);
      } else {
        setUserName('Driver');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUserName('Driver');
    }
  };

  const fetchTrips = async () => {
    try {
      console.log('📤 Fetching trips...');
      const response = await driverAPI.getTrips();
      const tripsData = response.data?.data || [];
      console.log('📥 Trips fetched:', tripsData.length);
      setTrips(tripsData);
      setLastRefreshTime(new Date());
    } catch (error: any) {
      console.error('Failed to fetch trips:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
    loadUser();
  };

  // ============================================
  // ACTIONS
  // ============================================

  const handleAcknowledge = async (tripId: number, tripNumber: string) => {
    Alert.alert(
      'Acknowledge Gas Slip',
      `Confirm acknowledgment for trip #${tripNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Receive Amount', 
          style: 'default',
          onPress: async () => {
            setAcknowledging(tripId);
            try {
              const response = await driverAPI.acknowledgeFunds(tripId);
              if (response.data.success) {
                await fetchTrips();
                router.push(`/auth/trips/active?id=${tripId}`);
              }
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'Failed to acknowledge gas slip');
            } finally {
              setAcknowledging(null);
            }
          }
        },
      ]
    );
  };

  const handleViewGasSlip = async (tripId: number) => {
    try {
      setLoading(true);
      const response = await driverAPI.getGasSlip(tripId);
      const gasSlipData = response.data?.data;
      
      console.log('Setting gasSlip data:', gasSlipData);
      console.log('Vehicle data:', gasSlipData?.vehicle);
      
      setSelectedGasSlip(gasSlipData);
      setShowGasSlipModal(true);
    } catch (error) {
      console.error('Failed to fetch gas slip:', error);
      Alert.alert('Error', 'Failed to load gas slip details');
    } finally {
      setLoading(false);
    }
  };

  const testToast = () => {
  console.log('🧪 Testing toast...');
  Toast.show({
    type: 'fundRelease',
    text1: '🧪 Test Toast',
    text2: 'This is a test toast notification!',
    props: {
      onPress: () => console.log('Toast pressed!'),
    },
  });
};

  const handleTripAction = (trip: Trip) => {
    switch (trip.status) {
      case 'funds_issued':
        handleAcknowledge(trip.trip_ticket_id, trip.trip_ticket_number);
        break;
      case 'acknowledged':
      case 'in_transit':
        router.push(`/auth/trips/active?id=${trip.trip_ticket_id}`);
        break;
      default:
        break;
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  const getStatusConfig = (status: string): StatusConfig => {
    const configs: Record<string, StatusConfig> = {
      funds_issued: {
        bg: '#fef3c7', bgLight: '#fffbeb', text: '#d97706', label: 'Awaiting Acknowledgment',
        icon: 'document-text-outline', actionLabel: 'Receive Amount', 
        actionGradient: ['#059669', '#047857'], borderColor: '#fbbf24',
      },
      acknowledged: {
        bg: '#dbeafe', bgLight: '#eff6ff', text: '#2563eb', label: 'Ready to Start',
        icon: 'checkmark-circle-outline', actionLabel: 'Start Trip', 
        actionGradient: ['#2563eb', '#1d4ed8'], borderColor: '#60a5fa',
      },
      in_transit: {
        bg: '#d1fae5', bgLight: '#ecfdf5', text: '#059669', label: 'In Transit',
        icon: 'navigate-outline', actionLabel: 'Continue Trip', 
        actionGradient: ['#ea580c', '#c2410c'], borderColor: '#34d399',
      },
      pending_reconciliation: {
        bg: '#fef3c7', bgLight: '#fffbeb', text: '#d97706', label: 'Pending Reconciliation',
        icon: 'time-outline', actionGradient: ['#6b7280', '#4b5563'], borderColor: '#fbbf24',
      },
      closed: {
        bg: '#f3f4f6', bgLight: '#f9fafb', text: '#9ca3af', label: 'Closed',
        icon: 'lock-closed-outline', actionGradient: ['#6b7280', '#4b5563'], borderColor: '#e5e7eb',
      },
      rejected: {
        bg: '#fee2e2', bgLight: '#fef2f2', text: '#dc2626', label: 'Rejected',
        icon: 'close-circle-outline', actionGradient: ['#6b7280', '#4b5563'], borderColor: '#fca5a5',
      },
      cancelled: {
        bg: '#f3f4f6', bgLight: '#f9fafb', text: '#6b7280', label: 'Cancelled',
        icon: 'ban-outline', actionGradient: ['#6b7280', '#4b5563'], borderColor: '#d1d5db',
      },
    };
    return configs[status] || { 
      bg: '#f3f4f6', bgLight: '#f9fafb', text: '#4b5563', label: status, 
      icon: 'document-outline', actionGradient: ['#6b7280', '#4b5563'], borderColor: '#d1d5db',
    };
  };

  // ============================================
  // COMPUTED
  // ============================================

  const filteredTrips = useCallback(() => {
    switch (activeTab) {
      case 'active': 
        return trips.filter(t => ['funds_issued', 'acknowledged', 'in_transit'].includes(t.status));
      case 'completed': 
        return trips.filter(t => ['pending_reconciliation', 'closed', 'rejected', 'cancelled'].includes(t.status));
      default: 
        return trips;
    }
  }, [trips, activeTab]);

  const stats = {
    total: trips.length,
    inTransit: trips.filter(t => t.status === 'in_transit').length,
    pendingAcknowledgment: trips.filter(t => t.status === 'funds_issued').length,
    readyToStart: trips.filter(t => t.status === 'acknowledged').length,
  };

  const displayTrips = filteredTrips();

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <LinearGradient 
          colors={['#0f172a', '#1e293b']} 
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </LinearGradient>
      </View>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
        {/* Hero Header */}
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#1e40af']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroHeader}
        >
          <View style={styles.heroPattern}>
            <View style={[styles.heroCircle, styles.heroCircle1]} />
            <View style={[styles.heroCircle, styles.heroCircle2]} />
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroTop}>
              <View style={styles.userInfo}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.userName}>{userName || 'Driver'}</Text>
                <View style={styles.roleBadge}>
                  <View style={styles.roleDot} />
                  <Text style={styles.roleText}>Driver Portal</Text>
                </View>
              </View>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarInner}>
                  <Ionicons name="car-sport-outline" size={24} color="#ffffff" />
                </View>
                <View style={styles.avatarStatus} />
              </View>
            </View>
            <TouchableOpacity 
  onPress={() => {
    console.log('🧪 Testing toast...');
    Toast.show({
      type: 'fundRelease',
      text1: '🧪 Test Toast',
      text2: 'This is a test toast notification! Tap to see action.',
      props: {
        onPress: () => {
          console.log('✅ Toast pressed!');
          Alert.alert('Toast Pressed', 'You tapped the toast!');
        },
      },
    });
  }}
  style={styles.testButton}
>
  <Text style={styles.testButtonText}>Test Toast</Text>
</TouchableOpacity>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                  <Ionicons name="layers-outline" size={18} color="#60a5fa" />
                </View>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Trips</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                  <Ionicons name="navigate-outline" size={18} color="#4ade80" />
                </View>
                <Text style={styles.statValue}>{stats.inTransit}</Text>
                <Text style={styles.statLabel}>In Transit</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(251, 191, 36, 0.2)' }]}>
                  <Ionicons name="time-outline" size={18} color="#fbbf24" />
                </View>
                <Text style={styles.statValue}>{stats.pendingAcknowledgment + stats.readyToStart}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <View style={styles.tabWrapper}>
            {(['all', 'active', 'completed'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
                {activeTab === tab && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trips Section */}
        <Animated.View 
          style={[
            styles.tripsSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="list-outline" size={18} color="#374151" />
              <Text style={styles.sectionTitle}>Trip Tickets</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{displayTrips.length}</Text>
            </View>
            <Text style={styles.lastRefreshText}>
              Last updated: {lastRefreshTime.toLocaleTimeString()}
            </Text>
          </View>

          {displayTrips.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="car-outline" size={48} color="#d1d5db" />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'all' ? 'No trips assigned' : `No ${activeTab} trips`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'all' 
                  ? 'When trips are assigned to you, they will appear here'
                  : 'Switch to another tab to see more trips'}
              </Text>
            </View>
          ) : (
            displayTrips.map((trip, index) => {
              const statusConfig = getStatusConfig(trip.status);
              const hasAction = ['funds_issued', 'acknowledged', 'in_transit'].includes(trip.status);
              const isFirst = index === 0;

              return (
                <Animated.View 
                  key={trip.trip_ticket_id} 
                  style={[
                    styles.tripCard,
                    isFirst && styles.tripCardFirst,
                    { borderLeftColor: statusConfig.borderColor }
                  ]}
                >
                  <View style={styles.tripCardHeader}>
                    <View style={styles.tripNumberContainer}>
                      <Text style={styles.tripNumberLabel}>TRIP TICKET</Text>
                      <Text style={styles.tripNumber}>{trip.trip_ticket_number}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                      <Ionicons name={statusConfig.icon} size={12} color={statusConfig.text} style={styles.statusIcon} />
                      <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
                    </View>
                  </View>

                  <View style={styles.tripDetails}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="location-outline" size={14} color="#9ca3af" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Destination</Text>
                        <Text style={styles.detailValue}>{trip.destination}</Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Trip Date</Text>
                        <Text style={styles.detailValue}>
                          {new Date(trip.trip_date).toLocaleDateString('en-PH', {
                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="car-outline" size={14} color="#9ca3af" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Vehicle</Text>
                        <Text style={styles.detailValue}>
                          {trip.vehicle?.plate_number} • {trip.vehicle?.vehicle_model}
                        </Text>
                      </View>
                    </View>

                    {trip.amount_released ? (
                      <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                          <Ionicons name="cash-outline" size={14} color="#9ca3af" />
                        </View>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Amount Released</Text>
                          <Text style={[styles.detailValue, styles.amountValue]}>
                            ₱{trip.amount_released?.toLocaleString('en-PH')}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionContainer}>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => handleViewGasSlip(trip.trip_ticket_id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="document-text-outline" size={16} color="#4b5563" />
                      <Text style={styles.secondaryButtonText}>View Gas Slip</Text>
                    </TouchableOpacity>

                    {hasAction && (
                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => handleTripAction(trip)}
                        disabled={acknowledging === trip.trip_ticket_id}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={statusConfig.actionGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.primaryButtonGradient}
                        >
                          {acknowledging === trip.trip_ticket_id ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <>
                              <Ionicons 
                                name={trip.status === 'funds_issued' ? 'checkmark-circle-outline' : 'arrow-forward-outline'} 
                                size={16} 
                                color="#ffffff" 
                                style={styles.primaryButtonIcon}
                              />
                              <Text style={styles.primaryButtonText}>
                                {statusConfig.actionLabel}
                              </Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                </Animated.View>
              );
            })
          )}
        </Animated.View>
      </ScrollView>

      <GasSlipModal
        visible={showGasSlipModal}
        onClose={() => setShowGasSlipModal(false)}
        gasSlip={selectedGasSlip}
      />
    </>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1 },
  loadingGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: 'rgba(255, 255, 255, 0.7)', marginTop: 16, fontSize: 15, fontWeight: '500' },
  heroHeader: { 
    paddingTop: Platform.OS === 'ios' ? 60 : 48, 
    paddingBottom: 28, 
    paddingHorizontal: 20, 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24, 
    overflow: 'hidden' 
  },
  heroPattern: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  heroCircle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255, 255, 255, 0.03)' },
  heroCircle1: { width: 250, height: 250, top: -80, right: -60 },
  heroCircle2: { width: 180, height: 180, bottom: -40, left: -40, backgroundColor: 'rgba(255, 255, 255, 0.02)' },
  heroContent: { position: 'relative', zIndex: 1 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  userInfo: { flex: 1 },
  welcomeText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' },
  userName: { fontSize: 26, fontWeight: '800', color: '#ffffff', marginTop: 4 },
  roleBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8, 
    backgroundColor: 'rgba(255, 255, 255, 0.12)', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 20, 
    alignSelf: 'flex-start', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.15)' 
  },
  roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80', marginRight: 6 },
  roleText: { fontSize: 12, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '600' },
  avatarContainer: { position: 'relative', marginLeft: 12 },
  avatarInner: { 
    width: 52, 
    height: 52, 
    borderRadius: 16, 
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.2)' 
  },
  avatarStatus: { 
    position: 'absolute', 
    bottom: -2, 
    right: -2, 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    backgroundColor: '#22c55e', 
    borderWidth: 2, 
    borderColor: '#0f172a' 
  },
  statsContainer: { flexDirection: 'row', gap: 10 },
  statCard: { 
    flex: 1, 
    backgroundColor: 'rgba(255, 255, 255, 0.08)', 
    borderRadius: 16, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)' 
  },
  statIconContainer: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  statLabel: { fontSize: 11, color: 'rgba(255, 255, 255, 0.5)', marginTop: 2, fontWeight: '600' },
  tabContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  tabWrapper: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 12, padding: 4 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, position: 'relative' },
  tabButtonActive: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#0f172a' },
  tabIndicator: { position: 'absolute', bottom: -4, width: 20, height: 3, borderRadius: 2, backgroundColor: '#3b82f6' },
  tripsSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  badge: { backgroundColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, minWidth: 28, alignItems: 'center' },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  lastRefreshText: { fontSize: 10, color: '#94a3b8', marginLeft: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 48, backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#475569', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
  tripCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    padding: 18, 
    marginBottom: 12, 
    borderLeftWidth: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.04, 
    shadowRadius: 8, 
    elevation: 2 
  },
  tripCardFirst: { shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  tripCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  tripNumberContainer: { flex: 1, marginRight: 8 },
  tripNumberLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', marginBottom: 2 },
  tripNumber: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusIcon: { marginRight: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  tripDetails: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 14, gap: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  detailIconContainer: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 2 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 11, fontWeight: '600', color: '#94a3b8', marginBottom: 1, textTransform: 'uppercase' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#334155', lineHeight: 20 },
  amountValue: { color: '#059669', fontWeight: '700' },
  actionContainer: { flexDirection: 'row', gap: 10, marginTop: 16 },
  secondaryButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#f8fafc', 
    paddingVertical: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    gap: 6 
  },
  secondaryButtonText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  primaryButton: { flex: 1, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  primaryButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  primaryButtonIcon: { marginRight: 2 },
  primaryButtonText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
});