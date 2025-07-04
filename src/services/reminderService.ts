import { Member, Payment, Reminder } from '../types/bot';
import { WhatsAppService } from './whatsappService';

export class ReminderService {
  private whatsappService: WhatsAppService;
  
  constructor() {
    this.whatsappService = new WhatsAppService();
  }
  
  // Check for upcoming payment deadlines
  checkUpcomingDeadlines(members: Member[], payments: Payment[]): Reminder[] {
    const upcomingReminders: Reminder[] = [];
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    members.forEach(member => {
      const memberPayments = payments.filter(p => p.memberId === member.id);
      const lastPayment = memberPayments.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      
      // Check if member hasn't paid in the last 30 days
      const daysSinceLastPayment = lastPayment 
        ? Math.floor((today.getTime() - lastPayment.date.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      // Generate reminders based on payment patterns
      if (daysSinceLastPayment >= 25 && daysSinceLastPayment < 30) {
        // 5 days before due date
        upcomingReminders.push({
          id: `auto_${Date.now()}_${member.id}`,
          memberId: member.id,
          message: `Hi ${member.name}! 👋 Your monthly contribution of KSh 1,500 is due in 5 days. Please make your payment to avoid late fees. Thank you! 💰`,
          type: 'payment_due',
          status: 'pending',
          scheduledDate: today,
          createdDate: today
        });
      } else if (daysSinceLastPayment >= 30 && daysSinceLastPayment < 35) {
        // Payment overdue
        upcomingReminders.push({
          id: `auto_${Date.now()}_${member.id}`,
          memberId: member.id,
          message: `Hello ${member.name}, your monthly contribution is now overdue. Please make your payment of KSh 1,500 as soon as possible. Contact us if you need assistance. 🔔`,
          type: 'payment_overdue',
          status: 'pending',
          scheduledDate: today,
          createdDate: today
        });
      } else if (daysSinceLastPayment >= 45) {
        // Seriously overdue
        upcomingReminders.push({
          id: `auto_${Date.now()}_${member.id}`,
          memberId: member.id,
          message: `URGENT: ${member.name}, your payment is seriously overdue (${daysSinceLastPayment} days). Please contact the treasurer immediately to discuss your account. Your current balance is KSh ${member.currentBalance.toLocaleString()}. ⚠️`,
          type: 'payment_overdue',
          status: 'pending',
          scheduledDate: today,
          createdDate: today
        });
      }
      
      // Weekly reminder for members with negative balance
      if (member.currentBalance < 0 && daysSinceLastPayment % 7 === 0) {
        upcomingReminders.push({
          id: `weekly_${Date.now()}_${member.id}`,
          memberId: member.id,
          message: `Weekly reminder: ${member.name}, your account balance is KSh ${member.currentBalance.toLocaleString()}. Please make a payment to bring your account up to date. 📊`,
          type: 'payment_overdue',
          status: 'pending',
          scheduledDate: today,
          createdDate: today
        });
      }
    });
    
    return upcomingReminders;
  }
  
  // Send automatic reminders
  async sendAutomaticReminders(reminders: Reminder[], members: Member[]): Promise<void> {
    for (const reminder of reminders) {
      const member = members.find(m => m.id === reminder.memberId);
      if (member) {
        try {
          await this.whatsappService.sendMessage(member.phone, reminder.message);
          reminder.status = 'sent';
          console.log(`Reminder sent to ${member.name} (${member.phone})`);
        } catch (error) {
          console.error(`Failed to send reminder to ${member.name}:`, error);
          reminder.status = 'pending';
        }
      }
    }
  }
  
  // Generate meeting reminders
  generateMeetingReminder(members: Member[], meetingDate: Date, meetingDetails: string): Reminder[] {
    const reminders: Reminder[] = [];
    
    members.forEach(member => {
      reminders.push({
        id: `meeting_${Date.now()}_${member.id}`,
        memberId: member.id,
        message: `📅 Meeting Reminder: ${member.name}, we have a chama meeting scheduled for ${meetingDate.toLocaleDateString()} at ${meetingDate.toLocaleTimeString()}. ${meetingDetails} Please confirm your attendance. 🤝`,
        type: 'meeting_reminder',
        status: 'pending',
        scheduledDate: new Date(meetingDate.getTime() - 24 * 60 * 60 * 1000), // 1 day before
        createdDate: new Date()
      });
    });
    
    return reminders;
  }
  
  // Send bulk reminders
  async sendBulkReminders(members: Member[], message: string): Promise<void> {
    for (const member of members) {
      try {
        const personalizedMessage = message.replace('{name}', member.name)
          .replace('{balance}', member.currentBalance.toLocaleString())
          .replace('{total}', member.totalContributed.toLocaleString());
        
        await this.whatsappService.sendMessage(member.phone, personalizedMessage);
        console.log(`Bulk reminder sent to ${member.name}`);
      } catch (error) {
        console.error(`Failed to send bulk reminder to ${member.name}:`, error);
      }
    }
  }
  
  // Schedule reminder for specific date
  scheduleReminder(reminder: Reminder, members: Member[]): void {
    const now = new Date();
    const scheduledTime = reminder.scheduledDate.getTime() - now.getTime();
    
    if (scheduledTime > 0) {
      setTimeout(async () => {
        const member = members.find(m => m.id === reminder.memberId);
        if (member) {
          try {
            await this.whatsappService.sendMessage(member.phone, reminder.message);
            reminder.status = 'sent';
            console.log(`Scheduled reminder sent to ${member.name}`);
          } catch (error) {
            console.error(`Failed to send scheduled reminder to ${member.name}:`, error);
          }
        }
      }, scheduledTime);
    }
  }
}