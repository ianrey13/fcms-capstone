import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import { Toaster } from "react-hot-toast";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import DepartmentManagement from "./pages/admin/DepartmentManagement";
import VehicleManagement from "./pages/admin/VehicleManagement";
import SystemSettings from "./pages/admin/SystemSettings";
import BudgetPolicies from "./pages/admin/BudgetPolicies";
import Reports from "./pages/admin/Reports";
import Profile from "./pages/admin/Profile";

// Department Pages
import DepartmentDashboard from "./pages/department/DepartmentDashboard";
import CreateTripTicket from "./pages/department/CreateTripTicket";
import MyRequests from "./pages/department/MyRequests";
import TripTicketDetail from "./pages/department/TripTicketDetail";

// GSO pages
import GsoPending from "./pages/gso/GsoPending";
import GsoVerified from "./pages/gso/GsoVerified";
import GsoReturned from "./pages/gso/GsoReturned";
import GsoForward from "./pages/gso/GsoForward";
import GsoReports from "./pages/gso/GsoReports";
import GsoDashboard from "./pages/gso/GsoDashboard";
import GsoTripTicket from "./pages/gso/GsoTripTicket";

//mayors pages
import MayorDashboard from "./pages/mayor/MayorDashboard";
import MayorPending from "./pages/mayor/MayorPending";
import MayorApproved from "./pages/mayor/MayorApproved";
import MayorFundIssuance from "./pages/mayor/MayorFundIssuance";
import MayorReconciliation from "./pages/mayor/MayorReconciliation";
import MayorBudget from "./pages/mayor/MayorBudget";
import MayorReports from "./pages/mayor/MayorReports";
import MayorTripTicketDetail from "./pages/mayor/MayorTripTicketDetail";
import BudgetAssistance from "./pages/mayor/BudgetAssistance";

// Driver Pages (Work in Progress - replace with actual components later)
import DriverTrips from "./pages/admin/WorkInProgress";
import DriverActive from "./pages/admin/WorkInProgress";
import DriverHistory from "./pages/admin/WorkInProgress";
import DriverFuelLogs from "./pages/admin/WorkInProgress";

// Head of Office Pages
import HeadDashboard from "./pages/head/HeadDashboard";
import HeadPendingApproval from "./pages/head/HeadPendingApproval";
import HeadCreateTripTicket from "./pages/head/HeadCreateTripTicket";

