import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fcms_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("fcms_token");
      localStorage.removeItem("fcms_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ============ AUTH API ============
export const authAPI = {
  login: (email, password, deviceName = "web") =>
    api.post("/auth/login", { email, password, device_name: deviceName }),

  logout: () => api.post("/auth/logout"),

  getMe: () => api.get("/auth/me"),

  changePassword: (currentPassword, newPassword) =>
    api.post("/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPassword,
    }),

  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),

  resetPassword: (email, token, password) =>
    api.post("/auth/reset-password", {
      email,
      token,
      password,
      password_confirmation: password,
    }),
    
  updateProfile: (data) => api.post("/auth/update-profile", data),
};

// ============ TRIP TICKET API ============
export const tripTicketAPI = {
  getAll: (params) => api.get("/trip-tickets", { params }),
  getById: (id) => api.get(`/trip-tickets/${id}`),
  create: (data) => api.post("/trip-tickets", data),
  update: (id, data) => api.put(`/trip-tickets/${id}`, data),
  delete: (id) => api.delete(`/trip-tickets/${id}`),
  cancel: (id, reason) => api.post(`/trip-tickets/${id}/cancel`, { reason }),
  getMyRequests: (params) => api.get("/trip-tickets/my-requests", { params }),
  checkBudgetBeforeSubmit: (data) =>
    api.post("/trip-tickets/check-budget", data),
};
// ============ GSO API (Superadmin Equivalent) ============
export const gsoAPI = {
  // Dashboard
  getDashboard: () => api.get("/gso/dashboard"),

  // Trip Management
  getPendingMO: (params) => api.get("/gso/pending", { params }),
  getReturnedTickets: (params) => api.get("/gso/returned", { params }),
  getAllTrips: (params) => api.get("/gso/all-trips", { params }),
  getTicketById: (id) => api.get(`/gso/tickets/${id}`),

  // ✅ GSO Creates Trip Directly
  createTrip: (data) => api.post("/gso/create-trip", data),

  // Reconciliation
  getPendingReconciliation: (params) =>
    api.get("/gso/pending-reconciliation", { params }),
  reconcileTrip: (id, data) =>
    api.post(`/gso/tickets/${id}/reconcile`, data),

  // Reports
  getReports: (params) => api.get("/gso/reports", { params }),
  exportReport: (type, params) =>
    api.get(`/gso/reports/export/${type}`, { params, responseType: "blob" }),
    
  // Signature for GSO
  getSignature: (id) => api.get(`/gso/users/${id}/signature`),

  // ✅ FIXED: Fuel Receipts (now under admin prefix)
  getFuelReceipts: (params) => api.get("/admin/fuel-receipts", { params }),
  getFuelReceipt: (id) => api.get(`/admin/fuel-receipts/${id}`),
  recordReceipt: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.post("/admin/fuel-receipts/record", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ✅ FIXED: Completed Trips (now under admin prefix)
  getCompletedTrips: (params) => api.get("/admin/completed-trips", { params }),
};



// ============ MAYOR'S OFFICE API ============
export const mayorsOfficeAPI = {
  // Dashboard
  getDashboard: () => api.get("/mayors-office/dashboard"),

  // Ticket Management
  getPendingTickets: (params) => api.get("/mayors-office/pending", { params }),
  getApprovedTickets: (params) => api.get("/mayors-office/approved", { params }),
  getTicketById: (id) => api.get(`/mayors-office/tickets/${id}`),

  // Review Actions
  approveTicket: (id, data) => api.post(`/mayors-office/tickets/${id}/approve`, data),
  rejectTicket: (id, note) =>
    api.post(`/mayors-office/tickets/${id}/reject`, { review_note: note }),

  // Budget
  getBudgetOverview: () => api.get("/mayors-office/budget-overview"),
  getDepartmentBudget: (departmentId) =>
    api.get(`/mayors-office/departments/${departmentId}/budget`),
  getAllDepartmentsWithBudget: () =>
    api.get("/mayors-office/departments/all-with-budget"),
  getAllDepartmentsForSelector: () =>
    api.get("/mayors-office/departments/selector"),

  // Budget Assistance
  getBudgetAssistanceRequests: () =>
    api.get("/mayors-office/budget-assistance/requests"),
  getBudgetAssistanceRequest: (requestId) =>
    api.get(`/mayors-office/budget-assistance/request/${requestId}`),
  createMoFundedTicket: (data) =>
    api.post("/mayors-office/budget-assistance/create-ticket", data),
  removeMORequest: (requestId) =>
    api.delete(`/mayors-office/budget-assistance/request/${requestId}`),

  // Budget Policies (Mayor's Office can manage)
  getBudgetPolicies: (params) => api.get('/mayors-office/budget-policies', { params }),
  getBudgetPolicy: (departmentId) => api.get(`/mayors-office/budget-policies/${departmentId}`),
  createBudgetPolicy: (data) => api.post('/mayors-office/budget-policies', data),
  updateBudgetPolicy: (departmentId, data) => api.put(`/mayors-office/budget-policies/${departmentId}`, data),
  deleteBudgetPolicy: (departmentId) => api.delete(`/mayors-office/budget-policies/${departmentId}`),
  forceActivateBudget: (data) => api.post('/mayors-office/budget-periods/force-activate', data),

    getReceiptsForVerification: (params) => 
        api.get("/mayors-office/receipts/for-verification", { params }),
 verifyReceipt: (receiptId) => 
        api.post(`/mayors-office/receipts/${receiptId}/verify`),
};

// ============ DRIVER API (Merged with Staff) ============
export const driverAPI = {
  // Trip Management (Driver execution)
  getTrips: (params) => api.get("/driver/trips", { params }),
  getActiveTrip: () => api.get("/driver/trips/active"),
  getGasSlip: (id) => api.get(`/driver/trips/${id}/gas-slip`),

  // Trip Actions (Driver execution)
  acknowledgeFunds: (id) => api.post(`/driver/trips/${id}/acknowledge`),
  startTrip: (id, data) => api.post(`/driver/trips/${id}/start`, data),
  completeTrip: (id, data) => api.post(`/driver/trips/${id}/complete`, data),
  uploadReceipt: (id, formData) =>
    api.post(`/driver/trips/${id}/receipt`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateOdometer: (id, data) =>
    api.post(`/driver/trips/${id}/odometer`, data),

  // Dashboard
  getDashboard: () => api.get("/driver/dashboard"),

  // ✅ NEW: Staff functionality merged into Driver
  // Trip Requests (formerly staff)
  getMyRequests: (params) => api.get("/driver/trips/my-requests", { params }),
  getTripById: (id) => api.get(`/driver/tickets/${id}`),
  checkBudget: (data) => api.post("/driver/tickets/check-budget", data),
  
  // Resources
  getAvailableVehicles: (params = {}) =>
    api.get("/driver/vehicles/available", { params }),
  getActiveDrivers: (params = {}) =>
    api.get("/driver/drivers/active", { params }),
  
  // Budget
  getDepartmentBudget: () => api.get("/driver/departments/budget/current"),
  
  // Reports
  getTripReport: (params) => api.get("/driver/reports/trips", { params }),
  getFuelReport: (params) => api.get("/driver/reports/fuel", { params }),
  getReportSummary: (params) => api.get("/driver/reports/summary", { params }),
};

// ============ ADMIN API (GSO Only) ============
// ============ DEPARTMENT API (Mayor's Office) ============
export const departmentAPI = {
  getAll: (params) => api.get("/mayors-office/departments", { params }),
  getById: (id) => api.get(`/mayors-office/departments/${id}`),
  create: (data) => api.post("/mayors-office/departments", data),
  update: (id, data) => api.put(`/mayors-office/departments/${id}`, data),
  delete: (id) => api.delete(`/mayors-office/departments/${id}`),

  toggleStatus: (id, isActive) => 
    api.patch(`/mayors-office/departments/${id}/toggle-status`, { is_active: isActive }),
};

// User Management
export const userAPI = {
  getAll: (params) => api.get("/admin/users", { params }),
  getById: (id) => api.get(`/admin/users/${id}`),
  create: (data) => api.post("/admin/users", data),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  delete: (id) => api.delete(`/admin/users/${id}`),
  updateStatus: (id, status, reason = null) =>
    api.patch(`/admin/users/${id}/status`, {
      status,
      deactivation_reason: reason,
    }),
  resetPassword: (id) => api.post(`/admin/users/${id}/reset-password`),
  updateDepartment: (id, departmentId) =>
    api.patch(`/admin/users/${id}/department`, { department_id: departmentId }),
  updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),

  // Signature Management
  uploadSignature: (id, formData) =>
    api.post(`/admin/users/${id}/signature`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getSignature: (id) => api.get(`/admin/users/${id}/signature`),
  deleteSignature: (id) => api.delete(`/admin/users/${id}/signature`),
};

// Vehicle Management
export const vehicleAPI = {
  getAll: (params) => api.get("/admin/vehicles", { params }),
  getById: (id) => api.get(`/admin/vehicles/${id}`),
  create: (data) => api.post("/admin/vehicles", data),
  update: (id, data) => api.put(`/admin/vehicles/${id}`, data),
  delete: (id) => api.delete(`/admin/vehicles/${id}`),
  updateStatus: (id, status, reason = null) =>
    api.patch(`/admin/vehicles/${id}/status`, { status, deactivation_reason: reason }),
  updateMaintenance: (id, maintenanceFlag) =>
    api.patch(`/admin/vehicles/${id}/maintenance`, { maintenance_flag: maintenanceFlag }),
  updateOdometerStatus: (id, status) =>
    api.patch(`/admin/vehicles/${id}/odometer-status`, { odometer_status: status }),
  getAvailableVehicles: (params = {}) =>
    api.get("/admin/vehicles/available", { params }),
};

// Driver Management (Admin)
export const driverManagementAPI = {
  getAll: (params) => api.get("/admin/drivers", { params }),
  getById: (id) => api.get(`/admin/drivers/${id}`),
  registerDriver: (userId, departmentId) =>
    api.post("/admin/drivers", { user_id: userId, department_id: departmentId }),
  updateStatus: (id, status, reason = null) =>
    api.patch(`/admin/drivers/${id}/status`, { status, deactivation_reason: reason }),
  delete: (id) => api.delete(`/admin/drivers/${id}`),
  getActiveDrivers: (params = {}) => api.get("/admin/drivers", { params }),
};

// Budget Policy Management
export const budgetPolicyAPI = {
  getAll: (params) => api.get("/admin/budget-policies", { params }),
  getByDepartment: (departmentId) =>
    api.get(`/admin/budget-policies/${departmentId}`),
  create: (data) => api.post("/admin/budget-policies", data),
  update: (departmentId, data) =>
    api.put(`/admin/budget-policies/${departmentId}`, data),
  delete: (departmentId) =>
    api.delete(`/admin/budget-policies/${departmentId}`),

  getPeriods: (params) => api.get("/admin/budget-periods", { params }),
  getPeriodById: (id) => api.get(`/admin/budget-periods/${id}`),
  closePeriod: (id) => api.post(`/admin/budget-periods/${id}/close`),
  createPeriods: (data) => api.post("/admin/budget-periods/create", data),

  getBudgetStatus: (params) => api.get("/admin/budget-status", { params }),
  getEventLogs: (params) => api.get("/admin/budget-event-logs", { params }),
  forceActivate: (data) => api.post("/admin/budget-policies/force-activate", data),
  runWeeklyReset: () => api.post("/admin/budget-policies/run-weekly-reset"),
};

// System Settings
export const settingsAPI = {
  getAll: () => api.get("/admin/settings"),
  getByKey: (key) => api.get(`/admin/settings/${key}`),
  update: (key, value) =>
    api.put(`/admin/settings/${key}`, { setting_value: value }),
  updateMultiple: (settings) => api.post("/admin/settings/bulk", { settings }),
};

// Notifications
export const notificationAPI = {
  getAll: (params) => api.get("/notifications", { params }),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post("/notifications/mark-all-read"),
  getPreferences: () => api.get("/notifications/preferences"),
  updatePreferences: (preferences) =>
    api.put("/notifications/preferences", preferences),
  
  send: (data) => api.post("/notifications/send", data),
  
  // Test broadcast
  testBroadcast: () => api.post("/notifications/test"),
};

// Reports
export const reportsAPI = {
  getTripReport: (params) => api.get("/reports/trips", { params }),
  exportTripReport: (format, params) =>
    api.get(`/reports/trips/export/${format}`, { params, responseType: "blob" }),
  getFuelReport: (params) => api.get("/reports/fuel", { params }),
  exportFuelReport: (format, params) =>
    api.get(`/reports/fuel/export/${format}`, { params, responseType: "blob" }),
  getBudgetReport: (params) => api.get("/reports/budget", { params }),
  exportBudgetReport: (format, params) =>
    api.get(`/reports/budget/export/${format}`, { params, responseType: "blob" }),
  getVehicleReport: (params) => api.get("/reports/vehicles", { params }),
  getReportSummary: (params) => api.get("/reports/summary", { params }),
};

// Lookup Tables
export const lookupAPI = {
  getTripStatuses: () => api.get("/lookup/trip-statuses"),
  getUserRoles: () => api.get("/lookup/user-roles"),
  getRequestTypes: (category) =>
    api.get(`/lookup/request-types${category ? `?category=${category}` : ""}`),
  getFuelTypes: () => api.get("/lookup/fuel-types"),
};

// File Management
export const fileAPI = {
  upload: (file, type) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    return api.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  download: (uuid) =>
    api.get(`/files/download/${uuid}`, { responseType: "blob" }),
  delete: (uuid) => api.delete(`/files/${uuid}`),
};

// Audit Logs
export const auditAPI = {
  getLogs: (params) => api.get("/admin/audit-logs", { params }),
  getEntityLogs: (type, id) =>
    api.get(`/admin/audit-logs/entity/${type}/${id}`),
  getUserLogs: (userId) => api.get(`/admin/audit-logs/user/${userId}`),
};

export default api;