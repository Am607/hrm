import React, { useState } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  Mail,
  Phone,
  Building,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertCircle,
  X,
  FileText,
  User,
} from 'lucide-react';
import { Staff, Department, StaffStatus, Attendance, Leave, Salary } from '../types';
import { formatINR } from '../lib/currency';

interface StaffViewProps {
  staffList: Staff[];
  departments: Department[];
  attendanceList: Attendance[];
  leaveList: Leave[];
  salaryList: Salary[];
  onAddStaff: (data: Omit<Staff, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateStaff: (staffId: string, updates: Partial<Staff>) => Promise<void>;
  onDeleteStaff: (staffId: string) => Promise<void>;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staffList,
  departments,
  attendanceList,
  leaveList,
  salaryList,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStaffForProfile, setSelectedStaffForProfile] = useState<Staff | null>(null);
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    departmentId: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active' as StaffStatus,
    baseSalary: 50000,
    emergencyContact: '',
    notes: '',
    avatarUrl: '',
  });

  const [formError, setFormError] = useState('');

  // Handle Edit opening
  const handleOpenEdit = (staff: Staff) => {
    setStaffToEdit(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      phone: staff.phone || '',
      role: staff.role,
      departmentId: staff.departmentId,
      joinDate: staff.joinDate,
      status: staff.status,
      baseSalary: staff.baseSalary,
      emergencyContact: staff.emergencyContact || '',
      notes: staff.notes || '',
      avatarUrl: staff.avatarUrl || '',
    });
  };

  const handleOpenAdd = () => {
    setStaffToEdit(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      departmentId: departments[0]?.id || '',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
      baseSalary: 50000,
      emergencyContact: '',
      notes: '',
      avatarUrl: '',
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.role.trim()) {
      setFormError('Please fill in required fields: Name, Email, and Role.');
      return;
    }

    const deptObj = departments.find((d) => d.id === formData.departmentId);
    const departmentName = deptObj ? deptObj.name : 'General';

    try {
      if (staffToEdit) {
        await onUpdateStaff(staffToEdit.id, {
          ...formData,
          departmentName,
          baseSalary: Number(formData.baseSalary),
        });
        setStaffToEdit(null);
      } else {
        await onAddStaff({
          ...formData,
          departmentName,
          baseSalary: Number(formData.baseSalary),
        });
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to save staff record');
    }
  };

  // Filter staff
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === 'all' || s.departmentId === selectedDept || s.departmentName === selectedDept;
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your company roster, department assignments, and staff profiles ({filteredStaff.length} employees)
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add New Staff
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="terminated">Terminated</option>
          </select>

          {(searchTerm || selectedDept !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDept('all');
                setSelectedStatus('all');
              }}
              className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1 font-medium cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Department & Role</th>
                <th className="py-3.5 px-4">Join Date</th>
                <th className="py-3.5 px-4">Base Salary</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No staff members found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name & Contact */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        {staff.avatarUrl ? (
                          <img
                            src={staff.avatarUrl}
                            alt={staff.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {staff.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">{staff.name}</p>
                          <p className="text-[11px] text-slate-500">{staff.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department & Role */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-medium text-slate-800">{staff.role}</span>
                        <span className="text-[11px] text-slate-400 block">{staff.departmentName}</span>
                      </div>
                    </td>

                    {/* Join Date */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {staff.joinDate || 'N/A'}
                    </td>

                    {/* Base Salary */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {formatINR(staff.baseSalary)}/mo
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          staff.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : staff.status === 'on_leave'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {staff.status === 'on_leave' ? 'On Leave' : staff.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedStaffForProfile(staff)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(staff)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Staff Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove staff member ${staff.name}?`)) {
                              onDeleteStaff(staff.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Delete Staff"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Profile Modal / Drawer */}
      {selectedStaffForProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-4">
                {selectedStaffForProfile.avatarUrl ? (
                  <img
                    src={selectedStaffForProfile.avatarUrl}
                    alt={selectedStaffForProfile.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center">
                    {selectedStaffForProfile.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedStaffForProfile.name}</h2>
                  <p className="text-xs text-indigo-600 font-semibold">{selectedStaffForProfile.role}</p>
                  <p className="text-xs text-slate-500">{selectedStaffForProfile.departmentName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStaffForProfile(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Email</span>
                <span className="font-semibold text-slate-800 break-all">{selectedStaffForProfile.email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Phone</span>
                <span className="font-semibold text-slate-800">{selectedStaffForProfile.phone || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Joined Date</span>
                <span className="font-semibold text-slate-800">{selectedStaffForProfile.joinDate}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Monthly Base Salary</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatINR(selectedStaffForProfile.baseSalary)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Employment Status</span>
                <span className="font-bold text-emerald-600 uppercase text-[11px]">
                  {selectedStaffForProfile.status}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Emergency Contact</span>
                <span className="font-semibold text-slate-800">{selectedStaffForProfile.emergencyContact || 'None provided'}</span>
              </div>
            </div>

            {/* Notes */}
            {selectedStaffForProfile.notes && (
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
                <span className="font-semibold text-indigo-900 block mb-1">HR Notes:</span>
                <p className="text-slate-700">{selectedStaffForProfile.notes}</p>
              </div>
            )}

            {/* Recent Attendance Records */}
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">Recent Attendance Log</h3>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {attendanceList
                  .filter((a) => a.staffId === selectedStaffForProfile.id)
                  .slice(0, 5)
                  .map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-800">{att.date}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-500">
                          {att.checkInTime ? `In: ${att.checkInTime}` : 'No check-in'}
                          {att.checkOutTime ? ` | Out: ${att.checkOutTime}` : ''}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            att.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : att.status === 'late'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {att.status}
                        </span>
                      </div>
                    </div>
                  ))}
                {attendanceList.filter((a) => a.staffId === selectedStaffForProfile.id).length === 0 && (
                  <p className="text-xs text-slate-400 italic">No attendance records logged yet.</p>
                )}
              </div>
            </div>

            {/* Leave History */}
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">Leave Applications</h3>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {leaveList
                  .filter((l) => l.staffId === selectedStaffForProfile.id)
                  .map((lv) => (
                    <div
                      key={lv.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 capitalize">{lv.leaveType} Leave</span>
                        <span className="text-slate-500 ml-2">
                          ({lv.startDate} to {lv.endDate} &bull; {lv.days}d)
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          lv.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : lv.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {lv.status}
                      </span>
                    </div>
                  ))}
                {leaveList.filter((l) => l.staffId === selectedStaffForProfile.id).length === 0 && (
                  <p className="text-xs text-slate-400 italic">No leave applications recorded.</p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  const staff = selectedStaffForProfile;
                  setSelectedStaffForProfile(null);
                  handleOpenEdit(staff);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
              >
                Edit Staff Member
              </button>
              <button
                onClick={() => setSelectedStaffForProfile(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add or Edit Staff Modal */}
      {(isAddModalOpen || staffToEdit) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {staffToEdit ? `Edit Staff: ${staffToEdit.name}` : 'Add New Staff Member'}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setStaffToEdit(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@company.internal"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Job Title / Role *</label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department *</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Monthly Base Salary (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Join Date</label>
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StaffStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="Contact Name & Number"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Photo / Avatar URL (Optional)</label>
                <input
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any additional onboarding or contract remarks..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setStaffToEdit(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  {staffToEdit ? 'Save Changes' : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
