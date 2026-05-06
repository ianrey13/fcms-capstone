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
  const [showModal, setShowModal] = useState(false);
  const [showLeadershipModal, setShowLeadershipModal] = useState(false);
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
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

      // Process departments to extract head_of_office info
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
      setErrorMessage(
        error.response?.data?.message || "Failed to load departments",
      );
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

  // Get department head candidates - UPDATED: changed 'dept_head' to 'head_of_office'
  const getHeadCandidates = () => {
    return users.filter((user) => user.role === "head_of_office");
  };

  // Get OIC candidates (users belonging to the selected department)
  const getOICCandidates = () => {
    if (!selectedDepartment) return [];
    return users.filter(
      (user) =>
        user.department_id === selectedDepartment.department_id &&
        user.role !== "head_of_office", // OIC can't be the Head
    );
  };

  const filteredDepartments = departments.filter((dept) => {
    const search = searchTerm.toLowerCase();
    return (
      dept.department_name?.toLowerCase().includes(search) ||
      dept.department_code?.toLowerCase().includes(search)
    );
  });

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
      setShowDeleteConfirm(null);
      fetchDepartments();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete department";
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignHead = async () => {
    console.log("Assign Head clicked");
    console.log("Department ID:", selectedDepartment?.department_id);
    console.log("User ID:", leadershipData.head_of_office_id);

    if (!leadershipData.head_of_office_id) {
      setErrorMessage("Please select a Head of Office");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setSubmitting(true);
    try {
      // Pass the user_id directly (not as an object)
      await departmentAPI.assignHeadOfOffice(
        selectedDepartment.department_id,
        parseInt(leadershipData.head_of_office_id),
      );

      setSuccessMessage(
        `Head of Office assigned successfully to ${selectedDepartment.department_name}`,
      );
      setShowLeadershipModal(false);
      fetchDepartments();
      fetchUsers();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Assign Head error:", error);
      const message =
        error.response?.data?.message || "Failed to assign Head of Office";
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
      // Pass the user_id directly
      await departmentAPI.assignOIC(
        selectedDepartment.department_id,
        parseInt(leadershipData.oic_user_id),
      );

      setSuccessMessage(
        `OIC assigned successfully to ${selectedDepartment.department_name}`,
      );
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

      setSuccessMessage(
        `Head of Office removed from ${selectedDepartment.department_name}`,
      );
      setShowLeadershipModal(false);
      fetchDepartments();
      fetchUsers();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to remove Head of Office";
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

      setSuccessMessage(
        `OIC removed from ${selectedDepartment.department_name}`,
      );
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
      const response = await departmentAPI.getLeadershipInfo(
        dept.department_id,
      );
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Department Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage system departments, assign Heads of Office and OICs
          </p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
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

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={fetchDepartments}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Departments Grid/Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Departments ({filteredDepartments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No departments found</p>
              {searchTerm && (
                <Button
                  variant="link"
                  onClick={() => setSearchTerm("")}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Head of Office
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OIC
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Head Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDepartments.map((dept) => (
                    <tr
                      key={dept.department_id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 text-gray-400" />
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {dept.department_code}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">
                            {dept.department_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">
                            {dept.head_of_office ? (
                              <span className="text-green-600 font-medium">
                                {dept.head_of_office.name}
                              </span>
                            ) : (
                              <span className="text-gray-400">
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
                            {dept.current_oic &&
                            dept.current_oic.id !== dept.head_of_office?.id ? (
                              <span className="text-blue-600 font-medium">
                                {dept.current_oic.name}
                              </span>
                            ) : (
                              <span className="text-gray-400">
                                Not Assigned
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            dept.head_status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {dept.head_status === "active"
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openLeadershipModal(dept)}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            title="Assign Head of Office / OIC"
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(dept)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(dept)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingDept ? "Edit Department" : "Add New Department"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <Label
                  htmlFor="department_code"
                  className="flex items-center gap-2"
                >
                  <Code className="h-4 w-4" />
                  Department Code *
                </Label>
                <Input
                  id="department_code"
                  value={formData.department_code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      department_code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., GSO, ADMIN, ENGR"
                  className={`mt-1 font-mono ${formErrors.department_code ? "border-red-500" : ""}`}
                  autoComplete="off"
                />
                {formErrors.department_code && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.department_code}
                  </p>
                )}
                <p className="text-gray-400 text-xs mt-1">
                  Used as prefix for trip ticket numbers (max 20 characters)
                </p>
              </div>

              <div>
                <Label
                  htmlFor="department_name"
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Department Name *
                </Label>
                <Input
                  id="department_name"
                  value={formData.department_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      department_name: e.target.value,
                    })
                  }
                  placeholder="Full department name"
                  className={`mt-1 ${formErrors.department_name ? "border-red-500" : ""}`}
                />
                {formErrors.department_name && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.department_name}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting
                    ? "Saving..."
                    : editingDept
                      ? "Update Department"
                      : "Create Department"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leadership Assignment Modal (Head of Office & OIC) - UPDATED: role name and simplified API calls */}
      {showLeadershipModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <UserCog className="h-5 w-5 text-purple-600" />
                Leadership Assignment: {selectedDepartment.department_name}
              </h2>
              <button
                onClick={() => setShowLeadershipModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Head of Office Section */}
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <h3 className="font-semibold">Head of Office</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Select Head of Office</Label>
                    <Select
                      value={leadershipData.head_of_office_id}
                      onValueChange={(value) =>
                        setLeadershipData({
                          ...leadershipData,
                          head_of_office_id: value,
                        })
                      }
                    >
                      <SelectTrigger>
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
                    <p className="text-xs text-gray-400 mt-1">
                      Only users with "head_of_office" role can be assigned as
                      Head of Office
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAssignHead}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                      disabled={submitting}
                    >
                      {submitting ? "Assigning..." : "Assign Head"}
                    </Button>
                    {selectedDepartment.head_of_office_id && (
                      <Button
                        onClick={handleRemoveHead}
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        disabled={submitting}
                      >
                        Remove Head
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* OIC Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">Officer-in-Charge (OIC)</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Select OIC</Label>
                    <Select
                      value={leadershipData.oic_user_id}
                      onValueChange={(value) =>
                        setLeadershipData({
                          ...leadershipData,
                          oic_user_id: value,
                        })
                      }
                    >
                      <SelectTrigger>
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
                    <p className="text-xs text-gray-400 mt-1">
                      OIC will approve tickets when Head of Office is inactive
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAssignOIC}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={submitting}
                    >
                      {submitting ? "Assigning..." : "Assign OIC"}
                    </Button>
                    {selectedDepartment.oic_user_id && (
                      <Button
                        onClick={handleRemoveOIC}
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        disabled={submitting}
                      >
                        Remove OIC
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 mt-4">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> When Head of Office sets status to
                  "Inactive", the OIC will automatically gain approval
                  privileges.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-center mb-2">
                Delete Department
              </h2>
              <p className="text-gray-600 text-center mb-4">
                Are you sure you want to delete{" "}
                <strong>{showDeleteConfirm.department_name}</strong>?
              </p>
              <p className="text-sm text-red-600 text-center mb-6">
                Warning: This action cannot be undone. Departments with existing
                users cannot be deleted.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleDelete(showDeleteConfirm.department_id)}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={submitting}
                >
                  {submitting ? "Deleting..." : "Delete"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default DepartmentManagement;
