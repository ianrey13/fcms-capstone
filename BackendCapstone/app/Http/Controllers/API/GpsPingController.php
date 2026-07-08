<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\GpsPing;
use App\Models\TripTicket;
use App\Models\FuelLog;
use App\Models\Driver;
use App\Helpers\NotificationHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class GpsPingController extends Controller
{
    /**
     * Store a single GPS ping
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'trip_ticket_id' => 'required|exists:trip_ticket,trip_ticket_id',
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'accuracy_meters' => 'nullable|numeric|min:0',
                'speed_kmh' => 'nullable|numeric|min:0',
                'heading_degrees' => 'nullable|numeric|between:0,360',
                'recorded_at' => 'nullable|date',
                'is_low_accuracy' => 'nullable|boolean',
                'has_mock_location_flag' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify driver has access to this trip
            $user = $request->user();
            $driver = Driver::where('user_id', $user->user_id)->first();
            
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Driver record not found'
                ], 404);
            }

            $trip = TripTicket::where('trip_ticket_id', $request->trip_ticket_id)
                ->where('driver_id', $driver->driver_id)
                ->first();

            if (!$trip) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trip ticket not found or not assigned to you'
                ], 404);
            }

            // Check if trip is in transit
            if ($trip->status !== 'in_transit') {
                return response()->json([
                    'success' => false,
                    'message' => 'GPS pings can only be recorded for trips in transit. Current status: ' . $trip->status
                ], 422);
            }

            $ping = GpsPing::create([
                'trip_ticket_id' => $request->trip_ticket_id,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'accuracy_meters' => $request->accuracy_meters ?? null,
                'speed_kmh' => $request->speed_kmh ?? null,
                'heading_degrees' => $request->heading_degrees ?? null,
                'is_low_accuracy' => $request->is_low_accuracy ?? false,
                'is_queued_upload' => $request->is_queued_upload ?? false,
                'has_mock_location_flag' => $request->has_mock_location_flag ?? false,
                'recorded_at' => $request->recorded_at ?? now(),
                'received_at' => now(),
            ]);

            Log::info('GPS ping stored', [
                'ping_id' => $ping->ping_id,
                'trip_id' => $request->trip_ticket_id,
                'lat' => $request->latitude,
                'lng' => $request->longitude
            ]);

            return response()->json([
                'success' => true,
                'message' => 'GPS ping stored successfully',
                'data' => [
                    'ping_id' => $ping->ping_id,
                    'latitude' => $ping->latitude,
                    'longitude' => $ping->longitude,
                    'recorded_at' => $ping->recorded_at,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('GPS Ping store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to save GPS ping: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store batch GPS pings (for offline sync)
     */
    public function storeBatch(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'trip_ticket_id' => 'required|exists:trip_ticket,trip_ticket_id',
                'pings' => 'required|array|min:1',
                'pings.*.latitude' => 'required|numeric|between:-90,90',
                'pings.*.longitude' => 'required|numeric|between:-180,180',
                'pings.*.accuracy_meters' => 'nullable|numeric|min:0',
                'pings.*.speed_kmh' => 'nullable|numeric|min:0',
                'pings.*.heading_degrees' => 'nullable|numeric|between:0,360',
                'pings.*.recorded_at' => 'required|date',
                'pings.*.is_low_accuracy' => 'nullable|boolean',
                'pings.*.has_mock_location_flag' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $driver = Driver::where('user_id', $user->user_id)->first();
            
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Driver record not found'
                ], 404);
            }

            $trip = TripTicket::where('trip_ticket_id', $request->trip_ticket_id)
                ->where('driver_id', $driver->driver_id)
                ->first();

            if (!$trip) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trip ticket not found or not assigned to you'
                ], 404);
            }

            // Check if trip is in transit
            if ($trip->status !== 'in_transit') {
                return response()->json([
                    'success' => false,
                    'message' => 'GPS pings can only be recorded for trips in transit. Current status: ' . $trip->status
                ], 422);
            }

            $createdPings = [];
            
            DB::beginTransaction();
            
            foreach ($request->pings as $pingData) {
                $ping = GpsPing::create([
                    'trip_ticket_id' => $request->trip_ticket_id,
                    'latitude' => $pingData['latitude'],
                    'longitude' => $pingData['longitude'],
                    'accuracy_meters' => $pingData['accuracy_meters'] ?? null,
                    'speed_kmh' => $pingData['speed_kmh'] ?? null,
                    'heading_degrees' => $pingData['heading_degrees'] ?? null,
                    'is_low_accuracy' => $pingData['is_low_accuracy'] ?? false,
                    'is_queued_upload' => true,
                    'has_mock_location_flag' => $pingData['has_mock_location_flag'] ?? false,
                    'recorded_at' => $pingData['recorded_at'],
                    'received_at' => now(),
                ]);
                $createdPings[] = $ping->ping_id;
            }
            
            DB::commit();

            Log::info('Batch GPS pings stored', [
                'count' => count($createdPings),
                'trip_id' => $request->trip_ticket_id
            ]);

            return response()->json([
                'success' => true,
                'message' => count($createdPings) . ' GPS pings stored successfully',
                'data' => [
                    'stored_count' => count($createdPings),
                    'ping_ids' => $createdPings,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('GPS Ping batch store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to save GPS pings: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Start GPS tracking for a trip
     */
    public function startTracking(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'trip_ticket_id' => 'required|exists:trip_ticket,trip_ticket_id',
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'accuracy_meters' => 'nullable|numeric|min:0',
                'odometer_start' => 'nullable|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $driver = Driver::where('user_id', $user->user_id)->first();
            
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Driver record not found'
                ], 404);
            }

            $trip = TripTicket::with(['vehicle', 'gasSlip.fuelLog'])
                ->where('trip_ticket_id', $request->trip_ticket_id)
                ->where('driver_id', $driver->driver_id)
                ->first();

            if (!$trip) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trip ticket not found or not assigned to you'
                ], 404);
            }

            // Check if trip can be started
            if ($trip->status === 'in_transit') {
                return response()->json([
                    'success' => true,
                    'message' => 'Trip already in progress',
                    'data' => [
                        'trip_ticket_id' => $trip->trip_ticket_id,
                        'status' => $trip->status
                    ]
                ]);
            }

            if ($trip->status !== 'acknowledged') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot start trip. Current status: ' . $trip->status . '. Required: acknowledged'
                ], 422);
            }

            DB::beginTransaction();

            // Update trip status
            $trip->status = 'in_transit';
            $trip->save();

            // Update fuel log with start GPS data
            if ($trip->gasSlip) {
                $fuelLog = FuelLog::firstOrNew(['gas_slip_id' => $trip->gasSlip->gas_slip_id]);
                $fuelLog->trip_started_at = now();
                $fuelLog->trip_start_gps_lat = $request->latitude;
                $fuelLog->trip_start_gps_lng = $request->longitude;
                $fuelLog->trip_start_gps_accuracy = $request->accuracy_meters ?? null;
                if ($request->has('odometer_start')) {
                    $fuelLog->odometer_start = $request->odometer_start;
                }
                $fuelLog->save();

                // Store initial GPS ping
                GpsPing::create([
                    'trip_ticket_id' => $trip->trip_ticket_id,
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                    'accuracy_meters' => $request->accuracy_meters ?? null,
                    'is_queued_upload' => false,
                    'recorded_at' => now(),
                    'received_at' => now(),
                ]);
            }

            DB::commit();

            Log::info('GPS tracking started', [
                'trip_id' => $trip->trip_ticket_id,
                'driver_id' => $driver->driver_id
            ]);

            // Send notification
            NotificationHelper::send(
                $trip->submitted_by,
                'trip_started',
                'trip_ticket',
                $trip->trip_ticket_id,
                "Trip {$trip->trip_ticket_number} has been started by driver " . $user->full_name
            );

            return response()->json([
                'success' => true,
                'message' => 'GPS tracking started successfully',
                'data' => [
                    'trip_ticket_id' => $trip->trip_ticket_id,
                    'status' => $trip->status,
                    'trip_started_at' => now(),
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Start GPS tracking error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to start GPS tracking: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Stop GPS tracking for a trip
     */
    public function stopTracking(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'trip_ticket_id' => 'required|exists:trip_ticket,trip_ticket_id',
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'accuracy_meters' => 'nullable|numeric|min:0',
                'odometer_end' => 'nullable|numeric|min:0',
                'gps_distance_km' => 'nullable|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $driver = Driver::where('user_id', $user->user_id)->first();
            
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Driver record not found'
                ], 404);
            }

            $trip = TripTicket::with(['vehicle', 'gasSlip.fuelLog'])
                ->where('trip_ticket_id', $request->trip_ticket_id)
                ->where('driver_id', $driver->driver_id)
                ->first();

            if (!$trip) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trip ticket not found or not assigned to you'
                ], 404);
            }

            // Check if trip can be completed
            if ($trip->status === 'pending_reconciliation') {
                return response()->json([
                    'success' => true,
                    'message' => 'Trip already completed',
                    'data' => [
                        'trip_ticket_id' => $trip->trip_ticket_id,
                        'status' => $trip->status
                    ]
                ]);
            }

            if ($trip->status !== 'in_transit') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot complete trip. Current status: ' . $trip->status . '. Required: in_transit'
                ], 422);
            }

            DB::beginTransaction();

            // Update trip status
            $trip->status = 'pending_reconciliation';
            $trip->save();

            // Update fuel log with end GPS data
            if ($trip->gasSlip && $trip->gasSlip->fuelLog) {
                $fuelLog = $trip->gasSlip->fuelLog;
                $fuelLog->trip_ended_at = now();
                if ($request->has('odometer_end')) {
                    $fuelLog->odometer_end = $request->odometer_end;
                }
                if ($request->has('gps_distance_km')) {
                    $fuelLog->gps_distance_km = $request->gps_distance_km;
                }
                $fuelLog->trip_elapsed_minutes = $fuelLog->trip_started_at ? 
                    $fuelLog->trip_started_at->diffInMinutes(now()) : null;
                $fuelLog->save();

                // Store final GPS ping
                GpsPing::create([
                    'trip_ticket_id' => $trip->trip_ticket_id,
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                    'accuracy_meters' => $request->accuracy_meters ?? null,
                    'is_queued_upload' => false,
                    'recorded_at' => now(),
                    'received_at' => now(),
                ]);
            }

            DB::commit();

            Log::info('GPS tracking stopped', [
                'trip_id' => $trip->trip_ticket_id,
                'driver_id' => $driver->driver_id
            ]);

            // Send notification
            NotificationHelper::send(
                $trip->submitted_by,
                'trip_completed',
                'trip_ticket',
                $trip->trip_ticket_id,
                "Trip {$trip->trip_ticket_number} has been completed by driver " . $user->full_name
            );

            return response()->json([
                'success' => true,
                'message' => 'GPS tracking stopped successfully',
                'data' => [
                    'trip_ticket_id' => $trip->trip_ticket_id,
                    'status' => $trip->status,
                    'trip_ended_at' => now(),
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Stop GPS tracking error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to stop GPS tracking: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get GPS pings for a trip
     */
    public function getPings(Request $request, $tripId)
    {
        try {
            $user = $request->user();
            $driver = Driver::where('user_id', $user->user_id)->first();
            
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Driver record not found'
                ], 404);
            }

            $trip = TripTicket::where('trip_ticket_id', $tripId)
                ->where('driver_id', $driver->driver_id)
                ->first();

            if (!$trip) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trip ticket not found or not assigned to you'
                ], 404);
            }

            $limit = $request->get('limit', 100);
            $since = $request->get('since');

            $query = GpsPing::where('trip_ticket_id', $tripId)
                ->orderBy('recorded_at', 'desc');

            if ($since) {
                $query->where('recorded_at', '>=', $since);
            }

            $pings = $query->limit($limit)->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'trip_ticket_id' => $tripId,
                    'total_pings' => $pings->count(),
                    'pings' => $pings->map(function($ping) {
                        return [
                            'ping_id' => $ping->ping_id,
                            'latitude' => $ping->latitude,
                            'longitude' => $ping->longitude,
                            'accuracy_meters' => $ping->accuracy_meters,
                            'speed_kmh' => $ping->speed_kmh,
                            'heading_degrees' => $ping->heading_degrees,
                            'is_low_accuracy' => $ping->is_low_accuracy,
                            'recorded_at' => $ping->recorded_at,
                        ];
                    }),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get GPS pings error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch GPS pings: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get latest GPS ping for a trip
     */
    public function getLatestPing(Request $request, $tripId)
    {
        try {
            $user = $request->user();
            $driver = Driver::where('user_id', $user->user_id)->first();
            
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Driver record not found'
                ], 404);
            }

            $trip = TripTicket::where('trip_ticket_id', $tripId)
                ->where('driver_id', $driver->driver_id)
                ->first();

            if (!$trip) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trip ticket not found or not assigned to you'
                ], 404);
            }

            $ping = GpsPing::where('trip_ticket_id', $tripId)
                ->orderBy('recorded_at', 'desc')
                ->first();

            if (!$ping) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => 'No GPS pings found for this trip'
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'ping_id' => $ping->ping_id,
                    'latitude' => $ping->latitude,
                    'longitude' => $ping->longitude,
                    'accuracy_meters' => $ping->accuracy_meters,
                    'speed_kmh' => $ping->speed_kmh,
                    'heading_degrees' => $ping->heading_degrees,
                    'is_low_accuracy' => $ping->is_low_accuracy,
                    'recorded_at' => $ping->recorded_at,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get latest GPS ping error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch latest GPS ping: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get GPS track for a trip (full route)
     */
    public function getTrack(Request $request, $tripId)
    {
        try {
            $user = $request->user();
            $driver = Driver::where('user_id', $user->user_id)->first();
            
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Driver record not found'
                ], 404);
            }

            $trip = TripTicket::where('trip_ticket_id', $tripId)
                ->where('driver_id', $driver->driver_id)
                ->first();

            if (!$trip) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trip ticket not found or not assigned to you'
                ], 404);
            }

            $pings = GpsPing::where('trip_ticket_id', $tripId)
                ->where('is_low_accuracy', false) // Filter out low accuracy pings
                ->orderBy('recorded_at', 'asc')
                ->get();

            // Calculate track statistics
            $trackData = [];
            $totalDistance = 0;
            $maxSpeed = 0;
            $avgSpeed = 0;
            $totalTime = 0;
            $prevPing = null;

            foreach ($pings as $ping) {
                $trackData[] = [
                    'latitude' => $ping->latitude,
                    'longitude' => $ping->longitude,
                    'speed_kmh' => $ping->speed_kmh,
                    'heading_degrees' => $ping->heading_degrees,
                    'recorded_at' => $ping->recorded_at,
                ];

                if ($ping->speed_kmh && $ping->speed_kmh > $maxSpeed) {
                    $maxSpeed = $ping->speed_kmh;
                }

                if ($prevPing) {
                    // Calculate distance between points (Haversine formula)
                    $distance = $this->haversineDistance(
                        $prevPing->latitude, $prevPing->longitude,
                        $ping->latitude, $ping->longitude
                    );
                    $totalDistance += $distance;
                    
                    // Calculate time difference
                    $timeDiff = $prevPing->recorded_at->diffInSeconds($ping->recorded_at);
                    $totalTime += $timeDiff;
                }

                $prevPing = $ping;
            }

            if ($totalTime > 0 && $trackData) {
                $avgSpeed = ($totalDistance / $totalTime) * 3.6; // Convert to km/h
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'trip_ticket_id' => $tripId,
                    'total_pings' => $pings->count(),
                    'total_distance_km' => round($totalDistance, 2),
                    'max_speed_kmh' => round($maxSpeed, 2),
                    'avg_speed_kmh' => round($avgSpeed, 2),
                    'duration_minutes' => round($totalTime / 60, 2),
                    'start_time' => $pings->first()?->recorded_at,
                    'end_time' => $pings->last()?->recorded_at,
                    'track' => $trackData,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get GPS track error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch GPS track: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    private function haversineDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Delete GPS pings for a trip (admin only)
     */
    public function deletePings(Request $request, $tripId)
    {
        try {
            // Only GSO can delete GPS data
            if (!auth()->user() || auth()->user()->role !== 'gso_office') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only GSO can delete GPS data.'
                ], 403);
            }

            $count = GpsPing::where('trip_ticket_id', $tripId)->delete();

            Log::warning('GPS pings deleted', [
                'trip_id' => $tripId,
                'count' => $count,
                'deleted_by' => auth()->user()->user_id
            ]);

            return response()->json([
                'success' => true,
                'message' => "{$count} GPS pings deleted successfully",
                'data' => [
                    'trip_ticket_id' => $tripId,
                    'deleted_count' => $count,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Delete GPS pings error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete GPS pings: ' . $e->getMessage()
            ], 500);
        }
    }
}