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

// ✅ Department Pages (GSO Superadmin)
import DepartmentManagement from "./pages/mayor/departments/DepartmentManagement";
import AddDepartment from "./pages/mayor/departments/AddDepartment";
import EditDepartment from "./pages/mayor/departments/EditDepartment";

// ✅ User Pages (GSO Superadmin)
import UserManagement from "./pages/gso/users/UserManagement";
import AddUser from "./pages/gso/users/AddUser";
import EditUser from "./pages/gso/users/EditUser";

// ✅ Vehicle Pages (GSO Superadmin)
import VehicleManagement from "./pages/gso/vehicles/VehicleManagement";
import AddVehicle from "./pages/gso/vehicles/AddVehicle";
import EditVehicle from "./pages/gso/vehicles/EditVehicle";

// GSO Pages
import GsoDashboard from "./pages/gso/GsoDashboard";
import GsoCreateTrip from "./pages/gso/GsoCreateTrip";
import GsoAllTrips from "./pages/gso/GsoAllTrips";
import GsoPendingMO from "./pages/gso/GsoPendingMO";
import GsoReconciliation from "./pages/gso/GsoReconciliation";
import GsoReturned from "./pages/gso/GsoReturned";
import GsoReports from "./pages/gso/GsoReports";
import GsoTripTicket from "./pages/gso/GsoTripTicket";
import SystemSettings from "./pages/gso/SystemSettings";
import FuelReceipts from "./pages/gso/FuelReceipts";
import CompletedTrips from "./pages/gso/CompletedTrips";

// Staff Pages
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffTrips from "./pages/staff/StaffTrips";
import StaffReports from "./pages/staff/StaffReports";

// Mayor's Office Pages
import MayorDashboard from "./pages/mayor/MayorDashboard";
import MayorPending from "./pages/mayor/MayorPending";
import MayorApproved from "./pages/mayor/MayorApproved";
import MayorFundIssuance from "./pages/mayor/MayorFundIssuance";
import MayorBudgetAssistance from "./pages/mayor/BudgetAssistance";
import MayorBudget from "./pages/mayor/MayorBudget";
import MayorReports from "./pages/mayor/MayorReports";
import MayorTripTicketDetail from "./pages/mayor/MayorTripTicketDetail";
import BudgetPolicies from "./pages/mayor/BudgetPolicies";
import MayorReceiptVerification from "./pages/mayor/MayorReceiptVerification";

// Shared Pages
import Reports from "./pages/admin/Reports";
import Profile from "./pages/admin/Profile";
import Help from "./pages/admin/WorkInProgress";
import Unauthorized from "./pages/Unauthorized";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* ============ PUBLIC ROUTES ============ */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ============================================================ */}
          {/* ============ GSO ROUTES (Superadmin Equivalent) ============ */}
          {/* ============================================================ */}

          {/* GSO Dashboard & Trip Management */}
          <Route
            path="/gso/dashboard"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <GsoDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gso/create-trip"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <GsoCreateTrip />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gso/all-trips"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <GsoAllTrips />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gso/pending-mo"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <GsoPendingMO />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gso/reconciliation"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <GsoReconciliation />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gso/returned"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <GsoReturned />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gso/reports"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <GsoReports />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gso/tickets/:id"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <GsoTripTicket />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gso/fuel-receipts"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <FuelReceipts />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gso/completed-trips"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <CompletedTrips />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* ============================================================ */}
          {/* ============ GSO ADMIN ROUTES (Superadmin) ============ */}
          {/* ============================================================ */}

          {/* DEPARTMENT ROUTES */}
          <Route
            path="/mo/departments"
            element={
              <ProtectedRoute allowedRoles={["mayors_office"]}>
                <Layout>
                  <DepartmentManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mo/departments/add"
            element={
              <ProtectedRoute allowedRoles={["mayors_office"]}>
                <Layout>
                  <AddDepartment />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mo/departments/edit/:id"
            element={
              <ProtectedRoute allowedRoles={["mayors_office"]}>
                <Layout>
                  <EditDepartment />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* USER ROUTES */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <UserManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users/add"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <AddUser />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users/edit/:id"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <EditUser />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* VEHICLE ROUTES */}
          <Route
            path="/admin/vehicles"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <VehicleManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vehicles/add"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <AddVehicle />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vehicles/edit/:id"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <EditVehicle />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* SYSTEM SETTINGS */}
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <SystemSettings />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* BUDGET POLICIES (GSO) */}
          <Route
            path="/admin/budget-policies"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <BudgetPolicies />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* REPORTS (GSO) */}
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={["gso_office"]}>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* ============================================================ */}
          {/* ============ STAFF ROUTES ============ */}
          {/* ============================================================ */}

          <Route
            path="/driver/dashboard"
            element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <Layout>
                  <StaffDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/trips"
            element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <Layout>
                  <StaffTrips />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/reports"
            element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <Layout>
                  <StaffReports />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* ============================================================ */}
          {/* ============ MAYOR'S OFFICE ROUTES ============ */}
          {/* ============================================================ */}

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
            path="/mo/approved"
            element={
              <ProtectedRoute allowedRoles={["mayors_office"]}>
                <Layout>
                  <MayorApproved />
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
            path="/mo/budget-assistance"
            element={
              <ProtectedRoute allowedRoles={["mayors_office"]}>
                <Layout>
                  <MayorBudgetAssistance />
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
            path="/mo/budget-policies"
            element={
              <ProtectedRoute allowedRoles={["mayors_office"]}>
                <Layout>
                  <BudgetPolicies />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/mo/receipt-verification"
            element={
              <ProtectedRoute allowedRoles={["mayors_office"]}>
                <Layout>
                  <MayorReceiptVerification />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* ============================================================ */}
          {/* ============ SHARED ROUTES ============ */}
          {/* ============================================================ */}

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

          {/* ============================================================ */}
          {/* ============ UNAUTHORIZED & 404 ============ */}
          {/* ============================================================ */}

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
