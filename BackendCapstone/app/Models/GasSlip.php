<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GasSlip extends Model
{
    protected $table = 'gas_slip';
    protected $primaryKey = 'gas_slip_id';
    
    protected $fillable = [
        'trip_ticket_id',
        'created_by',
        'amount_released',
        'budget_before',
        'budget_after',
        'period_id',
        'acknowledged_by',
        'acknowledged_at',
        'acknowledgement_gps_lat',
        'acknowledgement_gps_lng',
        'reconciliation_status',
        'reconciliation_note',
        'reconciled_by',
        'reconciled_at',
        'receipt_acknowledged_by',
        'receipt_acknowledged_at',
    ];
    
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'reconciled_at' => 'datetime',
        'receipt_acknowledged_at' => 'datetime',
        'acknowledged_at' => 'datetime',
        'amount_released' => 'decimal:2',
        'budget_before' => 'decimal:2',
        'budget_after' => 'decimal:2',
    ];
    


      public function period()
    {
        return $this->belongsTo(DeptBudgetPeriod::class, 'period_id', 'period_id');
    }
    
    public function tripTicket()
    {
        return $this->belongsTo(TripTicket::class, 'trip_ticket_id', 'trip_ticket_id');
    }
    
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }
    
    public function reconciledBy()
    {
        return $this->belongsTo(User::class, 'reconciled_by', 'user_id');
    }
    
    public function receiptAcknowledgedBy()
    {
        return $this->belongsTo(User::class, 'receipt_acknowledged_by', 'user_id');
    }
    
    
   public function acknowledgedBy()
    {
        return $this->belongsTo(User::class, 'acknowledged_by', 'user_id');
    }
    
    public function fuelLog()
    {
        return $this->hasOne(FuelLog::class, 'gas_slip_id', 'gas_slip_id');
    }

}