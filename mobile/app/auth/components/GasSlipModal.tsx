// app/auth/components/GasSlipModal.tsx
import { View, Text, Modal, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { X, Printer, FileText, User, Truck, MapPin, Calendar, DollarSign, Fuel, CheckCircle } from 'lucide-react-native';
import { useState, useRef, useEffect } from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface GasSlipProps {
  visible: boolean;
  onClose: () => void;
  gasSlip: {
    gas_slip_id?: number;
    trip_ticket_number?: string;
    amount_released?: number;
    driver_name?: string;
    driver_full_name?: string;
    vehicle?: {
      plate_number?: string;
      vehicle_model?: string;
      fuel_type?: string;
    };
    destination?: string;
    purpose?: string;
    trip_date?: string;
    charge_to?: string;
    created_at?: string;
    mayor_name?: string;
    department_name?: string;
  } | null;
}

export default function GasSlipModal({ visible, onClose, gasSlip }: GasSlipProps) {
  const [printing, setPrinting] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!gasSlip) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '₱0.00';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // ✅ FIX: Get data from nested vehicle object
  const driverName = gasSlip.driver_full_name || gasSlip.driver_name || 'N/A';
  const vehicle = gasSlip.vehicle || {};
  const vehiclePlate = vehicle.plate_number || 'N/A';
  const vehicleModel = vehicle.vehicle_model || '';
  const vehicleInfo = vehicleModel && vehiclePlate ? `${vehicleModel} / ${vehiclePlate}` : vehiclePlate || vehicleModel || 'N/A';
  const fuelType = vehicle.fuel_type ? vehicle.fuel_type.toUpperCase() : 'N/A';
  const destination = gasSlip.destination || 'N/A';
  const purpose = gasSlip.purpose || 'N/A';
  const tripNumber = gasSlip.trip_ticket_number || 'N/A';
  const amountReleased = gasSlip.amount_released || 0;
  const chargeTo = gasSlip.charge_to || 'N/A';
  const departmentName = gasSlip.department_name || 'N/A';

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Driver's Trip Ticket - ${tripNumber}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Times New Roman', 'Georgia', 'Serif', Arial, sans-serif; 
              font-size: 10px; 
              color: #000; 
              background: #fff;
              margin: 0;
              padding: 20px;
            }
            .container {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              border: 2px solid #000;
              background: #fff;
            }
            .headerBanner {
              background: linear-gradient(135deg, #2d5a3f 0%, #4a7c59 50%, #2d5a3f 100%);
              padding: 10px 15px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #1a1a1a;
            }
            .logoCircle {
              width: 60px;
              height: 60px;
              background: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #ffd700;
            }
            .logoText { text-align: center; font-size: 10px; font-weight: bold; }
            .headerText { text-align: center; flex: 1; color: white; }
            .republicText { font-size: 9px; letter-spacing: 1px; margin-bottom: 2px; }
            .provinceText { font-size: 10px; font-weight: bold; }
            .municipalityText { font-size: 12px; font-weight: bold; margin: 2px 0; }
            .gsoBadge { font-size: 10px; font-weight: bold; letter-spacing: 1px; background: #1e3a6e; display: inline-block; padding: 2px 12px; border-radius: 2px; }
            .ticketBar {
              display: flex; justify-content: flex-end; align-items: center;
              border-bottom: 2px solid #000; padding: 4px 12px; gap: 10px;
              font-size: 10px; background: #f5f5f5;
            }
            .section { padding: 6px 12px; }
            .sectionBorder { border-bottom: 1.5px solid #000; }
            .italicNote { font-size: 8.5px; font-style: italic; margin-bottom: 5px; }
            .row { display: flex; align-items: flex-end; margin-bottom: 4px; }
            .rowNum { min-width: 18px; font-size: 9.5px; padding: 3px 4px; }
            .rowLabel { min-width: 210px; font-size: 9.5px; padding: 3px 4px; }
            .rowColon { min-width: 12px; font-size: 9.5px; padding: 3px 4px; }
            .rowValue { flex: 1; border-bottom: 1px solid #000; font-size: 9.5px; padding: 2px 4px; }
            .twoColumnRow { display: flex; gap: 0; }
            .leftColumn { flex: 1; border-right: 1px solid #000; padding-right: 8px; }
            .rightColumn { width: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: bold; font-size: 9px; text-align: center; padding: 4px 8px; }
            .amountBox { background: #e8f5e9; padding: 6px 12px; border-top: 1px solid #4caf50; text-align: center; }
            .amountLabel { font-weight: bold; }
            .amountValue { color: #2e7d32; font-weight: bold; margin-left: 8px; }
            .footerBar { background: #f0f0f0; padding: 4px 12px; border-top: 1px solid #ccc; display: flex; justify-content: space-between; font-size: 8px; }
            @media print { body { margin: 0; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="headerBanner">
              <div class="logoCircle"><div class="logoText">MUN<br/>LOGO</div></div>
              <div class="headerText">
                <div class="republicText">REPUBLIC OF THE PHILIPPINES</div>
                <div class="provinceText">PROVINCE OF MISAMIS ORIENTAL</div>
                <div class="municipalityText">MUNICIPALITY OF LAGUINDINGAN</div>
                <div class="gsoBadge">GENERAL SERVICES OFFICE</div>
                <div style="font-size:8px; margin-top:3px; color:#e0e0e0;">laguindingan.gso@gmail.com</div>
              </div>
              <div class="logoCircle"><div class="logoText">BP<br/>LOGO</div></div>
            </div>
            <div class="ticketBar">
              <span style="font-weight:bold;">Trip Ticket #</span>
              <span style="border-left:1.5px solid #000; padding-left:10px; font-weight:bold;">${tripNumber}</span>
            </div>
            <div class="section sectionBorder">
              <div class="italicNote">(To be filled up by the Administrative Official Authorizing the Travel)</div>
              <div class="row"><span class="rowNum">1.</span><span class="rowLabel">Name of Driver</span><span class="rowColon">:</span><span class="rowValue">${driverName}</span></div>
              <div class="row"><span class="rowNum">2.</span><span class="rowLabel">Government Car used & Plate #</span><span class="rowColon">:</span><span class="rowValue">${vehicleInfo}</span></div>
              <div class="row"><span class="rowNum">3.</span><span class="rowLabel">Name of Authorized Passenger</span><span class="rowColon">:</span><span class="rowValue">${departmentName}</span></div>
              <div class="row"><span class="rowNum">4.</span><span class="rowLabel">Place to be visited & Inspected</span><span class="rowColon">:</span><span class="rowValue">${destination}</span></div>
              <div class="twoColumnRow">
                <div class="leftColumn">
                  <div class="row"><span class="rowNum">5.</span><span class="rowLabel">Purpose of Travel</span><span class="rowColon">:</span><span class="rowValue">${purpose}</span></div>
                  <div class="row"><span class="rowNum">6.</span><span class="rowLabel">Charge to Project/Office</span><span class="rowColon">:</span><span class="rowValue">${chargeTo}</span></div>
                </div>
                <div class="rightColumn">
                  <div style="font-size:8px; margin-top:4px;">Approved: _________________</div>
                  <div style="font-size:7px;">_________________</div>
                  <div style="margin-top:6px; font-weight:bold;">HEAD OF OFFICE</div>
                </div>
              </div>
            </div>
            <div class="amountBox">
              <span class="amountLabel">Amount Released:</span>
              <span class="amountValue">${formatCurrency(amountReleased)}</span>
            </div>
            <div class="footerBar">
              <span>Fuel Type: ${fuelType}</span>
              <span>Date: ${formatDate(gasSlip.trip_date)}</span>
            </div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Trip Ticket',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <BlurView intensity={90} tint="dark" className="flex-1 justify-end">
        <Animated.View 
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          }}
          className="bg-white rounded-t-3xl h-5/6 overflow-hidden"
        >
          {/* Premium Header */}
          <LinearGradient
            colors={['#1e3a6e', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="pt-6 pb-4 px-5"
          >
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">Fuel Consumption Monitoring System</Text>
                <Text className="text-white text-xl font-bold mt-1">Gas Slip</Text>
              </View>
              <TouchableOpacity onPress={onClose} className="bg-white/20 p-2 rounded-full">
                <Ionicons name="close" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
            {/* Control Number - Premium Card */}
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl p-4 mb-5 shadow-lg"
            >
              <Text className="text-white/70 text-xs text-center">CONTROL NUMBER</Text>
              <Text className="text-white text-xl font-bold text-center mt-1 tracking-wider">
                {tripNumber}
              </Text>
            </LinearGradient>

            {/* Info Cards Row */}
            <View className="flex-row mb-4 gap-3">
              <LinearGradient
                colors={['#f3f4f6', '#e5e7eb']}
                className="flex-1 rounded-2xl p-4"
              >
                <View className="flex-row items-center mb-2">
                  <View className="bg-blue-500 p-1.5 rounded-full mr-2">
                    <User size={14} color="white" />
                  </View>
                  <Text className="text-gray-500 text-xs">Driver</Text>
                </View>
                <Text className="text-gray-800 font-bold text-sm">{driverName}</Text>
              </LinearGradient>
              
              <LinearGradient
                colors={['#f3f4f6', '#e5e7eb']}
                className="flex-1 rounded-2xl p-4"
              >
                <View className="flex-row items-center mb-2">
                  <View className="bg-green-500 p-1.5 rounded-full mr-2">
                    <Truck size={14} color="white" />
                  </View>
                  <Text className="text-gray-500 text-xs">Vehicle</Text>
                </View>
                <Text className="text-gray-800 font-bold text-sm">{vehiclePlate}</Text>
                <Text className="text-gray-500 text-xs">{vehicleModel}</Text>
              </LinearGradient>
            </View>

            {/* Trip Details Card */}
            <LinearGradient
              colors={['#f8fafc', '#f1f5f9']}
              className="rounded-2xl p-4 mb-4"
            >
              <View className="flex-row mb-3">
                <Calendar size={16} color="#6b7280" />
                <Text className="text-gray-400 text-xs ml-2 flex-1">Trip Date</Text>
                <Text className="text-gray-800 text-sm font-medium">{formatDate(gasSlip.trip_date)}</Text>
              </View>
              <View className="flex-row mb-3">
                <MapPin size={16} color="#6b7280" />
                <Text className="text-gray-400 text-xs ml-2 flex-1">Destination</Text>
                <Text className="text-gray-800 text-sm font-medium flex-2 text-right">{destination}</Text>
              </View>
              <View className="flex-row">
                <FileText size={16} color="#6b7280" />
                <Text className="text-gray-400 text-xs ml-2 flex-1">Purpose</Text>
                <Text className="text-gray-800 text-sm font-medium flex-2 text-right">{purpose}</Text>
              </View>
            </LinearGradient>

            {/* Fuel & Amount Row */}
            <View className="flex-row mb-5 gap-3">
              <LinearGradient
                colors={['#dbeafe', '#bfdbfe']}
                className="flex-1 rounded-2xl p-4 items-center"
              >
                <Fuel size={24} color="#2563eb" />
                <Text className="text-gray-600 text-xs mt-2">Fuel Type</Text>
                <Text className="text-blue-700 font-bold">{fuelType}</Text>
              </LinearGradient>
              
              <LinearGradient
                colors={['#dcfce7', '#bbf7d0']}
                className="flex-1 rounded-2xl p-4 items-center"
              >
                <DollarSign size={24} color="#16a34a" />
                <Text className="text-gray-600 text-xs mt-2">Amount</Text>
                <Text className="text-green-700 font-bold text-lg">{formatCurrency(amountReleased)}</Text>
              </LinearGradient>
              
              <LinearGradient
                colors={['#fef3c7', '#fde68a']}
                className="flex-1 rounded-2xl p-4 items-center"
              >
                <CheckCircle size={24} color="#d97706" />
                <Text className="text-gray-600 text-xs mt-2">Status</Text>
                <Text className="text-yellow-700 font-bold">Released</Text>
              </LinearGradient>
            </View>

            {/* Mayor Signature */}
            <View className="items-center pt-4 mt-2 border-t border-gray-100">
              <Text className="text-gray-400 text-xs">Approved by:</Text>
              <Text className="text-gray-800 font-bold text-base mt-2">HON. ROY I. MACUA</Text>
              <Text className="text-gray-500 text-xs mt-1">Municipal Mayor</Text>
              <View className="w-24 h-0.5 bg-gray-300 mt-3" />
            </View>

            {/* Footer Note */}
            <Text className="text-gray-400 text-[10px] text-center mt-6">
              This gas slip is valid only for the specified vehicle and driver.
              {'\n'}Present this slip at the contracted fuel station.
            </Text>

            {/* Print Button - Premium */}
            <TouchableOpacity
              onPress={handlePrint}
              disabled={printing}
              activeOpacity={0.8}
              className="mt-6 mb-8"
            >
              <LinearGradient
                colors={['#3b82f6', '#1e3a6e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 rounded-2xl items-center flex-row justify-center shadow-lg"
              >
                {printing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="print" size={22} color="white" />
                    <Text className="text-white font-bold text-base ml-2">Print / Save Gas Slip</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}