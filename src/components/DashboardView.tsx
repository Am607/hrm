import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  UserPlus,
} from 'lucide-react';
import { Staff, Department, Attendance, Leave, Salary, TabType } from '../types';
import { formatINR } from '../lib/currency';

interface DashboardViewProps {
  staff: Staff[];
  departments: Department[];
  attendance: Attendance[];
  leaves: Leave[];
  salaries: Salary[];
  setActiveTab: (tab: TabType) => void;
  onOpenAddStaff: () => void;
  onOpenCheckIn: () => void;
  onApproveLeave: (leaveId: string) => void;
  onRejectLeave: (leaveId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  staff,
  departments,
  attendance,
  leaves,
  salaries,
  setActiveTab,
  onOpenAddStaff,
  onOpenCheckIn,
  onApproveLeave,
  onRejectLeave,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate today's stats
  const totalStaff = staff.filter((s) => s.status !== 'terminated').length;
  
  // Today's attendance records
  const todayAttendance = attendance.filter((a) => a.date === todayStr);
  const presentCount = todayAttendance.filter((a) => a.status === 'present' || a.status === 'late' || a.status === 'half_day').length;
  const lateCount = todayAttendance.filter((a) => a.status === 'late').length;
  
  // Staff on approved leave today
  const onLeaveStaff = staff.filter((s) => s.status === 'on_leave').length;
  const activeLeavesToday = leaves.filter((l) => {
    if (l.status !== 'approved') return false;
    return l.startDate <= todayStr && l.endDate >= todayStr;
  }).length;
  const effectiveOnLeave = Math.max(onLeaveStaff, activeLeavesToday);

  // Absent today
  const absentCount = Math.max(0, totalStaff - presentCount - effectiveOnLeave);

  // Pending leaves
  const pendingLeaves = leaves.filter((l) => l.status === 'pending');

  // Attendance rate %
  const attendanceRate = totalStaff > 0 ? Math.round((presentCount / (totalStaff - effectiveOnLeave || 1)) * 100) : 0;

  // Monthly payroll calculation
  const currentMonth = todayStr.substring(0, 7); // e.g. "2026-10"
  const currentMonthSalaries = salaries.filter((s) => s.month.startsWith(currentMonth) || s.month.includes('2026'));
  const totalPayroll = currentMonthSalaries.reduce((sum, s) => sum + (s.netSalary || 0), 0);
  const totalPaid = currentMonthSalaries.filter((s) => s.paymentStatus === 'paid').reduce((sum, s) => sum + s.netSalary, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs mb-2">
            Company HR Command Center
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Today&apos;s Company Overview</h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl">
            Real-time synchronization across staff roster, daily clock-ins, leave requests, and payroll disbursements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenCheckIn}
            className="flex items-center text-xs font-semibold bg-white text-indigo-700 hover:bg-indigo-50 px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Clock className="w-4 h-4 mr-1.5" />
            Quick Check-In
          </button>
          <button
            onClick={onOpenAddStaff}
            className="flex items-center text-xs font-semibold bg-indigo-500/40 hover:bg-indigo-500/60 border border-white/20 text-white px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Staff
          </button>
        </div>
      </div>

      {/* 4 Core Metric KPI Cards (as specified in prompt) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div 
          onClick={() => setActiveTab('staff')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Staff</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">{totalStaff}</span>
            <span className="text-xs text-slate-400 ml-2">Active employees</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-medium">
            <span>View directory</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Present Today */}
        <div 
          onClick={() => setActiveTab('attendance')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Present Today</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-600">{presentCount}</span>
            <span className="text-xs text-slate-400 ml-2">
              {lateCount > 0 ? `(${lateCount} checked in late)` : 'all on time'}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-medium">
            <span>Check attendance sheet</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Absent Today */}
        <div 
          onClick={() => setActiveTab('attendance')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Absent Today</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-rose-600">{absentCount}</span>
            <span className="text-xs text-slate-400 ml-2">without leave pass</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-rose-600 font-medium">
            <span>Review unrecorded</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* On Leave */}
        <div 
          onClick={() => setActiveTab('leave')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">On Leave</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-amber-600">{effectiveOnLeave}</span>
            <span className="text-xs text-slate-400 ml-2">
              {pendingLeaves.length > 0 ? `(${pendingLeaves.length} pending)` : 'approved leave'}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-600 font-medium">
            <span>Manage leave requests</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Middle Grid: Pending Approvals & Attendance Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Leave Requests Alert Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Pending Leave Approvals</h2>
              <p className="text-xs text-slate-500">Requires manager or HR executive review</p>
            </div>
            <button
              onClick={() => setActiveTab('leave')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center cursor-pointer"
            >
              <span>View All ({leaves.length})</span>
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">All Leave Requests Reviewed</p>
              <p className="text-xs text-slate-400 mt-0.5">No pending applications waiting in queue.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.slice(0, 3).map((lv) => (
                <div
                  key={lv.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-slate-900">{lv.staffName}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase bg-indigo-100 text-indigo-700">
                        {lv.leaveType}
                      </span>
                      <span className="text-xs text-slate-500">
                        {lv.days} {lv.days === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 italic">&ldquo;{lv.reason}&rdquo;</p>
                    <p className="text-[11px] text-slate-400">
                      Period: {lv.startDate} to {lv.endDate}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => onApproveLeave(lv.id)}
                      className="flex items-center px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => onRejectLeave(lv.id)}
                      className="flex items-center px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance & Workforce Health Ring */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-900 text-base">Attendance Rate</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                Today
              </span>
            </div>
            <div className="flex items-center space-x-4 my-3">
              <div className="text-4xl font-extrabold text-slate-900">{attendanceRate}%</div>
              <div className="text-xs text-slate-500">
                <p className="font-medium text-slate-700">Daily Punctuality</p>
                <p>{presentCount} of {totalStaff - effectiveOnLeave} expected staff present</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex my-2">
              <div
                style={{ width: `${attendanceRate}%` }}
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              />
            </div>

            {/* Quick Status Breakdown */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block">On Time</span>
                <span className="font-bold text-slate-800 text-sm">{presentCount - lateCount}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block">Late Arrival</span>
                <span className="font-bold text-amber-600 text-sm">{lateCount}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block">Planned Leave</span>
                <span className="font-bold text-indigo-600 text-sm">{effectiveOnLeave}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block">Unexcused</span>
                <span className="font-bold text-rose-600 text-sm">{absentCount}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('attendance')}
            className="w-full mt-4 text-center text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 py-2 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            Open Attendance Log &#8594;
          </button>
        </div>
      </div>

      {/* Bottom Row: Department Distribution & Payroll Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Department Roster Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Department Staffing</h2>
              <p className="text-xs text-slate-500">{departments.length} registered departments</p>
            </div>
            <button
              onClick={() => setActiveTab('departments')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center cursor-pointer"
            >
              <span>Manage</span>
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3">
            {departments.map((dept) => {
              const deptStaffCount = staff.filter(
                (s) => s.departmentId === dept.id || s.departmentName === dept.name
              ).length;
              const percentage = totalStaff > 0 ? Math.round((deptStaffCount / totalStaff) * 100) : 0;

              return (
                <div key={dept.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{dept.name}</span>
                    <span className="text-slate-500 font-medium">
                      {deptStaffCount} members ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="bg-indigo-600 h-full rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Payroll Quick Snapshot */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Payroll Quick Look</h2>
                <p className="text-xs text-slate-500">Current cycle: {currentMonth}</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Total Net Payroll:</span>
                <span className="text-lg font-extrabold text-slate-900">
                  {formatINR(totalPayroll)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Disbursed (Paid):</span>
                <span className="font-semibold text-emerald-600">
                  {formatINR(totalPaid)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Pending Settlement:</span>
                <span className="font-semibold text-amber-600">
                  {formatINR(totalPayroll - totalPaid)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {currentMonthSalaries.length} employee salary slips
            </span>
            <button
              onClick={() => setActiveTab('salary')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center cursor-pointer"
            >
              <span>Open Salary Management</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
