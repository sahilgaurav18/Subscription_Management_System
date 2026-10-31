import React, { useState, useEffect, useCallback } from 'react';
import type { User, PaginatedResponse } from '../types/models';
import { api } from '../services/api';
import { Pagination } from '../components/Pagination';
import { LoadingState, EmptyState, ErrorState } from '../components/UIStates';
import { validatePassword } from '../utils/validation';
import { PasswordRequirements } from '../components/PasswordRequirements';
import { formatDate } from '../utils/format';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { UserCheck, Plus, Search, AlertCircle } from 'lucide-react';

export const Staff: React.FC = () => {
  const [data, setData] = useState<PaginatedResponse<User>>({
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 1,
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'staff' | 'admin'>('staff');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResponse<User>>('/users', {
        page,
        page_size: pageSize,
        q: search || undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load staff users');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const openCreateModal = () => {
    setFormEmail('');
    setFormPassword('');
    setFormRole('staff');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const check = validatePassword(formPassword);
    if (!check.isValid) {
      setModalError('Password does not meet the complexity requirements.');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/users/staff', {
        email: formEmail,
        password: formPassword,
        role: formRole,
      });
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create staff member');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUserActive = async (user: User) => {
    const actionName = user.is_active ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${actionName} this account?`)) return;

    try {
      await api.patch(`/users/${user.id}`, {
        is_active: !user.is_active,
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1F1A21] tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#6B4A6B]" />
            <span>Staff & Access Management</span>
          </h1>
          <p className="text-[13px] text-[#6D6572] mt-1">
            Create internal staff roles and manage account access permissions
          </p>
        </div>

        <Button
          variant="primary"
          onClick={openCreateModal}
          icon={<Plus className="w-4 h-4" />}
          className="self-start sm:self-auto"
        >
          Add Staff Member
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6D6572] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="erp-input pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            Filter
          </Button>
        </form>
      </Card>

      {/* Table Card */}
      <Card noPadding className="overflow-hidden">
        {error && (
          <div className="p-4 bg-[#FDF2F2] text-[13px] text-[#C0392B] border-b border-[#F8D2D0]">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead className="bg-[#F6F5F7] text-[12px] font-medium text-[#6D6572] border-b border-[#E3DFE5]">
              <tr>
                <th className="py-3 px-4">User Email</th>
                <th className="py-3 px-4 text-center">Role</th>
                <th className="py-3 px-4 text-center">Account Status</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DFE5] text-[13px] text-[#1F1A21]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-6">
                    <LoadingState message="Loading staff accounts..." />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-6 px-4">
                    <ErrorState message={error} onRetry={fetchUsers} />
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 px-4">
                    <EmptyState
                      title="No Staff Accounts Found"
                      description="Create internal staff accounts to delegate subscription and invoice management."
                      actionLabel="+ Add Staff Member"
                      onAction={openCreateModal}
                    />
                  </td>
                </tr>
              ) : (
                data.items.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F6F5F7] transition">
                    <td className="py-3 px-4 font-medium text-[#1F1A21]">{u.email}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`capitalize px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          u.role === 'admin'
                            ? 'bg-[#F1EAF1] text-[#6B4A6B] border-[#E3DFE5]'
                            : u.role === 'staff'
                            ? 'bg-[#EBF8FF] text-[#2B6CB0] border-[#BEE3F8]'
                            : 'bg-[#EDFDF5] text-[#1E8E5A] border-[#C6F6D5]'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.is_active ? (
                        <span className="text-[#1E8E5A] font-semibold bg-[#EDFDF5] px-2 py-0.5 rounded text-[11px] border border-[#C6F6D5]">
                          Active
                        </span>
                      ) : (
                        <span className="text-[#C0392B] font-semibold bg-[#FDF2F2] px-2 py-0.5 rounded text-[11px] border border-[#F8D2D0]">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#6D6572] font-mono tabular-nums text-[12px]">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant={u.is_active ? 'danger' : 'secondary'}
                        size="sm"
                        onClick={() => toggleUserActive(u)}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={data.page}
          pageSize={data.page_size}
          total={data.total}
          totalPages={data.total_pages}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Staff Account"
        maxWidth="md"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-[#FDF2F2] border border-[#F8D2D0] rounded text-[12px] text-[#C0392B] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#C0392B]" />
              <span>{modalError}</span>
            </div>
          )}

          <FormField label="Staff Work Email" required>
            <input
              type="email"
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="erp-input"
              placeholder="staff.member@brightloop.io"
            />
          </FormField>

          <FormField label="Role" required>
            <select
              value={formRole}
              onChange={(e: any) => setFormRole(e.target.value)}
              className="erp-select"
            >
              <option value="staff">Staff (Internal day-to-day operations)</option>
              <option value="admin">Admin (Full system control)</option>
            </select>
          </FormField>

          <FormField label="Initial Password" required>
            <input
              type="password"
              required
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              className="erp-input"
              placeholder="••••••••••••"
            />
            <PasswordRequirements password={formPassword} />
          </FormField>

          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-[#E3DFE5]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSaving}
            >
              Create Staff Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
