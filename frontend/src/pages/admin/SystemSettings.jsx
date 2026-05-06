import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Settings,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  User,
  Fuel,
  MapPin,
  Gauge,
  Clock,
  AlertTriangle,
  Wifi,
  Building2,
  Mail,
  Phone,
  Globe,
  Bell,        
  DollarSign
} from 'lucide-react';

const SystemSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getAll();
      const settingsData = response.data.data || response.data;
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to load settings');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save each setting individually or use bulk update
      for (const [key, value] of Object.entries(settings)) {
        await settingsAPI.update(key, value);
      }
      setSuccessMessage('All settings saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to save settings');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchSettings();
    setSuccessMessage('Settings reset to saved values');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'gps', label: 'GPS Configuration', icon: MapPin },
    { id: 'stations', label: 'Fuel Stations', icon: Fuel },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure system parameters and preferences</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {errorMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mayor Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Mayor's Office Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mayor_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Mayor's Name
                </Label>
                <Input
                  id="mayor_name"
                  value={settings.mayor_name || ''}
                  onChange={(e) => handleSettingChange('mayor_name', e.target.value)}
                  placeholder="e.g., Hon. Juan Dela Cruz"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Appears on printed gas slips</p>
              </div>
              <div>
                <Label htmlFor="mayor_office_phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Mayor's Office Phone
                </Label>
                <Input
                  id="mayor_office_phone"
                  value={settings.mayor_office_phone || ''}
                  onChange={(e) => handleSettingChange('mayor_office_phone', e.target.value)}
                  placeholder="e.g., (02) 8123-4567"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="mayor_office_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Mayor's Office Email
                </Label>
                <Input
                  id="mayor_office_email"
                  type="email"
                  value={settings.mayor_office_email || ''}
                  onChange={(e) => handleSettingChange('mayor_office_email', e.target.value)}
                  placeholder="e.g., mayor@fcms.gov.ph"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="system_name">System Name</Label>
                <Input
                  id="system_name"
                  value={settings.system_name || 'FCMS'}
                  onChange={(e) => handleSettingChange('system_name', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="system_timezone">Timezone</Label>
                <select
                  id="system_timezone"
                  value={settings.system_timezone || 'Asia/Manila'}
                  onChange={(e) => handleSettingChange('system_timezone', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                  <option value="UTC">UTC</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                  <option value="Australia/Sydney">Australia/Sydney (GMT+10)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="date_format">Date Format</Label>
                <select
                  id="date_format"
                  value={settings.date_format || 'Y-m-d'}
                  onChange={(e) => handleSettingChange('date_format', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Y-m-d">YYYY-MM-DD</option>
                  <option value="m/d/Y">MM/DD/YYYY</option>
                  <option value="d/m/Y">DD/MM/YYYY</option>
                  <option value="F j, Y">Month DD, YYYY</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* GSO Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                GSO Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="gso_head_name">GSO Head Name</Label>
                <Input
                  id="gso_head_name"
                  value={settings.gso_head_name || ''}
                  onChange={(e) => handleSettingChange('gso_head_name', e.target.value)}
                  placeholder="e.g., Engr. Maria Santos"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gso_office_phone">GSO Office Phone</Label>
                <Input
                  id="gso_office_phone"
                  value={settings.gso_office_phone || ''}
                  onChange={(e) => handleSettingChange('gso_office_phone', e.target.value)}
                  placeholder="e.g., (02) 8123-4567"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gso_office_email">GSO Office Email</Label>
                <Input
                  id="gso_office_email"
                  type="email"
                  value={settings.gso_office_email || ''}
                  onChange={(e) => handleSettingChange('gso_office_email', e.target.value)}
                  placeholder="e.g., gso@fcms.gov.ph"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* GPS Configuration Tab */}
      {activeTab === 'gps' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                GPS Tracking Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="gps_ping_interval_seconds" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  GPS Ping Interval (seconds)
                </Label>
                <Input
                  id="gps_ping_interval_seconds"
                  type="number"
                  value={settings.gps_ping_interval_seconds || 30}
                  onChange={(e) => handleSettingChange('gps_ping_interval_seconds', parseInt(e.target.value))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">How often the mobile app sends GPS coordinates</p>
              </div>

              <div>
                <Label htmlFor="gps_accuracy_threshold_meters" className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  GPS Accuracy Threshold (meters)
                </Label>
                <Input
                  id="gps_accuracy_threshold_meters"
                  type="number"
                  value={settings.gps_accuracy_threshold_meters || 50}
                  onChange={(e) => handleSettingChange('gps_accuracy_threshold_meters', parseInt(e.target.value))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Below this accuracy, pings are flagged as low accuracy</p>
              </div>

              <div>
                <Label htmlFor="minimum_gps_pings_threshold" className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  Minimum GPS Pings Required
                </Label>
                <Input
                  id="minimum_gps_pings_threshold"
                  type="number"
                  value={settings.minimum_gps_pings_threshold || 5}
                  onChange={(e) => handleSettingChange('minimum_gps_pings_threshold', parseInt(e.target.value))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum pings required for a valid GPS distance calculation</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                Anomaly Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="gps_distance_odometer_tolerance_pct" className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  GPS vs Odometer Tolerance (%)
                </Label>
                <Input
                  id="gps_distance_odometer_tolerance_pct"
                  type="number"
                  step="1"
                  value={settings.gps_distance_odometer_tolerance_pct || 20}
                  onChange={(e) => handleSettingChange('gps_distance_odometer_tolerance_pct', parseInt(e.target.value))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Variance allowed between GPS distance and odometer reading</p>
              </div>

              <div>
                <Label htmlFor="max_trip_duration_hours">Maximum Trip Duration (hours)</Label>
                <Input
                  id="max_trip_duration_hours"
                  type="number"
                  value={settings.max_trip_duration_hours || 24}
                  onChange={(e) => handleSettingChange('max_trip_duration_hours', parseInt(e.target.value))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Alert if trip exceeds this duration</p>
              </div>

              <div>
                <Label htmlFor="max_idle_minutes">Maximum Idle Time (minutes)</Label>
                <Input
                  id="max_idle_minutes"
                  type="number"
                  value={settings.max_idle_minutes || 30}
                  onChange={(e) => handleSettingChange('max_idle_minutes', parseInt(e.target.value))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Alert if vehicle idles longer than this</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fuel Stations Tab */}
      {activeTab === 'stations' && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-blue-600" />
                Contracted Fuel Stations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contracted_station_name">Primary Contracted Station</Label>
                <Input
                  id="contracted_station_name"
                  value={settings.contracted_station_name || ''}
                  onChange={(e) => handleSettingChange('contracted_station_name', e.target.value)}
                  placeholder="e.g., Petron - Main Branch"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Official fuel station where drivers must fuel</p>
              </div>

              <div>
                <Label htmlFor="contracted_station_address">Station Address</Label>
                <Input
                  id="contracted_station_address"
                  value={settings.contracted_station_address || ''}
                  onChange={(e) => handleSettingChange('contracted_station_address', e.target.value)}
                  placeholder="Full address of the station"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="contracted_station_contact">Station Contact Number</Label>
                <Input
                  id="contracted_station_contact"
                  value={settings.contracted_station_contact || ''}
                  onChange={(e) => handleSettingChange('contracted_station_contact', e.target.value)}
                  placeholder="Contact number"
                  className="mt-1"
                />
              </div>

              <div className="pt-4 border-t">
                <Label htmlFor="alternate_station_name">Alternate Station (Optional)</Label>
                <Input
                  id="alternate_station_name"
                  value={settings.alternate_station_name || ''}
                  onChange={(e) => handleSettingChange('alternate_station_name', e.target.value)}
                  placeholder="e.g., Shell - South Branch"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-blue-600" />
                Fuel Price Settings (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="diesel_price_per_liter">Diesel Price (₱/liter)</Label>
                <Input
                  id="diesel_price_per_liter"
                  type="number"
                  step="0.01"
                  value={settings.diesel_price_per_liter || ''}
                  onChange={(e) => handleSettingChange('diesel_price_per_liter', parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="premium_price_per_liter">Premium Price (₱/liter)</Label>
                <Input
                  id="premium_price_per_liter"
                  type="number"
                  step="0.01"
                  value={settings.premium_price_per_liter || ''}
                  onChange={(e) => handleSettingChange('premium_price_per_liter', parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="regular_price_per_liter">Regular Price (₱/liter)</Label>
                <Input
                  id="regular_price_per_liter"
                  type="number"
                  step="0.01"
                  value={settings.regular_price_per_liter || ''}
                  onChange={(e) => handleSettingChange('regular_price_per_liter', parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">Send system notifications via email</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSettingChange('email_notifications_enabled', !settings.email_notifications_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.email_notifications_enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.email_notifications_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-gray-500">Send push notifications to mobile devices</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSettingChange('push_notifications_enabled', !settings.push_notifications_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.push_notifications_enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.push_notifications_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="pt-4">
                <Label htmlFor="notification_retention_days">Notification Retention (days)</Label>
                <Input
                  id="notification_retention_days"
                  type="number"
                  value={settings.notification_retention_days || 30}
                  onChange={(e) => handleSettingChange('notification_retention_days', parseInt(e.target.value))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Number of days to keep notification history</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;