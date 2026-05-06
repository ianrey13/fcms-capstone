<?php

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\TripTicketController;
use App\Http\Controllers\API\ReconciliationController;
use App\Http\Controllers\API\FuelLogController;
use App\Http\Controllers\API\DepartmentRequestController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\BudgetController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\DepartmentController;
use App\Http\Controllers\API\VehicleController;
use App\Http\Controllers\API\SettingsController;
use App\Http\Controllers\API\BudgetPolicyController;
use App\Http\Controllers\API\DriverController;
use App\Http\Controllers\API\HeadOfOfficeController;
use App\Http\Controllers\API\GsoController;
use App\Http\Controllers\API\MayorsOfficeController;
use App\Http\Controllers\API\ReportsController;
use App\Http\Controllers\API\GpsPingController;
use App\Http\Controllers\API\LocationController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;

/*
|--------------------------------------------------------------------------
| API Routes - FCMS Authentication System
|--------------------------------------------------------------------------
*/

// ============ DEBUG ROUTE (Remove in production) ============
Route::get('/debug-ors', function () {
    $apiKey = config('services.ors.key');

    $keyCheck = [
        'api_key_exists' => !empty($apiKey),
        'api_key_preview' => $apiKey ? substr($apiKey, 0, 20) . '...' : null
    ];

    $geocodeResponse = Http::withHeaders([
        'Authorization' => $apiKey,
        'Accept' => 'application/json',
    ])->get("https://api.openrouteservice.org/geocode/search", [
        'text' => 'Cagayan de Oro',
        'boundary.country' => 'PH',
        'size' => 1
    ]);

    $origin = [124.442436, 8.573566];
    $destination = [124.6500, 8.4833];

    $directionsResponse = Http::withHeaders([
        'Authorization' => $apiKey,
        'Content-Type' => 'application/json',
        'Accept' => 'application/json',
    ])->post("https://api.openrouteservice.org/v2/directions/driving-car", [
        'coordinates' => [$origin, $destination],
        'units' => 'km'
    ]);

    return response()->json([
        'api_key_check' => $keyCheck,
        'geocode' => [
            'status' => $geocodeResponse->status(),
            'successful' => $geocodeResponse->successful(),
            'response' => $geocodeResponse->successful() ? $geocodeResponse->json() : $geocodeResponse->body()
        ],
        'directions' => [
            'status' => $directionsResponse->status(),
            'successful' => $directionsResponse->successful(),
            'response' => $directionsResponse->successful() ? $directionsResponse->json() : $directionsResponse->body()
        ]
    ]);
});

// ============ PUBLIC ROUTES (No Authentication) ============
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

// ============ LOCATION ROUTES (Public - No Auth Required) ============
// Location routes - keep these
Route::prefix('location')->group(function () {
    Route::get('/search', [LocationController::class, 'search']);
    Route::get('/distance', [LocationController::class, 'calculateDistance']);
    Route::get('/geocode', [LocationController::class, 'geocode']);
    Route::get('/barangays', [LocationController::class, 'getBarangays']);
    Route::get('/municipalities', [LocationController::class, 'getMunicipalities']);
});

// ============ PUBLIC FUEL PRICES ============
Route::get('/public/fuel-prices', function () {
    return response()->json([
        'diesel' => \App\Models\SystemSetting::where('setting_key', 'diesel_price_per_liter')->first()?->setting_value ?? 50.00,
        'premium' => \App\Models\SystemSetting::where('setting_key', 'premium_price_per_liter')->first()?->setting_value ?? 65.00,
        'regular' => \App\Models\SystemSetting::where('setting_key', 'regular_price_per_liter')->first()?->setting_value ?? 55.00,
    ]);
});

