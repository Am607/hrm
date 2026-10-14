export type StaffStatus = 'active' | 'on_leave' | 'terminated';

export interface Department {
  id: string;
  name: string;
  description: string;
  headStaffId?: string;
  headStaffName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  departmentId: string;
  departmentName: string;
  joinDate: string;
  status: StaffStatus;
  baseSalary: number;
  emergencyContact?: string;
  notes?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day';

export interface Attendance {
  id: string;
  staffId: string;
  staffName: string;
  departmentId?: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string; // e.g. "09:05 AM"
  checkOutTime?: string; // e.g. "05:30 PM"
  status: AttendanceStatus;
  workHours?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type LeaveType = 'annual' | 'sick' | 'casual' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface Leave {
  id: string;
  staffId: string;
  staffName: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type PaymentStatus = 'pending' | 'paid';

export interface Salary {
  id: string;
  staffId: string;
  staffName: string;
  departmentName: string;
  month: string; // e.g. "2026-10" or "October 2026"
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentStatus: PaymentStatus;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type TabType = 'dashboard' | 'staff' | 'attendance' | 'leave' | 'salary' | 'departments' | 'reports';
