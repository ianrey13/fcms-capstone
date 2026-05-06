// app/auth/trips/active.tsx - Simplified (No GPS)
import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  ScrollView, 
  Modal, 
  StatusBar,
  StyleSheet,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { driverAPI } from '../../../services/api';

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
  charge_to?: string;
  purpose?: string;
}

export default function ActiveTripScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const tripId = id || trip?.trip_ticket_id;
  const router_back = useRouter();

  useEffect(() => {
    fetchActiveTrip();
  }, []);

  const fetchActiveTrip = async () => {
    try {
      console.log('Fetching active trip...');
      const response = await driverAPI.getActiveTrip();
      console.log('API Response:', response.data);
      
      const tripData = response.data?.data || response.data;
      setTrip(tripData);
      
    } catch (error: any) {
      console.error('Failed to fetch active trip:', error);
      Alert.alert('Error', 'Unable to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!tripId) return;
    
    setActionLoading(true);
    try {
      await driverAPI.acknowledgeFunds(Number(tripId));
      Alert.alert('Success', 'Gas slip acknowledged! You can now start your trip.');
      await fetchActiveTrip(); // Refresh trip data
    } catch (error: any) {
      console.error('Acknowledge error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to acknowledge');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartTrip = async () => {
    if (!tripId) return;
    
    setActionLoading(true);
    try {
      await driverAPI.startTrip(Number(tripId));
      Alert.alert('Success', 'Trip started! You are now in transit.');
      await fetchActiveTrip(); // Refresh trip data
    } catch (error: any) {
      console.error('Start trip error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to start trip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!tripId) return;
    
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
            setActionLoading(true);
            try {
              await driverAPI.completeTrip(Number(tripId));
              Alert.alert(
                'Trip Completed',
                'Your trip has been successfully completed.',
                [{ text: 'OK', onPress: () => router_back.replace('/auth') }]
              );
            } catch (error: any) {
              console.error('Complete trip error:', error);
              Alert.alert('Error', 'Failed to complete trip');
            } finally {
              setActionLoading(false);
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
        id: tripId,
        tripNumber: trip?.trip_ticket_number 
      }
    });
  };

  const handleGoBack = () => {
    router_back.back();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-PH', {
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

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bgColor: string; action: string }> = {
      funds_issued: { 
        label: 'AWAITING ACKNOWLEDGMENT', 
        color: '#f59e0b', 
        bgColor: 'rgba(245, 158, 11, 0.15)',
        action: 'Acknowledge Gas Slip'
      },
      acknowledged: { 
        label: 'READY TO START', 
        color: '#3b82f6', 
        bgColor: 'rgba(59, 130, 246, 0.15)',
        action: 'Start Trip'
      },
      in_transit: { 
        label: 'IN TRANSIT', 
        color: '#22c55e', 
        bgColor: 'rgba(34, 197, 94, 0.15)',
        action: 'Complete Trip'
      },
    };
    return configs[status] || { 
      label: status?.toUpperCase()?.replace(/_/g, ' ') || 'UNKNOWN', 
      color: '#6b7280', 
      bgColor: 'rgba(107, 114, 128, 0.15)',
      action: 'View Details'
    };
  };

  const getActionHandler = () => {
    if (!trip) return null;
    switch (trip.status) {
      case 'funds_issued': return handleAcknowledge;
      case 'acknowledged': return handleStartTrip;
      case 'in_transit': return handleCompleteTrip;
      default: return null;
    }
  };

  const getActionButtonColor = () => {
    if (!trip) return ['#6b7280', '#4b5563'];
    switch (trip.status) {
      case 'funds_issued': return ['#f59e0b', '#d97706'];
      case 'acknowledged': return ['#3b82f6', '#2563eb'];
      case 'in_transit': return ['#22c55e', '#16a34a'];
      default: return ['#6b7280', '#4b5563'];
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
  const actionHandler = getActionHandler();
  const actionColors = getActionButtonColor();

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
              <Text style={styles.headerSubtitle}>{trip.trip_ticket_number}</Text>
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

          {/* Trip Card */}
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
                  <Text style={styles.detailValue}>
                    {trip.vehicle?.plate_number} - {trip.vehicle?.vehicle_model}
                  </Text>
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

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Primary Action Button (Acknowledge/Start/Complete) */}
            {actionHandler && (
              <TouchableOpacity 
                onPress={actionHandler} 
                disabled={actionLoading}
                activeOpacity={0.8} 
                style={styles.actionButton}
              >
                <LinearGradient colors={actionColors} style={styles.actionGradient}>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>{statusConfig.action}</Text>
                    {trip.status === 'funds_issued' && (
                      <Text style={styles.actionSubtitle}>Confirm receipt of gas slip</Text>
                    )}
                    {trip.status === 'acknowledged' && (
                      <Text style={styles.actionSubtitle}>Begin your journey</Text>
                    )}
                    {trip.status === 'in_transit' && (
                      <Text style={styles.actionSubtitle}>Finish and submit trip</Text>
                    )}
                  </View>
                  {actionLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Ionicons 
                      name={trip.status === 'funds_issued' ? 'document-text-outline' : trip.status === 'acknowledged' ? 'play-circle' : 'flag-outline'} 
                      size={28} 
                      color="white" 
                    />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Upload Receipt Button (Always visible for in_transit) */}
            {(trip.status === 'in_transit' || trip.status === 'acknowledged') && (
              <TouchableOpacity onPress={handleUploadReceipt} activeOpacity={0.8} style={styles.secondaryButton}>
                <LinearGradient colors={['#d97706', '#b45309']} style={styles.secondaryGradient}>
                  <Ionicons name="camera" size={24} color="white" />
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>UPLOAD RECEIPT</Text>
                    <Text style={styles.actionSubtitle}>Take photo of fuel receipt</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Workflow Steps */}
          <View style={styles.workflowCard}>
            <Text style={styles.workflowTitle}>Trip Workflow</Text>
            <View style={styles.stepsContainer}>
              {[
                { step: 1, label: 'Acknowledge', status: trip.status !== 'funds_issued' ? 'completed' : trip.status === 'funds_issued' ? 'current' : 'pending' },
                { step: 2, label: 'Start Trip', status: trip.status === 'in_transit' || trip.status === 'completed' ? 'completed' : trip.status === 'acknowledged' ? 'current' : 'pending' },
                { step: 3, label: 'Upload Receipt', status: 'pending' },
                { step: 4, label: 'Complete', status: 'pending' },
              ].map((step) => (
                <View key={step.step} style={styles.stepItem}>
                  <View style={[
                    styles.stepCircle,
                    step.status === 'completed' && styles.stepCompleted,
                    step.status === 'current' && styles.stepCurrent,
                  ]}>
                    {step.status === 'completed' ? (
                      <Ionicons name="checkmark" size={14} color="white" />
                    ) : (
                      <Text style={styles.stepNumber}>{step.step}</Text>
                    )}
                  </View>
                  <Text style={[
                    styles.stepLabel,
                    step.status === 'completed' && styles.stepLabelCompleted,
                    step.status === 'current' && styles.stepLabelCurrent,
                  ]}>{step.label}</Text>
                </View>
              ))}
            </View>
          </View>
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
                <View style={styles.guideItem}>
                  <View style={[styles.guideIconContainer, { backgroundColor: '#dbeafe' }]}>
                    <Ionicons name="document-text-outline" size={20} color="#3b82f6" />
                  </View>
                  <View style={styles.guideContent}>
                    <Text style={styles.guideTitle}>1. Acknowledge Gas Slip</Text>
                    <Text style={styles.guideDescription}>Confirm receipt of the gas slip before starting your trip</Text>
                  </View>
                </View>
                <View style={styles.guideItem}>
                  <View style={[styles.guideIconContainer, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="play-circle" size={20} color="#22c55e" />
                  </View>
                  <View style={styles.guideContent}>
                    <Text style={styles.guideTitle}>2. Start Trip</Text>
                    <Text style={styles.guideDescription}>Begin your journey after acknowledgment</Text>
                  </View>
                </View>
                <View style={styles.guideItem}>
                  <View style={[styles.guideIconContainer, { backgroundColor: '#fef3c7' }]}>
                    <Ionicons name="camera" size={20} color="#d97706" />
                  </View>
                  <View style={styles.guideContent}>
                    <Text style={styles.guideTitle}>3. Upload Receipt</Text>
                    <Text style={styles.guideDescription}>Take a clear photo of your fuel receipt after refueling</Text>
                  </View>
                </View>
                <View style={styles.guideItem}>
                  <View style={[styles.guideIconContainer, { backgroundColor: '#fee2e2' }]}>
                    <Ionicons name="flag" size={20} color="#dc2626" />
                  </View>
                  <View style={styles.guideContent}>
                    <Text style={styles.guideTitle}>4. Complete Trip</Text>
                    <Text style={styles.guideDescription}>Finish the trip AFTER uploading the receipt</Text>
                  </View>
                </View>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

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
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', marginTop: 2 },
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

  statusBadgeContainer: { alignItems: 'center', marginTop: 16, marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },

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
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIconContainer: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  detailsContainer: { gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  detailIconContainer: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 11, fontWeight: '600', color: '#94a3b8', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#334155', lineHeight: 20 },
  amountValue: { color: '#059669', fontWeight: '700', fontSize: 15 },

  actionsContainer: { paddingHorizontal: 16, gap: 12, marginBottom: 20 },
  actionButton: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 20 },
  actionTextContainer: { flex: 1 },
  actionTitle: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  actionSubtitle: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 12, fontWeight: '500', marginTop: 2 },

  secondaryButton: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  secondaryGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20 },

  workflowCard: { backgroundColor: '#ffffff', borderRadius: 16, marginHorizontal: 16, marginTop: 8, marginBottom: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  workflowTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 16, textAlign: 'center' },
  stepsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stepNumber: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  stepCompleted: { backgroundColor: '#22c55e' },
  stepCurrent: { backgroundColor: '#3b82f6' },
  stepLabel: { fontSize: 10, color: '#94a3b8', textAlign: 'center' },
  stepLabelCompleted: { color: '#22c55e', fontWeight: '600' },
  stepLabelCurrent: { color: '#3b82f6', fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalContainer: { backgroundColor: '#ffffff', borderRadius: 24, width: '100%', maxWidth: 360, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  modalCloseButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.15)', alignItems: 'center', justifyContent: 'center' },
  modalContent: { padding: 20, gap: 16 },
  guideItem: { flexDirection: 'row', gap: 14 },
  guideIconContainer: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  guideContent: { flex: 1 },
  guideTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  guideDescription: { fontSize: 13, color: '#64748b', lineHeight: 20 },
  modalButton: { marginHorizontal: 20, marginBottom: 20, borderRadius: 14, overflow: 'hidden' },
  modalButtonGradient: { paddingVertical: 14, alignItems: 'center' },
  modalButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});