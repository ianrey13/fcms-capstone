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
};

// ============ TRIP TICKET API ============
export const tripTicketAPI = {
  // Basic CRUD
  getAll: (params) => api.get("/trip-tickets", { params }),
  getById: (id) => api.get(`/trip-tickets/${id}`),
  create: (data) => api.post("/trip-tickets", data),
  update: (id, data) => api.put(`/trip-tickets/${id}`, data),
  delete: (id) => api.delete(`/trip-tickets/${id}`),

  // Draft management
  saveDraft: (data) => api.post("/trip-tickets/draft", data),
  updateDraft: (id, data) => api.put(`/trip-tickets/${id}/draft`, data),

  // Submit for approval
  submit: (data) => api.post("/trip-tickets/submit", data),

  // Budget check before submission (NEW)
  checkBudgetBeforeSubmit: (data) =>
    api.post("/trip-tickets/check-budget", data),

  // Get user's requests
  getMyRequests: (params) => api.get("/trip-tickets/my-requests", { params }),

  // Resubmit after revision
  resubmit: (id, data) => api.post(`/trip-tickets/${id}/resubmit`, data),

  // Cancel trip
  cancel: (id, reason) => api.post(`/trip-tickets/${id}/cancel`, { reason }),

  // Dashboard
  getDashboard: () => api.get("/dashboard"),
};

// ============ HEAD OF OFFICE API ============
export const headOfficeAPI = {
  // Dashboard & Monitoring
  getDashboard: () => api.get("/head/dashboard"),
  getPendingTickets: () => api.get("/head/tickets/pending"),
  getApprovedTickets: () => api.get("/head/tickets/approved"),
  getRejectedTickets: () => api.get("/head/tickets/rejected"),
  getReturnedTickets: () => api.get("/head/tickets/returned"),

  // Approval Actions
  approveTicket: (id, note) =>
    api.post(`/head/tickets/${id}/approve`, { note: note }),
  rejectTicket: (id, note) =>
    api.post(`/head/tickets/${id}/reject`, { note: note }),

  // OIC Management
  getOICStatus: () => api.get("/head/oic/status"),
  activateOIC: (data) => api.post("/head/oic/activate", data),
  deactivateOIC: () => api.post("/head/oic/deactivate"),

  // Head Status
  toggleHeadStatus: (data) => api.post("/head/status/toggle", data),

  // Monitoring
  getActiveTrips: () => api.get("/head/monitoring/active-trips"),
  getFuelConsumption: (params) =>
    api.get("/head/monitoring/fuel-consumption", { params }),
  getLiveTracking: (tripId) =>
    api.get(`/head/monitoring/live-tracking/${tripId}`),
  getTripHistory: (params) =>
    api.get("/head/monitoring/trip-history", { params }),

  // ✅ Trip ticket vehicles and drivers
  getAvailableVehicles: (params = {}) =>
    api.get("/head/vehicles", { params }),
  getActiveDrivers: (params = {}) =>
    api.get("/head/drivers", { params }),

  // ✅ ADD THIS - Submit trip ticket from Head
  submitTripTicket: (data) => api.post("/head/trip-tickets/submit", data),
};

// ============ GSO API ============
export const gsoAPI = {
  //dashboard
  getDashboard: () => api.get("/gso/dashboard"),

  // Ticket Management
  getPendingTickets: (params) => api.get("/gso/pending", { params }),
  getVerifiedTickets: (params) => api.get("/gso/verified", { params }),
  getReturnedTickets: (params) => api.get("/gso/returned", { params }),
  getRejectedTickets: (params) => api.get("/gso/rejected", { params }),
  getForwardQueue: (params) => api.get("/gso/forward", { params }),
  getForwardedTickets: (params) => api.get("/gso/forwarded", { params }),

  // Single ticket
  getTicketById: (id) => api.get(`/gso/tickets/${id}`),

  // Review Actions
  approveTicket: (id, note) =>
    api.post(`/gso/tickets/${id}/approve`, { gso_note: note }),
  rejectTicket: (id, note) =>
    api.post(`/gso/tickets/${id}/reject`, { gso_note: note }),

  // Forward to Mayor's Office
  forwardToMO: (ticketIds) =>
    api.post("/gso/tickets/forward-to-mo", { trip_ticket_ids: ticketIds }),

  // Reconciliation
  getPendingReconciliation: (params) =>
    api.get("/gso/reconciliation/pending", { params }),
  reconcileTrip: (id, data) =>
    api.post(`/gso/reconciliation/${id}/reconcile`, data),

  // Reports
  getReports: (params) => api.get("/gso/reports", { params }),
  exportReport: (type, params) =>
    api.get(`/gso/reports/export/${type}`, { params, responseType: "blob" }),
};

