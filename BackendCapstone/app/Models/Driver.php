<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Driver extends Model
{
    protected $table = 'drivers';
    protected $primaryKey = 'driver_id';
    
    protected $fillable = [
        'user_id', 'status', 'deactivated_by', 'deactivation_reason'
    ];
    
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deactivated_at' => 'datetime'
    ];
    
    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
    
    public function deactivatedBy()
    {
        return $this->belongsTo(User::class, 'deactivated_by', 'user_id');
    }
    
    public function tripTickets()
    {
        return $this->hasMany(TripTicket::class, 'driver_id', 'driver_id');
    }
    
    public function departmentRequests()
    {
        return $this->hasMany(DepartmentRequest::class, 'affected_driver_id', 'driver_id');
    }
    
    public function deptCrudRequests()
    {
        return $this->hasMany(DeptCrudRequest::class, 'affected_driver_id', 'driver_id');
    }
    
    // Helper methods
    public function isActive()
    {
        return $this->status === 'active';
    }
}