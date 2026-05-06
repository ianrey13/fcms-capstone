<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TripTicketEsignature extends Model
{
    protected $table = 'trip_ticket_esignature';
    protected $primaryKey = 'esig_record_id';
    public $timestamps = false;
    
    protected $fillable = [
        'trip_ticket_id', 'head_approval_id', 'user_id', 'esig_id',
        'signature_hash', 'signed_at', 'signed_ip', 'review_cycle'
    ];
    
    protected $casts = [
        'signed_at' => 'datetime',
        'review_cycle' => 'integer'
    ];
    
    public function tripTicket()
    {
        return $this->belongsTo(TripTicket::class, 'trip_ticket_id', 'trip_ticket_id');
    }
    
    public function headApproval()
    {
        return $this->belongsTo(HeadApproval::class, 'head_approval_id', 'approval_id');
    }
    
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
    
    public function esignature()
    {
        return $this->belongsTo(UserEsignature::class, 'esig_id', 'esig_id');
    }
}