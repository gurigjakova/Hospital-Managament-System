/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  Stethoscope, 
  LogOut, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle,
  FileText,
  User,
  Shield,
  CreditCard as BillingIcon,
  Trash2,
  Edit,
  Save,
  X,
  ChevronRight,
  Folder
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Patient {
  Id: string;
  FullName: string;
  DateOfBirth: string;
  Gender: string;
  BloodType: string;
  MedicalHistory: string;
  Phone: string;
  Address: string;
}

interface Appointment {
  Id: string;
  PatientId: string;
  PatientName: string;
  DoctorId: string;
  DoctorName: string;
  AppointmentDate: string;
  Status: 'Waiting' | 'In Progress' | 'Completed';
  Reason: string;
}

interface User {
  Id: string;
  Username: string;
  FullName: string;
  Role: 'Admin' | 'Doctor' | 'Nurse';
}

// --- API Helpers ---
const API_BASE = '/api';

const api = {
  login: async (creds: any) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds)
    });
    return res.json();
  },
  getPatients: () => fetch(`${API_BASE}/patients`).then(r => r.json()),
  addPatient: (p: any) => fetch(`${API_BASE}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p)
  }).then(r => r.json()),
  updatePatient: (id: string, p: any) => fetch(`${API_BASE}/patients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p)
  }).then(r => r.json()),
  deletePatient: (id: string) => fetch(`${API_BASE}/patients/${id}`, { method: 'DELETE' }).then(r => r.json()),
  
  getAppointments: () => fetch(`${API_BASE}/appointments`).then(r => r.json()),
  addAppointment: (a: any) => fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(a)
  }).then(r => r.json()),
  updateAppointmentStatus: (id: string, status: string) => fetch(`${API_BASE}/appointments/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Status: status })
  }).then(r => r.json()),
  getDoctors: () => fetch(`${API_BASE}/doctors`).then(r => r.json()),
  
  addBill: (b: any) => fetch(`${API_BASE}/bills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(b)
  }).then(r => r.json()),
};

// --- Components ---

