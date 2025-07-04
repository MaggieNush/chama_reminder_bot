import React, { useState } from 'react';
import { Download, X, FileText, Calendar, Users, CreditCard } from 'lucide-react';
import { Member, Payment } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  payments: Payment[];
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, members, payments }) => {
  const [exportType, setExportType] = useState('payments');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [format, setFormat] = useState('csv');

  if (!isOpen) return null;

  const generateCSV = (data: any[], headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header.toLowerCase().replace(' ', '_')] || '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');
    
    return csvContent;
  };

  const generateJSON = (data: any[]) => {
    return JSON.stringify(data, null, 2);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    let data: any[] = [];
    let filename = '';
    let headers: string[] = [];

    switch (exportType) {
      case 'payments':
        data = payments
          .filter(payment => {
            const paymentDate = new Date(payment.date);
            const memberFilter = selectedMembers.length === 0 || selectedMembers.includes(payment.memberId);
            return paymentDate >= startDate && paymentDate <= endDate && memberFilter;
          })
          .map(payment => {
            const member = members.find(m => m.id === payment.memberId);
            return {
              date: payment.date.toLocaleDateString(),
              member_name: member?.name || 'Unknown',
              member_phone: member?.phone || '',
              amount: payment.amount,
              method: payment.method,
              reference: payment.reference,
              status: payment.status
            };
          });
        headers = ['Date', 'Member Name', 'Member Phone', 'Amount', 'Method', 'Reference', 'Status'];
        filename = `payments_${dateRange.start}_to_${dateRange.end}`;
        break;

      case 'members':
        data = members
          .filter(member => selectedMembers.length === 0 || selectedMembers.includes(member.id))
          .map(member => ({
            name: member.name,
            phone: member.phone,
            email: member.email,
            join_date: member.joinDate.toLocaleDateString(),
            total_contributed: member.totalContributed,
            current_balance: member.currentBalance
          }));
        headers = ['Name', 'Phone', 'Email', 'Join Date', 'Total Contributed', 'Current Balance'];
        filename = `members_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'summary':
        const memberSummaries = members.map(member => {
          const memberPayments = payments.filter(p => p.memberId === member.id);
          const totalPaid = memberPayments.reduce((sum, p) => sum + p.amount, 0);
          const lastPayment = memberPayments.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
          
          return {
            name: member.name,
            phone: member.phone,
            total_contributed: member.totalContributed,
            current_balance: member.currentBalance,
            last_payment_date: lastPayment ? lastPayment.date.toLocaleDateString() : 'Never',
            last_payment_amount: lastPayment ? lastPayment.amount : 0,
            payment_count: memberPayments.length
          };
        });
        data = memberSummaries;
        headers = ['Name', 'Phone', 'Total Contributed', 'Current Balance', 'Last Payment Date', 'Last Payment Amount', 'Payment Count'];
        filename = `member_summary_${new Date().toISOString().split('T')[0]}`;
        break;
    }

    const content = format === 'csv' ? generateCSV(data, headers) : generateJSON(data);
    const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
    const fileExtension = format === 'csv' ? 'csv' : 'json';
    
    downloadFile(content, `${filename}.${fileExtension}`, mimeType);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Report
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'payments', label: 'Payment History', icon: CreditCard, desc: 'All payment records' },
                { id: 'members', label: 'Member List', icon: Users, desc: 'Member information' },
                { id: 'summary', label: 'Member Summary', icon: FileText, desc: 'Payment summaries per member' }
              ].map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setExportType(type.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      exportType === type.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mb-2 ${exportType === type.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          {exportType === 'payments' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Date Range</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Member Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Members (leave empty for all)
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {members.map(member => (
                <label key={member.id} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers([...selectedMembers, member.id]);
                      } else {
                        setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                      }
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{member.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
            <div className="flex gap-4">
              {[
                { id: 'csv', label: 'CSV (Excel)', desc: 'Comma-separated values' },
                { id: 'json', label: 'JSON', desc: 'JavaScript Object Notation' }
              ].map(fmt => (
                <button
                  key={fmt.id}
                  onClick={() => setFormat(fmt.id)}
                  className={`flex-1 p-3 border-2 rounded-lg text-left transition-colors ${
                    format === fmt.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{fmt.label}</div>
                  <div className="text-sm text-gray-500">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;