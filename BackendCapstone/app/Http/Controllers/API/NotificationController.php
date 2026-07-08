<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Events\NewNotification;  // ✅ Add this
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    /**
     * Get user's notifications
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            $notifications = Notification::where('recipient_user_id', $user->user_id)
                ->orderBy('created_at', 'desc')
                ->paginate(20);
            
            return response()->json([
                'success' => true,
                'data' => $notifications->items(),
                'meta' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'total' => $notifications->total(),
                    'unread_count' => Notification::where('recipient_user_id', $user->user_id)
                        ->where('is_read', false)
                        ->count(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get notifications error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications'
            ], 500);
        }
    }
    
    /**
     * Get unread notification count
     */
    public function unreadCount(Request $request)
    {
        try {
            $user = $request->user();
            
            $count = Notification::where('recipient_user_id', $user->user_id)
                ->where('is_read', false)
                ->count();
            
            return response()->json([
                'success' => true,
                'unread_count' => $count
            ]);
        } catch (\Exception $e) {
            Log::error('Unread count error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'unread_count' => 0
            ], 500);
        }
    }
    
    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        try {
            $notification = Notification::findOrFail($id);
            $user = $request->user();
            
            if ($notification->recipient_user_id !== $user->user_id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }
            
            $notification->is_read = true;
            $notification->read_at = now();
            $notification->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read'
            ]);
        } catch (\Exception $e) {
            Log::error('Mark as read error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark as read'
            ], 500);
        }
    }
    
    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        try {
            $user = $request->user();
            
            $count = Notification::where('recipient_user_id', $user->user_id)
                ->where('is_read', false)
                ->update(['is_read' => true, 'read_at' => now()]);
            
            return response()->json([
                'success' => true,
                'message' => "{$count} notifications marked as read"
            ]);
        } catch (\Exception $e) {
            Log::error('Mark all as read error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all as read'
            ], 500);
        }
    }
}