import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Users,
  UserCheck,
  UserPlus,
  Edit2,
  Trash2,
  DollarSign,
  AlertCircle,
  X,
  Briefcase,
} from 'lucide-react';
import { Department, Staff } from '../types';
import { formatINR } from '../lib/currency';

interface DepartmentViewProps {
  departments: Department[];
  staffList: Staff[];
  onAddDepartment: (data: Omit<Department, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateDepartment: (deptId: string, updates: Partial<Department>) => Promise<void>;
  onDeleteDepartment: (deptId: string) => Promise<void>;
  onAssignStaff: (staffId: string, deptId: string, deptName: string) => Promise<void>;
}

export const DepartmentView: React.FC<DepartmentViewProps> = ({
  departments,
  staffList,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onAssignStaff,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [assigningDept, setAssigningDept] = useState<Department | null>(null);
  const [selectedStaffToAssign, setSelectedStaffToAssign] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    headStaffName: '',
  });
  const [formError, setFormError] = useState('');

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormData({
      name: '',
      description: '',
      headStaffName: staffList[0]?.name || '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description || '',
      headStaffName: dept.headStaffName || '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Please provide a department name.');
      return;
    }

    try {
      if (editingDept) {
        await onUpdateDepartment(editingDept.id, formData);
      } else {
        await onAddDepartment(formData);
      }
      setIsAddModalOpen(false);
      setEditingDept(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save department');
    }
  };

  const handleConfirmAssign = async () => {
    if (!assigningDept || !selectedStaffToAssign) return;
    try {
      await onAssignStaff(selectedStaffToAssign, assigningDept.id, assigningDept.name);
      setAssigningDept(null);
      setSelectedStaffToAssign('');
    } catch (err) {
      console.error("Assignment failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Departments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize teams, assign department leadership, and distribute staff members
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </button>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => {
          const members = staffList.filter(
            (s) => s.departmentId === dept.id || s.departmentName === dept.name
          );
          const totalDeptSalary = members.reduce((sum, s) => sum + (s.baseSalary || 0), 0);
          const avgDeptSalary = members.length > 0 ? Math.round(totalDeptSalary / members.length) : 0;

          return (
            <div
              key={dept.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 p-5 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(dept)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Department"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete department ${dept.name}?`)) {
                          onDeleteDepartment(dept.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Delete Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-slate-900 text-base">{dept.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {dept.description || 'No description provided.'}
                  </p>
                </div>

                {/* Lead info */}
                <div className="mt-3 py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Department Head
                  </span>
                  <span className="font-semibold text-slate-800">
                    {dept.headStaffName || 'Unassigned'}
                  </span>
                </div>

                {/* Team members preview */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-700">Team Roster</span>
                    <span className="text-slate-400">{members.length} members</span>
                  </div>

                  <div className="flex items-center -space-x-2 overflow-hidden py-1">
                    {members.slice(0, 5).map((m) =>
                      m.avatarUrl ? (
                        <img
                          key={m.id}
                          src={m.avatarUrl}
                          alt={m.name}
                          title={m.name}
                          className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
                        />
                      ) : (
                        <div
                          key={m.id}
                          title={m.name}
                          className="inline-flex h-7 w-7 rounded-full ring-2 ring-white bg-indigo-100 text-indigo-700 font-bold items-center justify-center text-[10px]"
                        >
                          {m.name.charAt(0)}
                        </div>
                      )
                    )}
                    {members.length > 5 && (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 ring-2 ring-white text-[10px] font-semibold text-slate-600">
                        +{members.length - 5}
                      </span>
                    )}
                    {members.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No staff assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Avg {formatINR(avgDeptSalary)}/mo
                </span>
                <button
                  onClick={() => {
                    setAssigningDept(dept);
                    setSelectedStaffToAssign(staffList[0]?.id || '');
                  }}
                  className="flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Assign Staff
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Department Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {editingDept ? `Edit Department: ${editingDept.name}` : 'Create New Department'}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingDept(null);
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
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Mobile Engineering or Customer Success"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of department responsibilities and goals..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Department Head / Lead (Optional)
                </label>
                <select
                  value={formData.headStaffName}
                  onChange={(e) => setFormData({ ...formData, headStaffName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">No Lead Assigned</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingDept(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  {editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Staff to Department Modal */}
      {assigningDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Assign Staff to {assigningDept.name}
              </h2>
              <button
                onClick={() => setAssigningDept(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Select an employee from the roster to transfer or assign to the{' '}
                <strong className="text-slate-900">{assigningDept.name}</strong> department.
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Employee</label>
                <select
                  value={selectedStaffToAssign}
                  onChange={(e) => setSelectedStaffToAssign(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} &bull; currently: {s.departmentName} ({s.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setAssigningDept(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssign}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
