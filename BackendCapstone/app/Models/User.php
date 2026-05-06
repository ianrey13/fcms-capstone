<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;


class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
    
    protected $table = 'users';
    protected $primaryKey = 'user_id';
    
    // ============ ROLE CONSTANTS ============
    public const ROLE_SUPERADMIN = 'superadmin';
    public const ROLE_MAYORS_OFFICE = 'mayors_office';
    public const ROLE_HEAD_OF_OFFICE = 'head_of_office';
    public const ROLE_GSO_STAFF = 'gso_staff';
    public const ROLE_DEPT_OFFICE = 'dept_office';
    public const ROLE_DRIVER = 'driver';
    
    // ============ STATUS CONSTANTS ============
    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const HEAD_STATUS_ACTIVE = 'active';
    public const HEAD_STATUS_INACTIVE = 'inactive';
    
    protected $fillable = [
        'department_id', 'first_name', 'middle_name', 'last_name', 'email',
        'password_hash', 'role', 'head_active_status', 'status',
        'deactivated_by', 'deactivation_reason', 'password_changed_at',
        'failed_login_attempts', 'locked_until'
    ];
    
    protected $hidden = [
        'password_hash',
    ];
    
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'last_login_at' => 'datetime',
        'deactivated_at' => 'datetime',
        'password_changed_at' => 'datetime',
        'locked_until' => 'datetime',
        'failed_login_attempts' => 'integer'
    ];
    
    // Authentication
    public function getAuthPassword()
    {
        return $this->password_hash;
    }
    
    // Accessors
    public function getFullNameAttribute()
    {
        return trim($this->first_name . ' ' . ($this->middle_name ? $this->middle_name . ' ' : '') . $this->last_name);
    }
    
    // ============ ROLE CHECK METHODS ============
    public function isSuperAdmin()
    {
        return $this->role === self::ROLE_SUPERADMIN;
    }
    
    public function isDeptOffice()
    {
        return $this->role === self::ROLE_DEPT_OFFICE;
    }
    
    public function isDeptHead()
    {
        return $this->role === self::ROLE_HEAD_OF_OFFICE;
    }
    
    public function isGsoStaff()
    {
        return $this->role === self::ROLE_GSO_STAFF;
    }
    
    public function isMayorsOffice()
    {
        return $this->role === self::ROLE_MAYORS_OFFICE;
    }
    
    public function isDriver()
    {
        return $this->role === self::ROLE_DRIVER;
    }
    
    public function isActive()
    {
        return $this->status === self::STATUS_ACTIVE;
    }
    
    // ============ OIC METHODS ============
    public function isOIC()
    {
        if (!$this->department_id) return false;
        
        return OicDesignation::where('department_id', $this->department_id)
            ->where('oic_user_id', $this->user_id)
            ->where('is_active', true)
            ->exists();
    }
    
    public function canApproveDepartmentTickets()
    {
        if ($this->isDeptHead() && $this->head_active_status === self::HEAD_STATUS_ACTIVE) {
            return true;
        }
        return $this->isOIC();
    }
    
    public function getManagedDepartment()
    {
        if (!$this->department_id) return null;
        
        $department = Department::find($this->department_id);
        if (!$department) return null;
        
        $isHead = $this->isDeptHead() && $this->head_active_status === self::HEAD_STATUS_ACTIVE;
        $isOic = $this->isOIC();
        
        if ($isHead || $isOic) {
            return $department;
        }
        
        return null;
    }
    
    // ============ RELATIONSHIPS ============
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }
    
    public function driver()
    {
        return $this->hasOne(Driver::class, 'user_id', 'user_id');
    }
    
    public function submittedTripTickets()
    {
        return $this->hasMany(TripTicket::class, 'submitted_by', 'user_id');
    }
    
    public function moCreatedTripTickets()
    {
        return $this->hasMany(TripTicket::class, 'created_by_mo_user_id', 'user_id');
    }
    
    public function headApprovals()
    {
        return $this->hasMany(HeadApproval::class, 'approved_by', 'user_id');
    }
    
    public function gsoVerifications()
    {
        return $this->hasMany(GsoVerification::class, 'gso_verified_by', 'user_id');
    }
    
    public function moReviews()
    {
        return $this->hasMany(MoReview::class, 'reviewed_by', 'user_id');
    }
    
    public function gasSlipsCreated()
    {
        return $this->hasMany(GasSlip::class, 'created_by', 'user_id');
    }
    
    public function gasSlipsReconciled()
    {
        return $this->hasMany(GasSlip::class, 'reconciled_by', 'user_id');
    }
    
    public function gasSlipsAcknowledged()
    {
        return $this->hasMany(GasSlip::class, 'receipt_acknowledged_by', 'user_id');
    }
    
    public function fundIssuances()
    {
        return $this->hasMany(FundIssuance::class, 'issued_by', 'user_id');
    }
    
    public function fundIssuancesAcknowledged()
    {
        return $this->hasMany(FundIssuance::class, 'acknowledged_by', 'user_id');
    }
    
    public function notifications()
    {
        return $this->hasMany(Notification::class, 'recipient_user_id', 'user_id');
    }
    
    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class, 'user_id', 'user_id');
    }
    
    public function departmentRequestsSubmitted()
    {
        return $this->hasMany(DepartmentRequest::class, 'submitted_by', 'user_id');
    }
    
    public function departmentRequestsReviewed()
    {
        return $this->hasMany(DepartmentRequest::class, 'reviewed_by', 'user_id');
    }
    
    public function deptCrudRequestsSubmitted()
    {
        return $this->hasMany(DeptCrudRequest::class, 'submitted_by', 'user_id');
    }
    
    public function deptCrudRequestsReviewed()
    {
        return $this->hasMany(DeptCrudRequest::class, 'reviewed_by', 'user_id');
    }
    
    public function oicDesignationsAsHead()
    {
        return $this->hasMany(OicDesignation::class, 'head_of_office_id', 'user_id');
    }
    
    public function oicDesignationsAsOic()
    {
        return $this->hasMany(OicDesignation::class, 'oic_user_id', 'user_id');
    }
    
    public function oicDelegationLogsAsHead()
    {
        return $this->hasMany(OicDelegationLog::class, 'head_of_office_id', 'user_id');
    }
    
    public function oicDelegationLogsAsOic()
    {
        return $this->hasMany(OicDelegationLog::class, 'oic_user_id', 'user_id');
    }
    
    public function tripTicketReturns()
    {
        return $this->hasMany(TripTicketReturn::class, 'actioned_by', 'user_id');
    }
    
    public function tripTicketCancellations()
    {
        return $this->hasMany(TripTicketCancellation::class, 'cancelled_by', 'user_id');
    }
    
    public function tripTicketCancellationsFundReturned()
    {
        return $this->hasMany(TripTicketCancellation::class, 'fund_returned_by', 'user_id');
    }
    
    public function vehicleOdometerStatuses()
    {
        return $this->hasMany(VehicleOdometerStatus::class, 'reported_by', 'user_id');
    }
    
    public function systemSettingsUpdated()
    {
        return $this->hasMany(SystemSetting::class, 'updated_by', 'user_id');
    }
    
    public function userEsignatures()
    {
        return $this->hasMany(UserEsignature::class, 'user_id', 'user_id');
    }
    
    public function activeEsignature()
    {
        return $this->hasOne(UserEsignature::class, 'user_id', 'user_id')->where('is_active', true);
    }
    
    public function tripTicketEsignatures()
    {
        return $this->hasMany(TripTicketEsignature::class, 'user_id', 'user_id');
    }
    
    public function uploadedFiles()
    {
        return $this->hasMany(FileStorage::class, 'uploaded_by', 'user_id');
    }
    
    public function deletedFiles()
    {
        return $this->hasMany(FileStorage::class, 'deleted_by', 'user_id');
    }
    
    public function deletedDepartments()
    {
        return $this->hasMany(Department::class, 'deleted_by', 'user_id');
    }
    
    public function deactivatedDrivers()
    {
        return $this->hasMany(Driver::class, 'deactivated_by', 'user_id');
    }
    
    public function deactivatedVehicles()
    {
        return $this->hasMany(Vehicle::class, 'deactivated_by', 'user_id');
    }

    
}