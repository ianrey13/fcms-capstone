<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\GpsPing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GpsPingController extends Controller
{
    public function store(Request $request)
    {
        try {
            $request->validate([
                'trip_ticket_id' => 'required|exists:trip_ticket,trip_ticket_id',
                'latitude' => 'required|numeric',
                'longitude' => 'required|numeric',
                'accuracy_meters' => 'nullable|numeric',
                'speed_kmh' => 'nullable|numeric',
            ]);
            
            $ping = GpsPing::create([
                'trip_ticket_id' => $request->trip_ticket_id,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'accuracy_meters' => $request->accuracy_meters,
                'speed_kmh' => $request->speed_kmh,
                'recorded_at' => now(),
                'received_at' => now(),
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $ping
            ]);
            
        } catch (\Exception $e) {
            Log::error('GPS Ping error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to save GPS ping'
            ], 500);
        }
    }
}