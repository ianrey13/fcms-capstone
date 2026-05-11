<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    
    protected $table = 'departments';
    protected $primaryKey = 'department_id';
    
    protected $fillable = [
        'department_name', 'department_code', 'deleted_by'
    ];
    
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
    
    // Relationships
    public function users()
    {
        return $this->hasMany(User::class, 'department_id', 'department_id');
    }
    
    public function vehicles()
    {
        return $this->hasMany(Vehicle::class, 'department_id', 'department_id');
    }
    
    public function tripTickets()
    {
        return $this->hasMany(TripTicket::class, 'department_id', 'department_id');
    }
    
    public function budgetPolicy()
    {
        return $this->hasOne(DeptBudgetPolicy::class, 'department_id', 'department_id');
    }
    
    public function budgetPeriods()
    {
        return $this->hasMany(DeptBudgetPeriod::class, 'department_id', 'department_id');
    }
    
    public function departmentRequests()
    {
        return $this->hasMany(DepartmentRequest::class, 'department_id', 'department_id');
    }
    
    public function deptCrudRequests()
    {
        return $this->hasMany(DeptCrudRequest::class, 'department_id', 'department_id');
    }
    
    public function oicDesignations()
    {
        return $this->hasMany(OicDesignation::class, 'department_id', 'department_id');
    }
    
    // public function oicDelegationLogs()
    // {
    //     return $this->hasMany(OicDelegationLog::class, 'department_id', 'department_id');
    // }
    
    // Helper methods
    public function getCurrentBudgetPeriod()
    {
        return $this->budgetPeriods()
            ->where('status', 'active')
            ->where('week_start', '<=', now())
            ->where('week_end', '>=', now())
            ->first();
    }
    
    public function getRemainingBudget()
    {
        $currentPeriod = $this->getCurrentBudgetPeriod();
        if (!$currentPeriod) {
            return 0;
        }
        
        $spent = $currentPeriod->fundIssuances()->sum('amount_released');
        return $currentPeriod->allocated_amount - $spent;
    }
}