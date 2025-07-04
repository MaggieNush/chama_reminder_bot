import React, { useState } from 'react';
import { Users, CreditCard, Bell, BarChart3, Calendar, LogOut } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Payments from './components/Payments';
import Reminders from './components/Reminders';
import History from './components/History';
import Login from './components/Login';
import ExportModal from './components/ExportModal';
import { Member, Payment, Reminder } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showExportModal, setShowExportModal] = useState(false);

  const [members, setMembers] = useState<Member[]>([
    {
      id: '1',
      name: 'Mary Wanjiku',
      phone: '+254712345678',
      email: 'mary@example.com',
      joinDate: new Date('2024-01-15'),
      totalContributed: 15000,
      currentBalance: 500
    },
    {
      id: '2',
      name: 'John Mwangi',
      phone: '+254723456789',
      email: 'john@example.com',
      joinDate: new Date('2024-01-20'),
      totalContributed: 12000,
      currentBalance: -1000
    },
    {
      id: '3',
      name: 'Grace Akinyi',
      phone: '+254734567890',
      email: 'grace@example.com',
      joinDate: new Date('2024-02-01'),
      totalContributed: 18000,
      currentBalance: 2000
    }
  ]);

  const [payments, setPayments] = useState<Payment[]>([
    {
      id: '1',
      memberId: '1',
      amount: 1500,
      date: new Date('2024-12-01'),
      status: 'completed',
      method: 'M-Pesa',
      reference: 'MP240001'
    },
    {
      id: '2',
      memberId: '2',
      amount: 1500,
      date: new Date('2024-12-15'),
      status: 'pending',
      method: 'Bank Transfer',
      reference: 'BT240002'
    },
    {
      id: '3',
      memberId: '3',
      amount: 1500,
      date: new Date('2024-11-30'),
      status: 'completed',
      method: 'Cash',
      reference: 'CASH240003'
    }
  ]);

  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      memberId: '2',
      message: 'Monthly contribution of KSh 1,500 is due on 15th Dec',
      type: 'payment_due',
      status: 'pending',
      scheduledDate: new Date('2024-12-13'),
      createdDate: new Date('2024-12-10')
    }
  ]);

  // Demo user credentials
  const users = {
    'admin': { password: 'admin123', role: 'Administrator' },
    'manager': { password: 'manager123', role: 'Manager' },
    'treasurer': { password: 'treasurer123', role: 'Treasurer' }
  };

  const handleLogin = (credentials: { username: string; password: string }) => {
    const user = users[credentials.username as keyof typeof users];
    if (user && user.password === credentials.password) {
      setIsAuthenticated(true);
      setCurrentUser({ username: credentials.username, role: user.role });
    } else {
      alert('Invalid credentials. Please check the demo credentials provided.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'history', label: 'History', icon: Calendar }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard members={members} payments={payments} reminders={reminders} />;
      case 'members':
        return <Members members={members} setMembers={setMembers} />;
      case 'payments':
        return <Payments payments={payments} setPayments={setPayments} members={members} />;
      case 'reminders':
        return <Reminders reminders={reminders} setReminders={setReminders} members={members} />;
      case 'history':
        return <History payments={payments} members={members} />;
      default:
        return <Dashboard members={members} payments={payments} reminders={reminders} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Chama Manager</h1>
            <p className="text-gray-600 text-lg">Track payments, manage members, and send reminders</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome back,</p>
              <p className="font-semibold text-gray-900">{currentUser?.username}</p>
              <p className="text-xs text-gray-500">{currentUser?.role}</p>
            </div>
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Calendar size={20} />
              Export Report
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  <Icon size={20} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {renderContent()}
        </div>

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          members={members}
          payments={payments}
        />
      </div>
    </div>
  );
}

export default App;