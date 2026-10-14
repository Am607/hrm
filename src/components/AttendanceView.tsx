import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Edit3,
  Check,
  Search,
} from 'lucide-react';
import { Staff, Attendance, AttendanceStatus, Department } from '../types';

interface AttendanceViewProps {
  staffList: Staff[];
  attendanceList: Attendance[];
  departments: Department[];
  onSaveAttendance: (record: Omit<Attendance, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  onQuickCheckIn: (staffId: string, staffName: string, date: string, departmentId?: string) => Promise<void>;
  onQuickCheckOut: (recordId: string, checkInTimeStr?: string) => Promise<void>;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  staffList,
  attendanceList,
  departments,
  onSaveAttendance,
  onQuickCheckIn,
  onQuickCheckOut,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [viewMode, setViewMode] = useState<'daily' | 'history'>('daily');
  const [selectedStaffHistory, setSelectedStaffHistory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  // Move date back or forward
  const changeDateBy = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Active staff only
  const activeStaff = staffList.filter((s) => s.status !== 'terminated');

  // Attendance for the selected date
  const recordsForDate = attendanceList.filter((a) => a.date === selectedDate);
  const attendanceMap = new Map<string, Attendance>();
  recordsForDate.forEach((r) => attendanceMap.set(r.staffId, r));

  // Compute daily metrics
  let presentCount = 0;
  let lateCount = 0;
  let halfDayCount = 0;
  let absentCount = 0;

  activeStaff.forEach((s) => {
    const record = attendanceMap.get(s.id);
    if (!record) {
      absentCount++;
    } else {
      if (record.status === 'present') presentCount++;
      else if (record.status === 'late') lateCount++;
      else if (record.status === 'half_day') halfDayCount++;
      else absentCount++;
    }
  });

  // Handle Mark All Present
  const handleMarkAllPresent = async () => {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    for (const staff of activeStaff) {
      const existing = attendanceMap.get(staff.id);
      if (!existing || existing.status === 'absent') {
        await onSaveAttendance({
          id: existing?.id,
          staffId: staff.id,
          staffName: staff.name,
          departmentId: staff.departmentId,
          date: selectedDate,
          checkInTime: existing?.checkInTime || timeFormatted,
          status: 'present',
          workHours: 8.0,
          notes: 'Marked present via batch action',
        });
      }
    }
  };

  // Quick status toggle
  const handleStatusChange = async (staff: Staff, newStatus: AttendanceStatus) => {
    const existing = attendanceMap.get(staff.id);
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const payload: any = {
      id: existing?.id,
      staffId: staff.id,
      staffName: staff.name,
      departmentId: staff.departmentId,
      date: selectedDate,
      status: newStatus,
      workHours: newStatus === 'absent' ? 0 : existing?.workHours || (newStatus === 'half_day' ? 4 : 8),
      notes: existing?.notes || '',
    };
    if (newStatus !== 'absent') {
      payload.checkInTime = existing?.checkInTime || timeFormatted;
      if (existing?.checkOutTime) {
        payload.checkOutTime = existing.checkOutTime;
      }
    }

    await onSaveAttendance(payload);
  };

  // Filtered staff list
  const filteredActiveStaff = activeStaff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Attendance Tracking</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor daily employee check-ins, punctuality, and work hours
          </p>
        </div>

        {/* View Switcher: Daily vs History */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'daily'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Daily Sheet
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'history'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 mr-1.5" />
            Attendance History
          </button>
        </div>
      </div>

      {viewMode === 'daily' ? (
        <>
          {/* Date Navigator & Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => changeDateBy(-1)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-2 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                />
              </div>
              <button
                onClick={() => changeDateBy(1)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {!isToday && (
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="text-xs font-medium text-indigo-600 hover:underline px-2 cursor-pointer"
                >
                  Jump to Today
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
              <div className="relative w-full md:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <button
                onClick={handleMarkAllPresent}
                className="flex items-center text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Mark All Present
              </button>
            </div>
          </div>

          {/* KPI Chips for Today */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                {presentCount}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Present</span>
                <span className="text-xs font-bold text-slate-800">On Time</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                {lateCount}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Late</span>
                <span className="text-xs font-bold text-slate-800">&gt; 09:15 AM</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                {halfDayCount}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Half-Day</span>
                <span className="text-xs font-bold text-slate-800">4 Hours</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                {absentCount}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Absent</span>
                <span className="text-xs font-bold text-slate-800">Unrecorded</span>
              </div>
            </div>
          </div>

          {/* Daily Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Check-In</th>
                    <th className="py-3 px-4">Check-Out</th>
                    <th className="py-3 px-4">Hours</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredActiveStaff.map((staff) => {
                    const record = attendanceMap.get(staff.id);
                    const currentStatus = record?.status || 'absent';

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Staff */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            {staff.avatarUrl ? (
                              <img
                                src={staff.avatarUrl}
                                alt={staff.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                                {staff.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900">{staff.name}</p>
                              <p className="text-[11px] text-slate-400">{staff.departmentName}</p>
                            </div>
                          </div>
                        </td>

                        {/* Status Dropdown Selector */}
                        <td className="py-3 px-4">
                          <select
                            value={currentStatus}
                            onChange={(e) => handleStatusChange(staff, e.target.value as AttendanceStatus)}
                            className={`text-xs font-semibold py-1 px-2.5 rounded-lg border focus:outline-none cursor-pointer ${
                              currentStatus === 'present'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : currentStatus === 'late'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : currentStatus === 'half_day'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            <option value="present">Present</option>
                            <option value="late">Late</option>
                            <option value="half_day">Half Day</option>
                            <option value="absent">Absent</option>
                          </select>
                        </td>

                        {/* Check-In */}
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {record?.checkInTime || (
                            <span className="text-slate-400 font-sans italic">--:--</span>
                          )}
                        </td>

                        {/* Check-Out */}
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {record?.checkOutTime || (
                            <span className="text-slate-400 font-sans italic">--:--</span>
                          )}
                        </td>

                        {/* Work Hours */}
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {record?.workHours ? `${record.workHours} hrs` : '--'}
                        </td>

                        {/* Notes */}
                        <td className="py-3 px-4 text-slate-600 max-w-[180px]">
                          {editingNotesId === staff.id ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                value={tempNotes}
                                onChange={(e) => setTempNotes(e.target.value)}
                                className="px-2 py-1 text-xs border border-indigo-300 rounded focus:outline-none"
                                placeholder="Add note..."
                              />
                              <button
                                onClick={async () => {
                                  await onSaveAttendance({
                                    id: record?.id,
                                    staffId: staff.id,
                                    staffName: staff.name,
                                    departmentId: staff.departmentId,
                                    date: selectedDate,
                                    status: currentStatus,
                                    checkInTime: record?.checkInTime,
                                    checkOutTime: record?.checkOutTime,
                                    workHours: record?.workHours,
                                    notes: tempNotes,
                                  });
                                  setEditingNotesId(null);
                                }}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingNotesId(staff.id);
                                setTempNotes(record?.notes || '');
                              }}
                              className="group flex items-center space-x-1 cursor-pointer truncate"
                              title={record?.notes || 'Click to add note'}
                            >
                              <span className="truncate">{record?.notes || <span className="text-slate-300 italic">Add note</span>}</span>
                              <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 shrink-0" />
                            </div>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {!record?.checkInTime ? (
                              <button
                                onClick={() => onQuickCheckIn(staff.id, staff.name, selectedDate, staff.departmentId)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] shadow-xs cursor-pointer"
                              >
                                Check In
                              </button>
                            ) : !record?.checkOutTime ? (
                              <button
                                onClick={() => onQuickCheckOut(record.id, record.checkInTime)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium text-[11px] shadow-xs cursor-pointer"
                              >
                                Check Out
                              </button>
                            ) : (
                              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                Completed
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Attendance History View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Attendance Log History</h2>
              <p className="text-xs text-slate-500">Historical daily attendance records across staff</p>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-600">Filter Staff:</label>
              <select
                value={selectedStaffHistory}
                onChange={(e) => setSelectedStaffHistory(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white"
              >
                <option value="all">All Staff Members</option>
                {activeStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Staff Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Check In</th>
                  <th className="py-2.5 px-3">Check Out</th>
                  <th className="py-2.5 px-3">Hours</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceList
                  .filter((a) => selectedStaffHistory === 'all' || a.staffId === selectedStaffHistory)
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{log.date}</td>
                      <td className="py-2.5 px-3 text-slate-900">{log.staffName}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            log.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'late'
                              ? 'bg-amber-100 text-amber-800'
                              : log.status === 'half_day'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{log.checkInTime || '--'}</td>
                      <td className="py-2.5 px-3 font-mono">{log.checkOutTime || '--'}</td>
                      <td className="py-2.5 px-3 font-semibold">{log.workHours ? `${log.workHours}h` : '--'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{log.notes || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
