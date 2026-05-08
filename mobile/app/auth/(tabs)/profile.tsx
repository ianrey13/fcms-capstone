// app/auth/(tabs)/profile.tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  TextInput,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { storage } from '../../../utils/storage';
import { authAPI, driverAPI } from '../../../services/api';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  
  // Modal states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showTripsModal, setShowTripsModal] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });
  
  // Profile form
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    email: ''
  });
  const [profileErrors, setProfileErrors] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });

  const [stats, setStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    totalDistance: 0,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userStr = await storage.getItem('fcms_user');
      
      if (userStr) {
        const userData = JSON.parse(userStr);
        
        const displayName = userData?.full_name || 
                           (userData?.first_name && userData?.last_name ? `${userData.first_name} ${userData.last_name}` : null) ||
                           userData?.email?.split('@')[0] ||
                           'Driver';
        
        setUser({
          ...userData,
          display_name: displayName,
          full_name: displayName,
          user_id: userData.user_id || userData.id
        });
        
        setProfileForm({
          first_name: userData?.first_name || '',
          last_name: userData?.last_name || '',
          middle_name: userData?.middle_name || '',
          email: userData?.email || ''
        });
      } else {
        setUser({ display_name: 'Driver', role: 'driver' });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser({ display_name: 'Driver', role: 'driver' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch user trips using driverAPI
  const fetchUserTrips = async () => {
    setLoadingTrips(true);
    try {
      const response = await driverAPI.getTrips();
      const tripsData = response.data?.data || response.data || [];
      setTrips(tripsData);
      
      const completed = tripsData.filter((t: any) => t.status === 'closed' || t.status === 'completed').length;
      setStats({
        totalTrips: tripsData.length,
        completedTrips: completed,
        totalDistance: 0,
      });
    } catch (error) {
      console.error('Error fetching trips:', error);
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  };

  // ✅ Validate profile form
  const validateProfileForm = () => {
    let isValid = true;
    const errors = {
      first_name: '',
      last_name: '',
      email: ''
    };
    
    if (!profileForm.first_name.trim()) {
      errors.first_name = 'First name is required';
      isValid = false;
    }
    
    if (!profileForm.last_name.trim()) {
      errors.last_name = 'Last name is required';
      isValid = false;
    }
    
    if (!profileForm.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      errors.email = 'Please enter a valid email';
      isValid = false;
    }
    
    setProfileErrors(errors);
    return isValid;
  };

  // ✅ Validate password form
  const validatePasswordForm = () => {
    let isValid = true;
    const errors = {
      current_password: '',
      new_password: '',
      new_password_confirmation: ''
    };
    
    if (!passwordForm.current_password) {
      errors.current_password = 'Current password is required';
      isValid = false;
    }
    
    if (!passwordForm.new_password) {
      errors.new_password = 'New password is required';
      isValid = false;
    } else if (passwordForm.new_password.length < 6) {
      errors.new_password = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      errors.new_password_confirmation = 'Passwords do not match';
      isValid = false;
    }
    
    setPasswordErrors(errors);
    return isValid;
  };

  // ✅ Handle update profile - Using auth/me endpoint
  const handleUpdateProfile = async () => {
    if (!validateProfileForm()) return;
    
    setUpdatingProfile(true);
    try {
      // ✅ Use auth/me endpoint instead of admin endpoint
      const response = await authAPI.updateProfile({
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
        middle_name: profileForm.middle_name.trim() || null,
        email: profileForm.email.trim()
      });
      
      if (response.data?.success) {
        // Update local storage
        const updatedUser = {
          ...user,
          first_name: profileForm.first_name.trim(),
          last_name: profileForm.last_name.trim(),
          middle_name: profileForm.middle_name.trim(),
          email: profileForm.email.trim(),
          full_name: `${profileForm.first_name.trim()} ${profileForm.last_name.trim()}`,
          display_name: `${profileForm.first_name.trim()} ${profileForm.last_name.trim()}`
        };
        
        await storage.setItem('fcms_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        Alert.alert('Success', 'Profile updated successfully!');
        setShowEditProfileModal(false);
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // ✅ Handle change password
  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;
    
    setChangingPassword(true);
    try {
      const response = await authAPI.changePassword(
        passwordForm.current_password,
        passwordForm.new_password
      );
      
      if (response.data?.success) {
        Alert.alert('Success', 'Password changed successfully! Please login again.');
        setShowChangePasswordModal(false);
        setPasswordForm({
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        });
        setPasswordErrors({
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        });
        
        // Auto logout after password change
        setTimeout(() => {
          performLogout();
        }, 1500);
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // ✅ View all trips
  const handleViewAllTrips = async () => {
    await fetchUserTrips();
    setShowTripsModal(true);
  };

  // ✅ Logout handler

const handleLogout = () => {
  const isWeb = Platform.OS === 'web';
  
  const confirmLogout = () => {
    performLogout();
  };
  
  if (isWeb) {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      confirmLogout();
    }
  } else {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: confirmLogout
        },
      ]
    );
  }
};

  const performLogout = async () => {
    setLoggingOut(true);
    try {
      await storage.deleteItem('fcms_token');
      await storage.deleteItem('fcms_user');
      
      if (Platform.OS === 'web') {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach(function(c) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
      
      setTimeout(() => {
        router.replace('/');
      }, 100);
      
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  const getAvatarLetter = () => {
    if (profileForm.first_name) return profileForm.first_name.charAt(0).toUpperCase();
    if (user?.display_name && user.display_name !== 'Driver') return user.display_name.charAt(0).toUpperCase();
    return 'D';
  };

  const getUserDisplayName = () => {
    if (profileForm.first_name && profileForm.last_name) {
      return `${profileForm.first_name} ${profileForm.last_name}`;
    }
    if (user?.display_name && user.display_name !== 'Driver') return user.display_name;
    return user?.email?.split('@')[0] || 'Driver';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'closed': 'Completed',
      'in_transit': 'In Transit',
      'acknowledged': 'Ready',
      'funds_issued': 'Funds Issued',
      'pending_head_approval': 'Pending Head',
      'pending_gso_review': 'Pending GSO',
      'pending_mayors_office': 'Pending Mayor',
      'returned_for_revision': 'Returned',
    };
    return statusMap[status] || status?.replace(/_/g, ' ') || 'Pending';
  };

  const getStatusStyle = (status: string) => {
    if (status === 'closed') return styles.tripStatusCompleted;
    if (status === 'in_transit') return styles.tripStatusActive;
    return styles.tripStatusPending;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#1e40af']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.avatarGradient}>
                <Text style={styles.avatarText}>{getAvatarLetter()}</Text>
              </LinearGradient>
              <View style={styles.onlineDot} />
            </View>
            <Text style={styles.userName}>{getUserDisplayName()}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="car-sport-outline" size={14} color="#60a5fa" />
              <Text style={styles.roleText}>Driver</Text>
            </View>
            {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
          </View>
        </LinearGradient>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar-outline" size={22} color="#3b82f6" />
              </View>
              <Text style={styles.statValue}>{stats.totalTrips}</Text>
              <Text style={styles.statLabel}>Total Trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle-outline" size={22} color="#10b981" />
              </View>
              <Text style={styles.statValue}>{stats.completedTrips}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="navigate-outline" size={22} color="#f59e0b" />
              </View>
              <Text style={styles.statValue}>{stats.totalDistance}</Text>
              <Text style={styles.statLabel}>KM Driven</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => setShowEditProfileModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="person-outline" size={20} color="#3b82f6" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Personal Information</Text>
              <Text style={styles.menuSubtitle}>View and edit your profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => setShowChangePasswordModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#8b5cf6" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Change Password</Text>
              <Text style={styles.menuSubtitle}>Update your password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleViewAllTrips}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="car-outline" size={20} color="#10b981" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>My Trips</Text>
              <Text style={styles.menuSubtitle}>View all your trips</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          {/* App Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>App Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>Driver</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{user?.department_name || 'Engineering Office'}</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.7}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>FCMS Driver App v1.0.0</Text>
          <Text style={styles.copyrightText}>© GSO Laguindingan</Text>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={[styles.input, passwordErrors.current_password ? styles.inputError : null]}
                  secureTextEntry
                  value={passwordForm.current_password}
                  onChangeText={(text) => {
                    setPasswordForm({...passwordForm, current_password: text});
                    setPasswordErrors({...passwordErrors, current_password: ''});
                  }}
                  placeholder="Enter current password"
                  placeholderTextColor="#94a3b8"
                />
                {passwordErrors.current_password ? (
                  <Text style={styles.errorText}>{passwordErrors.current_password}</Text>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={[styles.input, passwordErrors.new_password ? styles.inputError : null]}
                  secureTextEntry
                  value={passwordForm.new_password}
                  onChangeText={(text) => {
                    setPasswordForm({...passwordForm, new_password: text});
                    setPasswordErrors({...passwordErrors, new_password: ''});
                  }}
                  placeholder="Enter new password (min 6 characters)"
                  placeholderTextColor="#94a3b8"
                />
                {passwordErrors.new_password ? (
                  <Text style={styles.errorText}>{passwordErrors.new_password}</Text>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={[styles.input, passwordErrors.new_password_confirmation ? styles.inputError : null]}
                  secureTextEntry
                  value={passwordForm.new_password_confirmation}
                  onChangeText={(text) => {
                    setPasswordForm({...passwordForm, new_password_confirmation: text});
                    setPasswordErrors({...passwordErrors, new_password_confirmation: ''});
                  }}
                  placeholder="Confirm new password"
                  placeholderTextColor="#94a3b8"
                />
                {passwordErrors.new_password_confirmation ? (
                  <Text style={styles.errorText}>{passwordErrors.new_password_confirmation}</Text>
                ) : null}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowChangePasswordModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveButton}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalSaveText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfileModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={[styles.input, profileErrors.first_name ? styles.inputError : null]}
                  value={profileForm.first_name}
                  onChangeText={(text) => {
                    setProfileForm({...profileForm, first_name: text});
                    setProfileErrors({...profileErrors, first_name: ''});
                  }}
                  placeholder="Enter first name"
                  placeholderTextColor="#94a3b8"
                />
                {profileErrors.first_name && (
                  <Text style={styles.errorText}>{profileErrors.first_name}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Middle Name</Text>
                <TextInput
                  style={styles.input}
                  value={profileForm.middle_name}
                  onChangeText={(text) => setProfileForm({...profileForm, middle_name: text})}
                  placeholder="Enter middle name (optional)"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={[styles.input, profileErrors.last_name ? styles.inputError : null]}
                  value={profileForm.last_name}
                  onChangeText={(text) => {
                    setProfileForm({...profileForm, last_name: text});
                    setProfileErrors({...profileErrors, last_name: ''});
                  }}
                  placeholder="Enter last name"
                  placeholderTextColor="#94a3b8"
                />
                {profileErrors.last_name && (
                  <Text style={styles.errorText}>{profileErrors.last_name}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={[styles.input, profileErrors.email ? styles.inputError : null]}
                  value={profileForm.email}
                  onChangeText={(text) => {
                    setProfileForm({...profileForm, email: text});
                    setProfileErrors({...profileErrors, email: ''});
                  }}
                  placeholder="Enter email"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {profileErrors.email && (
                  <Text style={styles.errorText}>{profileErrors.email}</Text>
                )}
              </View>

              <View style={styles.infoNote}>
                <Ionicons name="information-circle-outline" size={16} color="#64748b" />
                <Text style={styles.infoNoteText}>
                  Your changes will be saved and reflected in your profile immediately.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowEditProfileModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveButton}
                onPress={handleUpdateProfile}
                disabled={updatingProfile}
              >
                {updatingProfile ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Trips History Modal */}
      <Modal
        visible={showTripsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTripsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.tripsModalContainer]}>
            <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My Trips</Text>
              <TouchableOpacity onPress={() => setShowTripsModal(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalContent}>
              {loadingTrips ? (
                <View style={styles.tripsLoadingContainer}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text style={styles.tripsLoadingText}>Loading trips...</Text>
                </View>
              ) : trips.length === 0 ? (
                <View style={styles.emptyTripsContainer}>
                  <Ionicons name="car-outline" size={64} color="#cbd5e1" />
                  <Text style={styles.emptyTripsTitle}>No Trips Yet</Text>
                  <Text style={styles.emptyTripsText}>
                    Your trips will appear here once you complete them.
                  </Text>
                </View>
              ) : (
                trips.map((trip, index) => (
                  <View key={index} style={styles.tripItem}>
                    <View style={styles.tripHeader}>
                      <Text style={styles.tripNumber}>{trip.trip_ticket_number}</Text>
                      <View style={[styles.tripStatusBadge, getStatusStyle(trip.status)]}>
                        <Text style={styles.tripStatusText}>
                          {getStatusLabel(trip.status)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tripDetails}>
                      <View style={styles.tripRow}>
                        <Ionicons name="location-outline" size={14} color="#94a3b8" />
                        <Text style={styles.tripDestination}>{trip.destination}</Text>
                      </View>
                      <View style={styles.tripRow}>
                        <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
                        <Text style={styles.tripDate}>{formatDate(trip.trip_date)}</Text>
                      </View>
                      {trip.amount_released && (
                        <View style={styles.tripRow}>
                          <Ionicons name="cash-outline" size={14} color="#10b981" />
                          <Text style={styles.tripAmount}>₱{trip.amount_released.toLocaleString()}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCloseFullButton}
                onPress={() => setShowTripsModal(false)}
              >
                <Text style={styles.modalCloseFullText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b' },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40, paddingHorizontal: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerContent: { alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatarGradient: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  avatarText: { fontSize: 40, fontWeight: '700', color: '#ffffff' },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#22c55e', borderWidth: 3, borderColor: '#ffffff' },
  userName: { fontSize: 24, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  userEmail: { fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', marginTop: 4 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  roleText: { fontSize: 13, fontWeight: '600', color: '#e0f2fe' },
  statsSection: { paddingHorizontal: 20, marginTop: -24, marginBottom: 24 },
  statsCard: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#f1f5f9' },
  statItem: { flex: 1, alignItems: 'center' },
  statIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#94a3b8', marginTop: 2 },
  statDivider: { width: 1, height: 50, backgroundColor: '#e2e8f0', marginHorizontal: 8 },
  menuSection: { paddingHorizontal: 20, marginBottom: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: '#f1f5f9' },
  menuIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  menuSubtitle: { fontSize: 12, color: '#94a3b8' },
  infoCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginTop: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  infoDivider: { height: 1, backgroundColor: '#f1f5f9' },
  infoLabel: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 8, marginBottom: 24, paddingVertical: 16, borderRadius: 16, backgroundColor: '#fef2f2', gap: 10, borderWidth: 1, borderColor: '#fee2e2' },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
  versionContainer: { alignItems: 'center', paddingBottom: 32 },
  versionText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  copyrightText: { fontSize: 11, color: '#cbd5e1', marginTop: 4 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#ffffff', borderRadius: 24, width: width - 40, maxHeight: '80%', overflow: 'hidden' },
  tripsModalContainer: { maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  modalContent: { padding: 20 },
  modalFooter: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', gap: 12 },
  modalCancelButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  modalSaveButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#3b82f6', alignItems: 'center' },
  modalSaveText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  modalCloseFullButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#3b82f6', alignItems: 'center' },
  modalCloseFullText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  
  // Form styles
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1e293b', backgroundColor: '#f8fafc' },
  inputError: { borderColor: '#ef4444' },
  errorText: { fontSize: 12, color: '#ef4444', marginTop: 4 },
  infoNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f9ff', padding: 12, borderRadius: 12, gap: 8, marginTop: 8 },
  infoNoteText: { fontSize: 12, color: '#64748b', flex: 1, lineHeight: 18 },
  
  // Trips modal styles
  tripsLoadingContainer: { alignItems: 'center', paddingVertical: 40 },
  tripsLoadingText: { marginTop: 12, fontSize: 14, color: '#64748b' },
  emptyTripsContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyTripsTitle: { fontSize: 16, fontWeight: '700', color: '#475569', marginTop: 16 },
  emptyTripsText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 8 },
  tripItem: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tripNumber: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  tripStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  tripStatusCompleted: { backgroundColor: '#dcfce7' },
  tripStatusActive: { backgroundColor: '#dbeafe' },
  tripStatusPending: { backgroundColor: '#fef3c7' },
  tripStatusText: { fontSize: 10, fontWeight: '600', color: '#1e293b' },
  tripDetails: { gap: 6 },
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tripDestination: { fontSize: 13, color: '#334155', flex: 1 },
  tripDate: { fontSize: 12, color: '#64748b' },
  tripAmount: { fontSize: 12, fontWeight: '600', color: '#10b981' },
});