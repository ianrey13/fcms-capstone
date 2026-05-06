<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FuelLog extends Model
{
    protected $table = 'fuel_log';
    protected $primaryKey = 'fuel_log_id';
    
    protected $fillable = [
        'gas_slip_id', 'liters_availed', 'amount_on_receipt', 'receipt_photo_path',
        'receipt_phash', 'receipt_uploaded_at', 'odometer_out', 'odometer_in',
        'distance_source', 'odometer_continuity_flag', 'has_movement_flag',
        'duplicate_receipt_flag', 'trip_elapsed_minutes', 'gps_tracking_started_at',
        'gps_tracking_ended_at'
    ];
    
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'receipt_uploaded_at' => 'datetime',
        'gps_tracking_started_at' => 'datetime',
        'gps_tracking_ended_at' => 'datetime',
        'liters_availed' => 'decimal:3',
        'amount_on_receipt' => 'decimal:2',
        'odometer_continuity_flag' => 'boolean',
        'has_movement_flag' => 'boolean',
        'duplicate_receipt_flag' => 'boolean'
    ];
    
    public function gasSlip()
    {
        return $this->belongsTo(GasSlip::class, 'gas_slip_id', 'gas_slip_id');
    }
}