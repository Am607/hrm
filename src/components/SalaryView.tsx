import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  CheckCircle,
  Clock,
  Printer,
  Calendar,
  Sparkles,
  CreditCard,
  FileText,
  AlertCircle,
  X,
  ChevronDown,
  Building,
} from 'lucide-react';
import { Salary, Staff, Department, PaymentStatus } from '../types';
import { formatINR } from '../lib/currency';

interface SalaryViewProps {
  salaryList: Salary[];
  staffList: Staff[];
  departments: Department[];
  onAddSalary: (data: Omit<Salary, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateSalaryStatus: (salaryId: string, status: 'paid' | 'pending', method?: string) => Promise<void>;
  onBulkGeneratePayroll: (staffList: Staff[], month: string) => Promise<number>;
  isAddSalaryOpen: boolean;
  setIsAddSalaryOpen: (open: boolean) => void;
}

export const SalaryView: React.FC<SalaryViewProps> = ({
  salaryList,
  staffList,
  departments,
  onAddSalary,
  onUpdateSalaryStatus,
  onBulkGeneratePayroll,
  isAddSalaryOpen,
  setIsAddSalaryOpen,
}) => {
  const currentMonthDefault = new Date().toISOString().substring(0, 7); // e.g. "2026-10"
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthDefault);
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedSalaryForPayslip, setSelectedSalaryForPayslip] = useState<Salary | null>(null);
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    staffId: staffList[0]?.id || '',
    month: currentMonthDefault,
    baseSalary: 60000,
    allowances: 6000,
    deductions: 3500,
    paymentStatus: 'pending' as PaymentStatus,
    paymentMethod: 'Bank Transfer (NEFT/IMPS)',
    notes: 'Monthly regular payroll disbursement',
  });

  const [formError, setFormError] = useState('');

  // Handle staff select to pre-fill base salary
  const handleStaffSelect = (staffId: string) => {
    const s = staffList.find((item) => item.id === staffId);
    setFormData((prev) => ({
      ...prev,
      staffId,
      baseSalary: s ? s.baseSalary : 5000,
    }));
  };

  const handleOpenAdd = () => {
    const defaultStaff = staffList[0];
    setFormData({
      staffId: defaultStaff?.id || '',
      month: selectedMonth,
      baseSalary: defaultStaff ? defaultStaff.baseSalary : 60000,
      allowances: defaultStaff ? Math.round(defaultStaff.baseSalary * 0.08) : 5000,
      deductions: defaultStaff ? Math.round(defaultStaff.baseSalary * 0.05) : 3000,
      paymentStatus: 'pending',
      paymentMethod: 'Bank Transfer (NEFT/IMPS)',
      notes: 'Monthly regular payroll disbursement',
    });
    setFormError('');
    setIsAddSalaryOpen(true);
  };

  const handleSubmitSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.staffId) {
      setFormError('Please select an employee.');
      return;
    }

    const staffObj = staffList.find((s) => s.id === formData.staffId);
    const staffName = staffObj ? staffObj.name : 'Unknown';
    const departmentName = staffObj ? staffObj.departmentName : 'General';
    const netSalary = Number(formData.baseSalary) + Number(formData.allowances) - Number(formData.deductions);

    try {
      await onAddSalary({
        staffId: formData.staffId,
        staffName,
        departmentName,
        month: formData.month,
        baseSalary: Number(formData.baseSalary),
        allowances: Number(formData.allowances),
        deductions: Number(formData.deductions),
        netSalary: Math.max(0, netSalary),
        paymentStatus: formData.paymentStatus,
        paymentDate: formData.paymentStatus === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      });
      setIsAddSalaryOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create salary record');
    }
  };

  // Bulk generate
  const handleBulkGenerate = async () => {
    if (!confirm(`Generate monthly payroll for all active employees for ${selectedMonth}?`)) {
      return;
    }
    try {
      setIsGeneratingBulk(true);
      const count = await onBulkGeneratePayroll(staffList, selectedMonth);
      alert(`Successfully generated ${count} payroll slips for ${selectedMonth}!`);
    } catch (err) {
      console.error("Bulk generate error:", err);
    } finally {
      setIsGeneratingBulk(false);
    }
  };

  // Filter salaries
  const filteredSalaries = salaryList.filter((s) => {
    const monthMatch = !selectedMonth || s.month === selectedMonth;
    const staffMatch = selectedStaffFilter === 'all' || s.staffId === selectedStaffFilter;
    const statusMatch = selectedStatusFilter === 'all' || s.paymentStatus === selectedStatusFilter;
    return monthMatch && staffMatch && statusMatch;
  });

  // Calculate Metrics
  const totalPayroll = filteredSalaries.reduce((sum, s) => sum + (s.netSalary || 0), 0);
  const totalPaid = filteredSalaries
    .filter((s) => s.paymentStatus === 'paid')
    .reduce((sum, s) => sum + s.netSalary, 0);
  const totalPending = totalPayroll - totalPaid;
  const avgSalary = filteredSalaries.length > 0 ? Math.round(totalPayroll / filteredSalaries.length) : 0;

  // Print Payslip
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Salary & Payroll</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employee compensation, generate monthly salary slips, and disburse payouts
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleBulkGenerate}
            disabled={isGeneratingBulk}
            className="flex items-center text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
            title="Auto-generate monthly slips for all staff"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            {isGeneratingBulk ? 'Generating...' : 'Auto-Generate Month'}
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Salary Record
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Net Payroll</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              ₹
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {formatINR(totalPayroll)}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              for {filteredSalaries.length} records
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Paid Out</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-600">
              {formatINR(totalPaid)}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">settled payments</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Payout</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-amber-600">
              {formatINR(totalPending)}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">awaiting disbursement</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Average Payout</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {formatINR(avgSalary)}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">per employee</span>
          </div>
        </div>
      </div>

      {/* Month & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-700">Pay Period Month:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-semibold py-1.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedStaffFilter}
            onChange={(e) => setSelectedStaffFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white"
          >
            <option value="all">All Employees</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Salary Slips Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-4">Base Salary</th>
                <th className="py-3 px-4">Allowances</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4 font-bold text-slate-800">Net Pay</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSalaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No salary records found for this period. Click &ldquo;Auto-Generate Month&rdquo; or &ldquo;Add Salary Record&rdquo;.
                  </td>
                </tr>
              ) : (
                filteredSalaries.map((sal) => (
                  <tr key={sal.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee */}
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-semibold text-slate-900 block">{sal.staffName}</span>
                        <span className="text-[11px] text-slate-400">{sal.departmentName}</span>
                      </div>
                    </td>

                    {/* Month */}
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {sal.month}
                    </td>

                    {/* Base */}
                    <td className="py-3 px-4 text-slate-700">
                      {formatINR(sal.baseSalary)}
                    </td>

                    {/* Allowances */}
                    <td className="py-3 px-4 text-emerald-600">
                      +{formatINR(sal.allowances || 0)}
                    </td>

                    {/* Deductions */}
                    <td className="py-3 px-4 text-rose-600">
                      -{formatINR(sal.deductions || 0)}
                    </td>

                    {/* Net Salary */}
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      {formatINR(sal.netSalary)}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() =>
                          onUpdateSalaryStatus(
                            sal.id,
                            sal.paymentStatus === 'paid' ? 'pending' : 'paid',
                            sal.paymentMethod
                          )
                        }
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase cursor-pointer transition-colors ${
                          sal.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                        title="Click to toggle Paid/Pending"
                      >
                        {sal.paymentStatus === 'paid' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {sal.paymentStatus}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedSalaryForPayslip(sal)}
                          className="flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-[11px] cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          Payslip
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

      {/* Official Printable Payslip Modal */}
      {selectedSalaryForPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between no-print border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Official Monthly Salary Slip
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedSalaryForPayslip(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Document Card */}
            <div id="printable-payslip" className="bg-white p-6 border border-slate-200 rounded-xl space-y-5 text-xs text-slate-800">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">StaffSync HRM</h2>
                  <p className="text-[11px] text-slate-500">Corporate Employee Payroll Slip</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-indigo-700 uppercase px-2.5 py-1 rounded bg-indigo-50 border border-indigo-100 inline-block">
                    {selectedSalaryForPayslip.month}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Generated: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Employee & Payment Meta */}
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block">Employee Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedSalaryForPayslip.staffName}</span>
                  <span className="text-slate-500 block text-[11px]">{selectedSalaryForPayslip.departmentName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Payment Method</span>
                  <span className="font-semibold text-slate-800">
                    {selectedSalaryForPayslip.paymentMethod || 'Bank Transfer'}
                  </span>
                  <span
                    className={`inline-block mt-0.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      selectedSalaryForPayslip.paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedSalaryForPayslip.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Earnings & Deductions Breakdown Table */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                  <span>Description</span>
                  <span className="text-right">Amount (₹)</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-700">Base Salary</span>
                    <span className="font-semibold text-slate-900">
                      {formatINR(selectedSalaryForPayslip.baseSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-700">Allowances & Bonuses</span>
                    <span className="font-semibold text-emerald-600">
                      +{formatINR(selectedSalaryForPayslip.allowances || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-700">Deductions (Tax, PF, Leaves)</span>
                    <span className="font-semibold text-rose-600">
                      -{formatINR(selectedSalaryForPayslip.deductions || 0)}
                    </span>
                  </div>
                </div>

                {/* Net Pay Total */}
                <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900 mt-3">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">NET TAKE-HOME PAY</span>
                    <span className="text-[10px] text-slate-400">Total credited to staff account</span>
                  </div>
                  <span className="text-xl font-extrabold text-indigo-700">
                    {formatINR(selectedSalaryForPayslip.netSalary)}
                  </span>
                </div>
              </div>

              {selectedSalaryForPayslip.notes && (
                <div className="text-[11px] text-slate-500 italic p-2.5 bg-slate-50 rounded-lg">
                  Notes: {selectedSalaryForPayslip.notes}
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-200 text-center">
                <div>
                  <div className="border-b border-slate-300 w-32 mx-auto mb-1"></div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Employee Signature</span>
                </div>
                <div>
                  <div className="border-b border-slate-300 w-32 mx-auto mb-1"></div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Authorized HR Signatory</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Salary Modal */}
      {isAddSalaryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Create Salary Record</h2>
              <button
                onClick={() => setIsAddSalaryOpen(false)}
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

            <form onSubmit={handleSubmitSalary} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Employee *</label>
                <select
                  value={formData.staffId}
                  onChange={(e) => handleStaffSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} &bull; {formatINR(s.baseSalary)}/mo ({s.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Pay Period Month *</label>
                  <input
                    type="month"
                    required
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Base Salary (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Allowances / Bonus (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Deductions (Tax, PF, Leaves) (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                <span className="font-semibold text-indigo-900">Calculated Net Payout:</span>
                <span className="font-extrabold text-base text-indigo-700">
                  {formatINR(Math.max(0, formData.baseSalary + formData.allowances - formData.deductions))}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Disbursement Status</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT/IMPS)</option>
                    <option value="UPI / Direct Deposit">UPI / Direct Deposit</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. October monthly salary + quarterly performance bonus"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSalaryOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Save Salary Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
