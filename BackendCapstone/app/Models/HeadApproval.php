<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeadApproval extends Model
{
    protected $table = 'head_approval';
    protected $primaryKey = 'approval_id';
    public $timestamps = false;
    
    protected $fillable = [
        'trip_ticket_id', 'review_cycle', 'approved_by', 'is_oic_action',
        'decision', 'review_note', 'reviewed_at'
    ];
    
    protected $casts = [
        'reviewed_at' => 'datetime',
        'is_oic_action' => 'boolean',
        'review_cycle' => 'integer'
    ];
    
    // Decision constants
    public const DECISION_APPROVED = 'approved';
    public const DECISION_REJECTED = 'rejected';
    
    public function tripTicket()
    {
        return $this->belongsTo(TripTicket::class, 'trip_ticket_id', 'trip_ticket_id');
    }
    
    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_id');
    }
    
    public function tripTicketEsignatures()
    {
        return $this->hasMany(TripTicketEsignature::class, 'head_approval_id', 'approval_id');
    }
}