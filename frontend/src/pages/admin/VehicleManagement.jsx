// src/pages/admin/VehicleManagement.jsx
import React, { useState, useEffect } from "react";
import { vehicleAPI, departmentAPI } from "../../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Car,
  Plus,
  Edit,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Fuel,
  Gauge,
  AlertTriangle,
  Check,
  XCircle,
  Truck,
  Building2,
  Wrench,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fuelFilter, setFuelFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    department_id: "",
    vehicle_model: "",
    plate_number: "",
    fuel_type: "diesel",
    status: "active",
    odometer_status: "functional",
    maintenance_flag: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVehicles();
    fetchDepartments();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleAPI.getAll();
      const vehicleData = response.data?.data || response.data || [];
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      setErrorMessage(error.response?.data?.message || "Failed to load vehicles");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getAll();
      const deptData = response.data?.data || response.data || [];
      setDepartments(Array.isArray(deptData) ? deptData : []);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  };

  const getDepartmentName = (departmentId) => {
    const department = departments.find((d) => d.department_id === departmentId);
    return department?.department_name || "N/A";
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      vehicle.vehicle_model?.toLowerCase().includes(search) ||
      vehicle.plate_number?.toLowerCase().includes(search);
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    const matchesFuel = fuelFilter === "all" || vehicle.fuel_type === fuelFilter;
    return matchesSearch && matchesStatus && matchesFuel;
  });

  const validateForm = () => {
    const errors = {};
    if (!formData.department_id) errors.department_id = "Department is required";
    if (!formData.vehicle_model?.trim()) errors.vehicle_model = "Vehicle model is required";
    if (!formData.plate_number?.trim()) errors.plate_number = "Plate number is required";
    else if (formData.plate_number.length > 20) errors.plate_number = "Plate number must be 20 characters or less";
    if (!formData.fuel_type) errors.fuel_type = "Fuel type is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const data = {
        department_id: parseInt(formData.department_id),
        vehicle_model: formData.vehicle_model.trim(),
        plate_number: formData.plate_number.trim().toUpperCase(),
        fuel_type: formData.fuel_type,
        status: formData.status,
        odometer_status: formData.odometer_status,
        maintenance_flag: formData.maintenance_flag,
      };

      if (editingVehicle) {
        await vehicleAPI.update(editingVehicle.vehicle_id, data);
        setSuccessMessage("Vehicle updated successfully");
      } else {
        await vehicleAPI.create(data);
        setSuccessMessage("Vehicle created successfully");
      }

      setShowModal(false);
      resetForm();
      await fetchVehicles();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Submit error:", error);
      const message = error.response?.data?.message || "Operation failed";
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingVehicle) return;
    
    setSubmitting(true);
    try {
      await vehicleAPI.delete(deletingVehicle.vehicle_id);
      setSuccessMessage("Vehicle deleted successfully");
      setShowDeleteModal(false);
      setDeletingVehicle(null);
      await fetchVehicles();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete vehicle";
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (vehicle) => {
    const newStatus = vehicle.status === "active" ? "inactive" : "active";
    try {
      await vehicleAPI.updateStatus(vehicle.vehicle_id, newStatus);
      await fetchVehicles();
      setSuccessMessage(`Vehicle ${newStatus === "active" ? "activated" : "deactivated"} successfully`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage("Failed to update vehicle status");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleToggleMaintenance = async (vehicle) => {
    const newFlag = !vehicle.maintenance_flag;
    try {
      await vehicleAPI.updateMaintenance(vehicle.vehicle_id, newFlag);
      await fetchVehicles();
      setSuccessMessage(`Maintenance flag ${newFlag ? "enabled" : "disabled"}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage("Failed to update maintenance flag");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const resetForm = () => {
    setFormData({
      department_id: "",
      vehicle_model: "",
      plate_number: "",
      fuel_type: "diesel",
      status: "active",
      odometer_status: "functional",
      maintenance_flag: false,
    });
    setFormErrors({});
    setEditingVehicle(null);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      department_id: vehicle.department_id,
      vehicle_model: vehicle.vehicle_model,
      plate_number: vehicle.plate_number,
      fuel_type: vehicle.fuel_type,
      status: vehicle.status,
      odometer_status: vehicle.odometer_status,
      maintenance_flag: vehicle.maintenance_flag,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openDeleteModal = (vehicle) => {
    setDeletingVehicle(vehicle);
    setShowDeleteModal(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setFuelFilter("all");
  };

  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || fuelFilter !== "all";

  const getFuelTypeIcon = (fuelType) => {
    switch (fuelType) {
      case "diesel":
        return <Fuel className="h-3 w-3" />;
      case "premium":
        return <Fuel className="h-3 w-3 text-yellow-500" />;
      default:
        return <Fuel className="h-3 w-3 text-green-500" />;
    }
  };

  const getStatusBadge = (status) => {
    if (status === "active") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle className="h-3 w-3" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <XCircle className="h-3 w-3" />
        Inactive
      </span>
    );
  };

  const getOdometerBadge = (status) => {
    if (status === "functional") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <Gauge className="h-3 w-3" />
          Functional
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
        <AlertTriangle className="h-3 w-3" />
        Non-Functional
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Vehicle Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage fleet vehicles, track status, and maintenance
          </p>
        </div>
        <Button 
          onClick={openCreateModal} 
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Register Vehicle
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by model or plate..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={fuelFilter}
                onChange={(e) => setFuelFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Fuel Types</option>
                <option value="diesel">Diesel</option>
                <option value="premium">Premium</option>
                <option value="regular">Regular</option>
              </select>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={fetchVehicles} 
                  className="flex-1 flex items-center gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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

      {/* Vehicles Table */}
      <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden">
        <CardHeader className="border-b dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Car className="h-5 w-5" />
            Fleet Vehicles
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
              ({filteredVehicles.length} {filteredVehicles.length === 1 ? 'vehicle' : 'vehicles'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-16">
              <Truck className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No vehicles found</p>
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vehicle</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plate #</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fuel</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Odometer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Maintenance</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredVehicles.map((vehicle, index) => (
                    <tr 
                      key={vehicle.vehicle_id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <Car className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {vehicle.vehicle_model}
                          </span>
                        </div>
                       </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
                          {vehicle.plate_number}
                        </span>
                       </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {getDepartmentName(vehicle.department_id)}
                          </span>
                        </div>
                       </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {getFuelTypeIcon(vehicle.fuel_type)}
                          <span className="text-sm capitalize text-slate-600 dark:text-slate-400">
                            {vehicle.fuel_type}
                          </span>
                        </div>
                       </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleStatus(vehicle)}>
                          {getStatusBadge(vehicle.status)}
                        </button>
                       </td>
                      <td className="px-4 py-3">
                        {getOdometerBadge(vehicle.odometer_status)}
                       </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleMaintenance(vehicle)}>
                          {vehicle.maintenance_flag ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              <Wrench className="h-3 w-3" />
                              Under Maintenance
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                              <Check className="h-3 w-3" />
                              Operational
                            </span>
                          )}
                        </button>
                       </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(vehicle)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30 h-8 w-8 p-0"
                            title="Edit Vehicle"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(vehicle)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 h-8 w-8 p-0"
                            title="Delete Vehicle"
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
                  <Car className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingVehicle ? "Edit Vehicle" : "Register New Vehicle"}
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
                  <Building2 className="h-4 w-4" />
                  Department *
                </Label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className={`w-full mt-1.5 px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white ${formErrors.department_id ? "border-red-500" : "border-slate-300 dark:border-slate-700"}`}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
                {formErrors.department_id && <p className="text-red-500 text-xs mt-1">{formErrors.department_id}</p>}
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Vehicle Model *
                </Label>
                <Input
                  value={formData.vehicle_model}
                  onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                  placeholder="e.g., Toyota Hilux, Mitsubishi L300"
                  className={`mt-1.5 dark:bg-slate-900 dark:border-slate-700 ${formErrors.vehicle_model ? "border-red-500" : ""}`}
                />
                {formErrors.vehicle_model && <p className="text-red-500 text-xs mt-1">{formErrors.vehicle_model}</p>}
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Plate Number *
                </Label>
                <Input
                  value={formData.plate_number}
                  onChange={(e) => setFormData({ ...formData, plate_number: e.target.value.toUpperCase() })}
                  placeholder="e.g., ABC-1234"
                  className={`mt-1.5 font-mono dark:bg-slate-900 dark:border-slate-700 ${formErrors.plate_number ? "border-red-500" : ""}`}
                />
                {formErrors.plate_number && <p className="text-red-500 text-xs mt-1">{formErrors.plate_number}</p>}
                <p className="text-xs text-slate-400 mt-1">Unique identifier for the vehicle</p>
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  Fuel Type *
                </Label>
                <select
                  value={formData.fuel_type}
                  onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white"
                >
                  <option value="diesel">Diesel</option>
                  <option value="premium">Premium</option>
                  <option value="regular">Regular</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Status</Label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Odometer</Label>
                  <select
                    value={formData.odometer_status}
                    onChange={(e) => setFormData({ ...formData, odometer_status: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="functional">Functional</option>
                    <option value="non_functional">Non-Functional</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <Label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <Wrench className="h-4 w-4" />
                  Under Maintenance
                </Label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, maintenance_flag: !formData.maintenance_flag })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.maintenance_flag ? "bg-red-600" : "bg-slate-300 dark:bg-slate-600"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.maintenance_flag ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md" disabled={submitting}>
                  {submitting ? "Saving..." : (editingVehicle ? "Update Vehicle" : "Register Vehicle")}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 dark:border-slate-700 dark:text-slate-300">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Separate from Create/Edit Modal */}
      {showDeleteModal && deletingVehicle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Trash2 className="h-7 w-7 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-center mb-2 text-slate-900 dark:text-white">Delete Vehicle</h2>
              <p className="text-slate-600 dark:text-slate-400 text-center mb-4">
                Are you sure you want to delete <strong>{deletingVehicle.vehicle_model}</strong>?
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400 text-center mb-6">
                ⚠️ Warning: This action cannot be undone. Vehicles with existing trip tickets cannot be deleted.
              </p>
              <div className="flex gap-3">
                <Button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-md" disabled={submitting}>
                  {submitting ? "Deleting..." : "Delete"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowDeleteModal(false); setDeletingVehicle(null); }} className="flex-1 dark:border-slate-700 dark:text-slate-300">
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

export default VehicleManagement;