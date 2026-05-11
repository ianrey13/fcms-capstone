<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GsoVerification extends Model
{
    protected $table = 'gso_verification';
    protected $primaryKey = 'verification_id';
    public $timestamps = false;
    
    protected $fillable = [
        'trip_ticket_id', 'review_cycle', 'verified_by',
        'verified_at', 'decision', 'verification_note',    'assigned_number',

    ];
    
    protected $casts = [
        'verified_at' => 'datetime',
        'review_cycle' => 'integer'
    ];
    
    public function tripTicket()
    {
        return $this->belongsTo(TripTicket::class, 'trip_ticket_id', 'trip_ticket_id');
    }
    
    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'gso_verified_by', 'user_id');
    }
}