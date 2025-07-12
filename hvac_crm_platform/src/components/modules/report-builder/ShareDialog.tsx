import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { 
  Share, 
  Users, 
  Eye,
  Edit,
  Shield,
  X,
  Plus,
  Trash2,
  Copy,
  Mail,
  Link,
  Globe,
  Lock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ShareDialogProps {
  reportId: string | null;
  onClose: () => void;
  onShare: (args: any) => Promise<void>;
}

export function ShareDialog({ reportId, onClose, onShare }: ShareDialogProps) {
  const [shareMode, setShareMode] = useState<'users' | 'link' | 'public'>('users');
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [defaultPermission, setDefaultPermission] = useState<'view' | 'edit' | 'admin'>('view');
  const [isPublic, setIsPublic] = useState(false);
  const [linkExpiry, setLinkExpiry] = useState('never');

  // Mock users for demonstration
  const availableUsers = [
    { id: 'user1', name: 'Jan Kowalski', email: 'jan.kowalski@hvac.pl', role: 'Technician' },
    { id: 'user2', name: 'Anna Nowak', email: 'anna.nowak@hvac.pl', role: 'Manager' },
    { id: 'user3', name: 'Piotr Wiśniewski', email: 'piotr.wisniewski@hvac.pl', role: 'Admin' },
    { id: 'user4', name: 'Maria Wójcik', email: 'maria.wojcik@hvac.pl', role: 'Analyst' }
  ];

  const permissionLevels = [
    { 
      value: 'view', 
      label: 'View Only', 
      icon: Eye, 
      description: 'Can view the report and its results' 
    },
    { 
      value: 'edit', 
      label: 'Edit', 
      icon: Edit, 
      description: 'Can modify report configuration and settings' 
    },
    { 
      value: 'admin', 
      label: 'Admin', 
      icon: Shield, 
      description: 'Full control including sharing and deletion' 
    }
  ];

  const handleAddUser = () => {
    if (!newUserEmail) return;
    
    const existingUser = availableUsers.find(u => u.email === newUserEmail);
    if (existingUser && !selectedUsers.find(u => u.id === existingUser.id)) {
      setSelectedUsers([...selectedUsers, { ...existingUser, permission: defaultPermission }]);
      setNewUserEmail('');
    } else if (!existingUser) {
      // Add external user
      const newUser = {
        id: `external_${Date.now()}`,
        name: newUserEmail.split('@')[0],
        email: newUserEmail,
        role: 'External',
        permission: defaultPermission
      };
      setSelectedUsers([...selectedUsers, newUser]);
      setNewUserEmail('');
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleUpdatePermission = (userId: string, permission: 'view' | 'edit' | 'admin') => {
    setSelectedUsers(selectedUsers.map(u => 
      u.id === userId ? { ...u, permission } : u
    ));
  };

  const handleShare = async () => {
    if (!reportId) {
      toast.error('No report selected');
      return;
    }

    try {
      // Share with individual users
      for (const user of selectedUsers) {
        await onShare({
          reportId: reportId as any,
          userId: user.id as any,
          permission: user.permission
        });
      }

      toast.success(`Report shared with ${selectedUsers.length} user(s)`);
      onClose();
    } catch (error) {
      toast.error('Failed to share report');
      console.error('Share error:', error);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/reports/${reportId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard');
  };

  const getPermissionIcon = (permission: string) => {
    const perm = permissionLevels.find(p => p.value === permission);
    return perm ? perm.icon : Eye;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Share Report</h2>
            <p className="text-sm text-gray-600">Control who can access and modify this report</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Mode Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {[
              { mode: 'users', label: 'Specific Users', icon: Users },
              { mode: 'link', label: 'Share Link', icon: Link },
              { mode: 'public', label: 'Public Access', icon: Globe }
            ].map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setShareMode(mode as any)}
                className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${
                  shareMode === mode
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {shareMode === 'users' && (
            <div className="space-y-4">
              {/* Add User */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Add People
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddUser()}
                  />
                  <select
                    value={defaultPermission}
                    onChange={(e) => setDefaultPermission(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {permissionLevels.map(perm => (
                      <option key={perm.value} value={perm.value}>
                        {perm.label}
                      </option>
                    ))}
                  </select>
                  <Button onClick={handleAddUser} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* User Suggestions */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Suggested Users</div>
                <div className="grid grid-cols-2 gap-2">
                  {availableUsers
                    .filter(user => !selectedUsers.find(u => u.id === user.id))
                    .slice(0, 4)
                    .map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUsers([...selectedUsers, { ...user, permission: defaultPermission }]);
                      }}
                      className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 text-left"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                        <div className="text-xs text-gray-500 truncate">{user.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    People with access ({selectedUsers.length})
                  </div>
                  <div className="space-y-2">
                    {selectedUsers.map(user => {
                      const PermissionIcon = getPermissionIcon(user.permission);
                      return (
                        <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">
                                {user.name.split(' ').map((n: string) => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <select
                              value={user.permission}
                              onChange={(e) => handleUpdatePermission(user.id, e.target.value as any)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            >
                              {permissionLevels.map(perm => (
                                <option key={perm.value} value={perm.value}>
                                  {perm.label}
                                </option>
                              ))}
                            </select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveUser(user.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {shareMode === 'link' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Link className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Share via Link</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Anyone with this link will be able to view the report. 
                      You can set an expiration date for security.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Link Expiration
                </label>
                <select
                  value={linkExpiry}
                  onChange={(e) => setLinkExpiry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="never">Never expires</option>
                  <option value="1day">1 day</option>
                  <option value="1week">1 week</option>
                  <option value="1month">1 month</option>
                  <option value="3months">3 months</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={`${window.location.origin}/reports/${reportId}`}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                />
                <Button onClick={handleCopyLink} variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          )}

          {shareMode === 'public' && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Public Access</h4>
                    <p className="text-sm text-yellow-800 mt-1">
                      Making this report public will allow anyone to view it without authentication. 
                      This includes sensitive HVAC and customer data.
                    </p>
                  </div>
                </div>
              </div>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium">Make report publicly accessible</div>
                  <div className="text-xs text-gray-600">
                    Anyone with the link can view this report
                  </div>
                </div>
              </label>

              {isPublic && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      Report is now publicly accessible
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {shareMode === 'users' && selectedUsers.length > 0 && 
              `${selectedUsers.length} user(s) will be notified`
            }
            {shareMode === 'link' && 'Link sharing enabled'}
            {shareMode === 'public' && isPublic && 'Public access enabled'}
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleShare}
              disabled={shareMode === 'users' && selectedUsers.length === 0}
            >
              <Share className="w-4 h-4 mr-2" />
              Share Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
