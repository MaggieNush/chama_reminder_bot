import { Message, QuickReply, Member, Payment, Reminder, BotState } from '../types/bot';
import { PDFService } from './pdfService';
import { ReminderService } from './reminderService';
import { WhatsAppService } from './whatsappService';

export class BotService {
  private members: Member[] = [
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
  ];

  private payments: Payment[] = [
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
    }
  ];

  private reminders: Reminder[] = [
    {
      id: '1',
      memberId: '2',
      message: 'Monthly contribution of KSh 1,500 is due on 15th Dec',
      type: 'payment_due',
      status: 'pending',
      scheduledDate: new Date('2024-12-13'),
      createdDate: new Date('2024-12-10')
    }
  ];

  private state: BotState = {
    currentFlow: null,
    flowData: {},
    awaitingInput: null
  };

  private reminderService: ReminderService;
  private whatsappService: WhatsAppService;

  constructor() {
    this.reminderService = new ReminderService();
    this.whatsappService = new WhatsAppService();
    
    // Start automatic reminder checking
    this.startAutomaticReminders();
  }

  private startAutomaticReminders(): void {
    // Check for reminders every hour
    setInterval(() => {
      this.checkAndSendAutomaticReminders();
    }, 60 * 60 * 1000); // 1 hour
    
    // Initial check
    setTimeout(() => {
      this.checkAndSendAutomaticReminders();
    }, 5000); // 5 seconds after startup
  }

  private async checkAndSendAutomaticReminders(): Promise<void> {
    try {
      const upcomingReminders = this.reminderService.checkUpcomingDeadlines(this.members, this.payments);
      
      if (upcomingReminders.length > 0) {
        console.log(`Found ${upcomingReminders.length} automatic reminders to send`);
        
        // Add to reminders list
        this.reminders.push(...upcomingReminders);
        
        // Send reminders
        await this.reminderService.sendAutomaticReminders(upcomingReminders, this.members);
      }
    } catch (error) {
      console.error('Error checking automatic reminders:', error);
    }
  }

  processMessage(userMessage: string): Message[] {
    const responses: Message[] = [];
    const lowerMessage = userMessage.toLowerCase().trim();

    // Handle flow-based conversations
    if (this.state.currentFlow) {
      return this.handleFlow(userMessage);
    }

    // Main menu and commands
    if (lowerMessage === 'hi' || lowerMessage === 'hello' || lowerMessage === 'start' || lowerMessage === '/start') {
      responses.push(this.createWelcomeMessage());
    } else if (lowerMessage.includes('member') || lowerMessage === '1') {
      responses.push(this.createMembersMenu());
    } else if (lowerMessage.includes('payment') || lowerMessage === '2') {
      responses.push(this.createPaymentsMenu());
    } else if (lowerMessage.includes('reminder') || lowerMessage === '3') {
      responses.push(this.createRemindersMenu());
    } else if (lowerMessage.includes('report') || lowerMessage === '4') {
      responses.push(this.createReportsMenu());
    } else if (lowerMessage.includes('help') || lowerMessage === '5') {
      responses.push(this.createHelpMessage());
    } else if (lowerMessage === 'menu' || lowerMessage === 'main menu') {
      responses.push(this.createMainMenu());
    } else {
      responses.push(this.createUnknownCommandMessage());
    }

    return responses;
  }

  private handleFlow(userMessage: string): Message[] {
    const responses: Message[] = [];
    
    switch (this.state.currentFlow) {
      case 'add_member':
        return this.handleAddMemberFlow(userMessage);
      case 'record_payment':
        return this.handleRecordPaymentFlow(userMessage);
      case 'send_reminder':
        return this.handleSendReminderFlow(userMessage);
      case 'bulk_reminder':
        return this.handleBulkReminderFlow(userMessage);
      default:
        this.resetState();
        responses.push(this.createMainMenu());
    }

    return responses;
  }

  private handleAddMemberFlow(userMessage: string): Message[] {
    const responses: Message[] = [];
    
    if (!this.state.awaitingInput) {
      this.state.awaitingInput = 'name';
      responses.push({
        id: Date.now().toString(),
        text: "Let's add a new member! 👥\n\n✅ **Step 1 of 4: Member Name**\n\nPlease enter the member's full name:",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      });
    } else if (this.state.awaitingInput === 'name') {
      if (userMessage.trim().length < 2) {
        responses.push({
          id: Date.now().toString(),
          text: "❌ Please enter a valid name (at least 2 characters):",
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
        return responses;
      }
      
      this.state.flowData.name = userMessage.trim();
      this.state.awaitingInput = 'phone';
      responses.push({
        id: Date.now().toString(),
        text: `✅ Name: **${userMessage}**\n\n📱 **Step 2 of 4: Phone Number**\n\nPlease enter their phone number (format: +254712345678):`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      });
    } else if (this.state.awaitingInput === 'phone') {
      const phoneRegex = /^\+254[0-9]{9}$/;
      if (!phoneRegex.test(userMessage.trim())) {
        responses.push({
          id: Date.now().toString(),
          text: "❌ Please enter a valid Kenyan phone number (format: +254712345678):",
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
        return responses;
      }
      
      // Check if phone number already exists
      const existingMember = this.members.find(m => m.phone === userMessage.trim());
      if (existingMember) {
        responses.push({
          id: Date.now().toString(),
          text: `❌ This phone number is already registered to **${existingMember.name}**. Please enter a different number:`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
        return responses;
      }
      
      this.state.flowData.phone = userMessage.trim();
      this.state.awaitingInput = 'email';
      responses.push({
        id: Date.now().toString(),
        text: `✅ Phone: **${userMessage}**\n\n📧 **Step 3 of 4: Email Address**\n\nPlease enter their email address:`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      });
    } else if (this.state.awaitingInput === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userMessage.trim())) {
        responses.push({
          id: Date.now().toString(),
          text: "❌ Please enter a valid email address (e.g., john@example.com):",
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
        return responses;
      }
      
      this.state.flowData.email = userMessage.trim();
      this.state.awaitingInput = 'confirm';
      
      responses.push({
        id: Date.now().toString(),
        text: `✅ Email: **${userMessage}**\n\n📋 **Step 4 of 4: Confirmation**\n\n**Member Details:**\n👤 Name: ${this.state.flowData.name}\n📱 Phone: ${this.state.flowData.phone}\n📧 Email: ${this.state.flowData.email}\n📅 Join Date: ${new Date().toLocaleDateString()}\n\nIs this information correct?`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick_reply',
        data: {
          quickReplies: [
            { text: '✅ Yes, Add Member', payload: 'confirm_add_member' },
            { text: '❌ Cancel', payload: 'cancel_add_member' }
          ]
        }
      });
    }

    return responses;
  }

  private handleRecordPaymentFlow(userMessage: string): Message[] {
    const responses: Message[] = [];
    
    if (!this.state.awaitingInput) {
      const membersList = this.members.map((member, index) => 
        `${index + 1}. **${member.name}** (${member.phone})\n   Balance: KSh ${member.currentBalance.toLocaleString()}`
      ).join('\n\n');
      
      this.state.awaitingInput = 'member';
      responses.push({
        id: Date.now().toString(),
        text: `💰 **Record New Payment**\n\n👥 **Step 1 of 4: Select Member**\n\nChoose a member by typing their number:\n\n${membersList}`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      });
    } else if (this.state.awaitingInput === 'member') {
      const memberIndex = parseInt(userMessage) - 1;
      if (memberIndex >= 0 && memberIndex < this.members.length) {
        this.state.flowData.member = this.members[memberIndex];
        this.state.awaitingInput = 'amount';
        responses.push({
          id: Date.now().toString(),
          text: `✅ Selected: **${this.state.flowData.member.name}**\nCurrent Balance: KSh ${this.state.flowData.member.currentBalance.toLocaleString()}\n\n💵 **Step 2 of 4: Payment Amount**\n\nPlease enter the payment amount (KSh):`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
      } else {
        responses.push({
          id: Date.now().toString(),
          text: "❌ Invalid selection. Please enter a valid member number (1-" + this.members.length + "):",
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
      }
    } else if (this.state.awaitingInput === 'amount') {
      const amount = parseFloat(userMessage.replace(/[^\d.]/g, ''));
      if (amount > 0 && amount <= 1000000) {
        this.state.flowData.amount = amount;
        this.state.awaitingInput = 'method';
        responses.push({
          id: Date.now().toString(),
          text: `✅ Amount: **KSh ${amount.toLocaleString()}**\n\n📱 **Step 3 of 4: Payment Method**\n\nSelect payment method:`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'quick_reply',
          data: {
            quickReplies: [
              { text: '📱 M-Pesa', payload: 'M-Pesa' },
              { text: '🏦 Bank Transfer', payload: 'Bank Transfer' },
              { text: '💵 Cash', payload: 'Cash' }
            ]
          }
        });
      } else {
        responses.push({
          id: Date.now().toString(),
          text: "❌ Please enter a valid amount between KSh 1 and KSh 1,000,000:",
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
      }
    } else if (this.state.awaitingInput === 'method') {
      this.state.flowData.method = userMessage;
      this.state.awaitingInput = 'reference';
      responses.push({
        id: Date.now().toString(),
        text: `✅ Payment method: **${userMessage}**\n\n🔗 **Step 4 of 4: Reference Number**\n\nPlease enter the transaction reference number:`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      });
    } else if (this.state.awaitingInput === 'reference') {
      if (userMessage.trim().length < 3) {
        responses.push({
          id: Date.now().toString(),
          text: "❌ Please enter a valid reference number (at least 3 characters):",
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
        return responses;
      }
      
      // Create new payment
      const newPayment: Payment = {
        id: Date.now().toString(),
        memberId: this.state.flowData.member.id,
        amount: this.state.flowData.amount,
        date: new Date(),
        status: 'completed',
        method: this.state.flowData.method,
        reference: userMessage.trim()
      };
      
      this.payments.push(newPayment);
      
      // Update member's contribution
      const member = this.members.find(m => m.id === newPayment.memberId);
      if (member) {
        member.totalContributed += newPayment.amount;
        member.currentBalance += newPayment.amount;
      }
      
      responses.push({
        id: Date.now().toString(),
        text: `✅ **Payment Recorded Successfully!**\n\n💰 **Payment Details:**\n👤 Member: ${this.state.flowData.member.name}\n💵 Amount: KSh ${newPayment.amount.toLocaleString()}\n📱 Method: ${newPayment.method}\n🔗 Reference: ${newPayment.reference}\n📅 Date: ${newPayment.date.toLocaleDateString()}\n💳 New Balance: KSh ${member?.currentBalance.toLocaleString()}\n\n📱 A confirmation SMS will be sent to the member.`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick_reply',
        data: {
          quickReplies: [
            { text: '💰 Record Another', payload: 'record_payment' },
            { text: '📊 View Payments', payload: 'view_payments' },
            { text: '📋 Main Menu', payload: 'menu' }
          ]
        }
      });
      
      // Send confirmation to member
      this.sendPaymentConfirmation(member!, newPayment);
      
      this.resetState();
    }

    return responses;
  }

  private async sendPaymentConfirmation(member: Member, payment: Payment): Promise<void> {
    try {
      const message = `✅ Payment Confirmed!\n\nHi ${member.name}, your payment has been received:\n\n💰 Amount: KSh ${payment.amount.toLocaleString()}\n📱 Method: ${payment.method}\n🔗 Reference: ${payment.reference}\n📅 Date: ${payment.date.toLocaleDateString()}\n💳 New Balance: KSh ${member.currentBalance.toLocaleString()}\n\nThank you for your contribution! 🙏`;
      
      await this.whatsappService.sendMessage(member.phone, message);
    } catch (error) {
      console.error('Failed to send payment confirmation:', error);
    }
  }

  private handleSendReminderFlow(userMessage: string): Message[] {
    const responses: Message[] = [];
    
    if (!this.state.awaitingInput) {
      const membersList = this.members.map((member, index) => 
        `${index + 1}. **${member.name}** (Balance: KSh ${member.currentBalance.toLocaleString()})`
      ).join('\n');
      
      this.state.awaitingInput = 'member';
      responses.push({
        id: Date.now().toString(),
        text: `🔔 **Send Individual Reminder**\n\n👥 **Step 1 of 2: Select Member**\n\nChoose a member:\n\n${membersList}\n\nOr type **"all"** to send to all members`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      });
    } else if (this.state.awaitingInput === 'member') {
      if (userMessage.toLowerCase() === 'all') {
        this.state.currentFlow = 'bulk_reminder';
        this.state.awaitingInput = 'message';
        responses.push({
          id: Date.now().toString(),
          text: `📢 **Bulk Reminder to All Members**\n\n💬 **Step 2 of 2: Message**\n\nEnter your reminder message:\n\n💡 **Tips:**\n• Use {name} for member's name\n• Use {balance} for current balance\n• Use {total} for total contributed`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
        return responses;
      }
      
      const memberIndex = parseInt(userMessage) - 1;
      if (memberIndex >= 0 && memberIndex < this.members.length) {
        this.state.flowData.member = this.members[memberIndex];
        this.state.awaitingInput = 'message';
        responses.push({
          id: Date.now().toString(),
          text: `✅ Selected: **${this.state.flowData.member.name}**\nPhone: ${this.state.flowData.member.phone}\nBalance: KSh ${this.state.flowData.member.currentBalance.toLocaleString()}\n\n💬 **Step 2 of 2: Message**\n\nEnter your reminder message:`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
      } else {
        responses.push({
          id: Date.now().toString(),
          text: "❌ Invalid selection. Please enter a valid member number or 'all':",
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
      }
    } else if (this.state.awaitingInput === 'message') {
      if (userMessage.trim().length < 10) {
        responses.push({
          id: Date.now().toString(),
          text: "❌ Please enter a longer message (at least 10 characters):",
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
        return responses;
      }
      
      // Create and send reminder
      const newReminder: Reminder = {
        id: Date.now().toString(),
        memberId: this.state.flowData.member.id,
        message: userMessage.trim(),
        type: 'payment_due',
        status: 'sent',
        scheduledDate: new Date(),
        createdDate: new Date()
      };
      
      this.reminders.push(newReminder);
      
      // Send via WhatsApp
      this.sendReminderToMember(this.state.flowData.member, userMessage.trim());
      
      responses.push({
        id: Date.now().toString(),
        text: `✅ **Reminder Sent Successfully!**\n\n📱 **To:** ${this.state.flowData.member.name} (${this.state.flowData.member.phone})\n💬 **Message:** ${userMessage.trim()}\n📅 **Sent:** ${new Date().toLocaleString()}\n\n📲 The member will receive this reminder via WhatsApp.`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick_reply',
        data: {
          quickReplies: [
            { text: '🔔 Send Another', payload: 'send_reminder' },
            { text: '📋 View Reminders', payload: 'view_reminders' },
            { text: '📋 Main Menu', payload: 'menu' }
          ]
        }
      });
      
      this.resetState();
    }

    return responses;
  }

  private handleBulkReminderFlow(userMessage: string): Message[] {
    const responses: Message[] = [];
    
    if (this.state.awaitingInput === 'message') {
      if (userMessage.trim().length < 10) {
        responses.push({
          id: Date.now().toString(),
          text: "❌ Please enter a longer message (at least 10 characters):",
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
        return responses;
      }
      
      // Send bulk reminders
      this.sendBulkReminders(userMessage.trim());
      
      responses.push({
        id: Date.now().toString(),
        text: `✅ **Bulk Reminders Sent Successfully!**\n\n📢 **To:** All ${this.members.length} members\n💬 **Message:** ${userMessage.trim()}\n📅 **Sent:** ${new Date().toLocaleString()}\n\n📲 All members will receive this reminder via WhatsApp.`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick_reply',
        data: {
          quickReplies: [
            { text: '🔔 Send Another', payload: 'send_reminder' },
            { text: '📋 View Reminders', payload: 'view_reminders' },
            { text: '📋 Main Menu', payload: 'menu' }
          ]
        }
      });
      
      this.resetState();
    }

    return responses;
  }

  private async sendReminderToMember(member: Member, message: string): Promise<void> {
    try {
      await this.whatsappService.sendMessage(member.phone, message);
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  }

  private async sendBulkReminders(message: string): Promise<void> {
    try {
      await this.reminderService.sendBulkReminders(this.members, message);
    } catch (error) {
      console.error('Failed to send bulk reminders:', error);
    }
  }

  // Handle quick reply selections
  handleQuickReply(payload: string): Message[] {
    if (payload === 'add_member') {
      this.state.currentFlow = 'add_member';
      return this.handleAddMemberFlow('');
    } else if (payload === 'confirm_add_member') {
      return this.confirmAddMember();
    } else if (payload === 'cancel_add_member') {
      this.resetState();
      return [{
        id: Date.now().toString(),
        text: "❌ Member addition cancelled. What would you like to do next?",
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick_reply',
        data: {
          quickReplies: [
            { text: '👥 Members Menu', payload: '1' },
            { text: '📋 Main Menu', payload: 'menu' }
          ]
        }
      }];
    } else if (payload === 'record_payment') {
      this.state.currentFlow = 'record_payment';
      return this.handleRecordPaymentFlow('');
    } else if (payload === 'send_reminder') {
      this.state.currentFlow = 'send_reminder';
      return this.handleSendReminderFlow('');
    } else if (payload === 'view_members') {
      return this.getViewMembersResponse();
    } else if (payload === 'view_payments') {
      return this.getViewPaymentsResponse();
    } else if (payload === 'view_reminders') {
      return this.getViewRemindersResponse();
    } else if (payload === 'member_summary') {
      return this.getMemberSummaryResponse();
    } else if (payload === 'payment_report') {
      return this.getPaymentReportResponse();
    } else if (payload === 'download_member_pdf') {
      return this.downloadMemberPDF();
    } else if (payload === 'download_payment_pdf') {
      return this.downloadPaymentPDF();
    } else if (payload === 'auto_reminders') {
      return this.getAutoRemindersResponse();
    } else {
      return this.processMessage(payload);
    }
  }

  private confirmAddMember(): Message[] {
    // Create new member
    const newMember: Member = {
      id: Date.now().toString(),
      name: this.state.flowData.name,
      phone: this.state.flowData.phone,
      email: this.state.flowData.email,
      joinDate: new Date(),
      totalContributed: 0,
      currentBalance: 0
    };
    
    this.members.push(newMember);
    
    // Send welcome message to new member
    this.sendWelcomeMessage(newMember);
    
    this.resetState();
    
    return [{
      id: Date.now().toString(),
      text: `✅ **Member Added Successfully!**\n\n👤 **${newMember.name}**\n📱 ${newMember.phone}\n📧 ${newMember.email}\n📅 Joined: ${newMember.joinDate.toLocaleDateString()}\n💰 Initial Balance: KSh 0\n\n📲 A welcome message has been sent to the member via WhatsApp.\n\nWhat would you like to do next?`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '👥 View Members', payload: 'view_members' },
          { text: '💰 Record Payment', payload: 'record_payment' },
          { text: '➕ Add Another Member', payload: 'add_member' },
          { text: '📋 Main Menu', payload: 'menu' }
        ]
      }
    }];
  }

  private async sendWelcomeMessage(member: Member): Promise<void> {
    try {
      const message = `🎉 Welcome to our Chama!\n\nHi ${member.name}, you have been successfully added to our chama group.\n\n📋 **Your Details:**\n📱 Phone: ${member.phone}\n📧 Email: ${member.email}\n📅 Join Date: ${member.joinDate.toLocaleDateString()}\n\n💰 **Next Steps:**\n• Monthly contribution: KSh 1,500\n• Payment due: 15th of each month\n• Contact treasurer for payment methods\n\nWelcome aboard! 🤝`;
      
      await this.whatsappService.sendMessage(member.phone, message);
    } catch (error) {
      console.error('Failed to send welcome message:', error);
    }
  }

  private downloadMemberPDF(): Message[] {
    try {
      PDFService.generateMemberSummaryPDF(this.members, this.payments);
      
      return [{
        id: Date.now().toString(),
        text: `📄 **Member Summary PDF Generated!**\n\n✅ The PDF report has been downloaded to your device.\n\n📊 **Report Contents:**\n• All ${this.members.length} members\n• Individual balances and contributions\n• Payment history summary\n• Generated on ${new Date().toLocaleDateString()}\n\nWhat would you like to do next?`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick_reply',
        data: {
          quickReplies: [
            { text: '📊 Payment Report PDF', payload: 'download_payment_pdf' },
            { text: '📋 View Reports Menu', payload: '4' },
            { text: '📋 Main Menu', payload: 'menu' }
          ]
        }
      }];
    } catch (error) {
      return [{
        id: Date.now().toString(),
        text: `❌ **Error Generating PDF**\n\nSorry, there was an error generating the PDF report. Please try again later.\n\nError: ${error}`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick_reply',
        data: {
          quickReplies: [
            { text: '🔄 Try Again', payload: 'download_member_pdf' },
            { text: '📋 Main Menu', payload: 'menu' }
          ]
        }
      }];
    }
  }

  private downloadPaymentPDF(): Message[] {
    try {
      PDFService.generatePaymentReportPDF(this.payments, this.members);
      
      return [{
        id: Date.now().toString(),
        text: `📄 **Payment Report PDF Generated!**\n\n✅ The PDF report has been downloaded to your device.\n\n📊 **Report Contents:**\n• All ${this.payments.length} payments\n• Payment methods and references\n• Member details\n• Generated on ${new Date().toLocaleDateString()}\n\nWhat would you like to do next?`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick_reply',
        data: {
          quickReplies: [
            { text: '📊 Member Summary PDF', payload: 'download_member_pdf' },
            { text: '📋 View Reports Menu', payload: '4' },
            { text: '📋 Main Menu', payload: 'menu' }
          ]
        }
      }];
    } catch (error) {
      return [{
        id: Date.now().toString(),
        text: `❌ **Error Generating PDF**\n\nSorry, there was an error generating the PDF report. Please try again later.\n\nError: ${error}`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick_reply',
        data: {
          quickReplies: [
            { text: '🔄 Try Again', payload: 'download_payment_pdf' },
            { text: '📋 Main Menu', payload: 'menu' }
          ]
        }
      }];
    }
  }

  private getAutoRemindersResponse(): Message[] {
    const upcomingReminders = this.reminderService.checkUpcomingDeadlines(this.members, this.payments);
    const autoRemindersCount = this.reminders.filter(r => r.id.startsWith('auto_')).length;
    
    return [{
      id: Date.now().toString(),
      text: `🤖 **Automatic Reminders Status**\n\n✅ **System Active:** Checking every hour\n📊 **Auto Reminders Sent:** ${autoRemindersCount}\n⏰ **Pending Auto Reminders:** ${upcomingReminders.length}\n\n🔔 **Reminder Rules:**\n• 5 days before due date\n• Payment overdue (30+ days)\n• Seriously overdue (45+ days)\n• Weekly reminders for negative balance\n\n📱 All reminders are sent via WhatsApp automatically.`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '🔔 Send Manual Reminder', payload: 'send_reminder' },
          { text: '📋 View All Reminders', payload: 'view_reminders' },
          { text: '📋 Main Menu', payload: 'menu' }
        ]
      }
    }];
  }

  // Create menu messages
  private createWelcomeMessage(): Message {
    return {
      id: Date.now().toString(),
      text: "👋 **Welcome to Chama Payment Reminder Bot!**\n\nI'm your intelligent chama assistant, here to help you:\n\n✅ Manage members and payments\n✅ Send automatic reminders\n✅ Generate detailed reports\n✅ Track contributions and balances\n\nWhat would you like to do today?",
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '👥 Members', payload: '1' },
          { text: '💰 Payments', payload: '2' },
          { text: '🔔 Reminders', payload: '3' },
          { text: '📊 Reports', payload: '4' },
          { text: '❓ Help', payload: '5' }
        ]
      }
    };
  }

  private createMainMenu(): Message {
    return {
      id: Date.now().toString(),
      text: "📋 **Main Menu**\n\nChoose an option:",
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '👥 Members', payload: '1' },
          { text: '💰 Payments', payload: '2' },
          { text: '🔔 Reminders', payload: '3' },
          { text: '📊 Reports', payload: '4' },
          { text: '❓ Help', payload: '5' }
        ]
      }
    };
  }

  private createMembersMenu(): Message {
    const totalMembers = this.members.length;
    const activeMembers = this.members.filter(m => m.currentBalance >= 0).length;
    
    return {
      id: Date.now().toString(),
      text: `👥 **Members Management**\n\n📊 **Statistics:**\n• Total Members: ${totalMembers}\n• Up to date: ${activeMembers}\n• Behind: ${totalMembers - activeMembers}\n\nWhat would you like to do?`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '➕ Add Member', payload: 'add_member' },
          { text: '👀 View Members', payload: 'view_members' },
          { text: '📋 Main Menu', payload: 'menu' }
        ]
      }
    };
  }

  private createPaymentsMenu(): Message {
    const totalPayments = this.payments.length;
    const totalAmount = this.payments.reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = this.payments.filter(p => p.status === 'pending').length;
    
    return {
      id: Date.now().toString(),
      text: `💰 **Payments Overview**\n\n📊 **Statistics:**\n• Total Payments: ${totalPayments}\n• Total Amount: KSh ${totalAmount.toLocaleString()}\n• Pending: ${pendingPayments}\n\nWhat would you like to do?`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '💰 Record Payment', payload: 'record_payment' },
          { text: '👀 View Payments', payload: 'view_payments' },
          { text: '📋 Main Menu', payload: 'menu' }
        ]
      }
    };
  }

  private createRemindersMenu(): Message {
    const totalReminders = this.reminders.length;
    const pendingReminders = this.reminders.filter(r => r.status === 'pending').length;
    const autoReminders = this.reminders.filter(r => r.id.startsWith('auto_')).length;
    
    return {
      id: Date.now().toString(),
      text: `🔔 **Reminders Center**\n\n📊 **Statistics:**\n• Total Reminders: ${totalReminders}\n• Pending: ${pendingReminders}\n• Auto Reminders: ${autoReminders}\n• Sent: ${totalReminders - pendingReminders}\n\nWhat would you like to do?`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '🔔 Send Reminder', payload: 'send_reminder' },
          { text: '🤖 Auto Reminders', payload: 'auto_reminders' },
          { text: '👀 View Reminders', payload: 'view_reminders' },
          { text: '📋 Main Menu', payload: 'menu' }
        ]
      }
    };
  }

  private createReportsMenu(): Message {
    const totalContributions = this.members.reduce((sum, m) => sum + m.totalContributed, 0);
    const averageContribution = totalContributions / this.members.length;
    
    return {
      id: Date.now().toString(),
      text: `📊 **Reports & Analytics**\n\n💰 **Summary:**\n• Total Contributions: KSh ${totalContributions.toLocaleString()}\n• Average per Member: KSh ${averageContribution.toLocaleString()}\n• Active Members: ${this.members.length}\n\nSelect a report:`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '📊 Member Summary', payload: 'member_summary' },
          { text: '💰 Payment Report', payload: 'payment_report' },
          { text: '📄 Download PDF', payload: 'download_member_pdf' },
          { text: '📋 Main Menu', payload: 'menu' }
        ]
      }
    };
  }

  private createHelpMessage(): Message {
    return {
      id: Date.now().toString(),
      text: `❓ **Help & Commands**\n\n🤖 **Available Commands:**\n• "menu" - Main menu\n• "members" - Member management\n• "payments" - Payment tracking\n• "reminders" - Send reminders\n• "reports" - View reports\n• "help" - This help message\n\n💡 **Features:**\n• ✅ Add/manage members\n• ✅ Record payments with confirmation\n• ✅ Automatic reminder system\n• ✅ PDF report generation\n• ✅ WhatsApp integration\n• ✅ Real-time balance tracking\n\n📞 **Support:** Contact admin for technical issues`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '📋 Main Menu', payload: 'menu' }
        ]
      }
    };
  }

  private createUnknownCommandMessage(): Message {
    return {
      id: Date.now().toString(),
      text: "🤔 I didn't understand that command. Here are some things you can try:\n\n• Type \"menu\" for the main menu\n• Type \"help\" for available commands\n• Use the quick reply buttons below",
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '📋 Main Menu', payload: 'menu' },
          { text: '❓ Help', payload: 'help' }
        ]
      }
    };
  }

  // View responses
  private getViewMembersResponse(): Message[] {
    const membersList = this.members.map((member, index) => 
      `${index + 1}. **${member.name}**\n📱 ${member.phone}\n💰 Contributed: KSh ${member.totalContributed.toLocaleString()}\n💳 Balance: KSh ${member.currentBalance.toLocaleString()}\n📅 Joined: ${member.joinDate.toLocaleDateString()}\n${member.currentBalance >= 0 ? '✅ Up to date' : '⚠️ Behind'}\n`
    ).join('\n');

    return [{
      id: Date.now().toString(),
      text: `👥 **All Members (${this.members.length})**\n\n${membersList}`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '➕ Add Member', payload: 'add_member' },
          { text: '📄 Download PDF', payload: 'download_member_pdf' },
          { text: '📋 Main Menu', payload: 'menu' }
        ]
      }
    }];
  }

  private getViewPaymentsResponse(): Message[] {
    const paymentsList = this.payments.slice(0, 10).map(payment => {
      const member = this.members.find(m => m.id === payment.memberId);
      return `💰 **KSh ${payment.amount.toLocaleString()}**\n👤 ${member?.name}\n📱 ${payment.method}\n🔗 ${payment.reference}\n📅 ${payment.date.toLocaleDateString()}\n${payment.status === 'completed' ? '✅' : payment.status === 'pending' ? '⏳' : '❌'} ${payment.status}\n`;
    }).join('\n');

    return [{
      id: Date.now().toString(),
      text: `💰 **Recent Payments (${this.payments.length} total)**\n\n${paymentsList}${this.payments.length > 10 ? '\n... and more' : ''}`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '💰 Record Payment', payload: 'record_payment' },
          { text: '📄 Download PDF', payload: 'download_payment_pdf' },
          { text: '📋 Main Menu', payload: 'menu' }
        ]
      }
    }];
  }

  private getViewRemindersResponse(): Message[] {
    const remindersList = this.reminders.slice(0, 5).map(reminder => {
      const member = this.members.find(m => m.id === reminder.memberId);
      return `🔔 **To:** ${member?.name}\n💬 ${reminder.message.substring(0, 50)}${reminder.message.length > 50 ? '...' : ''}\n📅 ${reminder.scheduledDate.toLocaleDateString()}\n${reminder.status === 'sent' ? '✅' : reminder.status === 'pending' ? '⏳' : '❌'} ${reminder.status}\n`;
    }).join('\n');

    return [{
      id: Date.now().toString(),
      text: `🔔 **Recent Reminders (${this.reminders.length} total)**\n\n${remindersList}${this.reminders.length > 5 ? '\n... and more' : ''}`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '🔔 Send Reminder', payload: 'send_reminder' },
          { text: '🤖 Auto Reminders', payload: 'auto_reminders' },
          { text: '📋 Main Menu', payload: 'menu' }
        ]
      }
    }];
  }

  private getMemberSummaryResponse(): Message[] {
    const summary = this.members.map((member, index) => {
      const memberPayments = this.payments.filter(p => p.memberId === member.id);
      const lastPayment = memberPayments.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      
      return `${index + 1}. **${member.name}**\n💰 Total: KSh ${member.totalContributed.toLocaleString()}\n💳 Balance: KSh ${member.currentBalance.toLocaleString()}\n📊 Payments: ${memberPayments.length}\n📅 Last Payment: ${lastPayment ? lastPayment.date.toLocaleDateString() : 'Never'}\n${member.currentBalance >= 0 ? '✅ Up to date' : '⚠️ Behind'}\n`;
    }).join('\n');

    return [{
      id: Date.now().toString(),
      text: `📊 **Member Summary Report**\n\n${summary}`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '📄 Download PDF', payload: 'download_member_pdf' },
          { text: '💰 Payment Report', payload: 'payment_report' },
          { text: '📋 Main Menu', payload: 'menu' }
        ]
      }
    }];
  }

  private getPaymentReportResponse(): Message[] {
    const totalAmount = this.payments.reduce((sum, p) => sum + p.amount, 0);
    const completedPayments = this.payments.filter(p => p.status === 'completed');
    const averagePayment = completedPayments.length > 0 ? totalAmount / completedPayments.length : 0;
    
    const monthlyData: { [key: string]: number } = {};
    this.payments.forEach(payment => {
      const monthKey = payment.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + payment.amount;
    });

    const monthlyReport = Object.entries(monthlyData)
      .map(([month, amount]) => `📅 ${month}: KSh ${amount.toLocaleString()}`)
      .join('\n');

    return [{
      id: Date.now().toString(),
      text: `💰 **Payment Report**\n\n📊 **Summary:**\n• Total Payments: ${this.payments.length}\n• Total Amount: KSh ${totalAmount.toLocaleString()}\n• Average Payment: KSh ${averagePayment.toLocaleString()}\n• Completed: ${completedPayments.length}\n\n📈 **Monthly Breakdown:**\n${monthlyReport}`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '📄 Download PDF', payload: 'download_payment_pdf' },
          { text: '📊 Member Summary', payload: 'member_summary' },
          { text: '📋 Main Menu', payload: 'menu' }
        ]
      }
    }];
  }

  private resetState(): void {
    this.state = {
      currentFlow: null,
      flowData: {},
      awaitingInput: null
    };
  }

  getMembers(): Member[] {
    return this.members;
  }

  getPayments(): Payment[] {
    return this.payments;
  }

  getReminders(): Reminder[] {
    return this.reminders;
  }
}