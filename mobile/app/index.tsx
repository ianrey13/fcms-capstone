// mobile/app/index.tsx
import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard,
  ImageBackground
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { authAPI } from '../services/api';
import { storage } from '../utils/storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const token = await storage.getItem('fcms_token');
      if (token) {
        router.replace('/auth');
      }
    } catch (error) {
      console.error('Session check error:', error);
      await storage.deleteItem('fcms_token');
      await storage.deleteItem('fcms_user');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    setLoading(true);
    
    try {
      const response = await authAPI.login(email, password);
      console.log('Login response:', response.data);

      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data;
        
        await storage.setItem('fcms_token', token);
        await storage.setItem('fcms_user', JSON.stringify(user));
        
        router.replace('/auth');
      } else {
        Alert.alert('Login Failed', response.data.message || 'Invalid credentials');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response?.status === 403) {
        errorMessage = 'Account is inactive. Contact administrator.';
      } else if (!error.response) {
        errorMessage = 'Network error. Check your connection.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ImageBackground 
          source={{ uri: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800' }}
          className="flex-1"
          blurRadius={3}
        >
          <LinearGradient
            colors={['rgba(30, 58, 110, 0.85)', 'rgba(37, 99, 235, 0.85)', 'rgba(59, 130, 246, 0.85)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1"
          >
            <StatusBar style="light" />
            
            <View className="flex-1 items-center justify-center px-6">
              {/* Logo Section */}
              <View className="items-center mb-12">
                <View className="bg-white/20 p-6 rounded-full mb-4 border border-white/30">
                  <MaterialCommunityIcons name="gas-station" size={50} color="white" />
                </View>
                <Text className="text-3xl font-bold text-white tracking-wide">FCMS</Text>
                <Text className="text-white/80 text-center mt-2 text-sm">
                  Fuel Consumption Monitoring System
                </Text>
                <View className="flex-row items-center mt-3">
                  <View className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                  <Text className="text-white/60 text-xs">General Service Office - Laguindingan</Text>
                </View>
              </View>

              {/* Login Form */}
              <View className="w-full bg-white/95 rounded-2xl p-6 shadow-lg">
                <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">
                  Welcome Back
                </Text>
                <Text className="text-gray-500 text-sm text-center mb-6">
                  Sign in to continue
                </Text>
                
                <View className="space-y-4">
                  {/* Email Input */}
                  <View>
                    <Text className="text-gray-600 text-sm mb-1 font-medium">Email Address</Text>
                    <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50">
                      <View className="pl-3">
                        <Ionicons name="mail-outline" size={20} color="#9ca3af" />
                      </View>
                      <TextInput
                        className="flex-1 p-3 text-base"
                        placeholder="driver@example.com"
                        placeholderTextColor="#9ca3af"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>
                  
                  {/* Password Input */}
                  <View>
                    <Text className="text-gray-600 text-sm mb-1 font-medium">Password</Text>
                    <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50">
                      <View className="pl-3">
                        <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
                      </View>
                      <TextInput
                        className="flex-1 p-3 text-base"
                        placeholder="Enter your password"
                        placeholderTextColor="#9ca3af"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity 
                        className="pr-3"
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons 
                          name={showPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color="#9ca3af" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  className="mt-6 rounded-xl overflow-hidden shadow-lg"
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#2563eb', '#1e3a6e']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="py-3.5 items-center"
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <View className="flex-row items-center">
                        <Ionicons name="log-in-outline" size={20} color="white" />
                        <Text className="text-white font-semibold text-base ml-2">Sign In</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Version Footer */}
              <Text className="text-white/40 text-xs mt-8">
            © 2026 General Services Office - Laguindingan • All rights reserved
              </Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}