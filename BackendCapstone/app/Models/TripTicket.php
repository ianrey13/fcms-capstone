<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TripTicket extends Model
{
    protected $table = 'trip_ticket';
    protected $primaryKey = 'trip_ticket_id';
    public $timestamps = false;

    protected $fillable = [
        'trip_ticket_number',
        'department_id',
        'driver_id',
        'vehicle_id',
        'submitted_by',
        'created_by_mo_user_id',
        'submitted_by_head',
        'submitted_at',
        'trip_date',
        'purpose',
        'destination',
        'charge_to',
        'passenger_name',
        'status',
        'updated_at',
        'estimated_distance_km',
        'estimated_fuel_liters',
        'original_charge_to',
        'charge_to_modified_by',
        'charge_to_modified_at',
        'charge_to_modification_reason',
        'odometer_exception',
        'odometer_exception_note',
        'odometer_exception_approved_by',
        'odometer_exception_approved_at',


    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'updated_at' => 'datetime',
        'trip_date' => 'date',
        'submitted_by_head' => 'boolean'
    ];

    // Status constants
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PENDING_HEAD_APPROVAL = 'pending_head_approval';
    public const STATUS_PENDING_GSO_REVIEW = 'pending_gso_review';
    public const STATUS_RETURNED_FOR_REVISION = 'returned_for_revision';
    public const STATUS_PENDING_MAYORS_OFFICE = 'pending_mayors_office';
    public const STATUS_WITH_MAYORS_OFFICE = 'with_mayors_office';

    public const STATUS_FUNDS_ISSUED = 'funds_issued';
    public const STATUS_IN_TRANSIT = 'in_transit';
    public const STATUS_PENDING_RECONCILIATION = 'pending_reconciliation';
    public const STATUS_CLOSED = 'closed';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_ACKNOWLEDGED = 'acknowledged';

    // Relationships
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id', 'driver_id');
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id', 'vehicle_id');
    }

    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by', 'user_id');
    }

    public function createdByMO()
    {
        return $this->belongsTo(User::class, 'created_by_mo_user_id', 'user_id');
    }

    public function headApprovals()
    {
        return $this->hasMany(HeadApproval::class, 'trip_ticket_id', 'trip_ticket_id');
    }

    public function latestHeadApproval()
    {
        return $this->hasOne(HeadApproval::class, 'trip_ticket_id', 'trip_ticket_id')
            ->latest('review_cycle');
    }

    public function gsoVerifications()
    {
        return $this->hasMany(GsoVerification::class, 'trip_ticket_id', 'trip_ticket_id');
    }

    public function latestGsoVerification()
    {
        return $this->hasOne(GsoVerification::class, 'trip_ticket_id', 'trip_ticket_id')
            ->latest('review_cycle');
    }

    public function moReviews()
    {
        return $this->hasMany(MoReview::class, 'trip_ticket_id', 'trip_ticket_id');
    }

    public function latestMoReview()
    {
        return $this->hasOne(MoReview::class, 'trip_ticket_id', 'trip_ticket_id')
            ->latest('review_cycle');
    }

    public function gasSlip()
    {
        return $this->hasOne(GasSlip::class, 'trip_ticket_id', 'trip_ticket_id');
    }

    public function vehicleSnapshot()
    {
        return $this->hasOne(TripTicketVehicleSnapshot::class, 'trip_ticket_id', 'trip_ticket_id');
    }

    public function returns()
    {
        return $this->hasMany(TripTicketReturn::class, 'trip_ticket_id', 'trip_ticket_id');
    }

    public function cancellation()
    {
        return $this->hasOne(TripTicketCancellation::class, 'trip_ticket_id', 'trip_ticket_id');
    }

    public function gpsPings()
    {
        return $this->hasMany(GpsPing::class, 'trip_ticket_id', 'trip_ticket_id');
    }

    public function gpsDistanceResult()
    {
        return $this->hasOne(GpsDistanceResult::class, 'trip_ticket_id', 'trip_ticket_id');
    }

    public function tripTicketEsignatures()
    {
        return $this->hasMany(TripTicketEsignature::class, 'trip_ticket_id', 'trip_ticket_id');
    }

    // Scopes
    public function scopePendingHeadApproval($query)
    {
        return $query->where('status', self::STATUS_PENDING_HEAD_APPROVAL);
    }

    public function scopePendingGsoReview($query)
    {
        return $query->where('status', self::STATUS_PENDING_GSO_REVIEW);
    }

    public function scopePendingMayorsOffice($query)
    {
        return $query->where('status', self::STATUS_PENDING_MAYORS_OFFICE);
    }

    public function scopeInTransit($query)
    {
        return $query->where('status', self::STATUS_IN_TRANSIT);
    }

    public function scopeClosed($query)
    {
        return $query->where('status', self::STATUS_CLOSED);
    }

    // Helper methods
    public function canBeApprovedByHead()
    {
        return $this->status === self::STATUS_PENDING_HEAD_APPROVAL;
    }

    public function canBeApprovedByGso()
    {
        return $this->status === self::STATUS_PENDING_GSO_REVIEW;
    }

    public function canBeApprovedByMo()
    {
        return $this->status === self::STATUS_PENDING_MAYORS_OFFICE;
    }

    public function canStartTrip()
    {
        return $this->status === self::STATUS_FUNDS_ISSUED;
    }

    public function canCompleteTrip()
    {
        return $this->status === self::STATUS_IN_TRANSIT;
    }

    public function chargeToModifiedBy()
{
    return $this->belongsTo(User::class, 'charge_to_modified_by', 'user_id');
}

public function odometerExceptionApprovedBy()
{
    return $this->belongsTo(User::class, 'odometer_exception_approved_by', 'user_id');
}
}
