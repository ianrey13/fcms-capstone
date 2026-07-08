<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FuelLog extends Model
{
    protected $table = 'fuel_log';
    protected $primaryKey = 'fuel_log_id';
    
    protected $fillable = [
        'gas_slip_id',
        'liters_availed',
        'amount_on_receipt',
        'receipt_photo_path',        
        'odometer_start',
        'odometer_end',        
        'odometer_continuity_flag',
        'has_movement_flag',
        'duplicate_receipt_flag',
        'trip_elapsed_minutes',
        'trip_started_at',
        'trip_ended_at',
        'trip_start_gps_lat',
        'trip_start_gps_lng',
        'trip_start_gps_accuracy',
        'distance_calculation_method',
        'gps_distance_km',
    ];
    
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'trip_started_at' => 'datetime',
        'trip_ended_at' => 'datetime',
        'liters_availed' => 'decimal:3',
        'amount_on_receipt' => 'decimal:2',
        'odometer_continuity_flag' => 'boolean',
        'has_movement_flag' => 'boolean',
        'duplicate_receipt_flag' => 'boolean',
        'trip_start_gps_lat' => 'decimal:7',
        'trip_start_gps_lng' => 'decimal:7',
        'trip_start_gps_accuracy' => 'decimal:2',
        'gps_distance_km' => 'decimal:2',
    ];
    
    // ============ RELATIONSHIPS ============
    public function gasSlip()
    {
        return $this->belongsTo(GasSlip::class, 'gas_slip_id', 'gas_slip_id');
    }
    
    // ============ HELPER METHODS ============
    
    /**
     * Check if trip is completed
     */
    public function isCompleted()
    {
        return $this->trip_ended_at !== null;
    }
    
    /**
     * Check if odometer readings are available
     */
    public function hasOdometerReadings()
    {
        return $this->odometer_start !== null && $this->odometer_end !== null;
    }
    
    /**
     * Calculate distance from odometer (if available)
     */
    public function getOdometerDistanceAttribute()
    {
        if ($this->hasOdometerReadings()) {
            return $this->odometer_end - $this->odometer_start;
        }
        return null;
    }
    
    /**
     * Get the effective distance (odometer or GPS)
     */
    public function getEffectiveDistanceAttribute()
    {
        if ($this->hasOdometerReadings()) {
            return $this->odometer_end - $this->odometer_start;
        }
        if ($this->gps_distance_km !== null) {
            return $this->gps_distance_km;
        }
        return null;
    }
    
    /**
     * Get distance source label
     */
    public function getDistanceSourceLabelAttribute()
    {
        $labels = [
            'odometer' => 'Odometer',
            'gps' => 'GPS',
            'manual_estimate' => 'Manual Estimate',
        ];
        return $labels[$this->distance_calculation_method] ?? 'Unknown';
    }
}