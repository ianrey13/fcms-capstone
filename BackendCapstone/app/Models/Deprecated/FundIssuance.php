<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FundIssuance extends Model
{
    protected $table = 'fund_issuance';
    protected $primaryKey = 'issuance_id';
    public $timestamps = false;
    
    protected $fillable = [
        'gas_slip_id', 'period_id', 'issued_by', 'acknowledged_by',
        'amount_released', 'budget_before', 'budget_after',
        'acknowledgement_method', 'issued_at', 'acknowledged_at'
    ];
    
    protected $casts = [
        'issued_at' => 'datetime',
        'acknowledged_at' => 'datetime',
        'amount_released' => 'decimal:2',
        'budget_before' => 'decimal:2',
        'budget_after' => 'decimal:2'
    ];
    
    public function gasSlip()
    {
        return $this->belongsTo(GasSlip::class, 'gas_slip_id', 'gas_slip_id');
    }
    
    public function budgetPeriod()
    {
        return $this->belongsTo(DeptBudgetPeriod::class, 'period_id', 'period_id');
    }
    
    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'issued_by', 'user_id');
    }
    
    public function acknowledgedBy()
    {
        return $this->belongsTo(User::class, 'acknowledged_by', 'user_id');
    }
}