import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  Building2, 
  Cloud, 
  CloudOff, 
  LogIn, 
  LogOut, 
  Plus, 
  Sparkles, 
  Calendar,
  UserCheck,
  FileText,
  DollarSign,
  UserPlus
} from 'lucide-react';
import { signInWithGoogle, logoutUser } from '../lib/firebase';
import { TabType } from '../types';

interface NavbarProps {
  currentUser: User | null;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isCloudSynced: boolean;
  onOpenAddStaff: () => void;
  onOpenApplyLeave: () => void;
  onOpenAddSalary: () => void;
  onOpenCheckIn: () => void;
  onSeedData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  isCloudSynced,
  onOpenAddStaff,
  onOpenApplyLeave,
  onOpenAddSalary,
  onOpenCheckIn,
  onSeedData,
}) => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setAuthLoading(true);
      await signInWithGoogle();
    } catch (err) {
      console.error("Sign-in failed:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setAuthLoading(true);
      await logoutUser();
    } catch (err) {
      console.error("Sign-out failed:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">StaffSync</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">HRM</span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Simple Employee & Payroll Suite</p>
            </div>
          </div>

          {/* Center Info: Date & Sync Status */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <span>{todayFormatted}</span>
            </div>

            <div 
              className={`flex items-center text-xs px-2.5 py-1 rounded-full border ${
                isCloudSynced && currentUser
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={
                isCloudSynced && currentUser
                  ? 'Synchronized with Firebase Firestore in real time'
                  : 'Operating in local demo mode. Sign in with Google to sync Firestore cloud data.'
              }
            >
              {isCloudSynced && currentUser ? (
                <>
                  <Cloud className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  <span className="font-medium">Firebase Live Sync</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                  <span className="font-medium">Demo Mode</span>
                </>
              )}
            </div>
          </div>

          {/* Right Action buttons & Auth */}
          <div className="flex items-center space-x-3">
            {/* Quick Demo Data Seed */}
            <button
              onClick={onSeedData}
              className="hidden lg:flex items-center text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors cursor-pointer"
              title="Reset or replenish with sample departments, staff, attendance, and payroll records"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Sample Data
            </button>

            {/* Quick Action Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowQuickMenu(!showQuickMenu)}
                className="flex items-center text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Quick Action</span>
              </button>

              {showQuickMenu && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 text-xs"
                  onClick={() => setShowQuickMenu(false)}
                >
                  <button
                    onClick={onOpenAddStaff}
                    className="w-full flex items-center px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 mr-2.5 text-slate-400" />
                    Add New Staff
                  </button>
                  <button
                    onClick={onOpenCheckIn}
                    className="w-full flex items-center px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 mr-2.5 text-slate-400" />
                    Record Attendance
                  </button>
                  <button
                    onClick={onOpenApplyLeave}
                    className="w-full flex items-center px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 mr-2.5 text-slate-400" />
                    Apply for Leave
                  </button>
                  <button
                    onClick={onOpenAddSalary}
                    className="w-full flex items-center px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4 mr-2.5 text-slate-400" />
                    Create Salary Slip
                  </button>
                </div>
              )}
            </div>

            {/* Google Authentication */}
            {currentUser ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-medium text-xs flex items-center justify-center">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-none">
                    {currentUser.displayName || 'Admin User'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {currentUser.email}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  disabled={authLoading}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={authLoading}
                className="flex items-center text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
                title="Sign in with your Google account for multi-device Firestore sync"
              >
                <svg className="w-3.5 h-3.5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{authLoading ? 'Signing in...' : 'Sign In'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
