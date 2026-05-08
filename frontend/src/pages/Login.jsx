// src/pages/Login.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fuel, Shield, Building2, MapPin, Clock, Sparkles, Lock, CheckCircle } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-4 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-10 w-1 h-1 bg-blue-400 rounded-full animate-ping" />
        <div className="absolute bottom-1/3 right-20 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping delay-300" />
        <div className="absolute top-2/3 left-1/3 w-1 h-1 bg-cyan-400 rounded-full animate-ping delay-700" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 opacity-10 hidden lg:block">
        <Building2 className="h-20 w-20 text-white" />
      </div>
      <div className="absolute bottom-10 right-10 opacity-10 hidden lg:block">
        <MapPin className="h-20 w-20 text-white" />
      </div>
      <div className="absolute top-1/3 right-20 opacity-5 hidden lg:block">
        <Fuel className="h-32 w-32 text-white rotate-12" />
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-md shadow-2xl border-0 relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm overflow-hidden animate-fade-in-up">
        {/* Premium Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600" />
        
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-3xl" />
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-br-3xl" />
        
        <CardHeader className="space-y-1 text-center pt-10 pb-6">
          {/* Logo with premium effects */}
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-2xl shadow-xl">
                <Fuel className="h-12 w-12 text-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-500" />
              </div>
            </div>
          </div>
          
          {/* Main Title */}
          <CardTitle className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              FCMS
            </span>
          </CardTitle>
          
          <CardDescription className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Fuel Consumption Monitoring  System
          </CardDescription>
          
          {/* Divider with municipality name */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-slate-300 dark:to-slate-700" />
            <span className="text-xs text-slate-400 dark:text-slate-500">General Service Office Laguindingan</span>
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-slate-300 dark:to-slate-700" />
          </div>
          
          {/* Feature badges */}
          <div className="flex items-center justify-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] text-slate-500">Real-time GPS</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-blue-500" />
              <span className="text-[10px] text-slate-500">Secure Access</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-8 px-6">
          <LoginForm />
        </CardContent>

        {/* Premium Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>24/7 Support</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              <span>Secured by FCMS</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              <span>Real-time Tracking</span>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-3">
            © 2026 General Services Office - Laguindingan • All rights reserved
          </p>
          <p className="text-center text-[9px] text-slate-300 dark:text-slate-600 mt-1">
            Version 1.0.0 • Build 2024.1
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;