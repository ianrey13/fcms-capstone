// app/auth/receipt.tsx - Fixed with correct FileSystem API

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ActivityIndicator, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Animated, 
  Dimensions,
  StyleSheet,
  StatusBar,
  Vibration
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { driverAPI } from '../../services/api';

const { width, height } = Dimensions.get('window');

export default function ReceiptScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number; size?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [tripId, setTripId] = useState<number | null>(null);
  const [tripNumber, setTripNumber] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const router = useRouter();
  const params = useLocalSearchParams();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const imageScaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
    if (params.id) {
      setTripId(parseInt(params.id as string));
    }
    if (params.tripNumber) {
      setTripNumber(params.tripNumber as string);
    }
  }, [params]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ============================================
  // PERMISSIONS
  // ============================================

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted') {
      Alert.alert(
        'Camera Permission Required', 
        'Camera access is needed to take receipt photos. You can also upload from your gallery.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Use Gallery', onPress: pickFromGallery },
        ]
      );
      return false;
    }
    return true;
  };

  // ============================================
  // IMAGE PICKING
  // ============================================

  const processImageAsset = (asset: ImagePicker.ImagePickerAsset) => {
    setImage(asset.uri);
    setImageInfo({
      width: asset.width || 0,
      height: asset.height || 0,
    });

    // Animate image in
    Animated.spring(imageScaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: false,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled && result.assets[0]) {
        processImageAsset(result.assets[0]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Camera Error', 'Unable to access camera. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        processImageAsset(result.assets[0]);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Gallery Error', 'Unable to access gallery. Please try again.');
    }
  };

  const showImageOptions = useCallback(() => {
    Alert.alert(
      'Select Receipt Image',
      'Choose how you want to add the receipt photo',
      [
        { 
          text: 'Take Photo', 
          onPress: takePhoto,
        },
        { 
          text: 'Choose from Gallery', 
          onPress: pickFromGallery,
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);

  // ============================================
  // ✅ FIXED: FILE VALIDATION
  // ============================================

  const validateImage = async (uri: string): Promise<{ valid: boolean; sizeMB: number; size?: number }> => {
    try {
      // ✅ Use FileSystem.getInfoAsync instead of new File()
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      console.log('File info:', fileInfo);
      
      if (!fileInfo.exists) {
        Alert.alert('Error', 'File does not exist. Please select another image.');
        return { valid: false, sizeMB: 0 };
      }
      
      const fileSize = fileInfo.size || 0;
      const fileSizeMB = fileSize / (1024 * 1024);

      console.log(`File size: ${fileSizeMB.toFixed(2)} MB`);

      if (fileSizeMB > 5) {
        Alert.alert(
          'File Too Large', 
          `Selected image is ${fileSizeMB.toFixed(1)}MB. Please select an image smaller than 5MB.`,
          [{ text: 'OK', onPress: resetImage }]
        );
        return { valid: false, sizeMB: fileSizeMB, size: fileSize };
      }

      return { valid: true, sizeMB: fileSizeMB, size: fileSize };
    } catch (error) {
      console.error('File validation error:', error);
      Alert.alert('Error', 'Failed to validate image. Please try again.');
      return { valid: false, sizeMB: 0 };
    }
  };

  // ============================================
  // UPLOAD
  // ============================================

  const uploadReceipt = async () => {
    if (!image) {
      Alert.alert('No Image Selected', 'Please take or select a photo of the fuel receipt first.');
      return;
    }

    if (!tripId) {
      Alert.alert('Trip Information Missing', 'Trip information not found. Please return to dashboard.');
      router.back();
      return;
    }

    // Validate image
    const validation = await validateImage(image);
    if (!validation.valid) return;

    setLoading(true);
    setUploadProgress(0);

    // Animate progress
    Animated.timing(progressAnim, {
      toValue: 0.3,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    try {
      // ✅ Get file info using FileSystem
      const fileInfo = await FileSystem.getInfoAsync(image);
      
      const formData = new FormData();
      const filename = `receipt_${tripId}_${Date.now()}.jpg`;

      // ✅ Properly append file for React Native
      formData.append('receipt', {
        uri: image,
        name: filename,
        type: 'image/jpeg',
      } as any);

      // Add liters and amount if provided (you can add inputs for these)
      // formData.append('liters_availed', liters);
      // formData.append('amount_on_receipt', amount);

      const response = await driverAPI.uploadReceipt(tripId, formData);

      // Complete progress animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();

      if (response.data?.success) {
        // Success haptic
        if (Platform.OS === 'ios') {
          Vibration.vibrate([0, 100, 50, 100]);
        }

        Alert.alert(
          'Upload Successful', 
          'Your receipt has been uploaded successfully and is pending verification.',
          [{ text: 'OK', onPress: () => router.replace('/auth') }]
        );
      } else {
        throw new Error(response.data?.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);

      let errorMessage = 'Failed to upload receipt. Please check your connection and try again.';
      if (error.response?.status === 413) {
        errorMessage = 'File is too large. Please select a smaller image.';
      } else if (error.response?.status === 422) {
        errorMessage = 'Invalid file format. Please select a JPG or PNG image.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress(0);
      progressAnim.setValue(0);
    }
  };

  const resetImage = useCallback(() => {
    setImage(null);
    setImageInfo(null);
    imageScaleAnim.setValue(0.9);
  }, []);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Premium Header */}
          <LinearGradient
            colors={['#0f172a', '#1e293b', '#1e40af']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {/* Background Pattern */}
            <View style={styles.headerPattern}>
              <View style={[styles.headerCircle, styles.headerCircle1]} />
              <View style={[styles.headerCircle, styles.headerCircle2]} />
            </View>

            <View style={styles.headerContent}>
              <View style={styles.headerTop}>
                <Animated.View style={{ opacity: fadeAnim }}>
                  <Text style={styles.headerLabel}>FUEL RECEIPT</Text>
                  <Text style={styles.headerTitle}>Upload Receipt</Text>
                  <Text style={styles.headerSubtitle}>Take a clear photo of your fuel receipt</Text>
                </Animated.View>
                <TouchableOpacity 
                  onPress={() => router.back()} 
                  style={styles.closeButton}
                  activeOpacity={0.7}
                >
                  <View style={styles.closeButtonInner}>
                    <Ionicons name="close" size={22} color="white" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Trip Info Card */}
              {tripNumber && (
                <Animated.View 
                  style={[
                    styles.tripInfoCard,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                  ]}
                >
                  <View style={styles.tripInfoRow}>
                    <Ionicons name="document-text-outline" size={16} color="rgba(255,255,255,0.6)" />
                    <View style={styles.tripInfoText}>
                      <Text style={styles.tripInfoLabel}>TRIP TICKET</Text>
                      <Text style={styles.tripInfoValue}>{tripNumber}</Text>
                    </View>
                  </View>
                </Animated.View>
              )}
            </View>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            {!image ? (
              <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
                {/* Upload Options Card */}
                <TouchableOpacity
                  style={styles.uploadCard}
                  onPress={showImageOptions}
                  activeOpacity={0.8}
                >
                  <View style={styles.uploadIconContainer}>
                    <LinearGradient
                      colors={['#3b82f6', '#2563eb']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.uploadIconGradient}
                    >
                      <Ionicons name="camera" size={36} color="white" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.uploadTitle}>Select Receipt Photo</Text>
                  <Text style={styles.uploadSubtitle}>
                    Take a photo or choose from your gallery
                  </Text>
                  <View style={styles.fileFormats}>
                    <View style={styles.formatBadge}>
                      <Text style={styles.formatText}>JPG</Text>
                    </View>
                    <View style={styles.formatBadge}>
                      <Text style={styles.formatText}>PNG</Text>
                    </View>
                    <Text style={styles.maxSizeText}>Max 5MB</Text>
                  </View>
                </TouchableOpacity>

                {/* Instructions Card */}
                <View style={styles.instructionsCard}>
                  <View style={styles.instructionsHeader}>
                    <View style={styles.instructionsIconContainer}>
                      <Ionicons name="information-circle" size={20} color="#3b82f6" />
                    </View>
                    <Text style={styles.instructionsTitle}>How to Upload</Text>
                  </View>

                  <View style={styles.instructionsList}>
                    {[
                      { step: '1', text: 'Take a clear, well-lit photo of the fuel receipt' },
                      { step: '2', text: 'Ensure the amount, date, and station name are visible' },
                      { step: '3', text: 'Upload for verification and trip completion' },
                    ].map((item, index) => (
                      <View key={index} style={styles.instructionItem}>
                        <View style={styles.stepBadge}>
                          <Text style={styles.stepText}>{item.step}</Text>
                        </View>
                        <Text style={styles.instructionText}>{item.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Animated.View>
            ) : (
              <Animated.View style={{ opacity: fadeAnim }}>
                {/* Image Preview Card */}
                <Animated.View 
                  style={[
                    styles.previewCard,
                    { transform: [{ scale: imageScaleAnim }] }
                  ]}
                >
                  <View style={styles.previewContainer}>
                    <Image 
                      source={{ uri: image }} 
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.6)']}
                      style={styles.previewOverlay}
                    />
                    <TouchableOpacity
                      style={styles.retakeButton}
                      onPress={resetImage}
                      activeOpacity={0.7}
                    >
                      <View style={styles.retakeButtonInner}>
                        <Ionicons name="refresh" size={18} color="white" />
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Image Info */}
                  {imageInfo && (
                    <View style={styles.imageInfoContainer}>
                      <View style={styles.imageInfoRow}>
                        <Ionicons name="resize-outline" size={14} color="#6b7280" />
                        <Text style={styles.imageInfoText}>
                          {imageInfo.width} × {imageInfo.height} px
                        </Text>
                      </View>
                      <View style={styles.imageInfoDivider} />
                      <View style={styles.imageInfoRow}>
                        <Ionicons name="document-outline" size={14} color="#6b7280" />
                        <Text style={styles.imageInfoText}>
                          {formatFileSize(imageInfo.size)}
                        </Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.changePhotoButton}
                    onPress={showImageOptions}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="images-outline" size={18} color="#6b7280" />
                    <Text style={styles.changePhotoText}>Change Photo</Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Upload Progress */}
                {loading && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBackground}>
                      <Animated.View 
                        style={[
                          styles.progressBarFill,
                          { 
                            width: progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', '100%']
                            })
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>Uploading receipt...</Text>
                  </View>
                )}

                {/* Upload Button */}
                <TouchableOpacity
                  onPress={uploadReceipt}
                  disabled={loading}
                  activeOpacity={0.8}
                  style={styles.uploadButton}
                >
                  <LinearGradient
                    colors={loading ? ['#6b7280', '#4b5563'] : ['#059669', '#047857', '#065f46']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.uploadButtonGradient}
                  >
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator color="white" size="small" />
                        <Text style={styles.loadingText}>Uploading...</Text>
                      </View>
                    ) : (
                      <>
                        <Ionicons name="cloud-upload-outline" size={24} color="white" />
                        <View style={styles.uploadButtonTextContainer}>
                          <Text style={styles.uploadButtonTitle}>Upload Receipt</Text>
                          <Text style={styles.uploadButtonSubtitle}>Submit for verification</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={resetImage}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Remove Photo</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerCircle1: {
    width: 250,
    height: 250,
    top: -80,
    right: -60,
  },
  headerCircle2: {
    width: 180,
    height: 180,
    bottom: -40,
    left: -40,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  headerContent: {
    position: 'relative',
    zIndex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: 12,
  },
  closeButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tripInfoCard: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tripInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tripInfoText: {
    flex: 1,
  },
  tripInfoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  tripInfoValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Content
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // Upload Card
  uploadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  uploadIconContainer: {
    marginBottom: 20,
  },
  uploadIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 16,
  },
  fileFormats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formatBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  formatText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  maxSizeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },

  // Instructions Card
  instructionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  instructionsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3b82f6',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    lineHeight: 20,
  },

  // Preview Card
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  previewImage: {
    width: '100%',
    height: 320,
    borderRadius: 16,
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  retakeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  retakeButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  imageInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  imageInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  imageInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  imageInfoDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#e2e8f0',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },

  // Progress
  progressContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },

  // Upload Button
  uploadButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 14,
  },
  uploadButtonTextContainer: {
    flex: 1,
  },
  uploadButtonTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  uploadButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  // Cancel Button
  cancelButton: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
});