<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $table = 'notifications';
    protected $primaryKey = 'notification_id';
    public $timestamps = false;
    
    protected $fillable = [
        'recipient_user_id', 
        'notification_type', 
        'entity_type', 
        'entity_id',
        'message', 
        'channel', 
        'is_read', 
        'created_at', 
        'read_at'
    ];
    
    protected $casts = [
        'created_at' => 'datetime',
        'read_at' => 'datetime',
        'is_read' => 'boolean'
    ];
    
    // ============ SCOPES ============
    
    /**
     * Scope query for specific user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('recipient_user_id', $userId);
    }
    
    /**
     * Scope query for unread notifications
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }
    
    /**
     * Scope query for read notifications
     */
    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }
    
    /**
     * Scope query by notification type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('notification_type', $type);
    }
    
    /**
     * Scope query by entity type
     */
    public function scopeOfEntity($query, $entityType, $entityId = null)
    {
        $query->where('entity_type', $entityType);
        if ($entityId) {
            $query->where('entity_id', $entityId);
        }
        return $query;
    }
    
    /**
     * Scope for budget assistance requests
     */
    public function scopeBudgetAssistance($query)
    {
        return $query->where('notification_type', 'budget_assistance_request');
    }
    
    /**
     * Scope for trip related notifications
     */
    public function scopeTripRelated($query)
    {
        return $query->whereIn('notification_type', [
            'trip_submitted',
            'head_approved',
            'head_rejected',
            'gso_approved',
            'gso_rejected',
            'mo_approved',
            'mo_rejected',
            'fund_issued',
            'trip_started',
            'trip_completed'
        ]);
    }
    
    // ============ METHODS ============
    
    /**
     * Mark notification as read
     */
    public function markAsRead()
    {
        $this->is_read = true;
        $this->read_at = now();
        $this->save();
        
        return $this;
    }
    
    /**
     * Mark notification as unread
     */
    public function markAsUnread()
    {
        $this->is_read = false;
        $this->read_at = null;
        $this->save();
        
        return $this;
    }
    
    /**
     * Check if notification is read
     */
    public function isRead()
    {
        return $this->is_read === true;
    }
    
    /**
     * Check if notification is unread
     */
    public function isUnread()
    {
        return $this->is_read === false;
    }
    
    /**
     * Get formatted time ago
     */
    public function getTimeAgoAttribute()
    {
        $now = now();
        $created = $this->created_at;
        $diff = $now->diffInMinutes($created);
        
        if ($diff < 1) {
            return 'Just now';
        } elseif ($diff < 60) {
            return $diff . ' minute' . ($diff > 1 ? 's' : '') . ' ago';
        } elseif ($diff < 1440) {
            $hours = floor($diff / 60);
            return $hours . ' hour' . ($hours > 1 ? 's' : '') . ' ago';
        } else {
            $days = floor($diff / 1440);
            return $days . ' day' . ($days > 1 ? 's' : '') . ' ago';
        }
    }
    
    /**
     * Get short message (truncated)
     */
    public function getShortMessageAttribute($length = 100)
    {
        if (strlen($this->message) <= $length) {
            return $this->message;
        }
        return substr($this->message, 0, $length) . '...';
    }
    
    // ============ RELATIONSHIPS ============
    
    /**
     * Get the recipient user
     */
    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_user_id', 'user_id');
    }
    
    /**
     * Get the related entity (polymorphic-like)
     */
    public function getEntity()
    {
        switch ($this->entity_type) {
            case 'trip_ticket':
                return TripTicket::find($this->entity_id);
            case 'gas_slip':
                return GasSlip::find($this->entity_id);
            
            case 'oic_designation':
                return OicDesignation::find($this->entity_id);
            case 'mo_request':
                // This is stored in session/cache, not database
                return null;
            default:
                return null;
        }
    }
    
    /**
     * Get notification icon class
     */
    public function getIconAttribute()
    {
        $icons = [
            'trip_submitted' => '📋',
            'head_approved' => '✅',
            'head_rejected' => '❌',
            'gso_approved' => '✓',
            'gso_rejected' => '✗',
            'mo_approved' => '💰',
            'mo_rejected' => '🚫',
            'fund_issued' => '💵',
            'trip_started' => '🚗',
            'trip_completed' => '🏁',
            'budget_low_warning' => '⚠️',
            'budget_assistance_request' => '🆘',
            'fund_return_pending' => '↩️',
        ];
        
        return $icons[$this->notification_type] ?? '🔔';
    }
    
    /**
     * Get notification color class
     */
    public function getColorClassAttribute()
    {
        $colors = [
            'trip_submitted' => 'blue',
            'head_approved' => 'green',
            'head_rejected' => 'red',
            'gso_approved' => 'green',
            'gso_rejected' => 'red',
            'mo_approved' => 'green',
            'mo_rejected' => 'red',
            'fund_issued' => 'green',
            'trip_started' => 'blue',
            'trip_completed' => 'green',
            'budget_low_warning' => 'yellow',
            'budget_assistance_request' => 'orange',
            'fund_return_pending' => 'yellow',
        ];
        
        return $colors[$this->notification_type] ?? 'gray';
    }
}