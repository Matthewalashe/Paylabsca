// ============================================================
// UserManagementPage.tsx — Full user CRUD with auth management
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ConfirmModal from "@/components/ui/confirm-modal";
import { useAuth, type UserRole } from "@/lib/auth";
import { toast } from "sonner";
import {
  Users, Plus, Shield, ClipboardCheck, Trash2, ArrowUpCircle, ArrowDownCircle,
  Mail, X, Search, Phone, Hash, KeyRound, Eye, EyeOff, RotateCcw,
  UserCheck, UserX, CheckCircle, AlertTriangle,
} from "lucide-react";

export default function UserManagementPage() {
  const { getAllUsers, createUser, deleteUser, updateUserRole, resetPassword, suspendUser, activateUser } = useAuth();
  const users = getAllUsers();

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // New user fields
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newOracle, setNewOracle] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("billing_officer");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Reset password modal
  const [resetModal, setResetModal] = useState<{ userId: string; userName: string } | null>(null);
  const [resetNewPass, setResetNewPass] = useState("");
  const [showResetPass, setShowResetPass] = useState(false);

  // Confirm modal states
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "upgrade" | "downgrade" | "create" | "suspend" | "activate";
    userId?: string;
    userName?: string;
  } | null>(null);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.oracleNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = () => {
    if (!newName.trim() || !newEmail.trim() || !newPhone.trim() || !newOracle.trim() || !newPassword) return;
    const result = createUser({
      name: newName,
      email: newEmail,
      phone: newPhone,
      oracleNumber: newOracle,
      role: newRole,
      password: newPassword,
    });
    if (result.success) {
      toast.success(`User "${newName}" created successfully with ${newRole === "billing_officer" ? "Billing" : "Certification"} Officer role.`);
      setNewName(""); setNewEmail(""); setNewPhone(""); setNewOracle(""); setNewRole("billing_officer"); setNewPassword("");
      setShowAddForm(false);
    } else {
      toast.error(result.error || "Failed to create user.");
    }
    setConfirmAction(null);
  };

  const handleDeleteUser = (id: string) => {
    deleteUser(id);
    toast.success("User account removed.");
    setConfirmAction(null);
  };

  const handleUpgradeUser = (id: string) => {
    updateUserRole(id, "certification_officer");
    toast.success("User upgraded to Certification Officer.");
    setConfirmAction(null);
  };

  const handleDowngradeUser = (id: string) => {
    updateUserRole(id, "billing_officer");
    toast.success("User downgraded to Billing Officer.");
    setConfirmAction(null);
  };

  const handleSuspendUser = (id: string) => {
    suspendUser(id);
    toast.success("User account suspended.");
    setConfirmAction(null);
  };

  const handleActivateUser = (id: string) => {
    activateUser(id);
    toast.success("User account activated.");
    setConfirmAction(null);
  };

  const handleResetPassword = () => {
    if (!resetModal || !resetNewPass) return;
    resetPassword(resetModal.userId, resetNewPass);
    toast.success(`Password reset for ${resetModal.userName}.`);
    setResetModal(null);
    setResetNewPass("");
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    let pass = "";
    for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    return pass;
  };

  const isFormValid = newName.trim() && newEmail.trim() && newPhone.trim() && newOracle.trim() && newPassword.length >= 6;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create accounts, manage roles, and control access credentials</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4" /> Add New User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{users.length}</p>
            <p className="text-xs text-gray-500">Total Users</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{users.filter(u => u.role === "billing_officer").length}</p>
            <p className="text-xs text-gray-500">Billing Officers</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{users.filter(u => u.role === "certification_officer").length}</p>
            <p className="text-xs text-gray-500">Cert Officers</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{users.filter(u => u.status === "active").length}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
        </div>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border-2 border-[#006400] p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 text-lg">Create New Officer Account</h3>
            <button onClick={() => setShowAddForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input placeholder="e.g. John Doe" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" placeholder="e.g. j.doe@lasbca.lg.gov.ng" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number *</Label>
              <Input type="tel" placeholder="+234..." value={newPhone} onChange={e => setNewPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Oracle Number *</Label>
              <Input placeholder="e.g. ORC-2024-0500" value={newOracle} onChange={e => setNewOracle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}>
                <option value="billing_officer">Billing Officer</option>
                <option value="certification_officer">Certification Officer</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Login Password *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input 
                    type={showNewPassword ? "text" : "password"} 
                    placeholder="Min 6 characters" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    className="pl-10 pr-10"
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs whitespace-nowrap"
                  onClick={() => setNewPassword(generatePassword())}
                >
                  Generate
                </Button>
              </div>
              {newPassword && newPassword.length < 6 && (
                <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters.</p>
              )}
            </div>
          </div>
          <div className="flex justify-end mt-5">
            <Button
              onClick={() => setConfirmAction({ type: "create" })}
              disabled={!isFormValid}
            >
              <Plus className="w-4 h-4" /> Create User Account
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Search by name, email, or oracle number..."
          className="pl-9"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* User List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Oracle #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${u.status === "suspended" ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${u.role === "certification_officer" ? "bg-[#D4AF37]" : "bg-[#006400]"}`}>
                        {u.avatar || "U"}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">{u.name}</span>
                        <p className="text-xs text-gray-500">{u.department}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs"><Mail className="w-3 h-3" />{u.email}</div>
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs"><Phone className="w-3 h-3" />{u.phone}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3 h-3 text-gray-400" />
                      <span className="font-mono text-xs font-bold text-gray-700">{u.oracleNumber}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === "certification_officer" ? "approved" : "default"}>
                      {u.role === "certification_officer" ? "Certification" : "Billing"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.status === "active" ? "approved" : "overdue"}>
                      {u.status === "active" ? "Active" : "Suspended"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {/* Reset Password */}
                      <Button
                        variant="ghost" size="sm"
                        className="h-8 text-xs text-blue-600 hover:text-blue-700"
                        onClick={() => setResetModal({ userId: u.id, userName: u.name })}
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                      </Button>

                      {/* Upgrade/Downgrade */}
                      {u.role === "billing_officer" && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-amber-600 hover:text-amber-700"
                          onClick={() => setConfirmAction({ type: "upgrade", userId: u.id, userName: u.name })}
                        >
                          <ArrowUpCircle className="w-3.5 h-3.5" /> Upgrade
                        </Button>
                      )}
                      {u.role === "certification_officer" && u.id !== "co-001" && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-orange-500 hover:text-orange-600"
                          onClick={() => setConfirmAction({ type: "downgrade", userId: u.id, userName: u.name })}
                        >
                          <ArrowDownCircle className="w-3.5 h-3.5" /> Downgrade
                        </Button>
                      )}

                      {/* Suspend/Activate */}
                      {u.id !== "co-001" && u.status === "active" && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-yellow-600 hover:text-yellow-700"
                          onClick={() => setConfirmAction({ type: "suspend", userId: u.id, userName: u.name })}
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {u.id !== "co-001" && u.status === "suspended" && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-green-600 hover:text-green-700"
                          onClick={() => setConfirmAction({ type: "activate", userId: u.id, userName: u.name })}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {/* Delete */}
                      {u.id !== "co-001" && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-red-500 hover:text-red-600"
                          onClick={() => setConfirmAction({ type: "delete", userId: u.id, userName: u.name })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {u.id === "co-001" && (
                        <span className="text-xs text-gray-400 italic px-2">Primary Admin</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== RESET PASSWORD MODAL ===== */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Reset Password</h3>
            <p className="text-sm text-gray-500 mb-5">Set a new password for <strong>{resetModal.userName}</strong>.</p>
            <div className="space-y-3">
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type={showResetPass ? "text" : "password"}
                  placeholder="New password (min 6 characters)"
                  value={resetNewPass}
                  onChange={e => setResetNewPass(e.target.value)}
                  className="pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowResetPass(!showResetPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showResetPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setResetNewPass(generatePassword())}>
                Generate Secure Password
              </Button>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => { setResetModal(null); setResetNewPass(""); }}>Cancel</Button>
              <Button onClick={handleResetPassword} disabled={resetNewPass.length < 6}>
                <KeyRound className="w-4 h-4" /> Set New Password
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CONFIRM MODALS ===== */}
      <ConfirmModal
        open={confirmAction?.type === "create"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleAddUser}
        title="Create New User Account?"
        message={`Create a ${newRole === "billing_officer" ? "Billing Officer" : "Certification Officer"} account for "${newName}" (${newEmail}). They will be able to sign in immediately with the password you set.`}
        confirmText="Create Account"
        variant="success"
      />
      <ConfirmModal
        open={confirmAction?.type === "delete"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.userId && handleDeleteUser(confirmAction.userId)}
        title="Delete User Account?"
        message={`Permanently remove ${confirmAction?.userName}'s account? They will lose all access.`}
        confirmText="Delete User"
        variant="danger"
      />
      <ConfirmModal
        open={confirmAction?.type === "upgrade"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.userId && handleUpgradeUser(confirmAction.userId)}
        title="Upgrade to Certification Officer?"
        message={`Upgrade ${confirmAction?.userName} to Certification Officer? They will gain admin privileges including invoice approval and user management.`}
        confirmText="Upgrade Role"
        variant="warning"
      />
      <ConfirmModal
        open={confirmAction?.type === "downgrade"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.userId && handleDowngradeUser(confirmAction.userId)}
        title="Downgrade to Billing Officer?"
        message={`Downgrade ${confirmAction?.userName} to Billing Officer? They will lose admin privileges.`}
        confirmText="Downgrade Role"
        variant="danger"
      />
      <ConfirmModal
        open={confirmAction?.type === "suspend"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.userId && handleSuspendUser(confirmAction.userId)}
        title="Suspend User Account?"
        message={`Suspend ${confirmAction?.userName}'s account? They will be unable to sign in until reactivated.`}
        confirmText="Suspend"
        variant="warning"
      />
      <ConfirmModal
        open={confirmAction?.type === "activate"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.userId && handleActivateUser(confirmAction.userId)}
        title="Activate User Account?"
        message={`Reactivate ${confirmAction?.userName}'s account? They will be able to sign in again.`}
        confirmText="Activate"
        variant="success"
      />
    </div>
  );
}
