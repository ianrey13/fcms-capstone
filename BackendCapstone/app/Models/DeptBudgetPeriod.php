<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeptBudgetPeriod extends Model
{
    protected $table = 'dept_budget_period';
    protected $primaryKey = 'period_id';
    
    protected $fillable = [
        'department_id', 'week_start', 'allocated_amount', 'status', 'closed_at'
    ];
    
    protected $casts = [
        'created_at' => 'datetime',
        'closed_at' => 'datetime',
        'week_start' => 'date',
        'allocated_amount' => 'decimal:2'
    ];
    
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }
    

     public function gasSlips()
    {
        return $this->hasMany(GasSlip::class, 'period_id', 'period_id');
    }
    
    
    public function getRemainingAmount()
    {
        $spent = $this->gasSlips()->sum('amount_released');
        return $this->allocated_amount - $spent;
    }
    
    public function isActive()
    {
        return $this->status === 'active';
    }
}