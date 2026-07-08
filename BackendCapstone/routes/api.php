<?php

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\TripTicketController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\BudgetController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\DepartmentController;
use App\Http\Controllers\API\VehicleController;
use App\Http\Controllers\API\SettingsController;
use App\Http\Controllers\API\BudgetPolicyController;
use App\Http\Controllers\API\DriverController;
use App\Http\Controllers\API\GsoController;
use App\Http\Controllers\API\MayorsOfficeController;
use App\Http\Controllers\API\ReportsController;
use App\Http\Controllers\API\GpsPingController;
use App\Http\Controllers\API\LocationController;
// ✅ ADD THIS IMPORT
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ============ PUBLIC ROUTES ============
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

Route::prefix('location')->group(function () {
    Route::get('/search', [LocationController::class, 'search']);
    Route::get('/distance', [LocationController::class, 'calculateDistance']);
    Route::get('/geocode', [LocationController::class, 'geocode']);
    Route::get('/barangays', [LocationController::class, 'getBarangays']);
    Route::get('/municipalities', [LocationController::class, 'getMunicipalities']);
});

Route::get('/public/fuel-prices', function () {
    return response()->json([
        'diesel' => \App\Models\SystemSetting::where('setting_key', 'diesel_price_per_liter')->first()?->setting_value ?? 50.00,
        'premium' => \App\Models\SystemSetting::where('setting_key', 'premium_price_per_liter')->first()?->setting_value ?? 65.00,
        'regular' => \App\Models\SystemSetting::where('setting_key', 'regular_price_per_liter')->first()?->setting_value ?? 55.00,
    ]);
});

// ============ ✅ ADD BROADCASTING AUTH ROUTE ============
// This is required for private channel authentication
Route::post('/broadcasting/auth', function (Request $request) {
    // Laravel's built-in broadcasting authentication
    return Broadcast::auth($request);
})->middleware('auth:sanctum');

