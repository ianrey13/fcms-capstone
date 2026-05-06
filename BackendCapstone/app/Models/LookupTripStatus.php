<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LookupTripStatus extends Model
{
    protected $table = 'lookup_trip_status';
    protected $primaryKey = 'status_code';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    
    protected $fillable = [
        'status_code', 'status_name', 'description', 'is_terminal', 'display_order', 'color_code'
    ];
    
    protected $casts = [
        'is_terminal' => 'boolean',
        'display_order' => 'integer'
    ];
}