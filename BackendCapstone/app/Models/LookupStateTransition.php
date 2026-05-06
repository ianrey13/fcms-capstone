<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LookupStateTransition extends Model
{
    protected $table = 'lookup_state_transitions';
    public $timestamps = false;
    
    protected $fillable = [
        'entity_type', 'from_status', 'to_status', 'requires_note', 'allowed_roles'
    ];
    
    protected $casts = [
        'requires_note' => 'boolean'
    ];
}