// ============ PROTECTED ROUTES ============
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
        Route::post('update-profile', [AuthController::class, 'updateProfile']);
    });

    // ============ REPORTS (All Authenticated) ============
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

    // ============ GSO ADMIN (Superadmin) ============
    Route::middleware(['role:gso_office'])->prefix('admin')->group(function () {
        // Users
        Route::apiResource('users', UserController::class);
        Route::patch('users/{id}/status', [UserController::class, 'updateStatus']);
        Route::post('users/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::patch('users/{id}/department', [UserController::class, 'updateDepartment']);
        Route::post('users/{id}/signature', [UserController::class, 'uploadSignature']);
        Route::get('users/{id}/signature', [UserController::class, 'getSignature']);
        Route::delete('users/{id}/signature', [UserController::class, 'deleteSignature']);

        // Vehicles
        Route::apiResource('vehicles', VehicleController::class);
        Route::patch('vehicles/{id}/status', [VehicleController::class, 'updateStatus']);
        Route::patch('vehicles/{id}/maintenance', [VehicleController::class, 'updateMaintenance']);
        Route::patch('vehicles/{id}/odometer-status', [VehicleController::class, 'updateOdometerStatus']);

        // Drivers
        Route::apiResource('drivers', DriverController::class);
        Route::get('drivers/active', [DriverController::class, 'getActiveDrivers']);
        Route::patch('drivers/{id}/status', [DriverController::class, 'updateStatus']);

        // Settings
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
        Route::get('budget-summary', [BudgetController::class, 'getBudgetSummary']);

        // Fuel Receipt Routes
        Route::get('fuel-receipts', [GsoController::class, 'getFuelReceipts']);
        Route::get('fuel-receipts/{id}', [GsoController::class, 'getFuelReceipt']);
        Route::post('fuel-receipts/record', [GsoController::class, 'recordReceipt']);

        // Completed Trips
        Route::get('completed-trips', [GsoController::class, 'getCompletedTrips']);
    });

    // ============ GSO (Trip Management) ============
    Route::middleware(['role:gso_office'])->prefix('gso')->group(function () {
        Route::get('dashboard', [GsoController::class, 'getDashboard']);
        Route::get('pending', [GsoController::class, 'getPendingTickets']);
        Route::get('returned', [GsoController::class, 'getReturnedTickets']);
        Route::get('all-trips', [GsoController::class, 'getAllTrips']);
        Route::get('pending-reconciliation', [GsoController::class, 'getPendingReconciliation']);
        Route::get('tickets/{id}', [GsoController::class, 'show']);
        Route::get('reports', [GsoController::class, 'getReports']);
        Route::get('users/{id}/signature', [UserController::class, 'getSignatureForGso']);

        Route::post('create-trip', [TripTicketController::class, 'gsoCreate']);
        Route::post('tickets/{id}/reconcile', [GsoController::class, 'reconcileTrip']);
    });

    // ============ MAYOR'S OFFICE ============
    Route::middleware(['role:mayors_office'])->prefix('mayors-office')->group(function () {
        // Dashboard
        Route::get('dashboard', [MayorsOfficeController::class, 'getDashboard']);
        
        // Tickets
        Route::get('pending', [MayorsOfficeController::class, 'getPendingTickets']);
        Route::get('approved', [MayorsOfficeController::class, 'getApprovedTickets']);
        Route::get('tickets/{id}', [MayorsOfficeController::class, 'show']);
        Route::post('tickets/{id}/approve', [MayorsOfficeController::class, 'approveTicket']);
        Route::post('tickets/{id}/reject', [MayorsOfficeController::class, 'rejectTicket']);
        
        // Budget
        Route::get('budget-overview', [MayorsOfficeController::class, 'getBudgetOverview']);
        Route::get('departments/{id}/budget', [MayorsOfficeController::class, 'getDepartmentBudget']);
        Route::get('departments/all-with-budget', [MayorsOfficeController::class, 'getAllDepartmentsWithBudget']);
        Route::get('departments/selector', [MayorsOfficeController::class, 'getAllDepartmentsForSelector']);

        // Budget Assistance
        Route::get('budget-assistance/requests', [MayorsOfficeController::class, 'getBudgetAssistanceRequests']);
        Route::get('budget-assistance/request/{requestId}', [MayorsOfficeController::class, 'getBudgetAssistanceRequest']);
        Route::post('budget-assistance/create-ticket', [MayorsOfficeController::class, 'createMoFundedTicket']);
        Route::delete('budget-assistance/request/{requestId}', [MayorsOfficeController::class, 'removeMORequest']);
        Route::get('departments/all', [DepartmentController::class, 'getAllDepartmentsForMO']);

        // Budget Policies - Full CRUD for Mayor's Office
        Route::get('budget-policies', [BudgetPolicyController::class, 'index']);
        Route::get('budget-policies/{departmentId}', [BudgetPolicyController::class, 'show']);
        Route::post('budget-policies', [BudgetPolicyController::class, 'store']);
        Route::put('budget-policies/{departmentId}', [BudgetPolicyController::class, 'update']);
        Route::delete('budget-policies/{departmentId}', [BudgetPolicyController::class, 'destroy']);

        // Budget Periods
        Route::get('budget-periods', [BudgetPolicyController::class, 'getPeriods']);
        Route::post('budget-periods/force-activate', [BudgetPolicyController::class, 'forceActivate']);

        // ✅ FIXED: Department Routes (Using apiResource for standard CRUD)
        Route::apiResource('departments', DepartmentController::class);
        
        // ✅ FIXED: Custom route for toggling status (must be BEFORE apiResource or use explicit)
        Route::patch('departments/{id}/toggle-status', [DepartmentController::class, 'toggleStatus']);

        Route::get('/receipts/for-verification', [MayorsOfficeController::class, 'getReceiptsForVerification']);
        Route::post('/receipts/{id}/verify', [MayorsOfficeController::class, 'verifyReceipt']);
    });

    // ============ DRIVER MOBILE APP ROUTES ============
    Route::middleware(['role:driver'])->prefix('driver')->group(function () {
        
        // === DASHBOARD & PROFILE ===
        Route::get('dashboard', [DriverController::class, 'mobileDashboard']);
        Route::get('profile', [DriverController::class, 'getProfile']);
        Route::post('profile/update', [DriverController::class, 'updateProfile']);
        Route::get('stats', [DriverController::class, 'getStats']);
        
        // === TRIP MANAGEMENT ===
        Route::get('trips', [DriverController::class, 'getTrips']);
        Route::get('trips/active', [DriverController::class, 'getActiveTrip']);
        Route::get('trips/history', [DriverController::class, 'getTripHistory']);
        Route::get('trips/{id}/details', [DriverController::class, 'getTripDetails']);
        
        // === TRIP ACTIONS ===
        Route::post('trips/{id}/acknowledge', [DriverController::class, 'acknowledgeFunds']);
        Route::post('trips/{id}/start', [DriverController::class, 'startTrip']);
        Route::post('trips/{id}/complete', [DriverController::class, 'completeTrip']);
        Route::get('trips/{id}/gas-slip', [DriverController::class, 'getGasSlip']);
        
        // === FUEL RECEIPT ===
        Route::post('trips/{id}/receipt', [DriverController::class, 'uploadReceipt']);
        Route::get('trips/{id}/receipt', [DriverController::class, 'getReceiptStatus']);
        Route::post('trips/{id}/receipt/acknowledge', [DriverController::class, 'acknowledgeReceipt']);
        
        // === GPS TRACKING ===
        Route::post('gps/start', [GpsPingController::class, 'startTracking']);
        Route::post('gps/stop', [GpsPingController::class, 'stopTracking']);
        Route::post('gps/ping', [GpsPingController::class, 'store']);
        Route::post('gps/batch', [GpsPingController::class, 'storeBatch']);
        
        // === NOTIFICATIONS ===
        Route::get('notifications', [NotificationController::class, 'driverNotifications']);
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        
        // === OFFLINE SYNC ===
        Route::post('sync/offline', [OfflineSyncController::class, 'sync']);
        Route::post('sync/queue', [OfflineSyncController::class, 'queueData']);
        Route::get('sync/pending', [OfflineSyncController::class, 'getPendingCount']);
        
        // === BUDGET & VEHICLES ===
        Route::get('vehicles/available', [VehicleController::class, 'getAvailableVehicles']);
        Route::get('departments/budget/current', [BudgetController::class, 'getCurrentDepartmentBudget']);
        Route::get('fuel-prices', [DriverController::class, 'getFuelPrices']);
        
        // === REPORTS ===
        Route::get('reports/trips', [ReportsController::class, 'getTripReport']);
        Route::get('reports/fuel', [ReportsController::class, 'getFuelReport']);
        Route::get('reports/summary', [ReportsController::class, 'getReportSummary']);
    });

    // ============ GPS & NOTIFICATIONS ============
    Route::post('gps-pings', [GpsPingController::class, 'store']);

    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::post('/send', [NotificationController::class, 'store']);
        Route::post('/test', [NotificationController::class, 'testBroadcast']);
    });
});