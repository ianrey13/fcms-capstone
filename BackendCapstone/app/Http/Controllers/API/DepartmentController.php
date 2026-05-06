<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\User;
use App\Models\OicDesignation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DepartmentController extends Controller
{
    /**
     * Display a listing of departments.
     */
    public function index()
    {
        try {
            $departments = Department::orderBy('department_name')->get();

            // Add head of office and OIC info
            $departments->map(function ($department) {
                $department->head_of_office = $this->getCurrentHeadOfOffice($department->department_id);
                $department->current_oic = $this->getCurrentOIC($department->department_id);
                $department->head_status = $this->getHeadStatus($department->department_id);
                return $department;
            });

            return response()->json([
                'success' => true,
                'data' => $departments
            ]);
        } catch (\Exception $e) {
            Log::error('Department index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch departments: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created department.
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'department_name' => 'required|string|max:150|unique:departments,department_name',
                'department_code' => 'required|string|max:20|unique:departments,department_code',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $department = Department::create([
                'department_name' => $request->department_name,
                'department_code' => strtoupper($request->department_code),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Department created successfully',
                'data' => $department
            ], 201);
        } catch (\Exception $e) {
            Log::error('Department store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create department: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified department.
     */
    public function show($id)
    {
        try {
            $department = Department::findOrFail($id);

            // Add additional info
            $department->head_of_office = $this->getCurrentHeadOfOffice($id);
            $department->current_oic = $this->getCurrentOIC($id);
            $department->head_status = $this->getHeadStatus($id);

            return response()->json([
                'success' => true,
                'data' => $department
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        }
    }

    /**
     * Update the specified department.
     */
    public function update(Request $request, $id)
    {
        try {
            $department = Department::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'department_name' => 'required|string|max:150|unique:departments,department_name,' . $id . ',department_id',
                'department_code' => 'required|string|max:20|unique:departments,department_code,' . $id . ',department_id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $department->update([
                'department_name' => $request->department_name,
                'department_code' => strtoupper($request->department_code),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Department updated successfully',
                'data' => $department
            ]);
        } catch (\Exception $e) {
            Log::error('Department update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update department'
            ], 500);
        }
    }

    /**
     * Remove the specified department (soft delete).
     */
    public function destroy($id)
    {
        try {
            $department = Department::findOrFail($id);

            // Check if department has users
            if ($department->users()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete department with existing users'
                ], 400);
            }

            // Soft delete
            $department->deleted_at = now();
            $department->deleted_by = auth()->id();
            $department->save();

            return response()->json([
                'success' => true,
                'message' => 'Department deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Department destroy error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete department'
            ], 500);
        }
    }

    /**
     * Assign Head of Office to a department
     */
    public function assignHeadOfOffice(Request $request, $id)
    {
        try {
            Log::info('Assign Head called', [
                'department_id' => $id,
                'user_id' => $request->user_id,
                'all_input' => $request->all()
            ]);

            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,user_id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $department = Department::findOrFail($id);

            // Get the user
            $user = User::where('user_id', $request->user_id)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Check if user is head_of_office role
            if ($user->role !== User::ROLE_HEAD_OF_OFFICE) {
                return response()->json([
                    'success' => false,
                    'message' => 'User must have head_of_office role. Current role: ' . $user->role
                ], 400);
            }

            DB::beginTransaction();

            // Deactivate any existing active designations for this department
            $existingDesignations = OicDesignation::where('department_id', $id)
                ->where('is_active', true)
                ->get();

            foreach ($existingDesignations as $existing) {
                $existing->is_active = false;
                $existing->revoked_at = now();
                $existing->save();
            }

            // Create new designation
            $designation = new OicDesignation();
            $designation->department_id = $id;
            $designation->head_of_office_id = $user->user_id;
            $designation->oic_user_id = $user->user_id;
            $designation->is_active = true;
            $designation->designated_at = now();
            $designation->save();

            // Update user's department and status
            $user->department_id = $id;
            $user->head_active_status = 'active';
            $user->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Head of Office assigned successfully',
                'data' => [
                    'department' => [
                        'id' => $department->department_id,
                        'name' => $department->department_name,
                        'code' => $department->department_code,
                    ],
                    'head_of_office' => [
                        'id' => $user->user_id,
                        'name' => $user->full_name,
                        'email' => $user->email,
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Assign Head error: ' . $e->getMessage());
            Log::error('Assign Head trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign Head of Office: ' . $e->getMessage()
            ], 500);
        }
    }

   /**
 * Remove Head of Office from a department
 */
public function removeHeadOfOffice($id)
{    
    try {
        Log::info('Remove Head called for department: ' . $id);
        
        $department = Department::find($id);
        if (!$department) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        }
        
        DB::beginTransaction();
        
        // Find and update designation
        $designation = OicDesignation::where('department_id', $id)
            ->where('is_active', true)
            ->first();
        
        if ($designation) {
            $headUserId = $designation->head_of_office_id;
            
            // Just deactivate, don't delete
            $designation->is_active = false;
            $designation->revoked_at = now();
            $designation->save();
            
            // Update the user - DON'T set department_id to null
            if ($headUserId) {
                $user = User::find($headUserId);
                if ($user) {
                    $user->head_active_status = null;
                    // Remove this line: $user->department_id = null;
                    $user->save();
                    Log::info('Updated user ' . $headUserId . ' - removed head status only');
                }
            }
        }
        
        DB::commit();
        
        return response()->json([
            'success' => true,
            'message' => 'Head of Office removed successfully'
        ]);
        
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Remove Head error: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Failed to remove Head of Office: ' . $e->getMessage()
        ], 500);
    }
}

    /**
     * Assign OIC (Officer-in-Charge) to a department
     */
    public function assignOIC(Request $request, $id)
    {
        try {
            Log::info('Assign OIC called', [
                'department_id' => $id,
                'user_id' => $request->user_id
            ]);

            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,user_id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $department = Department::findOrFail($id);
            $user = User::where('user_id', $request->user_id)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $currentDesignation = OicDesignation::where('department_id', $id)
                ->where('is_active', true)
                ->first();

            if (!$currentDesignation) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active department head found. Please assign Head of Office first.'
                ], 400);
            }

            DB::beginTransaction();

            // Update the OIC
            $currentDesignation->oic_user_id = $user->user_id;
            $currentDesignation->save();

            // Update user's department
            if ($user->department_id != $id) {
                $user->department_id = $id;
                $user->save();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'OIC assigned successfully',
                'data' => [
                    'department' => [
                        'id' => $department->department_id,
                        'name' => $department->department_name,
                        'code' => $department->department_code,
                    ],
                    'oic' => [
                        'id' => $user->user_id,
                        'name' => $user->full_name,
                        'email' => $user->email,
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Assign OIC error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign OIC: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove OIC from a department
     */
    public function removeOIC($id)
    {
        try {
            Log::info('Remove OIC called', ['department_id' => $id]);

            $department = Department::findOrFail($id);

            DB::beginTransaction();

            // Get current designation
            $designation = OicDesignation::where('department_id', $id)
                ->where('is_active', true)
                ->first();

            if (!$designation) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active designation found for this department'
                ], 404);
            }

            // Set OIC back to the head (self)
            $designation->oic_user_id = $designation->head_of_office_id;
            $designation->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'OIC removed successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Remove OIC error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove OIC: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Get department leadership info (Head and OIC)
     */
    public function getLeadershipInfo($id)
    {
        try {
            $department = Department::findOrFail($id);

            $head = $this->getCurrentHeadOfOffice($id);
            $oic = $this->getCurrentOIC($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'department' => [
                        'id' => $department->department_id,
                        'name' => $department->department_name,
                        'code' => $department->department_code,
                    ],
                    'head_of_office' => $head,
                    'oic' => $oic,
                    'head_status' => $this->getHeadStatus($id),
                    'has_active_oic' => !is_null($oic),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get Leadership error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch leadership info: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current head of office for a department
     */
    private function getCurrentHeadOfOffice($departmentId)
    {
        $designation = OicDesignation::where('department_id', $departmentId)
            ->where('is_active', true)
            ->first();

        if (!$designation) {
            return null;
        }

        $user = User::where('user_id', $designation->head_of_office_id)->first();
        if (!$user) {
            return null;
        }

        return [
            'id' => $user->user_id,
            'name' => $user->full_name,
            'email' => $user->email,
        ];
    }

    /**
     * Get current OIC for a department (if different from head)
     */
    private function getCurrentOIC($departmentId)
    {
        $designation = OicDesignation::where('department_id', $departmentId)
            ->where('is_active', true)
            ->first();

        if (!$designation) {
            return null;
        }

        // If OIC is the same as head, return null (no separate OIC)
        if ($designation->head_of_office_id == $designation->oic_user_id) {
            return null;
        }

        $user = User::where('user_id', $designation->oic_user_id)->first();
        if (!$user) {
            return null;
        }

        return [
            'id' => $user->user_id,
            'name' => $user->full_name,
            'email' => $user->email,
        ];
    }

    /**
     * Get head status for a department
     */
    private function getHeadStatus($departmentId)
    {
        $head = $this->getCurrentHeadOfOffice($departmentId);
        if (!$head) {
            return 'inactive';
        }

        $user = User::where('user_id', $head['id'])->first();
        return $user && $user->head_active_status === 'active' ? 'active' : 'inactive';
    }
}