// ============ PROTECTED ROUTES (Authentication Required) ============
Route::middleware('auth:sanctum')->group(function () {

    // User Management
    Route::prefix('auth')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('logout-all', [AuthController::class, 'logoutAllDevices']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
        Route::post('refresh-token', [AuthController::class, 'refreshToken']);
        Route::post('update-profile', [AuthController::class, 'updateProfile']);
    });

    // ============ REPORTS ROUTES (All Authenticated Users) ============
    Route::prefix('reports')->group(function () {
        Route::get('trips', [ReportsController::class, 'getTripReport']);
        Route::get('trips/export/{format}', [ReportsController::class, 'exportTripReport']);
        Route::get('fuel', [ReportsController::class, 'getFuelReport']);
        Route::get('fuel/export/{format}', [ReportsController::class, 'exportFuelReport']);
        Route::get('budget', [ReportsController::class, 'getBudgetReport']);
        Route::get('budget/export/{format}', [ReportsController::class, 'exportBudgetReport']);
        Route::get('vehicles', [ReportsController::class, 'getVehicleReport']);
        Route::get('summary', [ReportsController::class, 'getReportSummary']);
    });

    // ============ ADMIN ROUTES (Superadmin only) ============
    Route::middleware(['auth:sanctum', 'role:' . App\Models\User::ROLE_SUPERADMIN])->prefix('admin')->group(function () {

        // User Management
        Route::apiResource('users', UserController::class);
        Route::patch('users/{id}/status', [UserController::class, 'updateStatus']);
        Route::post('users/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::patch('users/{id}/department', [UserController::class, 'updateDepartment']);

        // Signature
        Route::post('users/{id}/signature', [UserController::class, 'uploadSignature']);
        Route::get('users/{id}/signature', [UserController::class, 'getSignature']);
        Route::delete('users/{id}/signature', [UserController::class, 'deleteSignature']);

        // Department Management
        Route::apiResource('departments', DepartmentController::class);

        // Vehicle Management
        Route::apiResource('vehicles', VehicleController::class);
        Route::patch('vehicles/{id}/status', [VehicleController::class, 'updateStatus']);
        Route::patch('vehicles/{id}/maintenance', [VehicleController::class, 'updateMaintenance']);

        // System Settings
        Route::get('settings', [SettingsController::class, 'index']);
        Route::get('settings/{key}', [SettingsController::class, 'show']);
        Route::put('settings/{key}', [SettingsController::class, 'update']);
        Route::post('settings/bulk', [SettingsController::class, 'bulkUpdate']);

        // Budget Policies
        Route::get('budget-policies', [BudgetPolicyController::class, 'index']);
        Route::get('budget-policies/{departmentId}', [BudgetPolicyController::class, 'show']);
        Route::post('budget-policies', [BudgetPolicyController::class, 'store']);
        Route::put('budget-policies/{departmentId}', [BudgetPolicyController::class, 'update']);
        Route::delete('budget-policies/{departmentId}', [BudgetPolicyController::class, 'destroy']);
        Route::get('budget-status', [BudgetPolicyController::class, 'getBudgetStatus']);
        Route::get('budget-event-logs', [BudgetPolicyController::class, 'getEventLogs']);
        Route::post('budget-policies/force-activate', [BudgetPolicyController::class, 'forceActivate']);
        Route::post('budget-policies/run-weekly-reset', [BudgetPolicyController::class, 'runWeeklyReset']);

        // Head of Office & OIC Assignment
        Route::post('departments/{id}/assign-head', [DepartmentController::class, 'assignHeadOfOffice']);
        Route::delete('departments/{id}/remove-head', [DepartmentController::class, 'removeHeadOfOffice']);
        Route::post('departments/{id}/assign-oic', [DepartmentController::class, 'assignOIC']);
        Route::delete('departments/{id}/remove-oic', [DepartmentController::class, 'removeOIC']);
        Route::get('departments/{id}/leadership', [DepartmentController::class, 'getLeadershipInfo']);

        // Budget Summary
        Route::get('budget-summary', [BudgetController::class, 'getBudgetSummary']);
    });

    // ============ DEPARTMENT OFFICE ROUTES ============
    Route::middleware(['auth:sanctum', 'role:' . App\Models\User::ROLE_DEPT_OFFICE])->group(function () {

        // Available Resources
        Route::get('vehicles/available', [VehicleController::class, 'getAvailableVehicles']);
        Route::get('drivers/active', [UserController::class, 'getActiveDrivers']);

        // Reports
        Route::get('trips', [ReportsController::class, 'getTripReport']);
        Route::get('fuel', [ReportsController::class, 'getFuelReport']);
        Route::get('summary', [ReportsController::class, 'getReportSummary']);

        // Department Budget
        Route::get('departments/budget/current', [BudgetController::class, 'getCurrentDepartmentBudget']);

        // Trip Ticket Management
        Route::prefix('trip-tickets')->group(function () {
            Route::get('my-requests', [TripTicketController::class, 'myRequests']);
            Route::post('draft', [TripTicketController::class, 'saveDraft']);
            Route::put('{id}/draft', [TripTicketController::class, 'updateDraft']);
            Route::post('submit', [TripTicketController::class, 'submit']);
            Route::post('{id}/resubmit', [TripTicketController::class, 'resubmit']);
            Route::get('{id}', [TripTicketController::class, 'show']);
            Route::post('check-budget', [TripTicketController::class, 'checkBudgetBeforeSubmit']);
        });
    });

    // ============ HEAD OF OFFICE ROUTES ============
    Route::middleware(['auth:sanctum', 'role:' . App\Models\User::ROLE_HEAD_OF_OFFICE])->prefix('head')->group(function () {

        Route::get('dashboard', [HeadOfOfficeController::class, 'getDashboard']);
        Route::get('tickets/pending', [HeadOfOfficeController::class, 'getPendingTickets']);
        Route::post('tickets/{id}/approve', [HeadOfOfficeController::class, 'approveTicket']);
        Route::post('tickets/{id}/reject', [HeadOfOfficeController::class, 'rejectTicket']);
        Route::post('status/toggle', [HeadOfOfficeController::class, 'toggleHeadStatus']);
        Route::get('oic/status', [HeadOfOfficeController::class, 'getOicStatus']);
        Route::get('monitoring/active-trips', [HeadOfOfficeController::class, 'getActiveTrips']);
        Route::get('monitoring/fuel-consumption', [HeadOfOfficeController::class, 'getFuelConsumption']);
          Route::get('vehicles', [VehicleController::class, 'getAvailableVehicles']);
    Route::get('drivers', [UserController::class, 'getActiveDrivers']);
 Route::get('vehicles', [HeadOfOfficeController::class, 'getAvailableVehicles']);
    Route::get('drivers', [HeadOfOfficeController::class, 'getActiveDrivers']);
        Route::post('trip-tickets/submit', [TripTicketController::class, 'submit']);

    });

    // ============ GSO ROUTES ============
    Route::middleware(['auth:sanctum', 'role:' . App\Models\User::ROLE_GSO_STAFF])->prefix('gso')->group(function () {

        Route::get('dashboard', [GsoController::class, 'getDashboard']);
        Route::get('pending', [GsoController::class, 'getPendingTickets']);
        Route::get('verified', [GsoController::class, 'getVerifiedTickets']);
        Route::get('forwarded', [GsoController::class, 'getForwardedTickets']);
        Route::get('returned', [GsoController::class, 'getReturnedTickets']);
        Route::get('forward', [GsoController::class, 'getForwardQueue']);
        Route::get('tickets/{id}', [GsoController::class, 'show']);
        Route::post('tickets/{id}/approve', [GsoController::class, 'approveTicket']);
        Route::post('tickets/{id}/reject', [GsoController::class, 'rejectTicket']);
        Route::post('tickets/forward-to-mo', [GsoController::class, 'forwardToMO']);
        Route::get('users/{id}/signature', [UserController::class, 'getSignatureForGso']);
        Route::get('reports', [GsoController::class, 'getReports']);
    });

    // ============ MAYOR'S OFFICE ROUTES ============
    Route::middleware(['auth:sanctum', 'role:' . App\Models\User::ROLE_MAYORS_OFFICE])->prefix('mayors-office')->group(function () {

        Route::get('dashboard', [MayorsOfficeController::class, 'getDashboard']);
        Route::get('pending', [MayorsOfficeController::class, 'getPendingTickets']);
        Route::get('approved', [MayorsOfficeController::class, 'getApprovedTickets']);
        Route::get('tickets/{id}', [MayorsOfficeController::class, 'show']);
        Route::post('tickets/{id}/approve', [MayorsOfficeController::class, 'approveTicket']);
        Route::post('tickets/{id}/reject', [MayorsOfficeController::class, 'rejectTicket']);
        Route::get('budget-overview', [MayorsOfficeController::class, 'getBudgetOverview']);

        // Budget Assistance Routes
        Route::get('budget-assistance/requests', [MayorsOfficeController::class, 'getBudgetAssistanceRequests']);
        Route::get('budget-assistance/request/{requestId}', [MayorsOfficeController::class, 'getBudgetAssistanceRequest']);
        Route::post('budget-assistance/create-ticket', [MayorsOfficeController::class, 'createMoFundedTicket']);
        Route::delete('budget-assistance/request/{requestId}', [MayorsOfficeController::class, 'removeMORequest']);
    });

    // ============ DRIVER ROUTES ============
    Route::middleware(['auth:sanctum', 'role:' . App\Models\User::ROLE_DRIVER])->prefix('driver')->group(function () {

        Route::get('trips', [DriverController::class, 'getTrips']);
        Route::get('trips/active', [DriverController::class, 'getActiveTrip']);
        Route::post('trips/{id}/acknowledge', [DriverController::class, 'acknowledgeFunds']);
        Route::post('trips/{id}/start', [DriverController::class, 'startTrip']);
        Route::post('trips/{id}/complete', [DriverController::class, 'completeTrip']);
        Route::get('trips/{id}/gas-slip', [DriverController::class, 'getGasSlip']);
        Route::post('trips/{id}/receipt', [DriverController::class, 'uploadReceipt']);
        Route::post('trips/{id}/odometer', [DriverController::class, 'updateOdometer']);
    });

    // GPS Pings
    Route::post('gps-pings', [GpsPingController::class, 'store']);

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    });
});
