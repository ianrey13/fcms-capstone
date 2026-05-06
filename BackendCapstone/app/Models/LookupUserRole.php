<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LookupUserRole extends Model
{
    protected $table = 'lookup_user_roles';
    protected $primaryKey = 'role_code';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    
    protected $fillable = [
        'role_code', 'role_name', 'description', 'hierarchy_level', 'is_active'
    ];
    
    protected $casts = [
        'is_active' => 'boolean',
        'hierarchy_level' => 'integer'
    ];
}