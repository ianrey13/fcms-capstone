// src/pages/Login.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fuel, Shield, Building2, MapPin, Clock } from 'lucide-react';
import LoginForm from '../components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRoutes = {
        'superadmin': '/admin/dashboard',
        'gso_staff': '/gso/dashboard',
        'mayors_office': '/mo/dashboard',
        'head_of_office': '/head/dashboard',
        'dept_office': '/department/dashboard',
        'driver': '/driver/dashboard',
      };
      navigate(roleRoutes[user.role] || '/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 opacity-20">
        <Building2 className="h-16 w-16 text-white" />
      </div>
      <div className="absolute bottom-10 right-10 opacity-20">
        <MapPin className="h-16 w-16 text-white" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 relative z-10 bg-white/95 backdrop-blur-sm overflow-hidden">
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600" />
        
        <CardHeader className="space-y-1 text-center pt-8 pb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-2xl shadow-lg relative">
              <Fuel className="h-10 w-10 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              FCMS
            </span>
          </CardTitle>
          <CardDescription className="text-gray-500 text-sm font-medium">
            Fuel Consumption Monitoring System
          </CardDescription>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-gray-300" />
            <span className="text-xs text-gray-400">Municipality of Laguindingan</span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-gray-300" />
          </div>
        </CardHeader>
        
        <CardContent className="pb-8 px-6">
          <LoginForm />
        </CardContent>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>24/7 Support</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Secure Access</span>
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-2">
            © 2026 General Services Office - Laguindingan
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;