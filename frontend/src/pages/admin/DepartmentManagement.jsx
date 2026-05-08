// src/pages/admin/DepartmentManagement.jsx
import React, { useState, useEffect } from "react";
import { departmentAPI, userAPI } from "../../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Code,
  Hash,
  UserCog,
  Crown,
  UserCheck,
  Users,
  Eye,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showLeadershipModal, setShowLeadershipModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    department_name: "",
    department_code: "",
  });
  const [leadershipData, setLeadershipData] = useState({
    head_of_office_id: "",
    oic_user_id: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentAPI.getAll();
      const deptData = response.data?.data || response.data || [];

      const processedDepts = deptData.map((dept) => ({
        ...dept,
        head_of_office_id: dept.head_of_office?.id || null,
        head_of_office_name: dept.head_of_office?.name || null,
        oic_user_id: dept.current_oic?.id || null,
        oic_name: dept.current_oic?.name || null,
      }));

      setDepartments(processedDepts);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      setErrorMessage(error.response?.data?.message || "Failed to load departments");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAll();
      const userData = response.data?.data || response.data || [];
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const getHeadCandidates = () => {
    return users.filter((user) => user.role === "head_of_office");
  };

  const getOICCandidates = () => {
    if (!selectedDepartment) return [];
    return users.filter(
      (user) =>
        user.department_id === selectedDepartment.department_id &&
        user.role !== "head_of_office",
    );
  };

  const filteredDepartments = departments.filter((dept) => {
    const search = searchTerm.toLowerCase();
    return (
      dept.department_name?.toLowerCase().includes(search) ||
      dept.department_code?.toLowerCase().includes(search)
    );
  });

  const hasActiveFilters = searchTerm !== "";

  const clearFilters = () => {
    setSearchTerm("");
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.department_name.trim()) {
      errors.department_name = "Department name is required";
    }
    if (!formData.department_code.trim()) {
      errors.department_code = "Department code is required";
    } else if (formData.department_code.length > 20) {
      errors.department_code = "Department code must be 20 characters or less";
    } else if (!/^[A-Z0-9_-]+$/i.test(formData.department_code)) {
      errors.department_code =
        "Department code can only contain letters, numbers, underscores, and hyphens";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const data = {
        department_name: formData.department_name.trim(),
        department_code: formData.department_code.trim().toUpperCase(),
      };

      if (editingDept) {
        await departmentAPI.update(editingDept.department_id, data);
        setSuccessMessage("Department updated successfully");
      } else {
        await departmentAPI.create(data);
        setSuccessMessage("Department created successfully");
      }

      setShowModal(false);
      resetForm();
      fetchDepartments();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors ||
        "Operation failed";
      setErrorMessage(
        typeof message === "string" ? message : "Failed to save department",
      );
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setSubmitting(true);
    try {
      await departmentAPI.delete(id);
      setSuccessMessage("Department deleted successfully");
      setShowDeleteConfirmModal(null);
      fetchDepartments();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete department";
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignHead = async () => {
    if (!leadershipData.head_of_office_id) {
      setErrorMessage("Please select a Head of Office");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setSubmitting(true);
    try {
      await departmentAPI.assignHeadOfOffice(
        selectedDepartment.department_id,
        parseInt(leadershipData.head_of_office_id),
      );

      setSuccessMessage(`Head of Office assigned successfully to ${selectedDepartment.department_name}`);
      setShowLeadershipModal(false);
      fetchDepartments();
      fetchUsers();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Assign Head error:", error);
      const message = error.response?.data?.message || "Failed to assign Head of Office";
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignOIC = async () => {
    if (!leadershipData.oic_user_id) {
      setErrorMessage("Please select an OIC");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setSubmitting(true);
    try {
      await departmentAPI.assignOIC(
        selectedDepartment.department_id,
        parseInt(leadershipData.oic_user_id),
      );

      setSuccessMessage(`OIC assigned successfully to ${selectedDepartment.department_name}`);
      setShowLeadershipModal(false);
      fetchDepartments();
      fetchUsers();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Assign OIC error:", error);
      const message = error.response?.data?.message || "Failed to assign OIC";
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveHead = async () => {
    setSubmitting(true);
    try {
      await departmentAPI.removeHeadOfOffice(selectedDepartment.department_id);

      setSuccessMessage(`Head of Office removed from ${selectedDepartment.department_name}`);
      setShowLeadershipModal(false);
      fetchDepartments();
      fetchUsers();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to remove Head of Office";
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveOIC = async () => {
    setSubmitting(true);
    try {
      await departmentAPI.removeOIC(selectedDepartment.department_id);

      setSuccessMessage(`OIC removed from ${selectedDepartment.department_name}`);
      setShowLeadershipModal(false);
      fetchDepartments();
      fetchUsers();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to remove OIC";
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const openLeadershipModal = async (dept) => {
    setSelectedDepartment(dept);
    setLeadershipData({ head_of_office_id: "", oic_user_id: "" });

    try {
      const response = await departmentAPI.getLeadershipInfo(dept.department_id);
      const data = response.data?.data || response.data;
      if (data.head_of_office) {
        setLeadershipData((prev) => ({
          ...prev,
          head_of_office_id:
            data.head_of_office.user_id?.toString() ||
            data.head_of_office.id?.toString(),
        }));
      }
      if (data.oic) {
        setLeadershipData((prev) => ({
          ...prev,
          oic_user_id: data.oic.user_id?.toString() || data.oic.id?.toString(),
        }));
      }
    } catch (error) {
      console.error("Failed to fetch leadership info:", error);
    }

    setShowLeadershipModal(true);
  };

  const resetForm = () => {
    setFormData({ department_name: "", department_code: "" });
    setFormErrors({});
    setEditingDept(null);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      department_name: dept.department_name,
      department_code: dept.department_code,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openDeleteModal = (dept) => {
    setShowDeleteConfirmModal(dept);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Department Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage system departments, assign Heads of Office and OICs
          </p>
        </div>
        <Button 
          onClick={openCreateModal} 
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-5 w-5" />
          {errorMessage}
        </div>
      )}

      {/* Filters Card */}
      <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden transition-all duration-300">
        <div 
          className="px-6 py-4 border-b dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Filters</span>
              {hasActiveFilters && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                  Active
                </span>
              )}
            </div>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
        
        {showFilters && (
          <div className="p-6 animate-slide-down">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={fetchDepartments}
                  className="flex items-center gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    onClick={clearFilters}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Departments Table */}
      <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden">
        <CardHeader className="border-b dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Building2 className="h-5 w-5" />
            All Departments
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
              ({filteredDepartments.length} {filteredDepartments.length === 1 ? 'department' : 'departments'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No departments found</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Head of Office</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">OIC</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Head Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredDepartments.map((dept, index) => (
                    <tr 
                      key={dept.department_id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Code className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                            {dept.department_code}
                          </span>
                        </div>
                       </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-900 dark:text-white font-medium">
                            {dept.department_name}
                          </span>
                        </div>
                       </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-500" />
                          <span className="text-sm">
                            {dept.head_of_office_name ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                {dept.head_of_office_name}
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">
                                Not Assigned
                              </span>
                            )}
                          </span>
                        </div>
                       </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">
                            {dept.oic_name && dept.oic_name !== dept.head_of_office_name ? (
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {dept.oic_name}
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">
                                Not Assigned
                              </span>
                            )}
                          </span>
                        </div>
                       </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                            dept.head_status === "active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {dept.head_status === "active" ? "Active" : "Inactive"}
                        </span>
                       </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openLeadershipModal(dept)}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-950/30 h-8 w-8 p-0"
                            title="Assign Head of Office / OIC"
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(dept)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30 h-8 w-8 p-0"
                            title="Edit Department"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(dept)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 h-8 w-8 p-0"
                            title="Delete Department"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                       </td>
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b dark:border-slate-700 bg-white dark:bg-slate-800 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingDept ? "Edit Department" : "Add New Department"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Department Code *
                </Label>
                <Input
                  value={formData.department_code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      department_code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., GSO, ADMIN, ENGR"
                  className={`mt-1.5 font-mono dark:bg-slate-900 dark:border-slate-700 ${formErrors.department_code ? "border-red-500" : ""}`}
                  autoComplete="off"
                />
                {formErrors.department_code && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.department_code}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Used as prefix for trip ticket numbers (max 20 characters)
                </p>
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Department Name *
                </Label>
                <Input
                  value={formData.department_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      department_name: e.target.value,
                    })
                  }
                  placeholder="Full department name"
                  className={`mt-1.5 dark:bg-slate-900 dark:border-slate-700 ${formErrors.department_name ? "border-red-500" : ""}`}
                />
                {formErrors.department_name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.department_name}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md" disabled={submitting}>
                  {submitting ? "Saving..." : (editingDept ? "Update Department" : "Create Department")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leadership Assignment Modal */}
      {showLeadershipModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b dark:border-slate-700 bg-white dark:bg-slate-800 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                  <UserCog className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Leadership Assignment
                </h2>
              </div>
              <button
                onClick={() => setShowLeadershipModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 rounded-xl p-3">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {selectedDepartment.department_name}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Assign Head of Office and Officer-in-Charge for this department
                </p>
              </div>

              {/* Head of Office Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                    <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Head of Office</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Select Head of Office</Label>
                    <Select
                      value={leadershipData.head_of_office_id}
                      onValueChange={(value) =>
                        setLeadershipData({
                          ...leadershipData,
                          head_of_office_id: value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-1.5 dark:bg-slate-900 dark:border-slate-700">
                        <SelectValue placeholder="Select a department head" />
                      </SelectTrigger>
                      <SelectContent>
                        {getHeadCandidates().map((user) => (
                          <SelectItem
                            key={user.user_id}
                            value={user.user_id.toString()}
                          >
                            {user.first_name} {user.last_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-400 mt-1">
                      Only users with "head_of_office" role can be assigned as Head of Office
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAssignHead}
                      className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800"
                      disabled={submitting}
                    >
                      {submitting ? "Assigning..." : "Assign Head"}
                    </Button>
                    {selectedDepartment.head_of_office_id && (
                      <Button
                        onClick={handleRemoveHead}
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                        disabled={submitting}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* OIC Section */}
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Officer-in-Charge (OIC)</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Select OIC</Label>
                    <Select
                      value={leadershipData.oic_user_id}
                      onValueChange={(value) =>
                        setLeadershipData({
                          ...leadershipData,
                          oic_user_id: value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-1.5 dark:bg-slate-900 dark:border-slate-700">
                        <SelectValue placeholder="Select an OIC" />
                      </SelectTrigger>
                      <SelectContent>
                        {getOICCandidates().map((user) => (
                          <SelectItem
                            key={user.user_id}
                            value={user.user_id.toString()}
                          >
                            {user.first_name} {user.last_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-400 mt-1">
                      OIC will approve tickets when Head of Office is inactive
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAssignOIC}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      disabled={submitting}
                    >
                      {submitting ? "Assigning..." : "Assign OIC"}
                    </Button>
                    {selectedDepartment.oic_user_id && (
                      <Button
                        onClick={handleRemoveOIC}
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                        disabled={submitting}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>ℹ️ Note:</strong> When Head of Office sets status to "Inactive", the OIC will automatically gain approval privileges.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Trash2 className="h-7 w-7 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-center mb-2 text-slate-900 dark:text-white">Delete Department</h2>
              <p className="text-slate-600 dark:text-slate-400 text-center mb-4">
                Are you sure you want to delete <strong>{showDeleteConfirmModal.department_name}</strong>?
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400 text-center mb-6">
                ⚠️ Warning: This action cannot be undone. Departments with existing users cannot be deleted.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => handleDelete(showDeleteConfirmModal.department_id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-md">
                  Delete
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDeleteConfirmModal(null)} className="flex-1 dark:border-slate-700 dark:text-slate-300">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;