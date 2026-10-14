import React from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarCheck2,
  DollarSign,
  Building2,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { TabType } from '../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  staffCount: number;
  departmentsCount: number;
  pendingLeavesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  staffCount,
  departmentsCount,
  pendingLeavesCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'staff' as TabType,
      label: 'Staff Directory',
      icon: Users,
      badge: staffCount > 0 ? staffCount : null,
    },
    {
      id: 'attendance' as TabType,
      label: 'Attendance',
      icon: Clock,
      badge: null,
    },
    {
      id: 'leave' as TabType,
      label: 'Leave Management',
      icon: CalendarCheck2,
      badge: pendingLeavesCount > 0 ? `${pendingLeavesCount} pending` : null,
      badgeVariant: 'amber',
    },
    {
      id: 'salary' as TabType,
      label: 'Salary & Payroll',
      icon: DollarSign,
      badge: null,
    },
    {
      id: 'departments' as TabType,
      label: 'Departments',
      icon: Building2,
      badge: departmentsCount > 0 ? departmentsCount : null,
    },
    {
      id: 'reports' as TabType,
      label: 'Reports & Analytics',
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Main Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-indigo-600' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.badgeVariant === 'amber'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : isActive
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Workflow Guide */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>HR Lifecycle Flow</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Staff &#8594; Attendance &#8594; Leave &#8594; Salary &#8594; Reports
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100">
        <div className="text-[11px] text-slate-400 flex items-center justify-between">
          <span>StaffSync v1.0 MVP</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
        </div>
      </div>
    </aside>
  );
};
