<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeptCrudRequest extends Model
{
    protected $table = 'dept_crud_request';
    protected $primaryKey = 'request_id';
    public $timestamps = false;
    
    protected $fillable = [
        'department_id', 'submitted_by', 'request_type', 'affected_vehicle_id',
        'affected_driver_id', 'affected_user_id', 'request_details', 'attachment_path',
        'status', 'reviewed_by', 'review_note', 'reviewed_at', 'submitted_at'
    ];
    
    protected $casts = [
        'reviewed_at' => 'datetime',
        'submitted_at' => 'datetime'
    ];
    
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }
    
    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by', 'user_id');
    }
    
    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by', 'user_id');
    }
    
    public function affectedVehicle()
    {
        return $this->belongsTo(Vehicle::class, 'affected_vehicle_id', 'vehicle_id');
    }
    
    public function affectedDriver()
    {
        return $this->belongsTo(Driver::class, 'affected_driver_id', 'driver_id');
    }
    
    public function affectedUser()
    {
        return $this->belongsTo(User::class, 'affected_user_id', 'user_id');
    }
}