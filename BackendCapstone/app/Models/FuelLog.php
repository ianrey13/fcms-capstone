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
    
    public function gasSlip()
    {
        return $this->belongsTo(GasSlip::class, 'gas_slip_id', 'gas_slip_id');
    }
}