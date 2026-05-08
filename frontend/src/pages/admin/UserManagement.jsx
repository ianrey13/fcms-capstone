// src/pages/admin/UserManagement.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, departmentAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Shield,
  Building2,
  Mail,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter
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
  const [showFilters, setShowFilters] = useState(false);
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
      setTimeout(() => setErrorMessage(''), 3000);
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.includes('image/png') && !file.type.includes('image/jpeg') && !file.type.includes('image/jpg')) {
        setErrorMessage('Please upload a PNG or JPG image');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Signature image must be less than 2MB');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }
      setSignatureFile(file);
      setSignaturePreview(URL.createObjectURL(file));
    }
  };

  const handleUploadSignature = async () => {
    if (!signatureFile) {
      setErrorMessage('Please select a signature image');
      return;
    }

    setUploadingSignature(true);
    try {
      const formData = new FormData();
      formData.append('signature', signatureFile);
      
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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      const response = await userAPI.create(formData);
      setSuccessMessage('User created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
      
      if (formData.role === 'head_of_office' && response.data?.data?.user_id) {
        setSelectedUser(response.data.data);
        setTimeout(() => setShowSignatureModal(true), 500);
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to create user');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

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

  const handleDeleteUser = async () => {
    try {
      await userAPI.delete(selectedUser.user_id);
      setSuccessMessage('User deactivated successfully');
      setShowDeleteModal(false);
      fetchUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to deactivate user');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      await userAPI.resetPassword(userId);
      setSuccessMessage('Password reset successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to reset password');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

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

  const openSignatureModal = (user) => {
    setSelectedUser(user);
    setSignatureFile(null);
    setSignaturePreview(null);
    setShowSignatureModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

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

  const getRoleBadgeColor = (role) => {
    const colors = {
      superadmin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
      gso_staff: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      mayors_office: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      dept_office: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      head_of_office: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
      driver: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

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

  const hasSignature = (user) => {
    return user.has_signature || user.signature_url;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchTerm !== '' || roleFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage system users, roles, and permissions</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)} 
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-5 w-5" />
          {errorMessage}
        </div>
      )}

      {/* Filters Card */}
      <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden transition-all duration-300">
        <div 
          className="px-6 py-4 border-b dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Filters</span>
              {hasActiveFilters && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                  Active
                </span>
              )}
            </div>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
        
        {showFilters && (
          <div className="p-6 animate-slide-down">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
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
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={fetchUsers} 
                  className="flex-1 flex items-center gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    onClick={clearFilters}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Users Table */}
      <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden">
        <CardHeader className="border-b dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Users className="h-5 w-5" />
            Users
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
              ({filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No users found</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">E-Signature</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredUsers.map((user, index) => (
                    <tr 
                      key={user.user_id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-white text-sm font-bold">
                              {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {user.first_name} {user.last_name}
                            </p>
                            {user.middle_name && (
                              <p className="text-xs text-slate-400">{user.middle_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-400 text-sm">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-400 text-sm">{user.department_name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.role === 'head_of_office' ? (
                          <button
                            onClick={() => openSignatureModal(user)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                              hasSignature(user)
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
                                : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                            }`}
                          >
                            <FileSignature className="h-3 w-3" />
                            {hasSignature(user) ? 'Uploaded' : 'Upload'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">Not required</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                            user.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
                              : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
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
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30 h-8 w-8 p-0"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(user.user_id)}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-950/30 h-8 w-8 p-0"
                            title="Reset Password"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          {user.user_id !== currentUser?.user_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteModal(user)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 h-8 w-8 p-0"
                              title="Delete User"
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

      {/* Create User Modal - Premium Design */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New User</h2>
              </div>
              <button 
                onClick={() => { setShowCreateModal(false); resetForm(); }} 
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              {/* Form fields... */}
              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium">Email *</Label>
                <Input
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`mt-1.5 dark:bg-slate-900 dark:border-slate-700 ${formErrors.email ? 'border-red-500' : ''}`}
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">First Name *</Label>
                  <Input
                    name="first_name"
                    placeholder="First name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={`mt-1.5 dark:bg-slate-900 dark:border-slate-700 ${formErrors.first_name ? 'border-red-500' : ''}`}
                  />
                  {formErrors.first_name && <p className="text-red-500 text-xs mt-1">{formErrors.first_name}</p>}
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Last Name *</Label>
                  <Input
                    name="last_name"
                    placeholder="Last name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={`mt-1.5 dark:bg-slate-900 dark:border-slate-700 ${formErrors.last_name ? 'border-red-500' : ''}`}
                  />
                  {formErrors.last_name && <p className="text-red-500 text-xs mt-1">{formErrors.last_name}</p>}
                </div>
              </div>
              
              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium">Middle Name</Label>
                <Input
                  name="middle_name"
                  placeholder="Middle name (optional)"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                  className="mt-1.5 dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              
              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium">Department *</Label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleInputChange}
                  className="w-full mt-1.5 px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
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
                <Label className="text-slate-700 dark:text-slate-300 font-medium">Role *</Label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full mt-1.5 px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
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
              
              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium">Password *</Label>
                <Input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`mt-1.5 dark:bg-slate-900 dark:border-slate-700 ${formErrors.password ? 'border-red-500' : ''}`}
                />
                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
              </div>
              
              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium">Confirm Password *</Label>
                <Input
                  name="password_confirmation"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password_confirmation}
                  onChange={handleInputChange}
                  className={`mt-1.5 dark:bg-slate-900 dark:border-slate-700 ${formErrors.password_confirmation ? 'border-red-500' : ''}`}
                />
                {formErrors.password_confirmation && <p className="text-red-500 text-xs mt-1">{formErrors.password_confirmation}</p>}
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md">
                  Create User
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }} className="flex-1 dark:border-slate-700 dark:text-slate-300">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal - Similar design */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Edit className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit User</h2>
              </div>
              <button onClick={() => { setShowEditModal(false); resetForm(); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-5 space-y-4">
              {/* Same form fields as create modal, without password requirement */}
              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium">Email *</Label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`mt-1.5 dark:bg-slate-900 dark:border-slate-700 ${formErrors.email ? 'border-red-500' : ''}`}
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">First Name *</Label>
                  <Input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={`mt-1.5 dark:bg-slate-900 dark:border-slate-700 ${formErrors.first_name ? 'border-red-500' : ''}`}
                  />
                  {formErrors.first_name && <p className="text-red-500 text-xs mt-1">{formErrors.first_name}</p>}
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Last Name *</Label>
                  <Input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={`mt-1.5 dark:bg-slate-900 dark:border-slate-700 ${formErrors.last_name ? 'border-red-500' : ''}`}
                  />
                  {formErrors.last_name && <p className="text-red-500 text-xs mt-1">{formErrors.last_name}</p>}
                </div>
              </div>
              
              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium">Middle Name</Label>
                <Input
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                  className="mt-1.5 dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              
              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium">Department *</Label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleInputChange}
                  className="w-full mt-1.5 px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
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
                <Label className="text-slate-700 dark:text-slate-300 font-medium">Role *</Label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full mt-1.5 px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
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
              
              <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl">
                <p className="text-sm text-amber-800 dark:text-amber-400">Leave password blank to keep current password</p>
              </div>
              
              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium">New Password (Optional)</Label>
                <Input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1.5 dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              
              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium">Confirm New Password</Label>
                <Input
                  name="password_confirmation"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password_confirmation}
                  onChange={handleInputChange}
                  className="mt-1.5 dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md">
                  Update User
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowEditModal(false); resetForm(); }} className="flex-1 dark:border-slate-700 dark:text-slate-300">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signature Upload Modal */}
      {showSignatureModal && selectedUser && (
        <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
          <DialogContent className="max-w-md dark:bg-slate-800 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Upload E-Signature</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Upload a signature image for {selectedUser.first_name} {selectedUser.last_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div 
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200"
                onClick={() => fileInputRef.current?.click()}
              >
                {signaturePreview ? (
                  <div className="text-center">
                    <img 
                      src={signaturePreview} 
                      alt="Signature Preview" 
                      className="max-w-full max-h-32 mx-auto mb-3 border rounded-lg dark:border-slate-600"
                    />
                    <p className="text-sm text-blue-600 dark:text-blue-400">Click to change</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileSignature className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-1">Click to upload signature image</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">PNG or JPG, max 2MB</p>
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
                <div className="flex justify-between items-center text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">
                  <span className="text-slate-600 dark:text-slate-400 truncate">{signatureFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSignatureFile(null);
                      setSignaturePreview(null);
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors"
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
              }} className="dark:border-slate-700 dark:text-slate-300">
                Cancel
              </Button>
              <Button 
                onClick={handleUploadSignature} 
                disabled={!signatureFile || uploadingSignature}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Trash2 className="h-7 w-7 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-center mb-2 text-slate-900 dark:text-white">Delete User</h2>
              <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
                Are you sure you want to deactivate <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?<br />
                The user can be reactivated later.
              </p>
              <div className="flex gap-3">
                <Button onClick={handleDeleteUser} className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-md">
                  Yes, Deactivate
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1 dark:border-slate-700 dark:text-slate-300">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;