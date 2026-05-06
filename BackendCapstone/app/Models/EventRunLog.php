<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventRunLog extends Model
{
    protected $table = 'event_run_log';
    protected $primaryKey = 'log_id';
    public $timestamps = false;
    
    protected $fillable = [
        'event_name', 'run_at', 'status', 'periods_closed',
        'periods_created', 'error_message', 'notes'
    ];
    
    protected $casts = [
        'run_at' => 'datetime',
        'periods_closed' => 'integer',
        'periods_created' => 'integer'
    ];
}