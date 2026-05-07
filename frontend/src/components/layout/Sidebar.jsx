// src/components/layout/Sidebar.jsx

import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Truck,
  Users,
  Building2,
  Fuel,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  BarChart3,
  Calendar,
  Car,
  ClipboardList,
  Receipt,
  AlertCircle,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileBarChart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  const getDashboardHref = () => {
    if (user?.role === "superadmin") return "/admin/dashboard";
    if (user?.role === "gso_staff") return "/gso/dashboard";
    if (user?.role === "mayors_office") return "/mo/dashboard";
    if (user?.role === "dept_office") return "/department/dashboard";
    if (user?.role === "head_of_office") return "/head/dashboard";
    if (user?.role === "driver") return "/driver/dashboard";
    return "/dashboard";
  };

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [setIsOpen]);

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location, isMobile, setIsOpen]);

  const getNavigationItems = () => {
    const roleSpecificItems = {
      superadmin: [
        { name: "Dashboard", href: getDashboardHref(), icon: LayoutDashboard },
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Departments", href: "/admin/departments", icon: Building2 },
        { name: "Vehicles", href: "/admin/vehicles", icon: Car },
        { name: "Budget Policies", href: "/admin/budget-policies", icon: DollarSign },
        { name: "System Settings", href: "/admin/settings", icon: Settings },
        // { name: "Reports", href: "/admin/reports", icon: FileBarChart }, // DISABLED - Can be enabled later
      ],
      gso_staff: [
        { name: "Dashboard", href: "/gso/dashboard", icon: LayoutDashboard },
        { name: "Pending Review", href: "/gso/pending", icon: Clock },
        { name: "Verified Tickets", href: "/gso/verified", icon: CheckCircle },
        { name: "Returned Tickets", href: "/gso/returned", icon: AlertCircle },
        { name: "Forward to MO", href: "/gso/forward", icon: ClipboardList },
        // { name: "Reports", href: "/gso/reports", icon: FileBarChart }, // DISABLED - Can be enabled later
      ],
      mayors_office: [
        { name: "Dashboard", href: "/mo/dashboard", icon: LayoutDashboard },
        { name: "Pending Fund Release", href: "/mo/pending", icon: Clock },
        { name: "Funds Released", href: "/mo/approved", icon: CheckCircle },
        { name: "Reconciliation", href: "/mo/reconciliation", icon: ClipboardList },
        { name: "Reports", href: "/mo/reports", icon: FileBarChart },
      ],
      dept_office: [
        { name: "Dashboard", href: "/department/dashboard", icon: LayoutDashboard },
        { name: "My Requests", href: "/department/requests", icon: FileText },
        { name: "Create Trip", href: "/department/create", icon: FileText },
        // { name: "Reports", href: "/department/reports", icon: FileBarChart }, // DISABLED - Can be enabled later
      ],
      head_of_office: [
        { name: "Dashboard", href: "/head/dashboard", icon: LayoutDashboard },
        { name: "Pending Approval", href: "/head/pending", icon: Clock },
      ],
      driver: [
        { name: "My Trips", href: "/driver/trips", icon: Truck },
        { name: "Active Trip", href: "/driver/active", icon: Fuel },
        { name: "Trip History", href: "/driver/history", icon: Calendar },
        { name: "Fuel Logs", href: "/driver/fuel-logs", icon: Receipt },
        { name: "Reports", href: "/driver/reports", icon: FileBarChart },
      ],
    };

    return roleSpecificItems[user?.role] || [];
  };

  const navigation = getNavigationItems();

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const getUserInitials = () => {
    const firstName = user?.first_name?.charAt(0) || "";
    const lastName = user?.last_name?.charAt(0) || "";
    return `${firstName}${lastName}`.toUpperCase();
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="default"
        size="icon"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 shadow-lg md:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop Toggle Button */}
      {!isOpen && !isMobile && (
        <Button
          variant="default"
          size="icon"
          onClick={toggleSidebar}
          className="fixed top-20 left-4 z-50 shadow-lg rounded-full"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Overlay for mobile */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-background border-r z-40",
          "transition-all duration-300 ease-in-out shadow-xl",
          "flex flex-col",
          isOpen ? "w-64" : "w-16",
          isMobile && !isOpen && "-translate-x-full",
        )}
      >
        {/* Toggle button inside sidebar */}
        {!isMobile && isOpen && (
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
            className="absolute -right-3 top-20 rounded-full shadow-md z-50 bg-background hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Logo Section */}
        <div
          className={cn(
            "flex items-center h-16 border-b",
            isOpen ? "justify-start px-4" : "justify-center",
          )}
        >
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-primary to-primary/70 p-2 rounded-lg">
              <Fuel className="h-6 w-6 text-primary-foreground" />
            </div>
            {isOpen && (
              <div className="text-left">
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  FCMS
                </span>
              </div>
            )}
          </div>
        </div>

        {/* User Info Section */}
        <div className={cn("p-3 border-b", !isOpen && "flex justify-center")}>
          <div className={cn("flex items-center", isOpen ? "space-x-3" : "flex-col")}>
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user?.full_name || user?.first_name || user?.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.role_label}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => isMobile && setIsOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center rounded-lg transition-all duration-200",
                      "hover:bg-accent hover:text-accent-foreground",
                      isActive
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "text-muted-foreground",
                      isOpen ? "px-3 py-2 space-x-3" : "justify-center p-2",
                    )
                  }
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", !isOpen && "mx-auto")} />
                  {isOpen && <span className="text-sm font-medium">{item.name}</span>}
                </NavLink>
              );
            })}
          </div>
        </ScrollArea>

        <Separator />

        {/* Footer - Logout */}
        <div className={cn("p-3", !isOpen && "flex justify-center")}>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "group w-full text-destructive hover:text-destructive hover:bg-destructive/10",
              isOpen ? "justify-start px-3" : "justify-center p-2",
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {isOpen && <span className="ml-3 text-sm font-medium">Logout</span>}
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;