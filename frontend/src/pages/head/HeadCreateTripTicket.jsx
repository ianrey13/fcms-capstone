// src/pages/head/HeadCreateTripTicket.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { headOfficeAPI } from "../../services/api";
import api from "../../services/api";
import { debounce } from "lodash";
import {
  FileText,
  Send,
  Truck,
  User,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Fuel,
  Route,
  Building2,
  Loader2,
  X,
  Info,
  XCircle,
  RefreshCw,
  Users,
  Phone,
  ChevronDown,
  ChevronUp,
  Gauge,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";

const HeadCreateTripTicket = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    driver_id: "",
    vehicle_id: "",
    trip_date: "",
    destination: "",
    purpose: "",
    charge_to: user?.department_name || user?.department?.department_name || "",
    passenger_name: "",
    estimated_fuel_liters: "",
    estimated_distance_km: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSunday, setIsSunday] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [fuelPrice, setFuelPrice] = useState(0);
  const [fuelPrices, setFuelPrices] = useState({
    diesel: 50.0,
    premium: 65.0,
    regular: 55.0,
  });

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [activeSection, setActiveSection] = useState("trip");

  const departmentName =
    user?.department_name || user?.department?.department_name || "";

  const isWeekday = (date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };

  const isWithinCurrentWeek = (date) => {
    const today = new Date();
    const currentDate = new Date(today);
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = currentDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(currentDate.getDate() - daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const tripDate = new Date(date);
    tripDate.setHours(0, 0, 0, 0);
    return tripDate >= startOfWeek && tripDate <= endOfWeek;
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tripDate = new Date(date);
    tripDate.setHours(0, 0, 0, 0);
    return tripDate < today;
  };

  const searchLocations = useCallback(
    debounce(async (query) => {
      if (query.length < 2) {
        setLocationSuggestions([]);
        return;
      }
      try {
        const response = await api.get("/location/search", { params: { query } });
        setLocationSuggestions(response.data?.data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error searching locations:", error);
      }
    }, 500),
    [],
  );

  useEffect(() => {
    return () => searchLocations.cancel();
  }, [searchLocations]);

  const calculateDistance = async (destinationName, coordinates = null) => {
    if (!destinationName || destinationName.length < 3) return;
    setCalculatingDistance(true);
    try {
      const params = {
        name: destinationName,
        vehicle_type: selectedVehicle?.fuel_type === "diesel" ? "truck" : "car",
        fuel_price: fuelPrice || 55.0,
      };
      if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
        params.lng = coordinates[0];
        params.lat = coordinates[1];
      }
      const response = await api.get("/location/distance", { params });
      const data = response.data?.data;
      if (data) {
        setDistanceInfo(data);
        if (data.estimated_fuel_liters && !isNaN(data.estimated_fuel_liters)) {
          const fuelLiters = typeof data.estimated_fuel_liters === "number"
            ? data.estimated_fuel_liters
            : parseFloat(data.estimated_fuel_liters);
          setFormData((prev) => ({
            ...prev,
            estimated_fuel_liters: fuelLiters.toFixed(1),
          }));
        }
        let distanceValue = null;
        if (data.round_trip_km) distanceValue = data.round_trip_km;
        else if (data.total_distance_km) distanceValue = data.total_distance_km;
        else if (data.distance_km) distanceValue = data.distance_km * 2;
        if (distanceValue && !isNaN(distanceValue)) {
          const distanceNum = typeof distanceValue === "number" ? distanceValue : parseFloat(distanceValue);
          setFormData((prev) => ({ ...prev, estimated_distance_km: distanceNum.toFixed(1) }));
        }
        const roundTrip = data.round_trip_km || data.distance_km * 2;
        toast.success(`📍 ${data.distance_text} (${roundTrip.toFixed(1)} km round trip)`);
      }
    } catch (error) {
      console.error("Error calculating distance:", error);
      toast.error("Unable to calculate distance. Please enter manually.");
      setFormData((prev) => ({ ...prev, estimated_distance_km: "", estimated_fuel_liters: "" }));
    } finally {
      setCalculatingDistance(false);
    }
  };

  const handleDestinationChange = (value) => {
    setFormData((prev) => ({ ...prev, destination: value }));
    searchLocations(value);
    if (errors.destination) setErrors((prev) => ({ ...prev, destination: "" }));
  };

  const selectSuggestion = async (suggestion) => {
    setFormData((prev) => ({ ...prev, destination: suggestion.name }));
    setShowSuggestions(false);
    setLocationSuggestions([]);
    await calculateDistance(suggestion.name, suggestion.coordinates);
  };

  useEffect(() => {
    fetchData();
    fetchFuelPrices();
    const checkIfSunday = () => setIsSunday(new Date().getDay() === 0);
    checkIfSunday();
    const interval = setInterval(checkIfSunday, 3600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (departmentName && !formData.charge_to) {
      setFormData((prev) => ({ ...prev, charge_to: departmentName }));
    }
  }, [departmentName]);

  useEffect(() => {
    if (selectedVehicle?.fuel_type && fuelPrices) {
      const price = getFuelPriceByType(selectedVehicle.fuel_type);
      setFuelPrice(price);
    }
  }, [selectedVehicle, fuelPrices]);

  const fetchFuelPrices = async () => {
    try {
      const response = await api.get("/public/fuel-prices");
      const data = response.data;
      setFuelPrices({
        diesel: parseFloat(data.diesel) || 50.0,
        premium: parseFloat(data.premium) || 65.0,
        regular: parseFloat(data.regular) || 55.0,
      });
    } catch (error) {
      console.log("Using default fuel prices");
    }
  };

  const getFuelPriceByType = (fuelType) => {
    switch (fuelType) {
      case "diesel": return fuelPrices.diesel;
      case "premium": return fuelPrices.premium;
      case "regular": return fuelPrices.regular;
      default: return 55.0;
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const departmentId = user?.department_id || user?.department?.department_id;
      const [driversRes, vehiclesRes] = await Promise.all([
        headOfficeAPI.getActiveDrivers({ department_id: departmentId }).catch(err => ({ data: [] })),
        headOfficeAPI.getAvailableVehicles({ department_id: departmentId }).catch(err => ({ data: [] })),
      ]);
      let driversData = driversRes.data?.data || driversRes.data || [];
      let vehiclesData = vehiclesRes.data?.data || vehiclesRes.data || [];
      setDrivers(Array.isArray(driversData) ? driversData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      if (driversData.length === 0) toast.error("No active drivers found for your department");
      if (vehiclesData.length === 0) toast.error("No active vehicles found for your department");
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load drivers and vehicles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (formData.vehicle_id && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.vehicle_id === parseInt(formData.vehicle_id) || v.id === parseInt(formData.vehicle_id));
      setSelectedVehicle(vehicle);
    } else {
      setSelectedVehicle(null);
      setFuelPrice(0);
    }
  }, [formData.vehicle_id, vehicles]);

  useEffect(() => {
    if (formData.driver_id && drivers.length > 0) {
      const driver = drivers.find(d => d.driver_id === parseInt(formData.driver_id) || d.id === parseInt(formData.driver_id));
      setSelectedDriver(driver);
    } else {
      setSelectedDriver(null);
    }
  }, [formData.driver_id, drivers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.driver_id) newErrors.driver_id = "Please select a driver";
    if (!formData.vehicle_id) newErrors.vehicle_id = "Please select a vehicle";
    if (!formData.trip_date) newErrors.trip_date = "Please select trip date";
    if (!formData.destination) newErrors.destination = "Please enter destination";
    if (!formData.purpose) newErrors.purpose = "Please enter trip purpose";
    if (formData.trip_date && typeof formData.trip_date === "string" && formData.trip_date.trim() !== "") {
      const tripDateObj = new Date(formData.trip_date);
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      if (isNaN(tripDateObj.getTime())) newErrors.trip_date = "Invalid date format";
      else if (currentDayOfWeek === 0) newErrors.trip_date = "Trip tickets cannot be created on Sundays.";
      else if (isPastDate(formData.trip_date)) newErrors.trip_date = "Trip date cannot be in the past";
      else if (!isWithinCurrentWeek(formData.trip_date)) newErrors.trip_date = "Trip tickets can only be created for dates within the current week.";
      else if (!isWeekday(tripDateObj)) newErrors.trip_date = "Trips can only be scheduled on weekdays (Monday to Friday).";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createPayload = () => ({
    driver_id: formData.driver_id ? parseInt(formData.driver_id) : null,
    vehicle_id: formData.vehicle_id ? parseInt(formData.vehicle_id) : null,
    trip_date: formData.trip_date || null,
    destination: formData.destination || null,
    purpose: formData.purpose || null,
    charge_to: formData.charge_to || null,
    passenger_name: formData.passenger_name || null,
    estimated_fuel_liters: formData.estimated_fuel_liters ? parseFloat(formData.estimated_fuel_liters) : null,
    estimated_distance_km: formData.estimated_distance_km ? parseFloat(formData.estimated_distance_km) : null,
    submitted_by_head: true,
  });

  const handleSubmit = async () => {
    if (!validateForm()) {
      const firstError = document.querySelector(".error-message");
      if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = createPayload();
      const submitResponse = await headOfficeAPI.submitTripTicket(payload);
      if (submitResponse.data.success) {
        toast.success("✓ Trip ticket created successfully! It has been sent to GSO for review.");
        navigate("/head/dashboard");
      } else {
        toast.error(submitResponse.data.message || "Error creating trip ticket");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      if (error.response?.status === 403) toast.error("You don't have permission to create trip tickets.");
      else if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        if (errors) Object.values(errors).flat().forEach(err => toast.error(err));
        else toast.error(error.response.data.message || "Validation failed");
      } else {
        toast.error(error.response?.data?.message || "Error creating trip ticket. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedCost = useMemo(() => {
    if (!formData.estimated_fuel_liters || parseFloat(formData.estimated_fuel_liters) <= 0) return 0;
    return parseFloat(formData.estimated_fuel_liters) * fuelPrice;
  }, [formData.estimated_fuel_liters, fuelPrice]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />
                Head of Office
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                Create Trip Ticket
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-white">Create Trip Ticket</h1>
            <p className="text-slate-300 mt-1">
              Create a trip ticket for your department - This will be sent directly to GSO for review
            </p>
          </div>
        </div>

        {/* Department Info Bar */}
        <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Department: <strong className="text-slate-900 dark:text-white">{departmentName || "N/A"}</strong>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
            <Info className="h-3 w-3" />
            As Head of Office, your approved tickets will skip the Head approval step and go directly to GSO.
          </p>
        </div>

        {isSunday && (
          <Alert className="mb-6 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-300">
              ⚠️ Trip tickets cannot be created on Sundays. Please come back on Monday.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Form Card */}
        <Card className="shadow-xl border-0 dark:bg-slate-800/80 dark:border-slate-700">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 rounded-t-xl border-b dark:border-slate-700">
            <CardTitle className="text-slate-900 dark:text-white">Trip Ticket Information</CardTitle>
            <CardDescription className="dark:text-slate-400">
              All fields marked with <span className="text-red-500">*</span> are required
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Row 1: Trip Date & Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Trip Date <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    name="trip_date"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    className={`pl-10 dark:bg-slate-900 dark:border-slate-700 ${errors.trip_date ? "border-red-500" : ""}`}
                    value={formData.trip_date}
                    onChange={handleInputChange}
                    disabled={isSunday}
                  />
                </div>
                {errors.trip_date && <p className="text-red-500 text-sm mt-1">{errors.trip_date}</p>}
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300">Destination <span className="text-red-500">*</span></Label>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="e.g., Cagayan de Oro City Hall"
                      className={`pl-10 dark:bg-slate-900 dark:border-slate-700 ${errors.destination ? "border-red-500" : ""}`}
                      value={formData.destination}
                      onChange={(e) => handleDestinationChange(e.target.value)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    {calculatingDistance && (
                      <div className="absolute right-3 top-1/2"><Loader2 className="h-4 w-4 animate-spin text-blue-500" /></div>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => calculateDistance(formData.destination)} disabled={calculatingDistance || !formData.destination}>
                    <RefreshCw className={`h-4 w-4 ${calculatingDistance ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                {errors.destination && <p className="text-red-500 text-sm mt-1">{errors.destination}</p>}
                {locationSuggestions.length > 0 && showSuggestions && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 border rounded-xl shadow-lg max-h-60 overflow-auto">
                    {locationSuggestions.map((suggestion, idx) => (
                      <div key={idx} className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2" onClick={() => selectSuggestion(suggestion)}>
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="text-sm dark:text-white">{suggestion.name}</span>
                        {suggestion.type && <Badge variant="outline" className="text-xs ml-auto">{suggestion.type}</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Distance Info Card */}
            {distanceInfo && (
              <div className="rounded-xl p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Route className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
                  <div className="flex-1">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><p className="text-slate-500 text-xs">From</p><p className="font-medium dark:text-white">LGU Building Laguindingan</p></div>
                      <div><p className="text-slate-500 text-xs">To</p><p className="font-medium dark:text-white">{distanceInfo.destination}</p></div>
                      <div><p className="text-slate-500 text-xs">Distance</p><p className="font-semibold text-blue-600 dark:text-blue-400">{distanceInfo.distance_text}</p></div>
                      <div><p className="text-slate-500 text-xs">Est. Fuel</p><p className="font-semibold text-green-600 dark:text-green-400">{distanceInfo.estimated_fuel_liters} L</p></div>
                    </div>
                    {distanceInfo.fuel_price_used && <p className="text-xs text-slate-400 mt-1">*Based on fuel price: ₱{distanceInfo.fuel_price_used}/L</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Purpose */}
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Purpose of Trip <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Describe the official purpose of this trip..."
                rows={3}
                className={errors.purpose ? "border-red-500 dark:bg-slate-900 dark:border-slate-700" : "dark:bg-slate-900 dark:border-slate-700"}
                value={formData.purpose}
                onChange={handleInputChange}
              />
              {errors.purpose && <p className="text-red-500 text-sm mt-1">{errors.purpose}</p>}
            </div>

            {/* Charge To & Passenger */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Charge To <span className="text-red-500">*</span></Label>
                <Input value={departmentName || "N/A"} disabled className="bg-slate-100 dark:bg-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Passenger Name (Optional)</Label>
                <Input
                  name="passenger_name"
                  placeholder="Name of passenger if applicable"
                  className="dark:bg-slate-900 dark:border-slate-700"
                  value={formData.passenger_name}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Vehicle & Driver */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Select Vehicle <span className="text-red-500">*</span></Label>
                <Select value={formData.vehicle_id?.toString()} onValueChange={(value) => handleSelectChange("vehicle_id", value)} disabled={isSunday}>
                  <SelectTrigger className={errors.vehicle_id ? "border-red-500 dark:bg-slate-900" : "dark:bg-slate-900"}>
                    <SelectValue placeholder="Choose a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.length === 0 ? <div className="px-2 py-4 text-center text-slate-500 text-sm">No vehicles available</div> :
                      vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.vehicle_id || vehicle.id} value={(vehicle.vehicle_id || vehicle.id).toString()}>
                          <div className="flex items-center gap-2"><Truck className="h-4 w-4" />{vehicle.plate_number} - {vehicle.vehicle_model}</div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.vehicle_id && <p className="text-red-500 text-sm mt-1">{errors.vehicle_id}</p>}
                {vehicles.length === 0 && !isLoading && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">No active vehicles found for your department</p>}
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300">Select Driver <span className="text-red-500">*</span></Label>
                <Select value={formData.driver_id?.toString()} onValueChange={(value) => handleSelectChange("driver_id", value)} disabled={isSunday}>
                  <SelectTrigger className={errors.driver_id ? "border-red-500 dark:bg-slate-900" : "dark:bg-slate-900"}>
                    <SelectValue placeholder="Choose a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.length === 0 ? <div className="px-2 py-4 text-center text-slate-500 text-sm">No drivers available</div> :
                      drivers.map((driver) => (
                        <SelectItem key={driver.driver_id || driver.id} value={(driver.driver_id || driver.id).toString()}>
                          <div className="flex items-center gap-2"><User className="h-4 w-4" />{driver.user?.full_name || driver.full_name || driver.name || "Unknown Driver"}</div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.driver_id && <p className="text-red-500 text-sm mt-1">{errors.driver_id}</p>}
                {drivers.length === 0 && !isLoading && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">No active drivers found for your department</p>}
              </div>
            </div>

            {/* Selected Vehicle Details */}
            {selectedVehicle && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold flex items-center gap-2 text-blue-800 dark:text-blue-300"><Truck className="h-4 w-4" />Selected Vehicle Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mt-2">
                  <div><p className="text-slate-500">Plate Number</p><p className="font-medium dark:text-white">{selectedVehicle.plate_number}</p></div>
                  <div><p className="text-slate-500">Model</p><p className="font-medium dark:text-white">{selectedVehicle.vehicle_model}</p></div>
                  <div><p className="text-slate-500">Fuel Type</p><Badge variant="outline">{selectedVehicle.fuel_type?.toUpperCase()}</Badge></div>
                </div>
                {fuelPrice > 0 && <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800"><p className="text-xs text-blue-600 dark:text-blue-400">Current {selectedVehicle.fuel_type} price: ₱{fuelPrice.toFixed(2)}/L</p></div>}
              </div>
            )}

            {/* Selected Driver Details */}
            {selectedDriver && (
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                <h4 className="font-semibold flex items-center gap-2 text-green-800 dark:text-green-300"><User className="h-4 w-4" />Selected Driver Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mt-2">
                  <div><p className="text-slate-500">Full Name</p><p className="font-medium dark:text-white">{selectedDriver.user?.full_name || selectedDriver.full_name || selectedDriver.name}</p></div>
                  <div><p className="text-slate-500">Email</p><p className="font-medium dark:text-white">{selectedDriver.user?.email || "N/A"}</p></div>
                  <div><p className="text-slate-500">Status</p><Badge className="bg-green-500">Active</Badge></div>
                </div>
              </div>
            )}

            {/* Estimates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Estimated Fuel (Liters) - Optional</Label>
                <div className="relative">
                  <Fuel className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    name="estimated_fuel_liters"
                    type="number"
                    step="0.01"
                    className="pl-10 dark:bg-slate-900 dark:border-slate-700"
                    value={formData.estimated_fuel_liters}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Estimated Distance (KM) - Optional</Label>
                <div className="relative">
                  <Route className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    name="estimated_distance_km"
                    type="number"
                    step="0.01"
                    className="pl-10 dark:bg-slate-900 dark:border-slate-700"
                    value={formData.estimated_distance_km}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Fuel Cost Estimate */}
            {selectedVehicle && formData.estimated_fuel_liters && parseFloat(formData.estimated_fuel_liters) > 0 && fuelPrice > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">Estimated Fuel Cost</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-slate-500">Estimated Liters</p><p className="font-medium dark:text-white">{parseFloat(formData.estimated_fuel_liters).toFixed(2)} L</p></div>
                  <div><p className="text-slate-500">Estimated Cost</p><p className="font-medium text-blue-600 dark:text-blue-400">₱{estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-4 border-t pt-6 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
            <Button variant="outline" onClick={() => navigate("/head/dashboard")} className="dark:border-slate-700 dark:text-slate-300">Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || isSunday} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isSubmitting ? "Submitting..." : "Submit to GSO"}
            </Button>
          </CardFooter>
        </Card>

        {/* Process Info */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-100 dark:border-blue-800">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-300"><CheckCircle className="h-4 w-4" />What happens next?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center"><div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-purple-600 dark:text-purple-400 font-bold">1</span></div><p className="dark:text-slate-300">Submit to GSO</p></div>
            <div className="text-center"><div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-yellow-600 dark:text-yellow-400 font-bold">2</span></div><p className="dark:text-slate-300">GSO Review</p></div>
            <div className="text-center"><div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-green-600 dark:text-green-400 font-bold">3</span></div><p className="dark:text-slate-300">Mayor's Office</p></div>
            <div className="text-center"><div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-indigo-600 dark:text-indigo-400 font-bold">4</span></div><p className="dark:text-slate-300">Trip Execution</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadCreateTripTicket;