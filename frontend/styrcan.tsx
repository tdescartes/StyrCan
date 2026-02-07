import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Calendar, Clock, Star, BookOpen, PiggyBank, FileText, Tags, 
  Play, History, FileCheck, User, Inbox, Megaphone, MessageSquare, FolderOpen, 
  Bell, Search, Plus, Filter, MoreHorizontal, ChevronRight, Lock, Check, Menu, X, 
  CreditCard, Shield, Briefcase, ArrowUpRight, Download, Zap, LogOut, ChevronDown, 
  AlertCircle, File, Moon, Sun, Laptop, Archive, Eye, Trash2, Command, 
  ChevronLeft, Layout, Copy, ExternalLink, HelpCircle, GripVertical, CheckSquare, Square,
  Send, Paperclip, RefreshCw, DollarSign, PieChart, BarChart, Activity
} from 'lucide-react';

// --- SYSTEM CONFIG & THEME ---
// "Zinc" palette: Professional, Stark, High Contrast.
// Implements Spec Section 1.5 & 3.1

const PLANS = {
  standard: { name: 'Standard', price: '49', features: ['basic'] },
  professional: { name: 'Professional', price: '129', features: ['basic', 'adv'] },
  enterprise: { name: 'Enterprise', price: 'Custom', features: ['basic', 'adv', 'ent'] },
};

// --- MOCK DATA (Spec Section 16 Data Models) ---
const CURRENT_USER = {
  id: 'USR-001',
  name: 'John Doe',
  role: 'Admin', // Owner/Admin capabilities
  email: 'john@styrcan.com',
  company: 'StyrCan Inc.',
  avatar: 'JD',
  plan: 'professional' // Toggle to 'standard' to see locks
};

const EMPLOYEES_DATA = Array.from({ length: 18 }).map((_, i) => ({
  id: `EMP-${1000 + i}`,
  name: ['Alice Freeman', 'Bob Smith', 'Charlie Davis', 'Diana Prince', 'Evan Wright', 'Fiona Gallagher', 'George Michael', 'Hannah Abbott'][i % 8] + (i > 7 ? ` ${i}` : ''),
  role: ['Software Engineer', 'Product Manager', 'Designer', 'Head of Ops', 'Junior Dev', 'HR Specialist', 'Sales Lead', 'QA Engineer'][i % 8],
  dept: ['Engineering', 'Product', 'Design', 'Operations', 'Engineering', 'HR', 'Sales', 'Engineering'][i % 8],
  status: i === 2 ? 'On Leave' : i % 10 === 0 ? 'Inactive' : 'Active',
  salary: 75000 + (i * 2500),
  hireDate: '2024-03-15',
  ptoBalance: { total: 20, used: i % 5 === 0 ? 5 : 0, available: i % 5 === 0 ? 15 : 20 }
}));

const TRANSACTIONS_DATA = [
  { id: 'TRX-101', date: '2026-02-05', desc: 'Client Payment - Acme Corp', amount: 12500.00, type: 'income', category: 'Sales' },
  { id: 'TRX-102', date: '2026-02-04', desc: 'AWS Infrastructure', amount: 850.00, type: 'expense', category: 'Software' },
  { id: 'TRX-103', date: '2026-02-03', desc: 'Office Rent - Feb', amount: 4500.00, type: 'expense', category: 'Rent' },
  { id: 'TRX-104', date: '2026-02-01', desc: 'Payroll Run #2026-02-A', amount: 48250.00, type: 'expense', category: 'Payroll' },
  { id: 'TRX-105', date: '2026-01-28', desc: 'Q1 Consultant Retainer', amount: 5000.00, type: 'expense', category: 'Services' },
];

const THREADS_DATA = [
  { id: 1, name: 'Engineering Team', type: 'group', unread: 3, lastMsg: 'Deployment scheduled for Friday.', time: '2m ago' },
  { id: 2, name: 'Alice Freeman', type: 'direct', unread: 0, lastMsg: 'Can we review the Q1 roadmap?', time: '1h ago' },
  { id: 3, name: 'Payroll Updates', type: 'group', unread: 0, lastMsg: 'Tax documents have been uploaded.', time: '1d ago' },
];

