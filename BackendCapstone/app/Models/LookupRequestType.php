<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LookupRequestType extends Model
{
    protected $table = 'lookup_request_types';
    protected $primaryKey = 'type_code';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    
    protected $fillable = [
        'type_code', 'category', 'type_name', 'description', 'requires_attachment', 'approval_workflow'
    ];
    
    protected $casts = [
        'requires_attachment' => 'boolean'
    ];
}