// ============ MAYOR'S OFFICE API ============
export const mayorsOfficeAPI = {
  // Dashboard
  getDashboard: () => api.get("/mayors-office/dashboard"),

  // Ticket Management
  getPendingTickets: (params) => api.get("/mayors-office/pending", { params }),
  getApprovedTickets: (params) =>
    api.get("/mayors-office/approved", { params }),
  getTicketById: (id) => api.get(`/mayors-office/tickets/${id}`),

  // Review Actions
  approveTicket: (id, amountReleased, note) =>
    api.post(`/mayors-office/tickets/${id}/approve`, {
      amount_released: amountReleased,
      review_note: note,
    }),
  rejectTicket: (id, note) =>
    api.post(`/mayors-office/tickets/${id}/reject`, { review_note: note }),

  // Budget Overview
  getBudgetOverview: () => api.get("/mayors-office/budget-overview"),

  // ============ NEW: BUDGET ASSISTANCE METHODS ============
  // Get all pending budget assistance requests
  getBudgetAssistanceRequests: () =>
    api.get("/mayors-office/budget-assistance/requests"),

  // Get single budget assistance request details
  getBudgetAssistanceRequest: (requestId) =>
    api.get(`/mayors-office/budget-assistance/request/${requestId}`),

  // Create MO-funded trip ticket from request
  createMoFundedTicket: (data) =>
    api.post("/mayors-office/budget-assistance/create-ticket", data),
  getDepartmentBudget: (departmentId) =>
    api.get(`/mayors-office/departments/${departmentId}/budget`),
};

