<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OicDesignation extends Model
{
    protected $table = 'oic_designation';
    protected $primaryKey = 'designation_id';
    public $timestamps = false;
    
    protected $fillable = [
        'department_id', 'head_of_office_id', 'oic_user_id', 'is_active',
        'designated_at', 'revoked_at'
    ];
    
    protected $casts = [
        'designated_at' => 'datetime',
        'revoked_at' => 'datetime',
        'is_active' => 'boolean'
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