const WinPanel = ({ title, children, className = "" }: { title: string, children: React.ReactNode, className?: string }) => (
  <div className={`bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col ${className}`}>
    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
      <h2 className="text-xs font-bold text-slate-700 flex items-center uppercase tracking-widest">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
        {title}
      </h2>
    </div>
    <div className="p-6 flex-1 overflow-auto">
      {children}
    </div>
  </div>
);

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full px-6 py-3 flex items-center space-x-3 cursor-pointer transition-colors outline-none ${
      active 
      ? 'bg-blue-600 border-l-4 border-blue-300 text-white' 
      : 'text-slate-300 hover:bg-slate-700'
    }`}
  >
    <Icon size={16} className={active ? "text-white" : "text-slate-400"} />
    <span className="text-sm font-semibold">{label}</span>
  </button>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'Patients' | 'Appointments' | 'Dashboard' | 'Billing' | 'DoctorsPanel' | 'Reports' | 'Lab' | 'Pharmacy' | 'Staff'>('Dashboard');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<{Id: string, FullName: string}[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bloodFilter, setBloodFilter] = useState('All');

  // Form States
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pts, apts, docs, billingData] = await Promise.all([
        api.getPatients(),
        api.getAppointments(),
        api.getDoctors(),
        fetch(`${API_BASE}/bills`).then(r => r.json())
      ]);
      setPatients(pts);
      setAppointments(apts);
      setDoctors(docs);
      setBills(billingData || []);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.login(loginForm);
    if (res.success) setUser(res.user);
    else alert(res.message);
  };

  const handleNfcSimulate = async () => {
    // Simmons NFC Login for Admin
    const res = await api.login({ nfcUid: 'CARD_001' });
    if (res.success) setUser(res.user);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 p-10 w-full max-w-md shadow-xl rounded-sm"
        >
          <div className="flex flex-col items-center mb-10">
            <div className="bg-slate-800 p-4 rounded-sm mb-4 shadow-sm">
              <Stethoscope className="text-white" size={36} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">ClinicFlow HMS</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold mt-1">Medical OS v2.4</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Staff Identity</label>
              <input 
                type="text" 
                placeholder="Username"
                className="w-full px-4 py-3 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm rounded-sm"
                value={loginForm.username}
                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Secure Key</label>
              <input 
                type="password" 
                placeholder="Password"
                className="w-full px-4 py-3 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm rounded-sm"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 font-bold text-sm tracking-widest uppercase shadow-md transition-all rounded-sm active:scale-[0.98]"
            >
              System Authorization
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100">
            <p className="text-center text-[9px] text-slate-400 mb-5 uppercase font-bold tracking-[0.3em]">NFC PROXIMITY LOGIN</p>
            <button 
              onClick={handleNfcSimulate}
              className="w-full bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 py-6 flex flex-col items-center justify-center transition-all group rounded-sm"
            >
              <Shield className="text-slate-300 group-hover:text-blue-500 mb-2" size={28} />
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-500 uppercase tracking-widest">Place badge on reader</span>
            </button>
          </div>

          <p className="text-center mt-10 text-[9px] text-slate-300 font-mono">ENCRYPTED SESSION • WIN7-X64 COMPATIBLE</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 flex flex-col shadow-2xl z-20 text-white">
        <div className="p-8 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-sm shadow-inner">
              <Stethoscope className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">MedCore HMS</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Clinic v2.4</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-6">
          <SidebarItem 
            icon={Users} 
            label="Patient Registry" 
            active={activeTab === 'Patients'} 
            onClick={() => setActiveTab('Patients')} 
          />
          <SidebarItem 
            icon={Calendar} 
            label="Appointments" 
            active={activeTab === 'Appointments'} 
            onClick={() => setActiveTab('Appointments')} 
          />
          {user.Role === 'Admin' && (
            <SidebarItem 
              icon={BillingIcon} 
              label="Billing & POS" 
              active={activeTab === 'Billing'} 
              onClick={() => setActiveTab('Billing')} 
            />
          )}
        </nav>

        <div className="p-6 bg-slate-900/50 border-t border-slate-700/50">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white uppercase shadow-lg">
              {user.FullName.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate">{user.FullName}</span>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">{user.Role} Mode</span>
            </div>
          </div>
          <button 
            onClick={() => setUser(null)}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm"
          >
            <LogOut size={14} />
            <span>Secure Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-10 shrink-0 shadow-sm relative z-10">
          <div className="flex space-x-8 h-full">
            <button 
              onClick={() => setActiveTab('Dashboard')}
              className={`h-full border-b-2 px-1 text-[11px] font-bold uppercase tracking-[0.15em] transition-all ${
                activeTab === 'Dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Main Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('DoctorsPanel')}
              className={`h-full border-b-2 px-1 text-[11px] font-bold uppercase tracking-[0.15em] transition-all ${
                activeTab === 'DoctorsPanel' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Doctor's Panel
            </button>
            <button 
              onClick={() => setActiveTab('Reports')}
              className={`h-full border-b-2 px-1 text-[11px] font-bold uppercase tracking-[0.15em] transition-all ${
                activeTab === 'Reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Report Utility
            </button>
            <button 
              onClick={() => setActiveTab('Lab')}
              className={`h-full border-b-2 px-1 text-[11px] font-bold uppercase tracking-[0.15em] transition-all ${
                activeTab === 'Lab' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Lab Results
            </button>
            <button 
              onClick={() => setActiveTab('Pharmacy')}
              className={`h-full border-b-2 px-1 text-[11px] font-bold uppercase tracking-[0.15em] transition-all ${
                activeTab === 'Pharmacy' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Pharmacy
            </button>
            <button 
              onClick={() => setActiveTab('Staff')}
              className={`h-full border-b-2 px-1 text-[11px] font-bold uppercase tracking-[0.15em] transition-all ${
                activeTab === 'Staff' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Medical Staff
            </button>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="bg-slate-50 px-4 py-1.5 rounded-sm border border-slate-100 text-[10px] font-mono text-slate-500 italic">
              SQLite: Local DB Connected
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Global System Search..." 
                className="pl-9 pr-4 py-2 border border-slate-100 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-[11px] w-64 transition-all rounded-sm"
              />
            </div>
          </div>
        </header>

        <div className="p-10 flex-1 overflow-auto">
          {activeTab === 'Staff' && (
            <div className="space-y-8">
              <WinPanel title="Hospital Personnel Registry">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {doctors.map(d => (
                    <div key={d.Id} className="p-6 border border-slate-100 bg-white rounded-sm shadow-sm hover:border-blue-300 transition-all group">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-sm flex items-center justify-center text-white font-bold group-hover:bg-blue-600 transition-colors">
                          <Stethoscope size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{d.FullName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Medical Doctor (MD)</p>
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                        <span>Status: ACTIVE</span>
                        <button className="text-blue-600 hover:underline">Duty Schedule</button>
                      </div>
                    </div>
                  ))}
                  <div className="p-6 border border-dashed border-slate-200 bg-slate-50/50 rounded-sm flex flex-col items-center justify-center space-y-3 cursor-pointer hover:bg-slate-50 transition-all">
                    <Plus className="text-slate-300" size={24} />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Register Staff</p>
                  </div>
                </div>
              </WinPanel>
            </div>
          )}

          {activeTab === 'Pharmacy' && (
            <div className="space-y-8">
              <WinPanel title="Inventory Control: Pharmaceuticals">
                <div className="overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">NDC Code</th>
                        <th className="px-6 py-4">Medication Name</th>
                        <th className="px-6 py-4">Stock Level</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4 text-right">Utility</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-slate-600 divide-y divide-slate-100 bg-white">
                      {[
                        { code: "NDC-002-911", name: "Amoxicillin 500mg", stock: 450, cat: "Antibiotic", status: "Optimal" },
                        { code: "NDC-114-222", name: "Lisinopril 10mg", stock: 120, cat: "Antihypertensive", status: "Warning" },
                        { code: "NDC-005-443", name: "Metformin 850mg", stock: 300, cat: "Antidiabetic", status: "Optimal" },
                        { code: "NDC-009-887", name: "Atorvastatin 20mg", stock: 50, cat: "Statin", status: "Low" },
                        { code: "NDC-221-001", name: "Paracetamol 500mg", stock: 1000, cat: "Analgesic", status: "Optimal" }
                      ].map((med, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-slate-400">#{med.code}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{med.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${med.status === 'Low' ? 'bg-red-500' : med.status === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (med.stock/1000)*100)}%` }}></div>
                              </div>
                              <span className="font-bold text-[10px]">{med.stock} UI</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 italic text-slate-400">{med.cat}</td>
                          <td className="px-6 py-4 text-right space-x-3">
                            <button className="text-blue-600 font-bold hover:underline text-[9px] uppercase">Refill</button>
                            <button className="text-slate-400 font-bold hover:text-slate-600 text-[9px] uppercase">Log</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </WinPanel>
            </div>
          )}

          {activeTab === 'Patients' && (
            <WinPanel title="Comprehensive Patient Registry">
              <div className="mb-8 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Patient Database</p>
                  <p className="text-xs text-slate-400 mt-1">Manage hospital admission records and clinical histories.</p>
                </div>
                <div className="flex space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input 
                      type="text" 
                      placeholder="Search patient..." 
                      className="pl-8 pr-4 py-2 border border-slate-200 bg-slate-50 text-[11px] rounded-sm focus:bg-white transition-all w-48"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select 
                    className="px-3 py-2 border border-slate-200 bg-slate-50 text-[11px] rounded-sm outline-none focus:bg-white"
                    value={bloodFilter}
                    onChange={(e) => setBloodFilter(e.target.value)}
                  >
                    <option value="All">All Blood Types</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button 
                    onClick={() => { setEditingPatient(null); setShowPatientDialog(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 flex items-center space-x-2 text-[11px] font-bold uppercase tracking-widest transition-all shadow-md rounded-sm"
                  >
                    <Plus size={14} />
                    <span>New Admission</span>
                  </button>
                </div>
              </div>

              <div className="overflow-hidden border border-slate-200 rounded-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">File No.</th>
                      <th className="px-6 py-4">Patient Name</th>
                      <th className="px-6 py-4 text-center">B-Type</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Address Registry</th>
                      <th className="px-6 py-4 text-right">Utility</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-600 divide-y divide-slate-100 bg-white">
                    {patients
                      .filter(p => p.FullName.toLowerCase().includes(searchTerm.toLowerCase()))
                      .filter(p => bloodFilter === 'All' || p.BloodType === bloodFilter)
                      .map(p => (
                      <tr key={p.Id} className="hover:bg-blue-50 transition-colors group">
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-400">#P-{p.Id.slice(0,6).toUpperCase()}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          <button 
                            onClick={() => alert(`PATIENT DOSSIER: ${p.FullName}\nIDENTITY REF: #P-${p.Id.slice(0,8).toUpperCase()}\nGENDER: ${p.Gender}\nPOB/ADDRESS: ${p.Address}\n\nCLINICAL NOTES:\n${p.MedicalHistory || "CLEAR"}`)}
                            className="hover:text-blue-600 hover:underline transition-all text-left"
                          >
                            {p.FullName}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-0.5 bg-red-50 text-red-700 font-bold rounded-sm text-[10px] border border-red-100">
                            {p.BloodType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{p.Phone}</td>
                        <td className="px-6 py-4 text-slate-400 truncate max-w-[200px] italic">{p.Address}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                alert(`Patient File: ${p.FullName}\nHistory: ${p.MedicalHistory || "No notes archived."}\nRegistry Date: ${p.CreatedAt || "Legacy"}`);
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white border border-transparent hover:border-emerald-100 rounded-sm"
                              title="View Clinical Folder"
                            >
                              <Folder size={14} />
                            </button>
                            <button 
                              onClick={() => { setEditingPatient(p); setShowPatientDialog(true); }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-blue-100 rounded-sm"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={async () => {
                                if(confirm("System Alert: Delete patient record forever?")) {
                                  await api.deletePatient(p.Id);
                                  loadData();
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-red-100 rounded-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </WinPanel>
          )}

          {activeTab === 'Appointments' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-6">
                <WinPanel title="Clinic Queue Management">
                  <div className="space-y-4">
                    {appointments.length === 0 && (
                      <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-100 rounded-sm">
                        <Calendar className="mx-auto text-slate-200 mb-3" size={48} />
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono italic">Static State: No active appointments</p>
                      </div>
                    )}
                    <div className="space-y-3">
                      {appointments.map(apt => (
                        <div key={apt.Id} className="flex items-center space-x-5 p-5 bg-white border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all rounded-sm group">
                          <div className={`p-4 rounded-sm shadow-sm ${
                            apt.Status === 'Waiting' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            apt.Status === 'In Progress' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                            'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            <Clock size={22} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold text-slate-800 text-base">{apt.PatientName}</h4>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">{new Date(apt.AppointmentDate).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center text-xs text-slate-500 space-x-3 italic">
                              <span className="font-bold text-slate-600 not-italic uppercase tracking-widest text-[10px]">DR. {apt.DoctorName.toUpperCase()}</span>
                              <span className="text-slate-300">•</span>
                              <span>{apt.Reason}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <select 
                              value={apt.Status}
                              onChange={async (e) => {
                                await api.updateAppointmentStatus(apt.Id, e.target.value);
                                loadData();
                              }}
                              className={`text-[10px] font-bold py-1.5 px-3 border outline-none cursor-pointer uppercase tracking-widest rounded-sm ${
                                apt.Status === 'Waiting' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                                apt.Status === 'In Progress' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                                'border-emerald-200 text-emerald-700 bg-emerald-50'
                              }`}
                            >
                              <option value="Waiting">Waiting</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                            <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-slate-600 transition-opacity">
                              <Search size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </WinPanel>
              </div>

              <div className="space-y-6">
                <WinPanel title="Admission Scheduler">
                  <form className="space-y-6" onSubmit={async (e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    await api.addAppointment({
                      PatientId: data.get('PatientId'),
                      DoctorId: data.get('DoctorId'),
                      AppointmentDate: `${data.get('Date')} ${data.get('Time')}`,
                      Reason: data.get('Reason')
                    });
                    loadData();
                    (e.target as HTMLFormElement).reset();
                  }}>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Patient</label>
                      <select name="PatientId" className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 shadow-sm outline-none text-xs font-semibold text-slate-700 rounded-sm focus:border-blue-400 transition-colors">
                        <option value="">-- SYSTEM REGISTRY --</option>
                        {patients.map(p => <option key={p.Id} value={p.Id}>{p.FullName}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assign Physician</label>
                      <select name="DoctorId" className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 shadow-sm outline-none text-xs font-semibold text-slate-700 rounded-sm focus:border-blue-400 transition-colors">
                        <option value="">-- DOCTOR LOUNGE --</option>
                        {doctors.map(d => <option key={d.Id} value={d.Id}>{d.FullName}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                        <input name="Date" type="date" className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 outline-none text-xs rounded-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</label>
                        <input name="Time" type="time" className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 outline-none text-xs rounded-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visit Reason</label>
                      <textarea name="Reason" rows={3} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 outline-none text-xs resize-none rounded-sm focus:border-blue-400 transition-colors" placeholder="Clinical observations..." />
                    </div>
                    <button type="submit" className="w-full bg-slate-800 text-white py-4 font-bold text-[11px] tracking-[0.2em] uppercase shadow-lg hover:bg-slate-700 active:scale-[0.98] transition-all rounded-sm flex items-center justify-center space-x-2">
                      <Plus size={14} />
                      <span>Confirm Appointment</span>
                    </button>
                  </form>
                </WinPanel>
              </div>
            </div>
          )}

          {activeTab === 'DoctorsPanel' && (
            <div className="space-y-8">
              <WinPanel title="Patient Consultations">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest border-b pb-2">Active Appointments</h3>
                    <div className="space-y-3">
                      {appointments.filter(a => a.Status !== 'Completed').map(apt => (
                        <div key={apt.Id} className="p-4 border border-slate-100 rounded-sm hover:border-blue-500 transition-all cursor-pointer group">
                          <p className="font-bold text-slate-800">{apt.PatientName}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-1">{apt.Reason}</p>
                        </div>
                      ))}
                      {appointments.filter(a => a.Status !== 'Completed').length === 0 && (
                        <p className="text-xs text-slate-400 italic">No pending consultations.</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-6 border-l pl-8">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest border-b pb-2">Clinical Note</h3>
                    <form className="space-y-4" onSubmit={(e) => {
                      e.preventDefault();
                      alert("Clinical Note saved to patient record.");
                      (e.target as HTMLFormElement).reset();
                    }}>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Patient</label>
                        <select className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-xs rounded-sm">
                          {patients.map(p => <option key={p.Id} value={p.Id}>{p.FullName}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prescription / Diagnostic</label>
                        <textarea rows={4} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-xs rounded-sm resize-none" placeholder="Enter findings..."></textarea>
                      </div>
                      <button className="w-full bg-blue-600 text-white py-3 text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-blue-700 transition-all">Submit Evaluation</button>
                    </form>
                  </div>
                </div>
              </WinPanel>
            </div>
          )}

          {activeTab === 'Lab' && (
            <div className="space-y-8">
              <WinPanel title="Diagnostic Laboratory Hub">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b pb-3">New Lab Request</h3>
                    <form className="space-y-4" onSubmit={(e) => {
                      e.preventDefault();
                      alert("Lab Request Broadcasted to Diagnostics Unit.");
                      (e.target as HTMLFormElement).reset();
                    }}>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Patient</label>
                        <select className="w-full p-2 border border-slate-200 bg-slate-50 text-xs rounded-sm">
                          {patients.map(p => <option key={p.Id} value={p.Id}>{p.FullName}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Test Type</label>
                        <select className="w-full p-2 border border-slate-200 bg-slate-50 text-xs rounded-sm">
                          <option>CBC (Complete Blood Count)</option>
                          <option>Lipid Profile</option>
                          <option>Blood Glucose</option>
                          <option>Liver Function Test (LFT)</option>
                          <option>Thyroid Panel</option>
                          <option>Urinalysis</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Urgency</label>
                        <div className="flex space-x-2">
                           <label className="flex-1 flex items-center justify-center p-2 border border-slate-200 text-[10px] font-bold cursor-pointer hover:bg-red-50 hover:border-red-200 rounded-sm">STAT</label>
                           <label className="flex-1 flex items-center justify-center p-2 border border-slate-200 text-[10px] font-bold cursor-pointer hover:bg-blue-50 border-blue-200 bg-blue-50 rounded-sm">NORMAL</label>
                        </div>
                      </div>
                      <button className="w-full py-3 bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest rounded-sm hover:bg-black transition-all">Queue Request</button>
                    </form>
                  </div>
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b pb-3">Pending & Recent Results</h3>
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="p-4 border border-slate-100 flex items-center justify-between hover:border-blue-200 transition-all cursor-pointer bg-white rounded-sm">
                          <div>
                            <p className="text-xs font-bold text-slate-800">CBC - MARCUR RICHARDSON</p>
                            <p className="text-[9px] text-slate-400 font-mono mt-1 uppercase">Ref: LAB-7729-X • Issued: 2h ago</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-[9px] font-bold px-2 py-1 bg-amber-50 text-amber-600 rounded-sm uppercase tracking-tighter">Processing...</span>
                            <ChevronRight size={14} className="text-slate-300" />
                          </div>
                        </div>
                      ))}
                      <div className="p-4 border border-emerald-100 flex items-center justify-between hover:border-emerald-200 transition-all cursor-pointer bg-emerald-50/30 rounded-sm">
                        <div>
                          <p className="text-xs font-bold text-emerald-800 uppercase">Glucose Test - SARAH JENKINS</p>
                          <p className="text-[9px] text-emerald-600/60 font-mono mt-1 uppercase">Ref: LAB-1120-A • Authorized: 1h ago</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-[9px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-sm uppercase tracking-tighter">Ready</span>
                          <FileText size={14} className="text-emerald-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </WinPanel>
            </div>
          )}
          {activeTab === 'Reports' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <WinPanel title="Revenue Analytics">
                  <div className="h-64 flex flex-col justify-center items-center">
                    <p className="text-3xl font-light text-slate-800 tracking-tight">${bills.reduce((acc, curr) => acc + curr.TotalAmount, 0).toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Total Billed Volume</p>
                  </div>
                </WinPanel>
                <WinPanel title="Patient Inflow">
                  <div className="h-64 flex flex-col justify-center items-center">
                    <p className="text-3xl font-light text-slate-800 tracking-tight">{patients.length}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Total Registered Entities</p>
                  </div>
                </WinPanel>
              </div>
              <WinPanel title="Recent Transactions">
                <div className="overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-3">Reference</th>
                        <th className="px-6 py-3">Patient</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-slate-600 divide-y divide-slate-50">
                      {bills.slice(0, 10).map((b, i) => (
                        <tr key={i}>
                          <td className="px-6 py-4 font-mono text-slate-400">#BILL-{b.Id.slice(0,6)}</td>
                          <td className="px-6 py-4 font-bold">{b.PatientName || "Self-Pay"}</td>
                          <td className="px-6 py-4 text-emerald-600 font-bold">${b.TotalAmount}</td>
                          <td className="px-6 py-4 text-right italic">{new Date().toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </WinPanel>
            </div>
          )}
          {activeTab === 'Dashboard' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: "Total Patients", value: patients.length, icon: Users, accent: "border-l-blue-500", meta: "+12 since yesterday" },
                  { label: "Appointments", value: appointments.length, icon: Calendar, accent: "border-l-emerald-500", meta: "Review Schedule" },
                  { label: "Lab Pending", value: "9", icon: Clock, accent: "border-l-amber-500", meta: "High Priority" },
                  { label: "Daily Revenue", value: "$2,840", icon: BillingIcon, accent: "border-l-slate-800", meta: "Billed Assets" }
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`bg-white border border-slate-200 p-6 shadow-sm flex flex-col justify-between rounded-sm border-l-4 ${stat.accent}`}
                  >
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                      <p className="text-3xl font-light text-slate-800 tracking-tight">{stat.value}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.meta}</p>
                      <stat.icon size={16} className="text-slate-100" />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2">
                  <WinPanel title="Active System Queue">
                    <div className="overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200 uppercase tracking-widest">
                          <tr>
                            <th className="px-6 py-3">Patient Name</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Doctor</th>
                            <th className="px-6 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs text-slate-600 divide-y divide-slate-50 bg-white">
                          {appointments.slice(0, 5).map(a => (
                            <tr key={a.Id} className="hover:bg-blue-50 transition-colors group">
                              <td className="px-6 py-4 font-bold text-slate-800">{a.PatientName}</td>
                              <td className="px-6 py-4">
                                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-sm ${
                                  a.Status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {a.Status}
                                </span>
                              </td>
                              <td className="px-6 py-4 italic text-slate-400">Dr. {a.DoctorName}</td>
                              <td className="px-6 py-4 text-right">
                                <button className="text-blue-600 font-bold hover:underline tracking-widest text-[9px] uppercase">Details</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </WinPanel>
                </div>
                
                <div className="space-y-8">
                  <WinPanel title="System Utilities">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Registry", icon: Users, tab: 'Patients' as const },
                        { label: "Scheduler", icon: Calendar, tab: 'Appointments' as const },
                        { label: "Billing", icon: BillingIcon, tab: 'Billing' as const },
                        { label: "Reports", icon: FileText, tab: 'Reports' as const }
                      ].map((action, i) => (
                        <button 
                          key={i}
                          onClick={() => setActiveTab(action.tab)} 
                          className="p-5 border border-slate-100 bg-slate-50/50 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-inner text-center transition-all group rounded-sm"
                        >
                          <action.icon className="mx-auto mb-3 text-slate-300 group-hover:text-blue-500 transition-colors" size={20} />
                          <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-600 uppercase tracking-[0.2em]">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </WinPanel>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Billing' && (
            <div className="max-w-5xl mx-auto">
              <WinPanel title="Medical POS Terminal">
                <form className="space-y-12" onSubmit={async (e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  const patientId = data.get('PatientId') as string;
                  const patient = patients.find(p => p.Id === patientId);
                  const amount = parseFloat(data.get('Amount') as string);
                  const details = data.get('Details') as string;
                  
                  await api.addBill({
                    PatientId: patientId,
                    TotalAmount: amount,
                    ServiceDetails: details
                  });
                  
                  setInvoiceData({
                    patientName: patient?.FullName || 'Anonymous',
                    amount: amount,
                    details: details,
                    date: new Date().toLocaleString(),
                    ref: `INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
                  });
                  setShowInvoice(true);
                  loadData();
                  (e.target as HTMLFormElement).reset();
                }}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Patient Records Access</label>
                        <select name="PatientId" className="w-full px-4 py-3 border border-slate-200 bg-slate-50 outline-none text-sm font-semibold rounded-sm focus:border-blue-400" required>
                          <option value="">-- SYSTEM REGISTRY --</option>
                          {patients.map(p => <option key={p.Id} value={p.Id}>{p.FullName}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Itemized Services</label>
                        <textarea name="Details" rows={6} className="w-full px-5 py-4 border border-slate-200 bg-slate-50 outline-none text-sm resize-none rounded-sm focus:border-blue-400 font-mono" placeholder="1. Consultation..." />
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-8 border border-slate-200 rounded-sm shadow-inner flex flex-col justify-between">
                      <div className="space-y-8">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Service Fee ($)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-2xl font-light">$</span>
                            <input name="Amount" type="number" step="0.01" className="w-full pl-10 pr-4 py-4 border border-slate-200 bg-white text-4xl font-light outline-none text-slate-800 rounded-sm focus:border-blue-400" defaultValue="0.00" />
                          </div>
                        </div>
                        
                        <div className="space-y-4 pt-6 border-t border-slate-200">
                          <div className="flex justify-between items-center py-4 border-t-2 border-slate-800">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Grand Total</span>
                            <span className="text-3xl font-black text-blue-600 tracking-tight">$0.00</span>
                          </div>
                        </div>
                      </div>

                      <button type="submit" className="w-full bg-blue-600 text-white py-5 font-bold text-[11px] tracking-[0.3em] uppercase shadow-2xl hover:bg-blue-700 active:scale-[0.98] flex items-center justify-center space-x-3 transition-all rounded-sm mt-10">
                        <CreditCard size={18} />
                        <span>Confirm Payment & Print</span>
                      </button>
                    </div>
                  </div>
                </form>
              </WinPanel>
            </div>
          )}
        </div>

        {/* Footer Status Line */}
        <footer className="h-10 bg-white border-t border-slate-200 flex items-center justify-between px-10 text-[9px] font-mono text-slate-400 uppercase tracking-widest shrink-0">
          <div>System: MEDCORE-OS • SQLITE: ESTABLISHED • CPU: OPTIMAL</div>
          <div>AES-256 ENCRYPTED SESSION • WIN7-LEGACY MODE</div>
        </footer>
      </main>

      {/* Patient Dialog Modal */}
      <AnimatePresence>
        {showPatientDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowPatientDialog(false)}
            />
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-2xl relative shadow-2xl rounded-sm overflow-hidden"
            >
              <div className="bg-slate-800 text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm tracking-tight">{editingPatient ? 'Archive Update: Patient' : 'New Admission Protocol'}</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Reference ID: {editingPatient ? editingPatient.Id.slice(0,8).toUpperCase() : 'PENDING'}</p>
                </div>
                <button onClick={() => setShowPatientDialog(false)} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
              </div>
              <form 
                className="p-10 space-y-8"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  const p = Object.fromEntries(data.entries());
                  if (editingPatient) {
                    await api.updatePatient(editingPatient.Id, p);
                  } else {
                    await api.addPatient(p);
                  }
                  setShowPatientDialog(false);
                  loadData();
                }}
              >
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name / Identity</label>
                    <input name="FullName" defaultValue={editingPatient?.FullName} required type="text" className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 outline-none text-sm font-semibold rounded-sm focus:border-blue-400 transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date of Birth</label>
                    <input name="DateOfBirth" defaultValue={editingPatient?.DateOfBirth} type="date" className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 outline-none text-sm font-semibold rounded-sm focus:border-blue-400 transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gender Protocol</label>
                    <select name="Gender" defaultValue={editingPatient?.Gender} className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 outline-none text-sm font-semibold rounded-sm focus:border-blue-400 transition-colors">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Blood Type (Rh)</label>
                    <select name="BloodType" defaultValue={editingPatient?.BloodType} className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 outline-none text-sm font-semibold rounded-sm focus:border-blue-400 transition-colors">
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure Contact Channel</label>
                  <input name="Phone" defaultValue={editingPatient?.Phone} type="text" className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 outline-none text-sm font-semibold rounded-sm focus:border-blue-400 transition-colors" placeholder="+1 (555) 000-0000" />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Residential Registry</label>
                  <textarea name="Address" defaultValue={editingPatient?.Address} rows={2} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 outline-none text-sm font-semibold rounded-sm focus:border-blue-400 transition-colors resize-none" />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical History Metadata</label>
                  <textarea name="MedicalHistory" defaultValue={editingPatient?.MedicalHistory} rows={3} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 outline-none text-sm font-semibold rounded-sm focus:border-blue-400 transition-colors resize-none" placeholder="Allergies, chronic conditions..." />
                </div>

                <div className="flex justify-end space-x-4 pt-8 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setShowPatientDialog(false)} 
                    className="px-8 py-3 bg-slate-50 text-slate-400 font-bold text-[11px] uppercase tracking-widest hover:text-slate-600 border border-slate-100 hover:border-slate-200 transition-all rounded-sm"
                  >
                    Discard Changes
                  </button>
                  <button 
                    type="submit" 
                    className="px-8 py-3 bg-slate-800 text-white font-bold text-[11px] uppercase tracking-widest shadow-xl hover:bg-slate-700 active:scale-[0.98] flex items-center space-x-2 transition-all rounded-sm"
                  >
                    <Save size={14} />
                    <span>{editingPatient ? 'Finalize Record' : 'Commit Admission'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Modal */}
      <AnimatePresence>
        {showInvoice && invoiceData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setShowInvoice(false)}
            />
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white w-[500px] relative shadow-2xl rounded-sm overflow-hidden"
            >
              <div className="p-12 space-y-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic">MEDCORE-HMS</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Official Clinical Invoice</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800">{invoiceData.ref}</p>
                    <p className="text-[9px] text-slate-400 font-mono mt-1">{invoiceData.date}</p>
                  </div>
                </div>

                <div className="border-t-2 border-slate-800 pt-8">
                  <div className="grid grid-cols-2 gap-8 text-xs">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Billed To:</p>
                      <p className="font-bold text-slate-800">{invoiceData.patientName}</p>
                      <p className="text-slate-500 italic mt-1 pb-4 border-b border-slate-100">Patient Registry ID Verified</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Facility:</p>
                      <p className="font-bold text-slate-800 uppercase tracking-tight">ClinicFlow Central</p>
                      <p className="text-slate-500 italic mt-1">Surgical Unit A</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Service Description</p>
                   <div className="bg-slate-50 p-6 rounded-sm border border-slate-100 italic text-slate-600 text-sm">
                     {invoiceData.details}
                   </div>
                </div>

                <div className="pt-8 border-t-2 border-slate-800 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Status: Paid in Full</p>
                    <p className="text-[9px] text-slate-400">Archived to Digital Record System</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Final Amount</p>
                    <p className="text-3xl font-black text-slate-800 tracking-tighter">${invoiceData.amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button 
                    onClick={() => setShowInvoice(false)}
                    className="flex-1 bg-slate-800 text-white py-4 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all rounded-sm"
                  >
                    Close Window
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="flex-1 bg-blue-600 text-white py-4 font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all rounded-sm flex items-center justify-center space-x-2"
                  >
                    <FileText size={14} />
                    <span>Print Receipt</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
