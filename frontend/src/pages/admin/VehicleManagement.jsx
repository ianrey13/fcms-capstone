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
  Info,
} from "lucide-react";

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchVehicles();
    fetchDepartments();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleAPI.getAll();
      // Handle response structure: response.data.data
      const vehicleData = response.data?.data || response.data || [];
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to load vehicles",
      );
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

  // Helper function to get department name by ID
  const getDepartmentName = (departmentId) => {
    const department = departments.find(
      (d) => d.department_id === departmentId,
    );
    return department?.department_name || "N/A";
  };

  // Filter vehicles based on search and status
  const filteredVehicles = vehicles.filter((vehicle) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      vehicle.vehicle_model?.toLowerCase().includes(search) ||
      vehicle.plate_number?.toLowerCase().includes(search);
    const matchesStatus =
      statusFilter === "all" || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const validateForm = () => {
    const errors = {};
    if (!formData.department_id) {
      errors.department_id = "Department is required";
    }
    if (!formData.vehicle_model?.trim()) {
      errors.vehicle_model = "Vehicle model is required";
    }
    if (!formData.plate_number?.trim()) {
      errors.plate_number = "Plate number is required";
    } else if (formData.plate_number.length > 20) {
      errors.plate_number = "Plate number must be 20 characters or less";
    }
    if (!formData.fuel_type) {
      errors.fuel_type = "Fuel type is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await vehicleAPI.delete(id);
      setSuccessMessage("Vehicle deleted successfully");
      setShowDeleteConfirm(null);
      await fetchVehicles();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete vehicle";
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (vehicle) => {
    const newStatus = vehicle.status === "active" ? "inactive" : "active";
    try {
      await vehicleAPI.updateStatus(vehicle.vehicle_id, newStatus);
      await fetchVehicles();
      setSuccessMessage(
        `Vehicle ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
      );
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
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="h-3 w-3" />
        Inactive
      </span>
    );
  };

  const getOdometerBadge = (status) => {
    if (status === "functional") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Gauge className="h-3 w-3" />
          Functional
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        <AlertTriangle className="h-3 w-3" />
        Non-Functional
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Vehicle Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage fleet vehicles, track status, and maintenance
          </p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Register Vehicle
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
                placeholder="Search by model or plate number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button
              variant="outline"
              onClick={fetchVehicles}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Fuel Consumption Reference Card - Optional */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">
                📋 Fuel Consumption Reference (from LGU Records):
              </p>
              <ul className="space-y-0.5 text-xs">
                <li>
                  • <strong>Cagayan de Oro trips</strong>: Pickup ~20L,
                  Ambulance ~40L, Motorcycle ~8L
                </li>
                <li>
                  • <strong>Local barangay trips</strong>: Motorcycle 3-8L,
                  Vehicle 15-20L
                </li>
                <li>
                  • <strong>Emergency/Patient transport</strong>: 35-40L round
                  trip
                </li>
                <li>
                  • <strong>All Barangays circuit</strong>: 15-20L depending on
                  vehicle
                </li>
                <li className="text-blue-600 mt-1">
                  ⚠️ These are reference values from actual trip records. Actual
                  consumption may vary based on traffic, load, and driving
                  conditions.
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Fleet Vehicles ({filteredVehicles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No vehicles found</p>
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
                      Vehicle
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plate #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fuel Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Odometer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Maintenance
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredVehicles.map((vehicle) => (
                    <tr
                      key={vehicle.vehicle_id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {vehicle.vehicle_model}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">
                          {vehicle.plate_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {getDepartmentName(vehicle.department_id)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {getFuelTypeIcon(vehicle.fuel_type)}
                          <span className="text-sm capitalize">
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
                        <button
                          onClick={() => handleToggleMaintenance(vehicle)}
                        >
                          {vehicle.maintenance_flag ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <Wrench className="h-3 w-3" />
                              Under Maintenance
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              <Check className="h-3 w-3" />
                              Operational
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(vehicle)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(vehicle)}
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

      {/* Create/Edit Modal - Keep your existing modal JSX, it's fine */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">
                {editingVehicle ? "Edit Vehicle" : "Register New Vehicle"}
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
                  htmlFor="department_id"
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Department *
                </Label>
                <select
                  id="department_id"
                  value={formData.department_id}
                  onChange={(e) =>
                    setFormData({ ...formData, department_id: e.target.value })
                  }
                  className={`w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.department_id ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
                {formErrors.department_id && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.department_id}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="vehicle_model"
                  className="flex items-center gap-2"
                >
                  <Car className="h-4 w-4" />
                  Vehicle Model *
                </Label>
                <Input
                  id="vehicle_model"
                  value={formData.vehicle_model}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicle_model: e.target.value })
                  }
                  placeholder="e.g., Toyota Hilux, Mitsubishi L300"
                  className={`mt-1 ${formErrors.vehicle_model ? "border-red-500" : ""}`}
                />
                {formErrors.vehicle_model && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.vehicle_model}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="plate_number"
                  className="flex items-center gap-2"
                >
                  <Truck className="h-4 w-4" />
                  Plate Number *
                </Label>
                <Input
                  id="plate_number"
                  value={formData.plate_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      plate_number: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., ABC-1234"
                  className={`mt-1 font-mono ${formErrors.plate_number ? "border-red-500" : ""}`}
                />
                {formErrors.plate_number && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.plate_number}
                  </p>
                )}
                <p className="text-gray-400 text-xs mt-1">
                  Unique identifier for the vehicle
                </p>
              </div>

              <div>
                <Label htmlFor="fuel_type" className="flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  Fuel Type *
                </Label>
                <select
                  id="fuel_type"
                  value={formData.fuel_type}
                  onChange={(e) =>
                    setFormData({ ...formData, fuel_type: e.target.value })
                  }
                  className={`w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.fuel_type ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="diesel">Diesel</option>
                  <option value="premium">Premium</option>
                  <option value="regular">Regular</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="odometer_status">Odometer Status</Label>
                  <select
                    id="odometer_status"
                    value={formData.odometer_status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        odometer_status: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="functional">Functional</option>
                    <option value="non_functional">Non-Functional</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Label
                  htmlFor="maintenance_flag"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Wrench className="h-4 w-4" />
                  Under Maintenance
                </Label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      maintenance_flag: !formData.maintenance_flag,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.maintenance_flag ? "bg-red-600" : "bg-gray-300"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.maintenance_flag ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading
                    ? "Saving..."
                    : editingVehicle
                      ? "Update Vehicle"
                      : "Register Vehicle"}
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
                Delete Vehicle
              </h2>
              <p className="text-gray-600 text-center mb-4">
                Are you sure you want to delete{" "}
                <strong>{showDeleteConfirm.vehicle_model}</strong>?
              </p>
              <p className="text-sm text-red-600 text-center mb-6">
                Warning: This action cannot be undone. Vehicles with existing
                trip tickets cannot be deleted.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleDelete(showDeleteConfirm.vehicle_id)}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete"}
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

export default VehicleManagement;