// ============ DRIVER API ============
export const driverAPI = {
  // Trip Management
  getAssignedTrips: (params) => api.get("/driver/trips", { params }),
  getActiveTrip: () => api.get("/driver/trips/active"),
  getTripHistory: (params) => api.get("/driver/trips/history", { params }),

  // Trip Actions
  startTrip: (id, data) => api.post(`/driver/trips/${id}/start`, data),
  completeTrip: (id, data) => api.post(`/driver/trips/${id}/complete`, data),

  // Fuel Log
  uploadFuelReceipt: (id, formData) =>
    api.post(`/driver/trips/${id}/fuel-receipt`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Dashboard
  getDashboard: () => api.get("/driver/dashboard"),
  getMyInfo: () => api.get("/driver/my-info"),
};

// ============ DEPARTMENT STAFF API ============
export const departmentStaffAPI = {
  // Trip Tickets - Using existing tripTicketAPI endpoints
  getMyTickets: (params) => tripTicketAPI.getMyRequests(params),
  getTicketById: (id) => tripTicketAPI.getById(id),
  createDraft: (data) => tripTicketAPI.saveDraft(data),
  updateDraft: (id, data) => tripTicketAPI.updateDraft(id, data),
  submitTicket: (data) => tripTicketAPI.submit(data),
  cancelTicket: (id, reason) => tripTicketAPI.cancel(id, reason),

  // Resources - Pass department_id as parameter
  getAvailableVehicles: (params = {}) =>
    api.get("/vehicles/available", { params }),
  getActiveDrivers: (params = {}) => api.get("/drivers/active", { params }),

  // Budget
  getDepartmentBudget: () => api.get("/departments/budget/current"),
  getBudgetHistory: (params) =>
    api.get("/departments/budget/history", { params }),

  // Dashboard
  getDashboard: () => tripTicketAPI.getDashboard(),

  // Department Requests
  submitRequest: (data) => api.post("/department-requests", data),
  getMyRequests: (params) =>
    api.get("/department-requests/my-requests", { params }),

  // ============ NEW: BUDGET CHECK METHOD ============
  checkBudgetAndRequestMO: (data) =>
    tripTicketAPI.checkBudgetBeforeSubmit(data),
};

// ============ SUPERADMIN API ============
// Department Management
export const departmentAPI = {
  getAll: (params) => api.get("/admin/departments", { params }),
  getById: (id) => api.get(`/admin/departments/${id}`),
  create: (data) => api.post("/admin/departments", data),
  update: (id, data) => api.put(`/admin/departments/${id}`, data),
  delete: (id) => api.delete(`/admin/departments/${id}`),

  // Leadership Management
  assignHeadOfOffice: (id, userId) =>
    api.post(`/admin/departments/${id}/assign-head`, { user_id: userId }),
  removeHeadOfOffice: (id) =>
    api.delete(`/admin/departments/${id}/remove-head`),
  assignOIC: (id, userId) =>
    api.post(`/admin/departments/${id}/assign-oic`, { user_id: userId }),
  removeOIC: (id) => api.delete(`/admin/departments/${id}/remove-oic`),
  getLeadershipInfo: (id) => api.get(`/admin/departments/${id}/leadership`),
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
  getSignature: (id) => api.get(`/gso/users/${id}/signature`), // Uses GSO endpoint for viewing
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
    api.patch(`/admin/vehicles/${id}/status`, {
      status,
      deactivation_reason: reason,
    }),
  updateMaintenance: (id, maintenanceFlag) =>
    api.patch(`/admin/vehicles/${id}/maintenance`, {
      maintenance_flag: maintenanceFlag,
    }),
  updateOdometerStatus: (id, status) =>
    api.patch(`/admin/vehicles/${id}/odometer-status`, {
      odometer_status: status,
    }),

  // For department staff
  getAvailableVehicles: (params = {}) =>
    api.get("/vehicles/available", { params }),
};

// Driver Management
export const driverManagementAPI = {
  getAll: (params) => api.get("/admin/drivers", { params }),
  getById: (id) => api.get(`/admin/drivers/${id}`),
  registerDriver: (userId, departmentId) =>
    api.post("/admin/drivers", {
      user_id: userId,
      department_id: departmentId,
    }),
  updateStatus: (id, status, reason = null) =>
    api.patch(`/admin/drivers/${id}/status`, {
      status,
      deactivation_reason: reason,
    }),
  delete: (id) => api.delete(`/admin/drivers/${id}`),

  // For department staff
  getActiveDrivers: (params = {}) => api.get("/drivers/active", { params }),
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

  // Budget Periods
  getPeriods: (params) => api.get("/admin/budget-periods", { params }),
  getPeriodById: (id) => api.get(`/admin/budget-periods/${id}`),
  closePeriod: (id) => api.post(`/admin/budget-periods/${id}/close`),
  createPeriods: (data) => api.post("/admin/budget-periods/create", data),

  // Budget Status
  getBudgetStatus: (params) => api.get("/admin/budget-status", { params }),
  getEventLogs: (params) => api.get("/admin/budget-event-logs", { params }),
  //force reset
  forceActivate: (data) =>
    api.post("/admin/budget-policies/force-activate", data),

  //run weekly
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

// Request Management (Department Requests & CRUD Requests)
export const requestAPI = {
  // Department Requests
  getDepartmentRequests: (params) =>
    api.get("/admin/requests/department", { params }),
  getDepartmentRequestById: (id) => api.get(`/admin/requests/department/${id}`),
  approveDepartmentRequest: (id, note) =>
    api.post(`/admin/requests/department/${id}/approve`, { review_note: note }),
  rejectDepartmentRequest: (id, note) =>
    api.post(`/admin/requests/department/${id}/reject`, { review_note: note }),

  // CRUD Requests
  getCrudRequests: (params) => api.get("/admin/requests/crud", { params }),
  getCrudRequestById: (id) => api.get(`/admin/requests/crud/${id}`),
  approveCrudRequest: (id, note) =>
    api.post(`/admin/requests/crud/${id}/approve`, { review_note: note }),
  rejectCrudRequest: (id, note) =>
    api.post(`/admin/requests/crud/${id}/reject`, { review_note: note }),
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
};

// Reports
export const reportsAPI = {
  // Trip Reports
  getTripReport: (params) => api.get("/reports/trips", { params }),
  exportTripReport: (format, params) =>
    api.get(`/reports/trips/export/${format}`, {
      params,
      responseType: "blob",
    }),

  // Fuel Reports
  getFuelReport: (params) => api.get("/reports/fuel", { params }),
  exportFuelReport: (format, params) =>
    api.get(`/reports/fuel/export/${format}`, { params, responseType: "blob" }),

  // Budget Reports
  getBudgetReport: (params) => api.get("/reports/budget", { params }),
  exportBudgetReport: (format, params) =>
    api.get(`/reports/budget/export/${format}`, {
      params,
      responseType: "blob",
    }),

  // Vehicle Reports
  getVehicleReport: (params) => api.get("/reports/vehicles", { params }),

  // Dashboard Summary
  getReportSummary: (params) => api.get("/reports/summary", { params }),
};

// Lookup Tables (for dropdowns)
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
