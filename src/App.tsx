/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, testConnection } from './lib/firebase';
import {
  Department,
  Staff,
  Attendance,
  Leave,
  Salary,
  TabType,
} from './types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_STAFF,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVES,
  INITIAL_SALARIES,
} from './services/mockSeedData';
import {
  subscribeToDepartments,
  subscribeToStaff,
  subscribeToAttendance,
  subscribeToLeaves,
  subscribeToSalaries,
  seedInitialDataIfEmpty,
  addStaff,
  updateStaff,
  deleteStaff,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  saveAttendance,
  quickCheckIn,
  quickCheckOut,
  applyLeave,
  reviewLeave,
  addSalaryRecord,
  updateSalaryPayment,
  generateMonthlyPayrollForStaff,
} from './services/hrmService';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { StaffView } from './components/StaffView';
import { AttendanceView } from './components/AttendanceView';
import { LeaveView } from './components/LeaveView';
import { SalaryView } from './components/SalaryView';
import { DepartmentView } from './components/DepartmentView';
import { ReportsView } from './components/ReportsView';
import { QuickCheckInModal } from './components/QuickCheckInModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Core HRM Data States (initialized with rich default sample data)
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>(INITIAL_ATTENDANCE);
  const [leaveList, setLeaveList] = useState<Leave[]>(INITIAL_LEAVES);
  const [salaryList, setSalaryList] = useState<Salary[]>(INITIAL_SALARIES);

  // Modal triggers
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [isAddSalaryOpen, setIsAddSalaryOpen] = useState(false);
  const [isQuickCheckInOpen, setIsQuickCheckInOpen] = useState(false);

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auth listener & Firestore live subscriptions
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsCloudSynced(true);
        // Test connection as required by SKILL.md
        await testConnection();
        // Seed initial data if Firestore collection is fresh and empty
        const didSeed = await seedInitialDataIfEmpty();
        if (didSeed) {
          showToast('Sample company data seeded to your Firebase database!');
        }

        // Attach real-time Firestore listeners
        const unsubDepts = subscribeToDepartments(
          (depts) => {
            if (depts.length > 0) setDepartments(depts);
          },
          (err) => console.warn("Firestore depts listener notice:", err)
        );

        const unsubStaff = subscribeToStaff(
          (st) => {
            if (st.length > 0) setStaffList(st);
          },
          (err) => console.warn("Firestore staff listener notice:", err)
        );

        const unsubAtt = subscribeToAttendance(
          (att) => {
            if (att.length > 0) setAttendanceList(att);
          },
          (err) => console.warn("Firestore att listener notice:", err)
        );

        const unsubLeaves = subscribeToLeaves(
          (lv) => {
            if (lv.length > 0) setLeaveList(lv);
          },
          (err) => console.warn("Firestore leaves listener notice:", err)
        );

        const unsubSal = subscribeToSalaries(
          (sal) => {
            if (sal.length > 0) setSalaryList(sal);
          },
          (err) => console.warn("Firestore salary listener notice:", err)
        );

        return () => {
          unsubDepts();
          unsubStaff();
          unsubAtt();
          unsubLeaves();
          unsubSal();
        };
      } else {
        setIsCloudSynced(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Handlers for Staff
  const handleAddStaff = async (data: Omit<Staff, 'id' | 'createdAt'>) => {
    if (currentUser) {
      await addStaff(data);
    } else {
      const newStaff: Staff = {
        ...data,
        id: `staff_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setStaffList((prev) => [newStaff, ...prev]);
    }
    showToast(`Staff member ${data.name} added successfully!`);
  };

  const handleUpdateStaff = async (staffId: string, updates: Partial<Staff>) => {
    if (currentUser) {
      await updateStaff(staffId, updates);
    } else {
      setStaffList((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
      );
    }
    showToast('Staff profile updated!');
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (currentUser) {
      await deleteStaff(staffId);
    } else {
      setStaffList((prev) => prev.filter((s) => s.id !== staffId));
    }
    showToast('Staff member deleted.');
  };

  // Handlers for Departments
  const handleAddDepartment = async (data: Omit<Department, 'id' | 'createdAt'>) => {
    if (currentUser) {
      await addDepartment(data);
    } else {
      const newDept: Department = {
        ...data,
        id: `dept_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setDepartments((prev) => [...prev, newDept]);
    }
    showToast(`Department ${data.name} created!`);
  };

  const handleUpdateDepartment = async (deptId: string, updates: Partial<Department>) => {
    if (currentUser) {
      await updateDepartment(deptId, updates);
    } else {
      setDepartments((prev) =>
        prev.map((d) => (d.id === deptId ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d))
      );
    }
    showToast('Department updated!');
  };

  const handleDeleteDepartment = async (deptId: string) => {
    if (currentUser) {
      await deleteDepartment(deptId);
    } else {
      setDepartments((prev) => prev.filter((d) => d.id !== deptId));
    }
    showToast('Department deleted.');
  };

  const handleAssignStaff = async (staffId: string, deptId: string, deptName: string) => {
    await handleUpdateStaff(staffId, { departmentId: deptId, departmentName: deptName });
    showToast(`Assigned staff to ${deptName}`);
  };

  // Handlers for Attendance
  const handleSaveAttendance = async (
    record: Omit<Attendance, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (currentUser) {
      await saveAttendance(record);
    } else {
      const now = new Date().toISOString();
      if (record.id) {
        setAttendanceList((prev) =>
          prev.map((a) => (a.id === record.id ? { ...a, ...record, updatedAt: now } : a))
        );
      } else {
        const newAtt: Attendance = {
          ...record,
          id: `att_${Date.now()}`,
          createdAt: now,
        };
        setAttendanceList((prev) => [newAtt, ...prev]);
      }
    }
    showToast('Attendance recorded!');
  };

  const handleQuickCheckIn = async (
    staffId: string,
    staffName: string,
    date: string,
    departmentId?: string
  ) => {
    if (currentUser) {
      await quickCheckIn(staffId, staffName, date, departmentId);
    } else {
      const now = new Date();
      const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const isLate = now.getHours() >= 9 && now.getMinutes() > 15;
      const newAtt: Attendance = {
        id: `att_${Date.now()}`,
        staffId,
        staffName,
        departmentId,
        date,
        checkInTime: timeFormatted,
        status: isLate ? 'late' : 'present',
        notes: isLate ? 'Checked in after 09:15 AM' : 'Standard check-in',
        createdAt: now.toISOString(),
      };
      setAttendanceList((prev) => [newAtt, ...prev]);
    }
    showToast(`Checked in ${staffName}`);
  };

  const handleQuickCheckOut = async (recordId: string, checkInTimeStr?: string) => {
    if (currentUser) {
      await quickCheckOut(recordId, checkInTimeStr);
    } else {
      const now = new Date();
      const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setAttendanceList((prev) =>
        prev.map((a) =>
          a.id === recordId
            ? {
                ...a,
                checkOutTime: timeFormatted,
                workHours: 8.5,
                updatedAt: now.toISOString(),
              }
            : a
        )
      );
    }
    showToast('Checked out successfully!');
  };

  // Handlers for Leave
  const handleApplyLeave = async (
    data: Omit<Leave, 'id' | 'createdAt' | 'status' | 'appliedAt'>
  ) => {
    if (currentUser) {
      await applyLeave(data);
    } else {
      const now = new Date().toISOString();
      const newLv: Leave = {
        ...data,
        id: `leave_${Date.now()}`,
        status: 'pending',
        appliedAt: now,
        createdAt: now,
      };
      setLeaveList((prev) => [newLv, ...prev]);
    }
    showToast('Leave request submitted!');
  };

  const handleReviewLeave = async (
    leaveId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string
  ) => {
    const reviewerName = currentUser?.displayName || 'HR Administrator';
    if (currentUser) {
      await reviewLeave(leaveId, status, reviewerName, reviewNotes);
    } else {
      const now = new Date().toISOString();
      setLeaveList((prev) =>
        prev.map((l) =>
          l.id === leaveId
            ? {
                ...l,
                status,
                reviewedBy: reviewerName,
                reviewedAt: now,
                reviewNotes: reviewNotes || (status === 'approved' ? 'Approved' : 'Declined'),
                updatedAt: now,
              }
            : l
        )
      );
    }
    showToast(`Leave request ${status}!`);
  };

  // Handlers for Salary
  const handleAddSalary = async (data: Omit<Salary, 'id' | 'createdAt'>) => {
    if (currentUser) {
      await addSalaryRecord(data);
    } else {
      const newSalary: Salary = {
        ...data,
        id: `sal_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setSalaryList((prev) => [newSalary, ...prev]);
    }
    showToast(`Salary slip generated for ${data.staffName}!`);
  };

  const handleUpdateSalaryStatus = async (
    salaryId: string,
    status: 'paid' | 'pending',
    method?: string
  ) => {
    if (currentUser) {
      await updateSalaryPayment(salaryId, status, method);
    } else {
      const now = new Date();
      setSalaryList((prev) =>
        prev.map((s) =>
          s.id === salaryId
            ? {
                ...s,
                paymentStatus: status,
                paymentDate: status === 'paid' ? now.toISOString().split('T')[0] : undefined,
                paymentMethod: method || s.paymentMethod || 'Bank Transfer',
                updatedAt: now.toISOString(),
              }
            : s
        )
      );
    }
    showToast(`Salary status updated to ${status.toUpperCase()}`);
  };

  const handleBulkGeneratePayroll = async (staff: Staff[], month: string) => {
    if (currentUser) {
      return await generateMonthlyPayrollForStaff(staff, month);
    } else {
      let count = 0;
      const newRecords: Salary[] = [];
      const now = new Date().toISOString();
      for (const st of staff) {
        if (st.status === 'terminated') continue;
        const allowances = Math.round(st.baseSalary * 0.08);
        const deductions = Math.round(st.baseSalary * 0.05);
        newRecords.push({
          id: `sal_${Date.now()}_${count}`,
          staffId: st.id,
          staffName: st.name,
          departmentName: st.departmentName,
          month,
          baseSalary: st.baseSalary,
          allowances,
          deductions,
          netSalary: st.baseSalary + allowances - deductions,
          paymentStatus: 'pending',
          paymentMethod: 'Bank Transfer (NEFT/IMPS)',
          notes: `Auto-generated payroll slip for ${month}`,
          createdAt: now,
        });
        count++;
      }
      setSalaryList((prev) => [...newRecords, ...prev]);
      return count;
    }
  };

  // Re-seed sample data on demand
  const handleResetSampleData = () => {
    setDepartments(INITIAL_DEPARTMENTS);
    setStaffList(INITIAL_STAFF);
    setAttendanceList(INITIAL_ATTENDANCE);
    setLeaveList(INITIAL_LEAVES);
    setSalaryList(INITIAL_SALARIES);
    showToast('Sample dataset restored!');
  };

  const pendingLeavesCount = leaveList.filter((l) => l.status === 'pending').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCloudSynced={isCloudSynced}
        onOpenAddStaff={() => setIsAddStaffOpen(true)}
        onOpenApplyLeave={() => setIsApplyLeaveOpen(true)}
        onOpenAddSalary={() => setIsAddSalaryOpen(true)}
        onOpenCheckIn={() => setIsQuickCheckInOpen(true)}
        onSeedData={handleResetSampleData}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            staffCount={staffList.filter((s) => s.status !== 'terminated').length}
            departmentsCount={departments.length}
            pendingLeavesCount={pendingLeavesCount}
          />
        </div>

        {/* Content Pane */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Mobile Tab Switcher */}
          <div className="md:hidden flex items-center space-x-1 overflow-x-auto pb-3 mb-4 text-xs font-semibold">
            {(
              [
                ['dashboard', 'Dashboard'],
                ['staff', 'Staff'],
                ['attendance', 'Attendance'],
                ['leave', 'Leave'],
                ['salary', 'Salary'],
                ['departments', 'Departments'],
                ['reports', 'Reports'],
              ] as [TabType, string][]
            ).map(([tabKey, label]) => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                  activeTab === tabKey
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'dashboard' && (
            <DashboardView
              staff={staffList}
              departments={departments}
              attendance={attendanceList}
              leaves={leaveList}
              salaries={salaryList}
              setActiveTab={setActiveTab}
              onOpenAddStaff={() => setIsAddStaffOpen(true)}
              onOpenCheckIn={() => setIsQuickCheckInOpen(true)}
              onApproveLeave={(id) => handleReviewLeave(id, 'approved', 'Approved from Dashboard')}
              onRejectLeave={(id) => handleReviewLeave(id, 'rejected', 'Declined from Dashboard')}
            />
          )}

          {activeTab === 'staff' && (
            <StaffView
              staffList={staffList}
              departments={departments}
              attendanceList={attendanceList}
              leaveList={leaveList}
              salaryList={salaryList}
              onAddStaff={handleAddStaff}
              onUpdateStaff={handleUpdateStaff}
              onDeleteStaff={handleDeleteStaff}
              isAddModalOpen={isAddStaffOpen}
              setIsAddModalOpen={setIsAddStaffOpen}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView
              staffList={staffList}
              attendanceList={attendanceList}
              departments={departments}
              onSaveAttendance={handleSaveAttendance}
              onQuickCheckIn={handleQuickCheckIn}
              onQuickCheckOut={handleQuickCheckOut}
            />
          )}

          {activeTab === 'leave' && (
            <LeaveView
              leaveList={leaveList}
              staffList={staffList}
              onApplyLeave={handleApplyLeave}
              onReviewLeave={handleReviewLeave}
              isApplyModalOpen={isApplyLeaveOpen}
              setIsApplyModalOpen={setIsApplyLeaveOpen}
            />
          )}

          {activeTab === 'salary' && (
            <SalaryView
              salaryList={salaryList}
              staffList={staffList}
              departments={departments}
              onAddSalary={handleAddSalary}
              onUpdateSalaryStatus={handleUpdateSalaryStatus}
              onBulkGeneratePayroll={handleBulkGeneratePayroll}
              isAddSalaryOpen={isAddSalaryOpen}
              setIsAddSalaryOpen={setIsAddSalaryOpen}
            />
          )}

          {activeTab === 'departments' && (
            <DepartmentView
              departments={departments}
              staffList={staffList}
              onAddDepartment={handleAddDepartment}
              onUpdateDepartment={handleUpdateDepartment}
              onDeleteDepartment={handleDeleteDepartment}
              onAssignStaff={handleAssignStaff}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              staffList={staffList}
              departments={departments}
              attendanceList={attendanceList}
              leaveList={leaveList}
              salaryList={salaryList}
            />
          )}
        </main>
      </div>

      {/* Global Quick Check-In Modal */}
      <QuickCheckInModal
        isOpen={isQuickCheckInOpen}
        onClose={() => setIsQuickCheckInOpen(false)}
        staffList={staffList}
        onSaveAttendance={handleSaveAttendance}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 border border-slate-700 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
