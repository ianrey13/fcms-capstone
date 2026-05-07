import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { tripTicketAPI, departmentStaffAPI } from "../../services/api";
import api from "../../services/api";
import { debounce } from "lodash";
import {
  FileText,
  Save,
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
  Phone,
  Info,
  XCircle,
  RefreshCw,
  RotateCcw,
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

const CreateTripTicket = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're in edit/resubmit mode
  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get("mode") === "edit";
  const editTicketId = searchParams.get("id");
  const [isResubmitMode, setIsResubmitMode] = useState(false);

  // Form state
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
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isCheckingBudget, setIsCheckingBudget] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSunday, setIsSunday] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [departmentBudget, setDepartmentBudget] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [fuelPrice, setFuelPrice] = useState(0);
  const [isLoadingFuelPrices, setIsLoadingFuelPrices] = useState(true);
  const [fuelPrices, setFuelPrices] = useState({
    diesel: 50.0,
    premium: 65.0,
    regular: 55.0,
  });

  // Distance & Location State
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [originAddress] = useState("LGU Building Laguindingan");
  const suggestionsRef = useRef(null);

  // MO Assistance Modal State
  const [showMOAssistanceModal, setShowMOAssistanceModal] = useState(false);
  const [moAssistanceData, setMoAssistanceData] = useState(null);

  // Get department name
  const departmentName =
    user?.department_name || user?.department?.department_name || "";

  // Load edit data if in resubmit mode
  useEffect(() => {
    if (isEditMode && editTicketId) {
      const savedData = sessionStorage.getItem("edit_ticket_data");
      if (savedData) {
        try {
          const ticketData = JSON.parse(savedData);
          setIsResubmitMode(true);
          
          setFormData({
            driver_id: ticketData.driver_id || "",
            vehicle_id: ticketData.vehicle_id || "",
            trip_date: ticketData.trip_date || "",
            destination: ticketData.destination || "",
            purpose: ticketData.purpose || "",
            charge_to: ticketData.charge_to || departmentName,
            passenger_name: ticketData.passenger_name || "",
            estimated_fuel_liters: ticketData.estimated_fuel_liters || "",
            estimated_distance_km: ticketData.estimated_distance_km || "",
          });
          
          toast.info("Editing returned ticket. Please make corrections and resubmit.", {
            duration: 5000,
          });
          
          // Clear session storage after loading
          sessionStorage.removeItem("edit_ticket_data");
        } catch (error) {
          console.error("Error loading edit data:", error);
        }
      }
    }
  }, [isEditMode, editTicketId, departmentName]);

  // Helper functions for date validation
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

  // Debounced search function for locations with cleanup
  const searchLocations = useCallback(
    debounce(async (query) => {
      if (query.length < 2) {
        setLocationSuggestions([]);
        return;
      }

      try {
        const response = await api.get("/location/search", {
          params: { query },
        });
        setLocationSuggestions(response.data?.data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error searching locations:", error);
      }
    }, 500),
    [],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      searchLocations.cancel();
    };
  }, [searchLocations]);

  // Calculate distance from LGU Building to destination
  const calculateDistance = async (destinationName, coordinates = null) => {
    if (!destinationName || destinationName.length < 3) return;

    setCalculatingDistance(true);
    try {
      const params = {
        name: destinationName,
        vehicle_type: selectedVehicle?.fuel_type === "diesel" ? "truck" : "car",
        fuel_price: fuelPrice || 55.0,
      };

      if (
        coordinates &&
        Array.isArray(coordinates) &&
        coordinates.length === 2
      ) {
        params.lng = coordinates[0];
        params.lat = coordinates[1];
      }

      const response = await api.get("/location/distance", { params });
      console.log("API Response:", response.data);

      const data = response.data?.data;

      if (data) {
        setDistanceInfo(data);

        if (data.estimated_fuel_liters && !isNaN(data.estimated_fuel_liters)) {
          const fuelLiters =
            typeof data.estimated_fuel_liters === "number"
              ? data.estimated_fuel_liters
              : parseFloat(data.estimated_fuel_liters);

          setFormData((prev) => ({
            ...prev,
            estimated_fuel_liters: fuelLiters.toFixed(1),
          }));
          console.log("Set fuel liters:", fuelLiters.toFixed(1));
        }

        let distanceValue = null;

        if (data.round_trip_km) {
          distanceValue = data.round_trip_km;
        } else if (data.total_distance_km) {
          distanceValue = data.total_distance_km;
        } else if (data.distance_km) {
          distanceValue = data.distance_km * 2;
        }

        if (distanceValue && !isNaN(distanceValue)) {
          const distanceNum =
            typeof distanceValue === "number"
              ? distanceValue
              : parseFloat(distanceValue);
          setFormData((prev) => ({
            ...prev,
            estimated_distance_km: distanceNum.toFixed(1),
          }));
          console.log("Set distance:", distanceNum.toFixed(1));
        } else {
          if (data.distance_km && !isNaN(data.distance_km)) {
            const roundTrip = data.distance_km * 2;
            setFormData((prev) => ({
              ...prev,
              estimated_distance_km: roundTrip.toFixed(1),
            }));
            console.log(
              "Set calculated round trip distance:",
              roundTrip.toFixed(1),
            );
          }
        }

        if (data.calculation_method === "fallback_estimate") {
          toast.success(`📍 Approximate distance: ${data.distance_text}`);
        } else {
          const roundTrip = data.round_trip_km || data.distance_km * 2;
          toast.success(
            `📍 ${data.distance_text} (${roundTrip.toFixed(1)} km round trip)`,
          );
        }
      }
    } catch (error) {
      console.error("Error calculating distance:", error);
      toast.error("Unable to calculate distance. Please enter manually.");
      setFormData((prev) => ({
        ...prev,
        estimated_distance_km: "",
        estimated_fuel_liters: "",
      }));
    } finally {
      setCalculatingDistance(false);
    }
  };

  // Handle destination change with autocomplete
  const handleDestinationChange = (value) => {
    setFormData((prev) => ({ ...prev, destination: value }));
    searchLocations(value);
    if (errors.destination) {
      setErrors((prev) => ({ ...prev, destination: "" }));
    }
  };

  // Select suggestion from autocomplete
  const selectSuggestion = async (suggestion) => {
    setFormData((prev) => ({ ...prev, destination: suggestion.name }));
    setShowSuggestions(false);
    setLocationSuggestions([]);
    await calculateDistance(suggestion.name, suggestion.coordinates);
  };

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
    fetchFuelPrices();

    const checkIfSunday = () => {
      const today = new Date();
      setIsSunday(today.getDay() === 0);
    };

    checkIfSunday();
    const interval = setInterval(checkIfSunday, 3600000);
    return () => clearInterval(interval);
  }, []);

  // Update charge_to when user loads
  useEffect(() => {
    if (departmentName && !formData.charge_to) {
      setFormData((prev) => ({ ...prev, charge_to: departmentName }));
    }
  }, [departmentName]);

  // Fetch fuel price when vehicle changes
  useEffect(() => {
    if (selectedVehicle?.fuel_type && fuelPrices) {
      const price = getFuelPriceByType(selectedVehicle.fuel_type);
      setFuelPrice(price);
    }
  }, [selectedVehicle, fuelPrices]);

  const fetchFuelPrices = async () => {
    setIsLoadingFuelPrices(true);
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
    } finally {
      setIsLoadingFuelPrices(false);
    }
  };

  const getFuelPriceByType = (fuelType) => {
    switch (fuelType) {
      case "diesel":
        return fuelPrices.diesel;
      case "premium":
        return fuelPrices.premium;
      case "regular":
        return fuelPrices.regular;
      default:
        return 55.0;
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const departmentId =
        user?.department_id || user?.department?.department_id;

      const [driversRes, vehiclesRes, budgetRes] = await Promise.all([
        departmentStaffAPI
          .getActiveDrivers({ department_id: departmentId })
          .catch(() => ({ data: { data: [] } })),
        departmentStaffAPI
          .getAvailableVehicles({ department_id: departmentId })
          .catch(() => ({ data: { data: [] } })),
        departmentStaffAPI.getDepartmentBudget().catch(() => ({ data: null })),
      ]);

      let driversData = driversRes.data?.data || driversRes.data || [];
      let vehiclesData = vehiclesRes.data?.data || vehiclesRes.data || [];

      setDrivers(Array.isArray(driversData) ? driversData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);

      const budgetData = budgetRes.data?.data || budgetRes.data;
      if (budgetData) {
        setDepartmentBudget({
          remaining_budget:
            budgetData.remaining_amount || budgetData.remaining_budget || 0,
          allocated_amount: budgetData.allocated_amount || 0,
          spent_amount:
            budgetData.total_spent_amount || budgetData.spent_amount || 0,
          week_start: budgetData.week_start,
          week_end: budgetData.week_end,
        });
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch vehicle details when selected
  useEffect(() => {
    if (formData.vehicle_id && vehicles.length > 0) {
      const vehicle = vehicles.find(
        (v) =>
          v.vehicle_id === parseInt(formData.vehicle_id) ||
          v.id === parseInt(formData.vehicle_id),
      );
      setSelectedVehicle(vehicle);
    } else {
      setSelectedVehicle(null);
      setFuelPrice(0);
    }
  }, [formData.vehicle_id, vehicles]);

  // Fetch driver details when selected
  useEffect(() => {
    if (formData.driver_id && drivers.length > 0) {
      const driver = drivers.find(
        (d) =>
          d.driver_id === parseInt(formData.driver_id) ||
          d.id === parseInt(formData.driver_id),
      );
      setSelectedDriver(driver);
    } else {
      setSelectedDriver(null);
    }
  }, [formData.driver_id, drivers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  //validation form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.driver_id) newErrors.driver_id = "Please select a driver";
    if (!formData.vehicle_id) newErrors.vehicle_id = "Please select a vehicle";
    if (!formData.trip_date) newErrors.trip_date = "Please select trip date";
    if (!formData.destination)
      newErrors.destination = "Please enter destination";
    if (!formData.purpose) newErrors.purpose = "Please enter trip purpose";

    if (
      formData.trip_date &&
      typeof formData.trip_date === "string" &&
      formData.trip_date.trim() !== ""
    ) {
      const tripDateObj = new Date(formData.trip_date);
      const today = new Date();
      const currentDayOfWeek = today.getDay();

      if (isNaN(tripDateObj.getTime())) {
        newErrors.trip_date = "Invalid date format";
      } else if (currentDayOfWeek === 0) {
        newErrors.trip_date =
          "Trip tickets cannot be created on Sundays. Please try again tomorrow (Monday).";
      } else if (isPastDate(formData.trip_date)) {
        newErrors.trip_date = "Trip date cannot be in the past";
      } else if (!isWithinCurrentWeek(formData.trip_date)) {
        newErrors.trip_date =
          "Trip tickets can only be created for dates within the current week (Monday to Sunday).";
      } else if (!isWeekday(tripDateObj)) {
        newErrors.trip_date =
          "Trips can only be scheduled on weekdays (Monday to Friday). Weekend trips are not allowed.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //create payload
  const createPayload = () => {
    const driverId = formData.driver_id ? parseInt(formData.driver_id) : null;
    const vehicleId = formData.vehicle_id
      ? parseInt(formData.vehicle_id)
      : null;

    return {
      driver_id: driverId,
      vehicle_id: vehicleId,
      trip_date: formData.trip_date || null,
      destination: formData.destination || null,
      purpose: formData.purpose || null,
      charge_to: formData.charge_to || null,
      passenger_name: formData.passenger_name || null,
      estimated_fuel_liters: formData.estimated_fuel_liters
        ? parseFloat(formData.estimated_fuel_liters)
        : null,
      estimated_distance_km: formData.estimated_distance_km
        ? parseFloat(formData.estimated_distance_km)
        : null,
    };
  };

const handleSubmit = async () => {
  if (!validateForm()) {
    const firstError = document.querySelector(".error-message");
    if (firstError)
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  setIsSubmitting(true);
  setIsCheckingBudget(true);

  try {
    const payload = createPayload();
    console.log("🚀 Submitting payload:", payload);

    let submitResponse;
    let budgetWarningData = null;

    // Check budget for warning purposes only (does NOT block submission)
    try {
      const checkResponse = await departmentStaffAPI.checkBudgetAndRequestMO(payload);
      
      if (!checkResponse.data.can_proceed) {
        // Store warning data but DON'T block submission
        budgetWarningData = {
          budget: checkResponse.data.budget,
          estimated_cost: checkResponse.data.estimated_cost,
          shortage: checkResponse.data.shortage,
          request_id: checkResponse.data.request_id,
          message: checkResponse.data.message,
        };
        console.log("⚠️ Budget insufficient, but continuing with submission");
      } else {
        console.log("✅ Budget sufficient");
      }
    } catch (budgetError) {
      console.warn("Budget check failed, but continuing with submission:", budgetError);
      // Continue with submission even if budget check fails
    }

    // If in resubmit mode, use the resubmit endpoint
    if (isResubmitMode && editTicketId) {
      console.log("📤 Resubmitting ticket:", editTicketId);
      submitResponse = await tripTicketAPI.resubmit(editTicketId, payload);
    } else {
      // ✅ ALWAYS submit the ticket (backend will handle insufficient budget flag)
      submitResponse = await tripTicketAPI.submit(payload);
    }

    console.log("📥 Submit response:", submitResponse.data);

    if (submitResponse.data.success) {
      // Show appropriate success message with budget warning if applicable
      if (budgetWarningData) {
        // Store warning data for modal
        setMoAssistanceData(budgetWarningData);
        setShowMOAssistanceModal(true);
        
        toast.success(
          "⚠️ Trip ticket submitted with INSUFFICIENT BUDGET warning.\n" +
          "The ticket will still proceed through the approval workflow.\n" +
          "Mayor's Office will be notified.",
          { duration: 6000 }
        );
      } else {
        toast.success(
          isResubmitMode
            ? "✓ Trip ticket resubmitted successfully! It has been sent to your Department Head for approval."
            : "✓ Trip ticket submitted successfully! It has been sent to your Department Head for approval."
        );
        
        // Navigate to requests page after a short delay
        setTimeout(() => {
          navigate("/department/requests");
        }, 1500);
      }
    } else {
      toast.error(submitResponse.data.message || "Error submitting trip ticket");
    }
  } catch (error) {
    console.error("❌ Error submitting:", error);
    console.error("Error response:", error.response?.data);
    console.error("Error status:", error.response?.status);
    
    const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error ||
                         "Error submitting trip ticket. Please try again.";
    toast.error(errorMessage);
  } finally {
    setIsSubmitting(false);
    setIsCheckingBudget(false);
  }
};
  const handleSaveDraft = async () => {
    if (!formData.driver_id) {
      toast.error("Please select a driver before saving draft");
      return;
    }

    if (!formData.vehicle_id) {
      toast.error("Please select a vehicle before saving draft");
      return;
    }

    if (!formData.trip_date) {
      toast.error("Please select a trip date before saving draft");
      return;
    }

    if (!formData.destination) {
      toast.error("Please enter a destination before saving draft");
      return;
    }

    if (!formData.purpose) {
      toast.error("Please enter a purpose before saving draft");
      return;
    }

    setIsSavingDraft(true);
    try {
      const payload = createPayload();
      const response = await tripTicketAPI.saveDraft(payload);

      if (response.data.success) {
        toast.success("✓ Trip ticket saved as draft!");
        navigate("/department/requests");
      } else {
        toast.error(response.data.message || "Error saving draft");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error(
        error.response?.data?.message ||
          "Error saving draft. Please try again.",
      );
    } finally {
      setIsSavingDraft(false);
    }
  };

  //Budget status calculation
  const getBudgetStatus = () => {
    if (!departmentBudget) return null;
    const remaining = departmentBudget.remaining_budget || 0;
    const allocated = departmentBudget.allocated_amount || 0;
    const used = allocated - remaining;
    const usedPercentage = allocated > 0 ? (used / allocated) * 100 : 0;
    const remainingPercentage =
      allocated > 0 ? (remaining / allocated) * 100 : 0;

    return {
      remaining,
      used,
      usedPercentage,
      remainingPercentage,
      isLow: remainingPercentage < 20,
      isCritical: remainingPercentage < 10,
    };
  };

  const budgetStatus = getBudgetStatus();

  //estimated cost
  const estimatedCost = useMemo(() => {
    if (
      !formData.estimated_fuel_liters ||
      parseFloat(formData.estimated_fuel_liters) <= 0
    )
      return 0;
    return parseFloat(formData.estimated_fuel_liters) * fuelPrice;
  }, [formData.estimated_fuel_liters, fuelPrice]);

  //moassistance
const MOAssistanceModal = () => {
  const handleClose = () => {
    setShowMOAssistanceModal(false);
    // Navigate to requests page after closing modal
    setTimeout(() => {
      navigate("/department/requests");
    }, 500);
  };

  const handleViewBudget = () => {
    setShowMOAssistanceModal(false);
    navigate("/department/budget-status");
  };

  const handleContinue = () => {
    setShowMOAssistanceModal(false);
    // Stay on page or navigate to requests
    navigate("/department/requests");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Insufficient Budget Notice
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Your department does not have enough budget for this trip. However, your trip ticket has been submitted and will proceed through the normal approval workflow.
            </p>

            {/* Budget Details */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Remaining Budget:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ₱{moAssistanceData?.budget?.remaining?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Estimated Cost:</span>
                  <span className="font-semibold">
                    ₱{moAssistanceData?.estimated_cost?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-gray-500">Shortage:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ₱{moAssistanceData?.shortage?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {moAssistanceData?.budget?.allocated > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Budget Utilization</span>
                  <span>
                    {Math.round(
                      ((moAssistanceData.budget.allocated -
                        moAssistanceData.budget.remaining) /
                        moAssistanceData.budget.allocated) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        ((moAssistanceData.budget.allocated -
                          moAssistanceData.budget.remaining) /
                          moAssistanceData.budget.allocated) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Updated Info Box - Key Change */}
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">
                    ⚠️ Insufficient Budget Notice
                  </p>
                  <p>
                    Your trip ticket has been submitted with INSUFFICIENT BUDGET notification.
                    The Mayor's Office will be notified and will decide which department's budget 
                    to charge upon fund release.
                  </p>
                  <p className="text-xs mt-2 text-blue-600 dark:text-blue-400">
                    ✓ Your ticket will still proceed through the normal approval workflow
                  </p>
                  <p className="text-xs mt-1 text-blue-500 dark:text-blue-400">
                    Request ID: {moAssistanceData?.request_id}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Need assistance? Contact Mayor's Office at
                <span className="inline-flex items-center gap-1 ml-1">
                  <Phone className="h-3 w-3" />
                  <span>(088) 123-4567</span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleContinue}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              OK, Continue
            </Button>
            <Button
              variant="outline"
              onClick={handleViewBudget}
              className="flex-1"
            >
              View Budget Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                {isResubmitMode ? (
                  <RotateCcw className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                ) : (
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isResubmitMode ? "Resubmit Trip Ticket" : "Create Trip Ticket"}
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 ml-12">
              {isResubmitMode
                ? "Make corrections to your returned trip ticket and resubmit for approval."
                : "Fill out the form below to request a trip ticket for official travel"}
            </p>
          </div>

          {/* Resubmit Banner */}
          {isResubmitMode && (
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <RotateCcw className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                You are editing a returned ticket. Please review the rejection reason, make necessary corrections, and resubmit.
              </AlertDescription>
            </Alert>
          )}

          {/* Department Info Bar */}
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Department:{" "}
                  <strong className="text-gray-900 dark:text-white">
                    {departmentName || "N/A"}
                  </strong>
                </span>
              </div>
              {departmentBudget && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Weekly Budget Remaining:{" "}
                    <strong
                      className={
                        budgetStatus?.isCritical
                          ? "text-red-600"
                          : budgetStatus?.isLow
                            ? "text-yellow-600"
                            : "text-green-600"
                      }
                    >
                      ₱{budgetStatus?.remaining?.toLocaleString() || 0}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Budget Alert */}
          {budgetStatus && budgetStatus.isLow && !isResubmitMode && (
            <Alert
              className={`mb-6 ${budgetStatus.isCritical ? "bg-red-50 border-red-200 dark:bg-red-900/20" : "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20"}`}
            >
              <AlertCircle
                className={`h-4 w-4 ${budgetStatus.isCritical ? "text-red-600" : "text-yellow-600"}`}
              />
              <AlertDescription
                className={
                  budgetStatus.isCritical
                    ? "text-red-800 dark:text-red-300"
                    : "text-yellow-800 dark:text-yellow-300"
                }
              >
                {budgetStatus.isCritical
                  ? `⚠️ CRITICAL: Only ₱${budgetStatus.remaining.toLocaleString()} remaining (${Math.round(budgetStatus.remainingPercentage)}% of weekly budget)! Please coordinate with your department head.`
                  : `⚠️ Low budget alert: Only ₱${budgetStatus.remaining.toLocaleString()} remaining (${Math.round(budgetStatus.remainingPercentage)}% of budget left this week).`}
              </AlertDescription>
            </Alert>
          )}

          {/* Sunday Restriction Banner */}
          {isSunday && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                ⚠️ Trip tickets cannot be created on Sundays. The system is
                closed for maintenance and rest day. Please come back on Monday
                to create your trip tickets.
              </AlertDescription>
            </Alert>
          )}

          {/* Main Form Card */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50 rounded-t-xl">
              <CardTitle>Trip Ticket Information</CardTitle>
              <CardDescription>
                All fields marked with <span className="text-red-500">*</span>{" "}
                are required
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Row 1: Trip Date & Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trip_date">
                    Trip Date <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="trip_date"
                      name="trip_date"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      className={`pl-10 ${errors.trip_date ? "border-red-500" : ""}`}
                      value={formData.trip_date}
                      onChange={handleInputChange}
                      disabled={isSunday}
                    />
                  </div>
                  {errors.trip_date && (
                    <p className="text-red-500 text-sm mt-1 error-message">
                      {errors.trip_date}
                    </p>
                  )}
                </div>

                {/* Destination with Autocomplete and Refresh Button */}
                <div>
                  <Label htmlFor="destination">
                    Destination <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="destination"
                        name="destination"
                        placeholder="e.g., Cagayan de Oro City Hall, Provincial Capitol"
                        className={`pl-10 ${errors.destination ? "border-red-500" : ""}`}
                        value={formData.destination}
                        onChange={(e) =>
                          handleDestinationChange(e.target.value)
                        }
                        onBlur={() => {
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                      />
                      {calculatingDistance && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => calculateDistance(formData.destination)}
                      disabled={calculatingDistance || !formData.destination}
                      className="px-3"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${calculatingDistance ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </div>
                  {errors.destination && (
                    <p className="text-red-500 text-sm mt-1 error-message">
                      {errors.destination}
                    </p>
                  )}
                </div>
              </div>

              {/* Distance Info Card */}
              {distanceInfo && (
                <div
                  className={`rounded-lg p-4 border ${
                    distanceInfo.calculation_method === "fallback_estimate"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        distanceInfo.calculation_method === "fallback_estimate"
                          ? "bg-yellow-100"
                          : "bg-blue-100"
                      }`}
                    >
                      <Route
                        className={`h-5 w-5 ${
                          distanceInfo.calculation_method ===
                          "fallback_estimate"
                            ? "text-yellow-600"
                            : "text-blue-600"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-800">
                          Route Information
                        </h4>
                        {distanceInfo.calculation_method ===
                          "fallback_estimate" && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs"
                          >
                            ⚠️ Approximate
                          </Badge>
                        )}
                        {distanceInfo.calculation_method === "gps_route" && (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 border-green-300 text-xs"
                          >
                            ✓ GPS Route
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">From</p>
                          <p className="font-medium text-gray-700">
                            LGU Building Laguindingan
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">To</p>
                          <p className="font-medium text-gray-700">
                            {distanceInfo.destination}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Distance</p>
                          <p className="font-semibold text-blue-600">
                            {distanceInfo.distance_text}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Est. Fuel</p>
                          <p className="font-semibold text-green-600">
                            {distanceInfo.estimated_fuel_liters} L
                          </p>
                        </div>
                      </div>
                      {distanceInfo.note && (
                        <p className="text-xs text-gray-400 mt-2 italic">
                          {distanceInfo.note}
                        </p>
                      )}
                      {distanceInfo.fuel_price_used && (
                        <p className="text-xs text-gray-400 mt-1">
                          *Based on fuel price: ₱{distanceInfo.fuel_price_used}
                          /L
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Row 2: Purpose */}
              <div>
                <Label htmlFor="purpose">
                  Purpose of Trip <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="purpose"
                  name="purpose"
                  placeholder="Describe the official purpose of this trip..."
                  rows={3}
                  className={errors.purpose ? "border-red-500" : ""}
                  value={formData.purpose}
                  onChange={handleInputChange}
                />
                {errors.purpose && (
                  <p className="text-red-500 text-sm mt-1 error-message">
                    {errors.purpose}
                  </p>
                )}
              </div>

              {/* Row 3: Charge To & Passenger */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="charge_to">
                    Charge To <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="charge_to"
                    name="charge_to"
                    value={departmentName || "N/A"}
                    disabled
                    className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This trip will be charged to your department
                  </p>
                </div>

                <div>
                  <Label htmlFor="passenger_name">
                    Passenger Name (Optional)
                  </Label>
                  <Input
                    id="passenger_name"
                    name="passenger_name"
                    placeholder="Name of passenger if applicable"
                    value={formData.passenger_name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Row 4: Vehicle & Driver */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicle_id">
                    Select Vehicle <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.vehicle_id?.toString()}
                    onValueChange={(value) =>
                      handleSelectChange("vehicle_id", value)
                    }
                    disabled={isSunday}
                  >
                    <SelectTrigger
                      className={errors.vehicle_id ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Choose a vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem
                          key={vehicle.vehicle_id || vehicle.id}
                          value={(vehicle.vehicle_id || vehicle.id).toString()}
                        >
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            {vehicle.plate_number} - {vehicle.vehicle_model}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.vehicle_id && (
                    <p className="text-red-500 text-sm mt-1 error-message">
                      {errors.vehicle_id}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="driver_id">
                    Select Driver <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.driver_id?.toString()}
                    onValueChange={(value) =>
                      handleSelectChange("driver_id", value)
                    }
                    disabled={isSunday}
                  >
                    <SelectTrigger
                      className={errors.driver_id ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Choose a driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem
                          key={driver.driver_id || driver.id}
                          value={(driver.driver_id || driver.id).toString()}
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {driver.user?.full_name || driver.full_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.driver_id && (
                    <p className="text-red-500 text-sm mt-1 error-message">
                      {errors.driver_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Selected Vehicle Details */}
              {selectedVehicle && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2 text-blue-800 dark:text-blue-300">
                      <Truck className="h-4 w-4" />
                      Selected Vehicle Details
                    </h4>
                    <Badge
                      className={`${selectedVehicle.status === "active" ? "bg-green-500" : "bg-yellow-500"}`}
                    >
                      {selectedVehicle.status === "active"
                        ? "Available"
                        : "Inactive"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Plate Number</p>
                      <p className="font-medium">
                        {selectedVehicle.plate_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Model</p>
                      <p className="font-medium">
                        {selectedVehicle.vehicle_model}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fuel Type</p>
                      <Badge variant="outline" className="mt-1">
                        {selectedVehicle.fuel_type?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  {fuelPrice > 0 && (
                    <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                      <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <Info className="h-3 w-3" />
                        <span>
                          Current {selectedVehicle.fuel_type} price: ₱
                          {fuelPrice.toFixed(2)}/L
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Driver Details */}
              {selectedDriver && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-800 dark:text-green-300">
                    <User className="h-4 w-4" />
                    Selected Driver Details
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Full Name</p>
                      <p className="font-medium">
                        {selectedDriver.user?.full_name ||
                          selectedDriver.full_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium">
                        {selectedDriver.user?.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <Badge className="mt-1 bg-green-500">Active</Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Row 5: Estimates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimated_fuel_liters">
                    Estimated Fuel (Liters) - Optional
                  </Label>
                  <div className="relative">
                    <Fuel className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="estimated_fuel_liters"
                      name="estimated_fuel_liters"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 50.00"
                      className="pl-10"
                      value={formData.estimated_fuel_liters}
                      onChange={handleInputChange}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Optional but recommended for budget planning
                  </p>
                </div>

                <div>
                  <Label htmlFor="estimated_distance_km">
                    Estimated Distance (KM) - Optional
                  </Label>
                  <div className="relative">
                    <Route className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="estimated_distance_km"
                      name="estimated_distance_km"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 150.00"
                      className="pl-10"
                      value={formData.estimated_distance_km}
                      onChange={handleInputChange}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Estimated total distance for this trip
                  </p>
                </div>
              </div>

              {/* Fuel Cost Estimate */}
              {selectedVehicle &&
                formData.estimated_fuel_liters &&
                parseFloat(formData.estimated_fuel_liters) > 0 &&
                fuelPrice > 0 && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold mb-2">Estimated Fuel Cost</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Estimated Liters</p>
                        <p className="font-medium">
                          {parseFloat(formData.estimated_fuel_liters).toFixed(
                            2,
                          )}{" "}
                          L
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Estimated Cost</p>
                        <p className="font-medium text-blue-600">
                          ₱
                          {estimatedCost.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          *Based on {selectedVehicle.fuel_type} fuel at ₱
                          {fuelPrice.toFixed(2)}/L
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </CardContent>

            <CardFooter className="flex justify-end gap-4 border-t pt-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={
                  isSavingDraft || isSubmitting || isCheckingBudget || isSunday
                }
                className="gap-2"
              >
                {isSavingDraft ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSavingDraft ? "Saving..." : "Save as Draft"}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  isSavingDraft || isSubmitting || isCheckingBudget || isSunday
                }
                className={`gap-2 ${
                  isResubmitMode
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                }`}
              >
                {isSunday ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Not Available on Sundays
                  </>
                ) : isCheckingBudget ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isResubmitMode ? (
                  <RotateCcw className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isSunday
                  ? "Closed on Sundays"
                  : isCheckingBudget
                    ? "Checking Budget..."
                    : isSubmitting
                      ? "Submitting..."
                      : isResubmitMode
                        ? "Resubmit Ticket"
                        : "Submit to Department Head"}
              </Button>
            </CardFooter>
          </Card>

          {/* Process Info */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <CheckCircle className="h-4 w-4" />
              What happens next?
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Submit to Head
                </p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Head Approval
                </p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-yellow-600 font-bold">3</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">GSO Review</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 font-bold">4</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Mayor's Office
                </p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-orange-600 font-bold">5</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">Fund Release</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-indigo-600 font-bold">6</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Trip Execution
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MO Assistance Modal */}
      {showMOAssistanceModal && <MOAssistanceModal />}
    </>
  );
};

export default CreateTripTicket;