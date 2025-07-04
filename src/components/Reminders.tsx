import React, { useState } from 'react';
import { Plus, Send, Bell, Calendar, MessageCircle } from 'lucide-react';
import { Reminder, Member } from '../types';

interface RemindersProps {
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  members: Member[];
}

const Reminders: React.FC<RemindersProps> = ({ reminders, setReminders, members }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '',
    message: '',
    type: 'payment_due' as const,
    scheduledDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newReminder: Reminder = {
      id: Date.now().toString(),
      memberId: formData.memberId,
      message: formData.message,
      type: formData.type,
      status: 'pending',
      scheduledDate: new Date(formData.scheduledDate),
      createdDate: new Date()
    };
    
    setReminders([...reminders, newReminder]);
    setFormData({
      memberId: '',
      message: '',
      type: 'payment_due',
      scheduledDate: new Date().toISOString().split('T')[0]
    });
    setShowAddForm(false);
  };

  const handleSendReminder = (id: string) => {
    setReminders(reminders.map(reminder => 
      reminder.id === id 
        ? { ...reminder, status: 'sent' }
        : reminder
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment_due': return <Bell className="h-4 w-4" />;
      case 'payment_overdue': return <Calendar className="h-4 w-4" />;
      case 'meeting_reminder': return <MessageCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Reminders</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Create Reminder
        </button>
      </div>

      {/* Add Reminder Form */}
      {showAddForm && (
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Reminder</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
                <select
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select member</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="payment_due">Payment Due</option>
                  <option value="payment_overdue">Payment Overdue</option>
                  <option value="meeting_reminder">Meeting Reminder</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your reminder message..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Reminder
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reminders List */}
      <div className="space-y-4">
        {reminders.map((reminder) => {
          const member = members.find(m => m.id === reminder.memberId);
          return (
            <div key={reminder.id} className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(reminder.type)}
                    <h3 className="font-semibold text-gray-900">{member?.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(reminder.status)}`}>
                      {reminder.status}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{reminder.message}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>📅 {reminder.scheduledDate.toLocaleDateString()}</span>
                    <span>📱 {member?.phone}</span>
                    <span>Created: {reminder.createdDate.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {reminder.status === 'pending' && (
                    <button
                      onClick={() => handleSendReminder(reminder.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                      <Send size={14} />
                      Send
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {reminders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No reminders created yet</p>
          <p className="text-gray-400 text-sm mt-2">Create your first reminder to start communicating with members</p>
        </div>
      )}
    </div>
  );
};

export default Reminders;