<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MoReview extends Model
{
    protected $table = 'mo_review';
    protected $primaryKey = 'review_id';
    public $timestamps = false;
    
    protected $fillable = [
        'trip_ticket_id', 'review_cycle', 'reviewed_by',
        'decision', 'review_note', 'reviewed_at'
    ];
    
    protected $casts = [
        'reviewed_at' => 'datetime',
        'review_cycle' => 'integer'
    ];
    
    public function tripTicket()
    {
        return $this->belongsTo(TripTicket::class, 'trip_ticket_id', 'trip_ticket_id');
    }
    
    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by', 'user_id');
    }
}