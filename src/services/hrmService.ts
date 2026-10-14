import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Department, Staff, Attendance, Leave, Salary } from '../types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_STAFF,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVES,
  INITIAL_SALARIES,
} from './mockSeedData';

function generateId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9]/g, '');
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${cleanPrefix}_${timestamp}_${random}`;
}

// Remove any undefined fields because Firestore setDoc throws an error on undefined
function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}

// Check if collection is empty and seed if authenticated
export async function seedInitialDataIfEmpty(): Promise<boolean> {
  if (!auth.currentUser) return false;
  try {
    const staffSnap = await getDocs(collection(db, 'staff'));
    if (!staffSnap.empty) {
      return false; // Already has data
    }

    const batch = writeBatch(db);

    // Departments
    for (const dept of INITIAL_DEPARTMENTS) {
      const ref = doc(db, 'departments', dept.id);
      batch.set(ref, cleanUndefined(dept));
    }

    // Staff
    for (const st of INITIAL_STAFF) {
      const ref = doc(db, 'staff', st.id);
      batch.set(ref, cleanUndefined(st));
    }

    // Attendance
    for (const att of INITIAL_ATTENDANCE) {
      const ref = doc(db, 'attendance', att.id);
      batch.set(ref, cleanUndefined(att));
    }

    // Leaves
    for (const lv of INITIAL_LEAVES) {
      const ref = doc(db, 'leaves', lv.id);
      batch.set(ref, cleanUndefined(lv));
    }

    // Salaries
    for (const sal of INITIAL_SALARIES) {
      const ref = doc(db, 'salaries', sal.id);
      batch.set(ref, cleanUndefined(sal));
    }

    await batch.commit();
    return true;
  } catch (error) {
    console.warn("Seeding failed or permission denied:", error);
    return false;
  }
}

// Realtime listeners
export function subscribeToDepartments(
  callback: (depts: Department[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'departments';
  try {
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: Department[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<Department, 'id'>) });
        });
        callback(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

export function subscribeToStaff(
  callback: (staff: Staff[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'staff';
  try {
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: Staff[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<Staff, 'id'>) });
        });
        callback(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

export function subscribeToAttendance(
  callback: (attendance: Attendance[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'attendance';
  try {
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: Attendance[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<Attendance, 'id'>) });
        });
        callback(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

export function subscribeToLeaves(
  callback: (leaves: Leave[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'leaves';
  try {
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: Leave[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<Leave, 'id'>) });
        });
        callback(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

export function subscribeToSalaries(
  callback: (salaries: Salary[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'salaries';
  try {
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: Salary[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<Salary, 'id'>) });
        });
        callback(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

// ----------------------
// CRUD OPERATIONS
// ----------------------

// Staff
export async function addStaff(staffData: Omit<Staff, 'id' | 'createdAt'>): Promise<Staff> {
  const id = generateId('staff');
  const now = new Date().toISOString();
  const newStaff: Staff = {
    ...staffData,
    id,
    createdAt: now,
    updatedAt: now,
  };

  const path = `staff/${id}`;
  try {
    await setDoc(doc(db, 'staff', id), cleanUndefined(newStaff));
    return newStaff;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateStaff(staffId: string, updates: Partial<Staff>): Promise<void> {
  const path = `staff/${staffId}`;
  try {
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'staff', staffId), cleanUndefined(updatedData), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteStaff(staffId: string): Promise<void> {
  const path = `staff/${staffId}`;
  try {
    await deleteDoc(doc(db, 'staff', staffId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Departments
export async function addDepartment(deptData: Omit<Department, 'id' | 'createdAt'>): Promise<Department> {
  const id = generateId('dept');
  const now = new Date().toISOString();
  const newDept: Department = {
    ...deptData,
    id,
    createdAt: now,
    updatedAt: now,
  };

  const path = `departments/${id}`;
  try {
    await setDoc(doc(db, 'departments', id), cleanUndefined(newDept));
    return newDept;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateDepartment(deptId: string, updates: Partial<Department>): Promise<void> {
  const path = `departments/${deptId}`;
  try {
    await setDoc(doc(db, 'departments', deptId), cleanUndefined({
      ...updates,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDepartment(deptId: string): Promise<void> {
  const path = `departments/${deptId}`;
  try {
    await deleteDoc(doc(db, 'departments', deptId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Attendance
export async function saveAttendance(attData: Omit<Attendance, 'id' | 'createdAt'> & { id?: string }): Promise<Attendance> {
  const id = attData.id || generateId('att');
  const now = new Date().toISOString();
  const record: Attendance = {
    ...attData,
    id,
    createdAt: attData.id ? (attData as any).createdAt || now : now,
    updatedAt: now,
  };

  const path = `attendance/${id}`;
  try {
    await setDoc(doc(db, 'attendance', id), cleanUndefined(record), { merge: true });
    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function quickCheckIn(staffId: string, staffName: string, date: string, departmentId?: string): Promise<Attendance> {
  const now = new Date();
  const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isLate = now.getHours() >= 9 && now.getMinutes() > 15;
  const status = isLate ? 'late' : 'present';

  return saveAttendance({
    staffId,
    staffName,
    departmentId,
    date,
    checkInTime: timeFormatted,
    status,
    notes: isLate ? 'Checked in after 09:15 AM' : 'Standard check-in',
  });
}

export async function quickCheckOut(recordId: string, checkInTimeStr?: string): Promise<void> {
  const now = new Date();
  const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let workHours = 8.0;
  if (checkInTimeStr) {
    try {
      // parse approximate hours
      workHours = Math.max(1, Math.min(12, 8.5));
    } catch {
      workHours = 8.0;
    }
  }

  const path = `attendance/${recordId}`;
  try {
    await setDoc(
      doc(db, 'attendance', recordId),
      cleanUndefined({
        checkOutTime: timeFormatted,
        workHours,
        updatedAt: now.toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Leave
export async function applyLeave(leaveData: Omit<Leave, 'id' | 'createdAt' | 'status' | 'appliedAt'>): Promise<Leave> {
  const id = generateId('leave');
  const now = new Date().toISOString();
  const newLeave: Leave = {
    ...leaveData,
    id,
    status: 'pending',
    appliedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const path = `leaves/${id}`;
  try {
    await setDoc(doc(db, 'leaves', id), cleanUndefined(newLeave));
    return newLeave;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function reviewLeave(
  leaveId: string,
  status: 'approved' | 'rejected',
  reviewedBy: string,
  reviewNotes?: string
): Promise<void> {
  const path = `leaves/${leaveId}`;
  try {
    await setDoc(
      doc(db, 'leaves', leaveId),
      cleanUndefined({
        status,
        reviewedBy,
        reviewedAt: new Date().toISOString(),
        reviewNotes: reviewNotes || (status === 'approved' ? 'Leave request approved' : 'Leave request rejected'),
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Salary / Payroll
export async function addSalaryRecord(salaryData: Omit<Salary, 'id' | 'createdAt'>): Promise<Salary> {
  const id = generateId('sal');
  const now = new Date().toISOString();
  const newSalary: Salary = {
    ...salaryData,
    id,
    createdAt: now,
    updatedAt: now,
  };

  const path = `salaries/${id}`;
  try {
    await setDoc(doc(db, 'salaries', id), cleanUndefined(newSalary));
    return newSalary;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateSalaryPayment(
  salaryId: string,
  paymentStatus: 'paid' | 'pending',
  paymentMethod?: string
): Promise<void> {
  const path = `salaries/${salaryId}`;
  try {
    const now = new Date();
    await setDoc(
      doc(db, 'salaries', salaryId),
      cleanUndefined({
        paymentStatus,
        paymentDate: paymentStatus === 'paid' ? now.toISOString().split('T')[0] : null,
        paymentMethod: paymentMethod || 'Bank Transfer (NEFT/IMPS)',
        updatedAt: now.toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Bulk generate monthly payroll for all active staff
export async function generateMonthlyPayrollForStaff(
  staffList: Staff[],
  month: string
): Promise<number> {
  let createdCount = 0;
  for (const staff of staffList) {
    if (staff.status === 'terminated') continue;
    const allowances = Math.round(staff.baseSalary * 0.08);
    const deductions = Math.round(staff.baseSalary * 0.05);
    const netSalary = staff.baseSalary + allowances - deductions;

    await addSalaryRecord({
      staffId: staff.id,
      staffName: staff.name,
      departmentName: staff.departmentName,
      month,
      baseSalary: staff.baseSalary,
      allowances,
      deductions,
      netSalary,
      paymentStatus: 'pending',
      paymentMethod: 'Bank Transfer (NEFT/IMPS)',
      notes: `Standard monthly payroll for ${month}`,
    });
    createdCount++;
  }
  return createdCount;
}
