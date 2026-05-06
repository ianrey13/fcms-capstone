<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table = 'audit_log';
    protected $primaryKey = 'log_id';
    
    protected $fillable = [
        'user_id', 'action', 'model_type', 'model_id', 'old_value',
        'new_value', 'ip_address', 'created_at', 'updated_at'
    ];
    
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'old_value' => 'array',
        'new_value' => 'array'
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}