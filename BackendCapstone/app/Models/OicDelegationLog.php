<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OicDelegationLog extends Model
{
    protected $table = 'oic_delegation_log';
    protected $primaryKey = 'log_id';
    public $timestamps = false;
    
    protected $fillable = [
        'department_id', 'head_of_office_id', 'oic_user_id', 'reason',
        'reason_details', 'estimated_return', 'delegated_at', 'revoked_at', 'tickets_handled'
    ];
    
    protected $casts = [
        'delegated_at' => 'datetime',
        'revoked_at' => 'datetime',
        'estimated_return' => 'date',
        'tickets_handled' => 'integer'
    ];
    
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }
    
    public function headOfOffice()
    {
        return $this->belongsTo(User::class, 'head_of_office_id', 'user_id');
    }
    
    public function oic()
    {
        return $this->belongsTo(User::class, 'oic_user_id', 'user_id');
    }
}