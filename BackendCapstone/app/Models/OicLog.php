<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OicLog extends Model
{
    protected $table = 'oic_logs';
    protected $primaryKey = 'log_id';
    public $timestamps = false;
    
    protected $fillable = [
        'department_id',
        'head_user_id',
        'oic_user_id',
        'action',
        'reason',
        'created_at'
    ];
    
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }
    
    public function head(): BelongsTo
    {
        return $this->belongsTo(User::class, 'head_user_id', 'user_id');
    }
    
    public function oic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'oic_user_id', 'user_id');
    }
}