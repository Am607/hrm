import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Clock,
  CalendarCheck2,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { Staff, Department, Attendance, Leave, Salary } from '../types';
import { formatINR } from '../lib/currency';

interface ReportsViewProps {
  staffList: Staff[];
  departments: Department[];
  attendanceList: Attendance[];
  leaveList: Leave[];
  salaryList: Salary[];
}

type ReportType = 'attendance' | 'leave' | 'salary';

export const ReportsView: React.FC<ReportsViewProps> = ({
  staffList,
  departments,
  attendanceList,
  leaveList,
  salaryList,
}) => {
  const [activeReport, setActiveReport] = useState<ReportType>('attendance');

  // Filter states
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // CSV Export utility
  const exportToCSV = (filename: string, rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Attendance Report Logic
  const filteredAttendance = attendanceList.filter((a) => {
    const dateMatch = (!startDate || a.date >= startDate) && (!endDate || a.date <= endDate);
    const deptMatch = selectedDept === 'all' || a.departmentId === selectedDept;
    return dateMatch && deptMatch;
  });

  const totalAttRecords = filteredAttendance.length;
  const presentAttCount = filteredAttendance.filter((a) => a.status === 'present').length;
  const lateAttCount = filteredAttendance.filter((a) => a.status === 'late').length;
  const halfDayAttCount = filteredAttendance.filter((a) => a.status === 'half_day').length;
  const absentAttCount = filteredAttendance.filter((a) => a.status === 'absent').length;
  const totalWorkHours = filteredAttendance.reduce((sum, a) => sum + (a.workHours || 0), 0);

  const handleExportAttendance = () => {
    const headers = ['Date', 'Staff Name', 'Department', 'Status', 'Check-In', 'Check-Out', 'Work Hours', 'Notes'];
    const rows = filteredAttendance.map((a) => {
      const staffObj = staffList.find((s) => s.id === a.staffId);
      return [
        a.date,
        a.staffName,
        staffObj?.departmentName || 'N/A',
        a.status.toUpperCase(),
        a.checkInTime || '--',
        a.checkOutTime || '--',
        a.workHours || 0,
        a.notes || '',
      ];
    });
    exportToCSV('attendance_report', [headers, ...rows]);
  };

  // 2. Leave Report Logic
  const filteredLeaves = leaveList.filter((l) => {
    const staffObj = staffList.find((s) => s.id === l.staffId);
    const deptMatch = selectedDept === 'all' || staffObj?.departmentId === selectedDept;
    return deptMatch;
  });

  const totalLeaveApplications = filteredLeaves.length;
  const approvedLeavesCount = filteredLeaves.filter((l) => l.status === 'approved').length;
  const pendingLeavesCount = filteredLeaves.filter((l) => l.status === 'pending').length;
  const rejectedLeavesCount = filteredLeaves.filter((l) => l.status === 'rejected').length;
  const totalLeaveDays = filteredLeaves
    .filter((l) => l.status === 'approved')
    .reduce((sum, l) => sum + (l.days || 0), 0);

  const handleExportLeave = () => {
    const headers = ['Staff Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status', 'Reviewed By'];
    const rows = filteredLeaves.map((l) => {
      const staffObj = staffList.find((s) => s.id === l.staffId);
      return [
        l.staffName,
        staffObj?.departmentName || 'N/A',
        l.leaveType.toUpperCase(),
        l.startDate,
        l.endDate,
        l.days,
        l.reason,
        l.status.toUpperCase(),
        l.reviewedBy || 'N/A',
      ];
    });
    exportToCSV('leave_report', [headers, ...rows]);
  };

  // 3. Salary Report Logic
  const filteredSalaries = salaryList.filter((s) => {
    const staffObj = staffList.find((item) => item.id === s.staffId);
    const deptMatch = selectedDept === 'all' || staffObj?.departmentId === selectedDept;
    return deptMatch;
  });

  const totalPayrollSpend = filteredSalaries.reduce((sum, s) => sum + (s.netSalary || 0), 0);
  const totalBaseSpend = filteredSalaries.reduce((sum, s) => sum + (s.baseSalary || 0), 0);
  const totalAllowances = filteredSalaries.reduce((sum, s) => sum + (s.allowances || 0), 0);
  const totalDeductions = filteredSalaries.reduce((sum, s) => sum + (s.deductions || 0), 0);
  const paidPayroll = filteredSalaries
    .filter((s) => s.paymentStatus === 'paid')
    .reduce((sum, s) => sum + s.netSalary, 0);

  const handleExportSalary = () => {
    const headers = ['Staff Name', 'Department', 'Pay Month', 'Base Salary (INR)', 'Allowances (INR)', 'Deductions (INR)', 'Net Payout (INR)', 'Status', 'Payment Method'];
    const rows = filteredSalaries.map((s) => [
      s.staffName,
      s.departmentName,
      s.month,
      s.baseSalary,
      s.allowances,
      s.deductions,
      s.netSalary,
      s.paymentStatus.toUpperCase(),
      s.paymentMethod || 'Bank Transfer',
    ]);
    exportToCSV('payroll_salary_report', [headers, ...rows]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">HR Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed insights into workforce attendance, employee leave trends, and payroll expenditure
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={
            activeReport === 'attendance'
              ? handleExportAttendance
              : activeReport === 'leave'
              ? handleExportLeave
              : handleExportSalary
          }
          className="flex items-center justify-center text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export to CSV
        </button>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
        <button
          onClick={() => setActiveReport('attendance')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeReport === 'attendance'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 mr-2" />
          Attendance Report
        </button>
        <button
          onClick={() => setActiveReport('leave')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeReport === 'leave'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarCheck2 className="w-4 h-4 mr-2" />
          Leave Report
        </button>
        <button
          onClick={() => setActiveReport('salary')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeReport === 'salary'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Salary & Payroll Report
        </button>
      </div>

      {/* Global Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {activeReport === 'attendance' && (
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-600">Date Range:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="py-1 px-2.5 rounded-xl border border-slate-200 bg-white"
              />
              <span className="text-slate-400">&rarr;</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="py-1 px-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>
          )}
        </div>

        <span className="text-slate-400 font-medium">
          Showing filtered data set
        </span>
      </div>

      {/* 1. ATTENDANCE REPORT CONTENT */}
      {activeReport === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs block">Present (On-Time)</span>
              <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                {presentAttCount}
              </span>
              <span className="text-[11px] text-slate-500">
                {totalAttRecords > 0 ? `${Math.round((presentAttCount / totalAttRecords) * 100)}% of logs` : '0%'}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs block">Late Arrivals</span>
              <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
                {lateAttCount}
              </span>
              <span className="text-[11px] text-slate-500">punctuality flag</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs block">Unexcused Absences</span>
              <span className="text-2xl font-extrabold text-rose-600 mt-1 block">
                {absentAttCount}
              </span>
              <span className="text-[11px] text-slate-500">no check-in</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs block">Total Logged Hours</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {Math.round(totalWorkHours)} hrs
              </span>
              <span className="text-[11px] text-slate-500">accumulated work</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Check-In</th>
                    <th className="py-3 px-4">Check-Out</th>
                    <th className="py-3 px-4">Hours</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendance.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-800">{a.date}</td>
                      <td className="py-3 px-4 text-slate-900">{a.staffName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            a.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : a.status === 'late'
                              ? 'bg-amber-100 text-amber-800'
                              : a.status === 'half_day'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">{a.checkInTime || '--'}</td>
                      <td className="py-3 px-4 font-mono">{a.checkOutTime || '--'}</td>
                      <td className="py-3 px-4 font-semibold">{a.workHours ? `${a.workHours}h` : '--'}</td>
                      <td className="py-3 px-4 text-slate-500">{a.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. LEAVE REPORT CONTENT */}
      {activeReport === 'leave' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs block">Total Applications</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {totalLeaveApplications}
              </span>
              <span className="text-[11px] text-slate-500">all time</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs block">Approved Leaves</span>
              <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                {approvedLeavesCount}
              </span>
              <span className="text-[11px] text-slate-500">sanctioned</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs block">Pending Reviews</span>
              <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
                {pendingLeavesCount}
              </span>
              <span className="text-[11px] text-slate-500">awaiting decision</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs block">Total Approved Days</span>
              <span className="text-2xl font-extrabold text-indigo-600 mt-1 block">
                {totalLeaveDays} days
              </span>
              <span className="text-[11px] text-slate-500">time-off granted</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4">Staff</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Days</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Reviewed By</th>
                    <th className="py-3 px-4">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900">{l.staffName}</td>
                      <td className="py-3 px-4 capitalize font-medium">{l.leaveType}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {l.startDate} &rarr; {l.endDate}
                      </td>
                      <td className="py-3 px-4 font-bold">{l.days}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            l.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : l.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{l.reviewedBy || '-'}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{l.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. SALARY REPORT CONTENT */}
      {activeReport === 'salary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs block">Total Net Payroll</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {formatINR(totalPayrollSpend)}
              </span>
              <span className="text-[11px] text-slate-500">overall net payout</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs block">Settled (Paid)</span>
              <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                {formatINR(paidPayroll)}
              </span>
              <span className="text-[11px] text-slate-500">disbursed funds</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs block">Allowances Paid</span>
              <span className="text-2xl font-extrabold text-indigo-600 mt-1 block">
                {formatINR(totalAllowances)}
              </span>
              <span className="text-[11px] text-slate-500">bonuses & incentives</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs block">Deductions</span>
              <span className="text-2xl font-extrabold text-rose-600 mt-1 block">
                {formatINR(totalDeductions)}
              </span>
              <span className="text-[11px] text-slate-500">withheld amounts</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4">Base Salary</th>
                    <th className="py-3 px-4">Allowances</th>
                    <th className="py-3 px-4">Deductions</th>
                    <th className="py-3 px-4 font-bold text-slate-900">Net Salary</th>
                    <th className="py-3 px-4">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSalaries.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900">{s.staffName}</td>
                      <td className="py-3 px-4 text-slate-600">{s.departmentName}</td>
                      <td className="py-3 px-4 font-medium">{s.month}</td>
                      <td className="py-3 px-4">{formatINR(s.baseSalary)}</td>
                      <td className="py-3 px-4 text-emerald-600">+{formatINR(s.allowances || 0)}</td>
                      <td className="py-3 px-4 text-rose-600">-{formatINR(s.deductions || 0)}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">{formatINR(s.netSalary)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            s.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {s.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
