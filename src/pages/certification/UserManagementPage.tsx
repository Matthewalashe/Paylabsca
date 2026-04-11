// ============================================================
// UserManagementPage.tsx — Admin user management
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ConfirmModal from "@/components/ui/confirm-modal";
import { ALL_USERS, type AppUser, type UserRole } from "@/lib/auth";
import {
  Users, Plus, Shield, ClipboardCheck, Trash2, ArrowUpCircle, ArrowDownCircle,
  Mail, X, Search, Phone, Hash,
} from "lucide-react";

export default function UserManagementPage() {
  const [users, setUsers] = useState<AppUser[]>(ALL_USERS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // New user fields
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newOracle, setNewOracle] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("billing_officer");

  // Confirm modal states
  const [confirmAction, setConfirmAction] = useState<{ type: "delete" | "upgrade" | "downgrade" | "create"; userId?: string; userName?: string } | null>(null);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.oracleNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = () => {
    if (!newName.trim() || !newEmail.trim() || !newPhone.trim() || !newOracle.trim()) return;
    const user: AppUser = {
      id: `user-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      oracleNumber: newOracle.trim(),
      role: newRole,
      department: "Building Certification Department",
      avatar: newName.split(" ").map(n => n[0]).join("").toUpperCase(),
    };
    setUsers(prev => [...prev, user]);
    setNewName(""); setNewEmail(""); setNewPhone(""); setNewOracle(""); setNewRole("billing_officer");
    setShowAddForm(false);
    setConfirmAction(null);
  };

  const handleDeleteUser = (id: string) => {
    if (id === "co-001") return;
    setUsers(prev => prev.filter(u => u.id !== id));
    setConfirmAction(null);
  };

  const handleUpgradeUser = (id: string) => {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, role: "certification_officer" as UserRole } : u
    ));
    setConfirmAction(null);
  };

  const handleDowngradeUser = (id: string) => {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, role: "billing_officer" as UserRole } : u
    ));
    setConfirmAction(null);
  };

  const isFormValid = newName.trim() && newEmail.trim() && newPhone.trim() && newOracle.trim();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage officers in the Building Certification Department</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4" /> Add New User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
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
            <p className="text-xs text-gray-500">Certification Officers</p>
          </div>
        </div>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border-2 border-[#006400] p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 text-lg">Add New Officer</h3>
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
              <Label>Department</Label>
              <Input value="Building Certification Department" readOnly className="bg-gray-50" />
            </div>
          </div>
          <div className="flex justify-end mt-5">
            <Button
              onClick={() => setConfirmAction({ type: "create" })}
              disabled={!isFormValid}
            >
              <Plus className="w-4 h-4" /> Create User
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
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
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
                      {u.role === "certification_officer" ? "Certification Officer" : "Billing Officer"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {u.role === "billing_officer" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-amber-600 hover:text-amber-700"
                          onClick={() => setConfirmAction({ type: "upgrade", userId: u.id, userName: u.name })}
                        >
                          <ArrowUpCircle className="w-3.5 h-3.5" /> Upgrade
                        </Button>
                      )}
                      {u.role === "certification_officer" && u.id !== "co-001" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-orange-500 hover:text-orange-600"
                          onClick={() => setConfirmAction({ type: "downgrade", userId: u.id, userName: u.name })}
                        >
                          <ArrowDownCircle className="w-3.5 h-3.5" /> Downgrade
                        </Button>
                      )}
                      {u.id !== "co-001" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-red-500 hover:text-red-600"
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

      {/* ===== CONFIRM MODALS ===== */}
      <ConfirmModal
        open={confirmAction?.type === "create"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleAddUser}
        title="Create New User?"
        message={`You are about to create a new ${newRole === "billing_officer" ? "Billing Officer" : "Certification Officer"} account for "${newName}". They will be able to access the system immediately.`}
        confirmText="Create User"
        variant="success"
      />

      <ConfirmModal
        open={confirmAction?.type === "delete"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.userId && handleDeleteUser(confirmAction.userId)}
        title="Delete User Account?"
        message={`Are you sure you want to delete ${confirmAction?.userName}'s account? This action cannot be undone and they will lose access to the system.`}
        confirmText="Delete User"
        variant="danger"
      />

      <ConfirmModal
        open={confirmAction?.type === "upgrade"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.userId && handleUpgradeUser(confirmAction.userId)}
        title="Upgrade to Certification Officer?"
        message={`You are about to upgrade ${confirmAction?.userName} from Billing Officer to Certification Officer. They will gain admin privileges including invoice approval and user management.`}
        confirmText="Upgrade Role"
        variant="warning"
      />

      <ConfirmModal
        open={confirmAction?.type === "downgrade"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.userId && handleDowngradeUser(confirmAction.userId)}
        title="Downgrade to Billing Officer?"
        message={`You are about to downgrade ${confirmAction?.userName} from Certification Officer to Billing Officer. They will lose admin privileges and invoice approval rights.`}
        confirmText="Downgrade Role"
        variant="danger"
      />
    </div>
  );
}