// Help Page
import Help from "./pages/admin/WorkInProgress";
import Unauthorized from "./pages/Unauthorized";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          {/* Default redirect - changed from /dashboard to /admin/dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Navigate to="/admin/dashboard" replace />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* ============ SUPER ADMIN ROUTES ============ */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["superadmin"]}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["superadmin"]}>
                <Layout>
                  <UserManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRoles={["superadmin"]}>
                <Layout>
                  <DepartmentManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vehicles"
            element={
              <ProtectedRoute allowedRoles={["superadmin"]}>
                <Layout>
                  <VehicleManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={["superadmin"]}>
                <Layout>
                  <SystemSettings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/budget-policies"
            element={
              <ProtectedRoute allowedRoles={["superadmin"]}>
                <Layout>
                  <BudgetPolicies />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={["superadmin"]}>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Profile Route - All Roles */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* ============ DEPARTMENT OFFICE ROUTES ============ */}
          <Route
            path="/department/dashboard"
            element={
              <ProtectedRoute allowedRoles={["dept_office", "head_of_office"]}>
                <Layout>
                  <DepartmentDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/create"
            element={
              <ProtectedRoute allowedRoles={["dept_office", "head_of_office"]}>
                <Layout>
                  <CreateTripTicket />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/requests"
            element={
              <ProtectedRoute allowedRoles={["dept_office", "head_of_office"]}>
                <Layout>
                  <MyRequests />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/requests/:id"
            element={
              <ProtectedRoute allowedRoles={["dept_office", "head_of_office"]}>
                <Layout>
                  <TripTicketDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/budget"
            element={
              <ProtectedRoute allowedRoles={["dept_office", "head_of_office"]}>
                <Layout>
                  <BudgetPolicies />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* ============ GSO ROUTES ============ */}
          <Route
            path="/gso/dashboard"
            element={
              <ProtectedRoute allowedRoles={["gso_staff"]}>
                <Layout>
                  <GsoDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gso/pending"
            element={
              <ProtectedRoute allowedRoles={["gso_staff"]}>
                <Layout>
                  <GsoPending />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gso/verified"
            element={
              <ProtectedRoute allowedRoles={["gso_staff"]}>
                <Layout>
                  <GsoVerified />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gso/returned"
            element={
              <ProtectedRoute allowedRoles={["gso_staff"]}>
                <Layout>
                  <GsoReturned />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gso/forward"
            element={
              <ProtectedRoute allowedRoles={["gso_staff"]}>
                <Layout>
                  <GsoForward />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gso/reports"
            element={
              <ProtectedRoute allowedRoles={["gso_staff"]}>
                <Layout>
                  <GsoReports />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* ============ HEAD OF OFFICE ROUTES ============ */}
          <Route
            path="/head/dashboard"
            element={
              <ProtectedRoute allowedRoles={["head_of_office"]}>
                <Layout>
                  <HeadDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/head/pending"
            element={
              <ProtectedRoute allowedRoles={["head_of_office"]}>
                <Layout>
                  <HeadPendingApproval />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* ============ MAYOR'S OFFICE ROUTES ============ */}
          <Route
            path="/mo/dashboard"
            element={
              <ProtectedRoute allowedRoles={["mayors_office"]}>
                <Layout>
                  <MayorDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mo/pending"
            element={
              <ProtectedRoute allowedRoles={["mayors_office"]}>
                <Layout>
                  <MayorPending />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mo/fund-issuance"
            element={
              <ProtectedRoute allowedRoles={["mayors_office"]}>
                <Layout>
                  <MayorFundIssuance />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mo/reconciliation"
            element={
              <ProtectedRoute allowedRoles={["mayors_office"]}>
                <Layout>
                  <MayorReconciliation />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mo/budget"
            element={
              <ProtectedRoute allowedRoles={["mayors_office"]}>
                <Layout>
                  <MayorBudget />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mo/reports"
            element={
              <ProtectedRoute allowedRoles={["mayors_office"]}>
                <Layout>
                  <MayorReports />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mo/approved"
            element={
              <ProtectedRoute allowedRoles={["mayors_office"]}>
                <Layout>
                  <MayorApproved />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* ============ DRIVER ROUTES ============ */}
          <Route
            path="/driver/trips"
            element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <Layout>
                  <DriverTrips />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/active"
            element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <Layout>
                  <DriverActive />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/history"
            element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <Layout>
                  <DriverHistory />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/fuel-logs"
            element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <Layout>
                  <DriverFuelLogs />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/reports"
            element={
              <ProtectedRoute allowedRoles={["driver", "superadmin"]}>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Department Reports */}
          <Route
            path="/department/reports"
            element={
              <ProtectedRoute
                allowedRoles={["dept_office", "head_of_office", "superadmin"]}
              >
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Help Route */}
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <Layout>
                  <Help />
                </Layout>
              </ProtectedRoute>
            }
          />
          // Add this route in your GSO routes section
          <Route
            path="/gso/tickets/:id"
            element={
              <ProtectedRoute allowedRoles={["gso_staff"]}>
                <Layout>
                  <GsoTripTicket />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mo/tickets/:id"
            element={
              <ProtectedRoute allowedRoles={["mayors_office"]}>
                <Layout>
                  <MayorTripTicketDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mo/budget-assistance"
            element={
              <ProtectedRoute allowedRoles={["mayors_office"]}>
                <Layout>
                  <BudgetAssistance />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/head/create-trip"
            element={
              <ProtectedRoute allowedRoles={["head_of_office"]}>
                <Layout>
                <HeadCreateTripTicket />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Unauthorized Page */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          {/* Catch all - 404 redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
