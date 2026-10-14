import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  User,
  AlertCircle,
  X,
  FileCheck2,
} from 'lucide-react';
import { Leave, Staff, LeaveType, LeaveStatus } from '../types';

interface LeaveViewProps {
  leaveList: Leave[];
  staffList: Staff[];
  onApplyLeave: (data: Omit<Leave, 'id' | 'createdAt' | 'status' | 'appliedAt'>) => Promise<void>;
  onReviewLeave: (leaveId: string, status: 'approved' | 'rejected', reviewNotes?: string) => Promise<void>;
  isApplyModalOpen: boolean;
  setIsApplyModalOpen: (open: boolean) => void;
}

export const LeaveView: React.FC<LeaveViewProps> = ({
  leaveList,
  staffList,
  onApplyLeave,
  onReviewLeave,
  isApplyModalOpen,
  setIsApplyModalOpen,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | LeaveStatus>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  
  // Review Modal state
  const [reviewingLeave, setReviewingLeave] = useState<Leave | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected'>('approved');
  const [reviewNotes, setReviewNotes] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    staffId: staffList[0]?.id || '',
    leaveType: 'annual' as LeaveType,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    days: 1,
    reason: '',
  });

  const [formError, setFormError] = useState('');

  // Calculate days between dates
  const handleDateChange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    setFormData((prev) => ({
      ...prev,
      startDate: start,
      endDate: end,
      days: isNaN(diffDays) ? 1 : diffDays,
    }));
  };

  const handleOpenApply = () => {
    setFormData({
      staffId: staffList[0]?.id || '',
      leaveType: 'annual',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      days: 1,
      reason: '',
    });
    setFormError('');
    setIsApplyModalOpen(true);
  };

  const handleSubmitApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.staffId) {
      setFormError('Please select a staff member.');
      return;
    }
    if (!formData.reason.trim()) {
      setFormError('Please provide a reason for the leave request.');
      return;
    }

    const staffObj = staffList.find((s) => s.id === formData.staffId);
    const staffName = staffObj ? staffObj.name : 'Unknown Staff';

    try {
      await onApplyLeave({
        ...formData,
        staffName,
      });
      setIsApplyModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit leave application');
    }
  };

  const handleConfirmReview = async () => {
    if (!reviewingLeave) return;
    try {
      await onReviewLeave(reviewingLeave.id, reviewDecision, reviewNotes);
      setReviewingLeave(null);
      setReviewNotes('');
    } catch (err) {
      console.error("Review failed:", err);
    }
  };

  // Filtered requests
  const filteredLeaves = leaveList.filter((l) => {
    const statusMatch = selectedFilter === 'all' || l.status === selectedFilter;
    const typeMatch = selectedTypeFilter === 'all' || l.leaveType === selectedTypeFilter;
    return statusMatch && typeMatch;
  });

  const pendingCount = leaveList.filter((l) => l.status === 'pending').length;
  const approvedCount = leaveList.filter((l) => l.status === 'approved').length;
  const rejectedCount = leaveList.filter((l) => l.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit leave requests, review employee time off, and track leave balances
          </p>
        </div>
        <button
          onClick={handleOpenApply}
          className="flex items-center justify-center text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Apply for Leave
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setSelectedFilter('pending')}
          className={`p-4 rounded-2xl border shadow-xs transition-all cursor-pointer ${
            selectedFilter === 'pending'
              ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-amber-600">{pendingCount}</span>
            <span className="text-xs text-slate-400 ml-2">applications</span>
          </div>
        </div>

        <div
          onClick={() => setSelectedFilter('approved')}
          className={`p-4 rounded-2xl border shadow-xs transition-all cursor-pointer ${
            selectedFilter === 'approved'
              ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Approved</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-600">{approvedCount}</span>
            <span className="text-xs text-slate-400 ml-2">requests approved</span>
          </div>
        </div>

        <div
          onClick={() => setSelectedFilter('rejected')}
          className={`p-4 rounded-2xl border shadow-xs transition-all cursor-pointer ${
            selectedFilter === 'rejected'
              ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-400/20'
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Declined</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-rose-600">{rejectedCount}</span>
            <span className="text-xs text-slate-400 ml-2">requests declined</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Type Selector */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Requests ({leaveList.length})
          </button>
          <button
            onClick={() => setSelectedFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedFilter === 'pending'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setSelectedFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedFilter === 'approved'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setSelectedFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedFilter === 'rejected'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Leave Type:</span>
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white"
          >
            <option value="all">All Types</option>
            <option value="annual">Annual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="casual">Casual Leave</option>
            <option value="unpaid">Unpaid Leave</option>
          </select>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Reason / Remarks</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No leave requests found in this view.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((lv) => (
                  <tr key={lv.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Staff */}
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {lv.staffName}
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700 capitalize">
                        {lv.leaveType}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-4 text-slate-600">
                      <span>{lv.startDate}</span>
                      <span className="text-slate-400 mx-1">&rarr;</span>
                      <span>{lv.endDate}</span>
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {lv.days} {lv.days === 1 ? 'day' : 'days'}
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4 text-slate-600 max-w-xs">
                      <p className="truncate" title={lv.reason}>
                        {lv.reason}
                      </p>
                      {lv.reviewNotes && (
                        <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">
                          Review note: {lv.reviewNotes}
                        </p>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          lv.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : lv.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {lv.status}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      {lv.status === 'pending' ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setReviewingLeave(lv);
                              setReviewDecision('approved');
                              setReviewNotes('Approved by HR Manager');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] shadow-xs cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setReviewingLeave(lv);
                              setReviewDecision('rejected');
                              setReviewNotes('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-medium text-[11px] cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {lv.reviewedBy ? `Reviewed by ${lv.reviewedBy}` : 'Completed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Decision Modal */}
      {reviewingLeave && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {reviewDecision === 'approved' ? 'Approve Leave Request' : 'Decline Leave Request'}
              </h2>
              <button
                onClick={() => setReviewingLeave(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 text-xs space-y-1">
              <p>
                <strong className="text-slate-800">Employee:</strong> {reviewingLeave.staffName}
              </p>
              <p>
                <strong className="text-slate-800">Period:</strong> {reviewingLeave.startDate} to{' '}
                {reviewingLeave.endDate} ({reviewingLeave.days} days)
              </p>
              <p>
                <strong className="text-slate-800">Type:</strong>{' '}
                <span className="capitalize">{reviewingLeave.leaveType}</span>
              </p>
              <p className="text-slate-600 italic">&ldquo;{reviewingLeave.reason}&rdquo;</p>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700 block">
                Reviewer Remarks (Optional)
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  reviewDecision === 'approved'
                    ? 'e.g. Approved. Coverage arranged with team.'
                    : 'e.g. Please reschedule due to ongoing project release.'
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setReviewingLeave(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReview}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-xs cursor-pointer ${
                  reviewDecision === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {reviewDecision === 'approved' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Apply for Leave</h2>
              <button
                onClick={() => setIsApplyModalOpen(false)}
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

            <form onSubmit={handleSubmitApply} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Employee *</label>
                <select
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {staffList
                    .filter((s) => s.status !== 'terminated')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} &bull; {s.role} ({s.departmentName})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Leave Category *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['annual', 'sick', 'casual', 'unpaid'] as LeaveType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, leaveType: type })}
                      className={`py-2 px-3 rounded-xl border text-center font-semibold capitalize cursor-pointer transition-colors ${
                        formData.leaveType === type
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => handleDateChange(e.target.value, formData.endDate)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => handleDateChange(formData.startDate, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Days</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={formData.days}
                    onChange={(e) => setFormData({ ...formData, days: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason for Leave *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Provide a clear description of your leave reason..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
