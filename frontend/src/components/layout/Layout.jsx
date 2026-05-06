import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import NotificationBell from '../../components/notifications/NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const marginLeft = isMobile ? '0' : (isSidebarOpen ? '256px' : '64px');

  // Don't show notification bell for driver (mobile app)
  const showNotificationBell = user?.role !== 'driver';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* Header Bar with Notification Bell */}
      <div 
        style={{ marginLeft: marginLeft }}
        className="fixed top-0 right-0 left-0 bg-white shadow-sm z-30 transition-all duration-300 ease-in-out"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                {user?.role_label || 'Dashboard'}
              </h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          {/* Notification Bell - Only for web users */}
          {showNotificationBell && (
            <div className="flex items-center gap-2">
              <NotificationBell />
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content with top padding for header */}
      <main 
        style={{ marginLeft: marginLeft, paddingTop: '70px' }}
        className="transition-all duration-300 ease-in-out"
      >
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;