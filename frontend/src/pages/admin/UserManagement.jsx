import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, departmentAPI, fileAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '../../services/api';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  CheckCircle,
  XCircle,
  RefreshCw,
  UserPlus,
  AlertCircle,
  Upload,
  FileSignature,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    department_id: '',
    role: '',
    password: '',
    password_confirmation: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  // Fetch users and departments on load
  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAll();
      setUsers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setErrorMessage('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getAll();
      setDepartments(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

 // Handle signature file selection
const handleSignatureChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    console.log('File selected:', file.name, file.type, file.size);
    
    // Validate file type
    if (!file.type.includes('image/png') && !file.type.includes('image/jpeg') && !file.type.includes('image/jpg')) {
      setErrorMessage('Please upload a PNG or JPG image');
      return;
    }
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Signature image must be less than 2MB');
      return;
    }
    setSignatureFile(file);
    setSignaturePreview(URL.createObjectURL(file));
  }
};

// Upload signature for user - FIXED VERSION
const handleUploadSignature = async () => {
  if (!signatureFile) {
    setErrorMessage('Please select a signature image');
    return;
  }

  setUploadingSignature(true);
  try {
    const formData = new FormData();
    formData.append('signature', signatureFile);
    
    // IMPORTANT: Pass the user ID in the URL
    await userAPI.uploadSignature(selectedUser.user_id, formData);
    
    setSuccessMessage('E-signature uploaded successfully');
    setShowSignatureModal(false);
    setSignatureFile(null);
    setSignaturePreview(null);
    fetchUsers();
    setTimeout(() => setSuccessMessage(''), 3000);
  } catch (error) {
    console.error('Upload error:', error);
    setErrorMessage(error.response?.data?.message || 'Failed to upload signature');
    setTimeout(() => setErrorMessage(''), 3000);
  } finally {
    setUploadingSignature(false);
  }
};

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.first_name) errors.first_name = 'First name is required';
    if (!formData.last_name) errors.last_name = 'Last name is required';
    if (!formData.department_id) errors.department_id = 'Department is required';
    if (!formData.role) errors.role = 'Role is required';
    
    if (!showEditModal) {
      if (!formData.password) errors.password = 'Password is required';
      if (formData.password !== formData.password_confirmation) {
        errors.password_confirmation = 'Passwords do not match';
      }
      if (formData.password && formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      const response = await userAPI.create(formData);
      setSuccessMessage('User created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
      
      // If user is head_of_office, prompt to upload signature
      if (formData.role === 'head_of_office' && response.data?.data?.user_id) {
        setSelectedUser(response.data.data);
        setTimeout(() => {
          setShowSignatureModal(true);
        }, 500);
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to create user');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Update user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      await userAPI.update(selectedUser.user_id, formData);
      setSuccessMessage('User updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to update user');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    try {
      await userAPI.delete(selectedUser.user_id);
      setSuccessMessage('User deleted successfully');
      setShowDeleteModal(false);
      fetchUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to delete user');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Reset password
  const handleResetPassword = async (userId) => {
    try {
      await userAPI.resetPassword(userId);
      setSuccessMessage('Password reset link sent to user');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to reset password');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Toggle user status
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await userAPI.updateStatus(user.user_id, newStatus);
      fetchUsers();
      setSuccessMessage(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to update user status');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Open edit modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      middle_name: user.middle_name || '',
      department_id: user.department_id,
      role: user.role,
      password: '',
      password_confirmation: ''
    });
    setShowEditModal(true);
  };

  // Open signature modal
  const openSignatureModal = (user) => {
    setSelectedUser(user);
    setSignatureFile(null);
    setSignaturePreview(null);
    setShowSignatureModal(true);
  };

  // Open delete modal
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      middle_name: '',
      department_id: '',
      role: '',
      password: '',
      password_confirmation: ''
    });
    setFormErrors({});
    setSelectedUser(null);
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    const colors = {
      superadmin: 'bg-purple-100 text-purple-800',
      gso_staff: 'bg-blue-100 text-blue-800',
      mayors_office: 'bg-green-100 text-green-800',
      dept_office: 'bg-yellow-100 text-yellow-800',
      head_of_office: 'bg-orange-100 text-orange-800',
      driver: 'bg-cyan-100 text-cyan-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  // Get role label
  const getRoleLabel = (role) => {
    const labels = {
      superadmin: 'Super Admin',
      gso_staff: 'GSO Staff',
      mayors_office: "Mayor's Office",
      dept_office: 'Dept Staff',
      head_of_office: 'Dept Head',
      driver: 'Driver'
    };
    return labels[role] || role;
  };

  // Check if user has signature
  const hasSignature = (user) => {
    return user.has_signature || user.signature_url;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users, roles, and permissions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add New User
        </Button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {errorMessage}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="superadmin">Super Admin</option>
              <option value="gso_staff">GSO Staff</option>
              <option value="mayors_office">Mayor's Office</option>
              <option value="dept_office">Dept Staff</option>
              <option value="head_of_office">Dept Head</option>
              <option value="driver">Driver</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button variant="outline" onClick={fetchUsers} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-Signature</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </p>
                          </div>
                        </div>
                       </td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3 text-gray-600">{user.department_name || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.role === 'head_of_office' && (
                          <button
                            onClick={() => openSignatureModal(user)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              hasSignature(user)
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            <FileSignature className="h-3 w-3" />
                            {hasSignature(user) ? 'Uploaded' : 'Missing'}
                          </button>
                        )}
                        {user.role !== 'head_of_office' && (
                          <span className="text-xs text-gray-400">Not required</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            user.status === 'active'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {user.status === 'active' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(user.user_id)}
                            className="text-yellow-600 hover:text-yellow-700"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          {user.user_id !== currentUser?.user_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteModal(user)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Create New User</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-4 space-y-4">
              {/* ... keep existing form fields ... */}
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={formErrors.email ? 'border-red-500' : ''}
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={formErrors.first_name ? 'border-red-500' : ''}
                  />
                  {formErrors.first_name && <p className="text-red-500 text-xs mt-1">{formErrors.first_name}</p>}
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={formErrors.last_name ? 'border-red-500' : ''}
                  />
                  {formErrors.last_name && <p className="text-red-500 text-xs mt-1">{formErrors.last_name}</p>}
                </div>
              </div>
              
              <div>
                <Label htmlFor="middle_name">Middle Name (Optional)</Label>
                <Input
                  id="middle_name"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <Label htmlFor="department_id">Department *</Label>
                <select
                  id="department_id"
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
                {formErrors.department_id && <p className="text-red-500 text-xs mt-1">{formErrors.department_id}</p>}
              </div>
              
              <div>
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Role</option>
                  <option value="gso_staff">GSO Staff</option>
                  <option value="mayors_office">Mayor's Office</option>
                  <option value="dept_office">Department Office</option>
                  <option value="head_of_office">Department Head</option>
                  <option value="driver">Driver</option>
                </select>
                {formErrors.role && <p className="text-red-500 text-xs mt-1">{formErrors.role}</p>}
              </div>
              
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={formErrors.password ? 'border-red-500' : ''}
                />
                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
              </div>
              
              <div>
                <Label htmlFor="password_confirmation">Confirm Password *</Label>
                <Input
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  value={formData.password_confirmation}
                  onChange={handleInputChange}
                  className={formErrors.password_confirmation ? 'border-red-500' : ''}
                />
                {formErrors.password_confirmation && <p className="text-red-500 text-xs mt-1">{formErrors.password_confirmation}</p>}
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">Create User</Button>
                <Button type="button" variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Edit User</h2>
              <button onClick={() => { setShowEditModal(false); resetForm(); }} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-4 space-y-4">
              {/* ... keep existing form fields ... */}
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={formErrors.email ? 'border-red-500' : ''}
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-first_name">First Name *</Label>
                  <Input
                    id="edit-first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={formErrors.first_name ? 'border-red-500' : ''}
                  />
                  {formErrors.first_name && <p className="text-red-500 text-xs mt-1">{formErrors.first_name}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-last_name">Last Name *</Label>
                  <Input
                    id="edit-last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={formErrors.last_name ? 'border-red-500' : ''}
                  />
                  {formErrors.last_name && <p className="text-red-500 text-xs mt-1">{formErrors.last_name}</p>}
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-middle_name">Middle Name (Optional)</Label>
                <Input
                  id="edit-middle_name"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-department_id">Department *</Label>
                <select
                  id="edit-department_id"
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
                {formErrors.department_id && <p className="text-red-500 text-xs mt-1">{formErrors.department_id}</p>}
              </div>
              
              <div>
                <Label htmlFor="edit-role">Role *</Label>
                <select
                  id="edit-role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Role</option>
                  <option value="gso_staff">GSO Staff</option>
                  <option value="mayors_office">Mayor's Office</option>
                  <option value="dept_office">Department Staff</option>
                  <option value="head_of_office">Department Head</option>
                  <option value="driver">Driver</option>
                </select>
                {formErrors.role && <p className="text-red-500 text-xs mt-1">{formErrors.role}</p>}
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">Leave password blank to keep current password</p>
              </div>
              
              <div>
                <Label htmlFor="edit-password">New Password (Optional)</Label>
                <Input
                  id="edit-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-password_confirmation">Confirm New Password</Label>
                <Input
                  id="edit-password_confirmation"
                  name="password_confirmation"
                  type="password"
                  value={formData.password_confirmation}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">Update User</Button>
                <Button type="button" variant="outline" onClick={() => { setShowEditModal(false); resetForm(); }} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

{showSignatureModal && selectedUser && (
  <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Upload E-Signature</DialogTitle>
        <DialogDescription>
          Upload a signature image for {selectedUser.first_name} {selectedUser.last_name}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div 
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {signaturePreview ? (
            <div className="text-center">
              <img 
                src={signaturePreview} 
                alt="Signature Preview" 
                className="max-w-full max-h-32 mx-auto mb-3 border rounded"
              />
              <p className="text-sm text-blue-600">Click to change</p>
            </div>
          ) : (
            <div className="text-center">
              <FileSignature className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 font-medium mb-1">Click to upload signature image</p>
              <p className="text-xs text-gray-400">PNG or JPG, max 2MB</p>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleSignatureChange}
          className="hidden"
        />
        
        {signatureFile && (
          <div className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
            <span className="text-gray-600 truncate">{signatureFile.name}</span>
            <button
              type="button"
              onClick={() => {
                setSignatureFile(null);
                setSignaturePreview(null);
              }}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => {
          setShowSignatureModal(false);
          setSignatureFile(null);
          setSignaturePreview(null);
        }}>
          Cancel
        </Button>
        <Button 
          onClick={handleUploadSignature} 
          disabled={!signatureFile || uploadingSignature}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {uploadingSignature ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Signature
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}

      {/* Delete Confirmation Modal
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-center mb-2">Delete User</h2>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete user <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?<br />
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button onClick={handleDeleteUser} className="flex-1 bg-red-600 hover:bg-red-700">
                  Delete
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default UserManagement;