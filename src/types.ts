export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  joinDate: Date;
  totalContributed: number;
  currentBalance: number;
}

export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
  method: 'M-Pesa' | 'Bank Transfer' | 'Cash';
  reference: string;
}

export interface Reminder {
  id: string;
  memberId: string;
  message: string;
  type: 'payment_due' | 'payment_overdue' | 'meeting_reminder';
  status: 'pending' | 'sent' | 'delivered';
  scheduledDate: Date;
  createdDate: Date;
}