const PAYROLL_RUNS = [
  { id: 'PR-2026-02-A', period: 'Feb 1 - Feb 15', status: 'Draft', total: 48250.00, date: 'Feb 15, 2026' },
  { id: 'PR-2026-01-B', period: 'Jan 16 - Jan 31', status: 'Completed', total: 47900.00, date: 'Jan 31, 2026' },
];

// --- UTILITY COMPONENTS ---

const Badge = ({ children, variant = 'default', className = '' }) => {
  const styles = {
    default: 'bg-zinc-100 text-zinc-600 border-transparent',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    error: 'bg-rose-50 text-rose-700 border-rose-100',
    black: 'bg-black text-white border-black',
    outline: 'bg-white text-zinc-500 border-zinc-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-100'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-widest font-bold border ${styles[variant] || styles.default} ${className}`}>
      {children}
    </span>
  );
};

const Button = ({ children, variant = 'primary', size = 'md', icon: Icon, onClick, disabled, className = '', fullWidth = false, loading = false }) => {
  const base = "relative inline-flex items-center justify-center font-bold transition-all focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm active:translate-y-[1px] uppercase tracking-wide text-xs overflow-hidden";
  const variants = {
    primary: "bg-black text-white hover:bg-zinc-800 border border-black shadow-sm",
    secondary: "bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 shadow-sm",
    ghost: "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
    danger: "bg-white border border-rose-200 text-rose-600 hover:bg-rose-50",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600"
  };
  const sizes = {
    xs: "px-2 py-1 text-[10px]",
    sm: "px-3 py-1.5",
    md: "px-5 py-2.5",
    lg: "px-8 py-3",
    icon: "p-2"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : Icon ? (
        <Icon className={`w-4 h-4 ${children ? 'mr-2' : ''} opacity-80`} />
      ) : null}
      {children}
    </button>
  );
};

const Card = ({ children, className = '', noPadding = false, title, subtitle, actions, locked = false }) => (
  <div className={`relative bg-white border border-zinc-200 rounded-sm shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] ${className} ${locked ? 'overflow-hidden' : ''}`}>
    {(title || actions) && (
      <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-start">
        <div>
          {title && <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
            {title} {locked && <Lock className="w-3 h-3 text-amber-500" />}
          </h3>}
          {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    )}
    <div className={noPadding ? '' : 'p-6'}>
      {children}
    </div>
    {locked && (
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 z-10">
        <div className="bg-white p-4 rounded-full shadow-xl mb-3">
          <Lock className="w-6 h-6 text-zinc-400" />
        </div>
        <h4 className="font-bold text-zinc-900">Feature Locked</h4>
        <p className="text-xs text-zinc-500 mt-1 mb-3 max-w-[200px]">Upgrade to Professional to unlock this feature.</p>
        <Button size="xs" variant="primary">Upgrade Plan</Button>
      </div>
    )}
  </div>
);

const SearchBar = ({ placeholder = "Search..." }) => (
  <div className="relative group w-full max-w-md">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-black transition-colors" />
    <input 
      type="text" 
      placeholder={placeholder} 
      className="w-full pl-9 pr-12 py-2 bg-zinc-50 border border-zinc-200 rounded-sm text-sm focus:outline-none focus:bg-white focus:border-black/20 focus:ring-4 focus:ring-black/5 transition-all"
    />
  </div>
);

const Toast = ({ message, type, onClose }) => (
  <div className="animate-in slide-in-from-bottom-5 fade-in duration-300 fixed bottom-6 right-6 z-50 flex items-center p-4 bg-white border border-zinc-200 shadow-xl rounded-sm max-w-sm w-full">
    <div className={`w-2 h-2 rounded-full mr-3 ${type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-blue-500'}`} />
    <div className="flex-1">
      <h4 className="text-sm font-bold text-zinc-900 capitalize">{type}</h4>
      <p className="text-xs text-zinc-500 mt-0.5">{message}</p>
    </div>
    <button onClick={onClose} className="text-zinc-400 hover:text-black">
      <X className="w-4 h-4" />
    </button>
  </div>
);

// --- MAIN APPLICATION STRUCTURE (Spec Section 3.3) ---

export default function StyrCanApp() {
  // Navigation State
  const [currentService, setCurrentService] = useState('home'); // home, employees, finance, payroll, communication, settings
  const [currentView, setCurrentView] = useState('dashboard'); // Specific view within service
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // UI State
  const [toast, setToast] = useState(null);
  
  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- SERVICE CONFIGURATION ---
  const services = useMemo(() => ({
    home: { 
      label: 'Home', 
      icon: LayoutDashboard,
      sidebar: [] 
    },
    employees: { 
      label: 'Employees', 
      icon: Users,
      sidebar: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'directory', label: 'Directory', icon: Users },
        { id: 'schedule', label: 'Schedule', icon: Calendar },
        { id: 'pto', label: 'Time Off', icon: Clock },
      ]
    },
    finance: { 
      label: 'Finance', 
      icon: PiggyBank,
      sidebar: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'ledger', label: 'Ledger', icon: FileText },
        { id: 'budgets', label: 'Budgets', icon: PieChart, locked: CURRENT_USER.plan === 'standard' },
        { id: 'categories', label: 'Categories', icon: Tags },
      ]
    },
    payroll: { 
      label: 'Payroll', 
      icon: CreditCard,
      sidebar: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'runs', label: 'Payroll Runs', icon: Play },
        { id: 'history', label: 'History', icon: History },
        { id: 'documents', label: 'Tax Docs', icon: FileCheck, locked: true }, // Ent only
      ]
    },
    communication: { 
      label: 'Communication', 
      icon: MessageSquare,
      sidebar: [
        { id: 'inbox', label: 'Inbox', icon: Inbox },
        { id: 'broadcasts', label: 'Broadcasts', icon: Megaphone, locked: CURRENT_USER.plan === 'standard' },
        { id: 'files', label: 'Files', icon: FolderOpen },
      ]
    },
    settings: {
      label: 'Settings',
      icon: Shield,
      sidebar: [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'company', label: 'Company', icon: Briefcase },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'billing', label: 'Billing', icon: CreditCard },
      ]
    }
  }), []);

  // --- SUB-COMPONENTS FOR VIEWS ---

  // 1. HOME / LANDING (Spec 10.1)
  const HomeView = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Welcome back, {CURRENT_USER.name.split(' ')[0]}.</h1>
          <p className="text-zinc-500 mt-2">Here is your daily overview for {CURRENT_USER.company}.</p>
        </div>
        <Button variant="secondary" icon={ExternalLink}>View Site</Button>
      </div>

      {/* Service Selector Cards (Spec 10.1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => { setCurrentService('employees'); setCurrentView('dashboard'); }} className="group bg-white p-6 border border-zinc-200 rounded-sm shadow-sm hover:border-black transition-all cursor-pointer">
          <div className="w-10 h-10 bg-zinc-100 rounded-sm flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-colors">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg mb-1">Employees</h3>
          <p className="text-xs text-zinc-500 mb-4">Manage staff, PTO, and schedules.</p>
          <div className="flex gap-2 text-xs font-medium text-zinc-600">
            <span className="bg-zinc-50 px-2 py-1 rounded-sm border border-zinc-100">18 Active</span>
            <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded-sm border border-rose-100">1 On Leave</span>
          </div>
        </div>

        <div onClick={() => { setCurrentService('finance'); setCurrentView('dashboard'); }} className="group bg-white p-6 border border-zinc-200 rounded-sm shadow-sm hover:border-black transition-all cursor-pointer">
          <div className="w-10 h-10 bg-zinc-100 rounded-sm flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-colors">
            <PiggyBank className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg mb-1">Finance</h3>
          <p className="text-xs text-zinc-500 mb-4">Track cash flow and expenses.</p>
          <div className="flex gap-2 text-xs font-medium text-zinc-600">
            <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-sm border border-emerald-100">+$12.5k Rev</span>
            <span className="bg-zinc-50 px-2 py-1 rounded-sm border border-zinc-100">84% Margin</span>
          </div>
        </div>

        <div onClick={() => { setCurrentService('payroll'); setCurrentView('dashboard'); }} className="group bg-white p-6 border border-zinc-200 rounded-sm shadow-sm hover:border-black transition-all cursor-pointer">
          <div className="w-10 h-10 bg-zinc-100 rounded-sm flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-colors">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg mb-1">Payroll</h3>
          <p className="text-xs text-zinc-500 mb-4">Process salaries and taxes.</p>
          <div className="flex gap-2 text-xs font-medium text-zinc-600">
            <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-sm border border-amber-100">Run Due Feb 15</span>
          </div>
        </div>

        <div onClick={() => { setCurrentService('communication'); setCurrentView('inbox'); }} className="group bg-white p-6 border border-zinc-200 rounded-sm shadow-sm hover:border-black transition-all cursor-pointer">
          <div className="w-10 h-10 bg-zinc-100 rounded-sm flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-colors">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg mb-1">Communication</h3>
          <p className="text-xs text-zinc-500 mb-4">Team chat and announcements.</p>
          <div className="flex gap-2 text-xs font-medium text-zinc-600">
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-sm border border-blue-100">3 Unread</span>
          </div>
        </div>
      </div>
      
      {/* Global Dashboard Widgets (Spec 10.1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Activity" noPadding>
          <div className="divide-y divide-zinc-100">
            {[
              { text: 'Payroll Run #2026-02-A created', user: 'John Doe', time: '2 hours ago', icon: CreditCard },
              { text: 'Alice Freeman requested PTO', user: 'Alice Freeman', time: '4 hours ago', icon: Clock },
              { text: 'New invoice #1024 paid', user: 'System', time: 'Yesterday', icon: DollarSign },
              { text: 'Weekly Sync scheduled', user: 'Evan Wright', time: 'Yesterday', icon: Calendar },
            ].map((item, i) => (
              <div key={i} className="p-4 flex items-center gap-3 hover:bg-zinc-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">{item.text}</p>
                  <p className="text-xs text-zinc-500">{item.user} • {item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-3">
             <Button variant="secondary" className="justify-start h-auto py-3 px-4" icon={Plus} onClick={() => { setCurrentService('employees'); setCurrentView('directory'); }}>Add Employee</Button>
             <Button variant="secondary" className="justify-start h-auto py-3 px-4" icon={CreditCard} onClick={() => { setCurrentService('finance'); setCurrentView('ledger'); }}>Log Expense</Button>
             <Button variant="secondary" className="justify-start h-auto py-3 px-4" icon={Play} onClick={() => { setCurrentService('payroll'); setCurrentView('runs'); }}>Run Payroll</Button>
             <Button variant="secondary" className="justify-start h-auto py-3 px-4" icon={Megaphone} onClick={() => { setCurrentService('communication'); setCurrentView('broadcasts'); }}>Send Broadcast</Button>
          </div>
        </Card>
      </div>
    </div>
  );

  // 2. EMPLOYEES VIEWS (Spec 5)
  const EmployeeDirectory = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Directory</h2>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Filter}>Filter</Button>
          <Button icon={Plus} onClick={() => showToast('Opened Add Employee Modal')}>Add Employee</Button>
        </div>
      </div>
      <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider font-bold text-zinc-500">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {EMPLOYEES_DATA.map(emp => (
              <tr key={emp.id} className="hover:bg-zinc-50 group">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600">
                      {emp.name.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900">{emp.name}</div>
                      <div className="text-xs text-zinc-500">{emp.dept}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3 text-zinc-600">{emp.role}</td>
                <td className="px-6 py-3">
                  <Badge variant={emp.status === 'Active' ? 'success' : emp.status === 'On Leave' ? 'warning' : 'default'}>{emp.status}</Badge>
                </td>
                <td className="px-6 py-3 text-right">
                  <button className="text-zinc-400 hover:text-black"><MoreHorizontal className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const PTOManager = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Time Off Requests</h2>
          <Button icon={Plus}>Request PTO</Button>
        </div>
        <Card noPadding>
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex gap-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <span className="flex-1">Employee</span>
            <span className="w-24">Type</span>
            <span className="w-32">Dates</span>
            <span className="w-24">Status</span>
          </div>
          <div className="divide-y divide-zinc-100">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4 hover:bg-zinc-50">
                <div className="flex-1 font-bold text-sm">Alice Freeman</div>
                <div className="w-24"><Badge>Vacation</Badge></div>
                <div className="w-32 text-xs text-zinc-600">Feb 20 - Feb 24</div>
                <div className="w-24">
                  {i === 0 ? <Badge variant="warning">Pending</Badge> : <Badge variant="success">Approved</Badge>}
                </div>
                {i === 0 && (
                  <div className="flex gap-2">
                    <Button size="xs" variant="secondary" onClick={() => showToast('Request Rejected')}>Reject</Button>
                    <Button size="xs" variant="primary" onClick={() => showToast('Request Approved')}>Approve</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div>
        <Card title="My Balance" subtitle="Year 2026">
          <div className="space-y-4 mt-2">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Vacation</span>
                <span className="text-zinc-500">12 / 20 days</span>
              </div>
              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-black w-[60%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Sick Leave</span>
                <span className="text-zinc-500">2 / 10 days</span>
              </div>
              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[20%]" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  // 3. FINANCE VIEWS (Spec 6)
  const FinanceLedger = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Transaction Ledger</h2>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Download}>Export</Button>
          <Button icon={Plus} onClick={() => showToast('Add Transaction modal')}>Add Entry</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 border border-zinc-200 rounded-sm">
          <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Total Revenue</div>
          <div className="text-2xl font-bold text-zinc-900 mt-1">$12,500.00</div>
        </div>
        <div className="bg-white p-4 border border-zinc-200 rounded-sm">
          <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Total Expenses</div>
          <div className="text-2xl font-bold text-zinc-900 mt-1">$53,600.00</div>
        </div>
        <div className="bg-white p-4 border border-zinc-200 rounded-sm">
          <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Net Profit</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">-$41,100.00</div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider font-bold text-zinc-500">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {TRANSACTIONS_DATA.map(trx => (
              <tr key={trx.id} className="hover:bg-zinc-50">
                <td className="px-6 py-3 text-zinc-500 font-mono text-xs">{trx.date}</td>
                <td className="px-6 py-3 font-medium text-zinc-900">{trx.desc}</td>
                <td className="px-6 py-3"><Badge variant="outline">{trx.category}</Badge></td>
                <td className={`px-6 py-3 text-right font-mono font-bold ${trx.type === 'income' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                  {trx.type === 'income' ? '+' : '-'}${trx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 4. PAYROLL VIEWS (Spec 7)
  const PayrollManager = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-zinc-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold">Payroll Runs</h2>
          <p className="text-zinc-500 mt-1 text-sm">Manage pay periods and process salaries.</p>
        </div>
        <Button icon={Plus}>Create Run</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PAYROLL_RUNS.map(run => (
          <Card key={run.id} className="group hover:border-black transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">{run.id}</div>
                <h3 className="text-lg font-bold">{run.period}</h3>
              </div>
              <Badge variant={run.status === 'Draft' ? 'warning' : 'success'}>{run.status}</Badge>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs text-zinc-500">Total Payout</div>
                <div className="text-xl font-mono font-bold">${run.total.toLocaleString()}</div>
              </div>
              {run.status === 'Draft' ? (
                <Button size="sm" onClick={() => showToast('Processing payroll...', 'success')}>Process Run</Button>
              ) : (
                <Button size="sm" variant="secondary" icon={Download}>Report</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  // 5. COMMUNICATION VIEWS (Spec 8)
  const InboxView = () => {
    const [selectedThreadId, setSelectedThreadId] = useState(1);
    const activeThread = THREADS_DATA.find(t => t.id === selectedThreadId);

    return (
      <div className="flex h-[calc(100vh-140px)] border border-zinc-200 rounded-sm bg-white overflow-hidden shadow-sm">
        {/* Thread List (Left) */}
        <div className="w-80 border-r border-zinc-200 flex flex-col bg-zinc-50/30">
          <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-white">
            <h3 className="font-bold text-sm">Inbox</h3>
            <button className="text-zinc-400 hover:text-black"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {THREADS_DATA.map(thread => (
              <div 
                key={thread.id} 
                onClick={() => setSelectedThreadId(thread.id)}
                className={`p-4 border-b border-zinc-100 cursor-pointer hover:bg-zinc-50 transition-colors ${selectedThreadId === thread.id ? 'bg-zinc-100 shadow-inner' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-bold text-sm ${thread.unread ? 'text-black' : 'text-zinc-700'}`}>{thread.name}</span>
                  <span className="text-[10px] text-zinc-400">{thread.time}</span>
                </div>
                <p className={`text-xs truncate ${thread.unread ? 'font-medium text-zinc-900' : 'text-zinc-500'}`}>{thread.lastMsg}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area (Right) */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="h-14 border-b border-zinc-200 flex items-center px-6 justify-between bg-white">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-bold text-sm">{activeThread?.name}</span>
            </div>
            <Button size="xs" variant="ghost" icon={MoreHorizontal} />
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-zinc-50/50">
             {/* Mock Messages */}
             <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-zinc-200 flex-shrink-0" />
               <div className="bg-white border border-zinc-200 p-3 rounded-sm rounded-tl-none text-sm shadow-sm max-w-[80%]">
                 <p className="text-zinc-800">Hi everyone, just a reminder about the all-hands meeting tomorrow.</p>
                 <span className="text-[10px] text-zinc-400 mt-1 block">Yesterday 2:30 PM</span>
               </div>
             </div>
             
             <div className="flex gap-3 flex-row-reverse">
               <div className="w-8 h-8 rounded-full bg-black flex-shrink-0 text-white flex items-center justify-center text-xs font-bold">JD</div>
               <div className="bg-black text-white p-3 rounded-sm rounded-tr-none text-sm shadow-sm max-w-[80%]">
                 <p>Thanks for the reminder! I'll be there.</p>
                 <span className="text-[10px] text-white/50 mt-1 block">Yesterday 2:35 PM</span>
               </div>
             </div>
          </div>

          <div className="p-4 border-t border-zinc-200 bg-white">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="w-full pl-4 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-sm text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                 <button className="p-1.5 text-zinc-400 hover:text-black"><Paperclip className="w-4 h-4" /></button>
                 <button className="p-1.5 text-zinc-400 hover:text-black"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- MAIN LAYOUT RENDERER ---
  
  const SidebarItem = ({ item }) => {
    const isActive = currentView === item.id;
    return (
      <button
        onClick={() => !item.locked && setCurrentView(item.id)}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-all duration-200 group relative
          ${isActive ? 'bg-zinc-100 text-black shadow-inner' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'}
          ${item.locked ? 'opacity-60 cursor-not-allowed' : ''}
          ${sidebarCollapsed ? 'justify-center' : ''}
        `}
      >
        <item.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-black' : 'text-zinc-400 group-hover:text-black'}`} />
        {!sidebarCollapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {item.locked && <Lock className="w-3 h-3 text-amber-500" />}
          </>
        )}
        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-black rounded-r-full" />}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-900 overflow-hidden">
      {/* GLOBAL HEADER (Spec 3.3) */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 z-50 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentService('home')}>
            <div className="w-6 h-6 bg-black text-white flex items-center justify-center rounded-sm">
              <Zap className="w-3 h-3 fill-current" />
            </div>
            <span className="font-bold tracking-tight text-lg">STYRCAN</span>
          </div>

          {/* Service Switcher Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {['home', 'employees', 'finance', 'payroll', 'communication'].map(svc => {
              const ServiceIcon = services[svc].icon;
              const isActive = currentService === svc;
              return (
                <button 
                  key={svc}
                  onClick={() => { setCurrentService(svc); setCurrentView(services[svc].sidebar[0]?.id || 'dashboard'); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${isActive ? 'bg-black text-white' : 'text-zinc-500 hover:text-black hover:bg-zinc-100'}`}
                >
                  <ServiceIcon className="w-3 h-3" />
                  {services[svc].label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-zinc-400 hover:text-black transition-colors" onClick={() => setCurrentService('settings')}><Shield className="w-5 h-5" /></button>
          <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold border border-zinc-300">
             {CURRENT_USER.avatar}
          </div>
        </div>
      </div>

      {/* SERVICE SIDEBAR (Spec 3.3) */}
      {services[currentService].sidebar.length > 0 && (
        <aside className={`fixed left-0 top-16 bottom-0 z-40 bg-white border-r border-zinc-200 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
           <div className="p-4 space-y-1">
             {services[currentService].sidebar.map(item => <SidebarItem key={item.id} item={item} />)}
           </div>
           
           <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute right-[-12px] top-6 bg-white border border-zinc-200 rounded-full p-1 shadow-sm text-zinc-400 hover:text-black hover:scale-110 transition-transform"
          >
             {sidebarCollapsed ? <ChevronRight className="w-3 h-3"/> : <ChevronLeft className="w-3 h-3"/>}
          </button>
        </aside>
      )}

      {/* MAIN CONTENT */}
      <main className={`flex-1 pt-16 transition-all duration-300 overflow-y-auto ${services[currentService].sidebar.length > 0 ? (sidebarCollapsed ? 'ml-16' : 'ml-64') : ''}`}>
        <div className="max-w-[1600px] mx-auto p-8 min-h-full">
          {/* Breadcrumbs */}
          <div className="flex items-center text-xs text-zinc-500 mb-6">
            <span className="uppercase tracking-wider font-bold">{services[currentService].label}</span>
            <ChevronRight className="w-3 h-3 mx-2" />
            <span className="font-medium text-zinc-900 capitalize">{currentView}</span>
          </div>

          {/* View Routing */}
          {currentService === 'home' && <HomeView />}
          {currentService === 'employees' && (
            currentView === 'directory' ? <EmployeeDirectory /> :
            currentView === 'pto' ? <PTOManager /> :
            <div className="text-center py-20 text-zinc-400">Dashboard / Schedule View Placeholder</div>
          )}
          {currentService === 'finance' && (
            currentView === 'ledger' ? <FinanceLedger /> :
            currentView === 'dashboard' ? <div className="text-center py-20 text-zinc-400">Finance Dashboard Placeholder</div> :
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-200 rounded-sm bg-zinc-50">
              <Lock className="w-8 h-8 text-zinc-300 mb-4" />
              <p className="text-zinc-500 font-medium">This feature requires a Professional Plan.</p>
            </div>
          )}
          {currentService === 'payroll' && (
            currentView === 'runs' ? <PayrollManager /> :
            <div className="text-center py-20 text-zinc-400">Dashboard / History View Placeholder</div>
          )}
          {currentService === 'communication' && (
            currentView === 'inbox' ? <InboxView /> :
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-200 rounded-sm bg-zinc-50">
               <Megaphone className="w-8 h-8 text-zinc-300 mb-4" />
               <p className="text-zinc-500 font-medium">Broadcasts are available on the Professional Plan.</p>
            </div>
          )}
           {currentService === 'settings' && (
            <div className="max-w-2xl mx-auto py-10">
               <h2 className="text-2xl font-bold mb-6">Settings</h2>
               <div className="space-y-6">
                  <Card title="Profile">
                     <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center text-xl font-bold text-zinc-500">{CURRENT_USER.avatar}</div>
                        <div>
                           <Button variant="secondary" size="sm">Change Avatar</Button>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 mt-6">
                        <div>
                           <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">First Name</label>
                           <input type="text" value="John" className="w-full p-2 border border-zinc-200 rounded-sm text-sm" readOnly />
                        </div>
                        <div>
                           <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Last Name</label>
                           <input type="text" value="Doe" className="w-full p-2 border border-zinc-200 rounded-sm text-sm" readOnly />
                        </div>
                     </div>
                  </Card>
               </div>
            </div>
          )}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}