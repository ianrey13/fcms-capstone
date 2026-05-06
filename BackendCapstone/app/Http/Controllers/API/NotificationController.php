<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

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
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
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
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
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
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}