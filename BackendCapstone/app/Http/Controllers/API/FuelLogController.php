<?php

namespace App\Http\Controllers;

use App\Models\FuelLog;
use App\Models\GasSlip;
use App\Models\TripTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class FuelLogController extends Controller
{
    /**
     * Upload receipt photo (mandatory gate)
     */
    public function uploadReceipt(Request $request, $gasSlipId)
    {
        $validator = Validator::make($request->all(), [
            'receipt_photo' => 'required|image|max:5120', // 5MB max
            'liters_availed' => 'required|numeric|min:0.01',
            'amount_on_receipt' => 'required|numeric|min:0.01',
            'odometer_out' => 'nullable|integer|min:0',
            'odometer_in' => 'nullable|integer|min:0'
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $gasSlip = GasSlip::findOrFail($gasSlipId);
        $tripTicket = $gasSlip->tripTicket;
        $user = $request->user();
        
        // Verify user is the assigned driver
        $driver = \App\Models\Driver::where('user_id', $user->user_id)->first();
        if (!$driver || $tripTicket->driver_id !== $driver->driver_id) {
            return response()->json(['message' => 'Unauthorized - not the assigned driver'], 403);
        }
        
        // Check if trip is in progress
        if ($tripTicket->status !== TripTicket::STATUS_IN_TRANSIT) {
            return response()->json(['message' => 'Trip is not in progress'], 400);
        }
        
        DB::beginTransaction();
        
        try {
            // Store the receipt photo
            $photoPath = $request->file('receipt_photo')->store('receipts', 'public');
            
            // Create or update fuel log
            $fuelLog = FuelLog::updateOrCreate(
                ['gas_slip_id' => $gasSlipId],
                [
                    'liters_availed' => $request->liters_availed,
                    'amount_on_receipt' => $request->amount_on_receipt,
                    'receipt_photo_path' => $photoPath,
                    'receipt_uploaded_at' => now(),
                    'odometer_out' => $request->odometer_out,
                    'odometer_in' => $request->odometer_in,
                    'has_movement_flag' => $request->has('has_movement_flag') ? $request->has_movement_flag : false
                ]
            );
            
            DB::commit();
            
            return response()->json([
                'message' => 'Receipt uploaded successfully',
                'fuel_log' => $fuelLog
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            // Delete uploaded file if exists
            if (isset($photoPath)) {
                Storage::disk('public')->delete($photoPath);
            }
            return response()->json(['message' => 'Failed to upload receipt', 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Update fuel log data (after upload)
     */
    public function update(Request $request, $gasSlipId)
    {
        $validator = Validator::make($request->all(), [
            'liters_availed' => 'sometimes|numeric|min:0.01',
            'amount_on_receipt' => 'sometimes|numeric|min:0.01',
            'odometer_out' => 'nullable|integer|min:0',
            'odometer_in' => 'nullable|integer|min:0'
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $fuelLog = FuelLog::where('gas_slip_id', $gasSlipId)->firstOrFail();
        $tripTicket = $fuelLog->gasSlip->tripTicket;
        $user = $request->user();
        
        // Verify user is the assigned driver
        $driver = \App\Models\Driver::where('user_id', $user->user_id)->first();
        if (!$driver || $tripTicket->driver_id !== $driver->driver_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Check if receipt is uploaded (gate passed)
        if (!$fuelLog->isReceiptUploaded()) {
            return response()->json(['message' => 'Receipt must be uploaded first'], 400);
        }
        
        $fuelLog->update($request->only([
            'liters_availed', 'amount_on_receipt', 'odometer_out', 'odometer_in'
        ]));
        
        return response()->json([
            'message' => 'Fuel log updated successfully',
            'fuel_log' => $fuelLog
        ]);
    }
    
    /**
     * Get fuel log for a gas slip
     */
    public function show($gasSlipId)
    {
        $fuelLog = FuelLog::where('gas_slip_id', $gasSlipId)
            ->with('gasSlip.tripTicket')
            ->first();
        
        if (!$fuelLog) {
            return response()->json(['message' => 'Fuel log not found'], 404);
        }
        
        // Add computed metrics from view
        $computedData = DB::table('v_fuel_log_computed')
            ->where('gas_slip_id', $gasSlipId)
            ->first();
        
        $fuelLog->computed_metrics = $computedData;
        
        return response()->json($fuelLog);
    }
}