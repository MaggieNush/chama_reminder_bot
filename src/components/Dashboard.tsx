import React from 'react';
import { Users, CreditCard, AlertCircle, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Member, Payment, Reminder } from '../types';

interface DashboardProps {
  members: Member[];
  payments: Payment[];
  reminders: Reminder[];
}

const Dashboard: React.FC<DashboardProps> = ({ members, payments, reminders }) => {
  const totalContributions = members.reduce((sum, member) => sum + member.totalContributed, 0);
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const pendingReminders = reminders.filter(r => r.status === 'pending').length;
  const completedPayments = payments.filter(p => p.status === 'completed').length;

  const stats = [
    {
      label: 'Total Members',
      value: members.length,
      icon: Users,
      color: 'bg-blue-500',
      change: '+2 this month'
    },
    {
      label: 'Total Contributions',
      value: `KSh ${totalContributions.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+15% this month'
    },
    {
      label: 'Pending Payments',
      value: pendingPayments,
      icon: AlertCircle,
      color: 'bg-yellow-500',
      change: `${pendingPayments} due this week`
    },
    {
      label: 'Completed Payments',
      value: completedPayments,
      icon: CreditCard,
      color: 'bg-indigo-500',
      change: '+8 this month'
    }
  ];

  const recentPayments = payments.slice(0, 5);
  const upcomingReminders = reminders.filter(r => r.status === 'pending').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-600" />
            Recent Payments
          </h3>
          <div className="space-y-3">
            {recentPayments.map((payment) => {
              const member = members.find(m => m.id === payment.memberId);
              return (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{member?.name}</p>
                    <p className="text-sm text-gray-600">{payment.method} • {payment.reference}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">KSh {payment.amount.toLocaleString()}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : payment.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Reminders */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-yellow-600" />
            Upcoming Reminders
          </h3>
          <div className="space-y-3">
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map((reminder) => {
                const member = members.find(m => m.id === reminder.memberId);
                return (
                  <div key={reminder.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{member?.name}</p>
                        <p className="text-sm text-gray-600 mt-1">{reminder.message}</p>
                      </div>
                      <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                        {reminder.scheduledDate.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming reminders</p>
            )}
          </div>
        </div>
      </div>

      {/* Member Summary */}
      <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Member Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {members.map((member) => (
            <div key={member.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-600">KSh {member.totalContributed.toLocaleString()}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  member.currentBalance >= 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {member.currentBalance >= 0 ? 'Up to date' : 'Overdue'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;