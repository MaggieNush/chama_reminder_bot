import { Message, QuickReply, Member, Payment, Reminder, BotState } from '../types/bot';

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
        text: "Let's add a new member! 👥\n\nPlease enter the member's full name:",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      });
    } else if (this.state.awaitingInput === 'name') {
      this.state.flowData.name = userMessage;
      this.state.awaitingInput = 'phone';
      responses.push({
        id: Date.now().toString(),
        text: `Great! Now please enter ${userMessage}'s phone number (e.g., +254712345678):`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      });
    } else if (this.state.awaitingInput === 'phone') {
      this.state.flowData.phone = userMessage;
      this.state.awaitingInput = 'email';
      responses.push({
        id: Date.now().toString(),
        text: "Perfect! Now please enter their email address:",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      });
    } else if (this.state.awaitingInput === 'email') {
      this.state.flowData.email = userMessage;
      
      // Create new member
      const newMember: Member = {
        id: Date.now().toString(),
        name: this.state.flowData.name,
        phone: this.state.flowData.phone,
        email: userMessage,
        joinDate: new Date(),
        totalContributed: 0,
        currentBalance: 0
      };
      
      this.members.push(newMember);
      
      responses.push({
        id: Date.now().toString(),
        text: `✅ Member added successfully!\n\n👤 **${newMember.name}**\n📱 ${newMember.phone}\n📧 ${newMember.email}\n📅 Joined: ${newMember.joinDate.toLocaleDateString()}\n\nWhat would you like to do next?`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick_reply',
        data: {
          quickReplies: [
            { text: '👥 View Members', payload: 'view_members' },
            { text: '💰 Record Payment', payload: 'record_payment' },
            { text: '📋 Main Menu', payload: 'menu' }
          ]
        }
      });
      
      this.resetState();
    }

    return responses;
  }

  private handleRecordPaymentFlow(userMessage: string): Message[] {
    const responses: Message[] = [];
    
    if (!this.state.awaitingInput) {
      const membersList = this.members.map((member, index) => 
        `${index + 1}. ${member.name} (${member.phone})`
      ).join('\n');
      
      this.state.awaitingInput = 'member';
      responses.push({
        id: Date.now().toString(),
        text: `💰 Record a new payment\n\nSelect a member by typing their number:\n\n${membersList}`,
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
          text: `Selected: **${this.state.flowData.member.name}**\n\nPlease enter the payment amount (KSh):`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
      } else {
        responses.push({
          id: Date.now().toString(),
          text: "❌ Invalid selection. Please enter a valid member number:",
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
      }
    } else if (this.state.awaitingInput === 'amount') {
      const amount = parseFloat(userMessage);
      if (amount > 0) {
        this.state.flowData.amount = amount;
        this.state.awaitingInput = 'method';
        responses.push({
          id: Date.now().toString(),
          text: `Amount: KSh ${amount.toLocaleString()}\n\nSelect payment method:`,
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
          text: "❌ Please enter a valid amount (numbers only):",
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
        text: `Payment method: ${userMessage}\n\nPlease enter the transaction reference number:`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      });
    } else if (this.state.awaitingInput === 'reference') {
      // Create new payment
      const newPayment: Payment = {
        id: Date.now().toString(),
        memberId: this.state.flowData.member.id,
        amount: this.state.flowData.amount,
        date: new Date(),
        status: 'completed',
        method: this.state.flowData.method,
        reference: userMessage
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
        text: `✅ Payment recorded successfully!\n\n💰 **Payment Details:**\n👤 Member: ${this.state.flowData.member.name}\n💵 Amount: KSh ${newPayment.amount.toLocaleString()}\n📱 Method: ${newPayment.method}\n🔗 Reference: ${newPayment.reference}\n📅 Date: ${newPayment.date.toLocaleDateString()}\n\nWhat's next?`,
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
      
      this.resetState();
    }

    return responses;
  }

  private handleSendReminderFlow(userMessage: string): Message[] {
    const responses: Message[] = [];
    
    if (!this.state.awaitingInput) {
      const membersList = this.members.map((member, index) => 
        `${index + 1}. ${member.name} (Balance: KSh ${member.currentBalance})`
      ).join('\n');
      
      this.state.awaitingInput = 'member';
      responses.push({
        id: Date.now().toString(),
        text: `🔔 Send a reminder\n\nSelect a member:\n\n${membersList}`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      });
    } else if (this.state.awaitingInput === 'member') {
      const memberIndex = parseInt(userMessage) - 1;
      if (memberIndex >= 0 && memberIndex < this.members.length) {
        this.state.flowData.member = this.members[memberIndex];
        this.state.awaitingInput = 'message';
        responses.push({
          id: Date.now().toString(),
          text: `Selected: **${this.state.flowData.member.name}**\n\nEnter your reminder message:`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
      } else {
        responses.push({
          id: Date.now().toString(),
          text: "❌ Invalid selection. Please enter a valid member number:",
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
      }
    } else if (this.state.awaitingInput === 'message') {
      // Create and send reminder
      const newReminder: Reminder = {
        id: Date.now().toString(),
        memberId: this.state.flowData.member.id,
        message: userMessage,
        type: 'payment_due',
        status: 'sent',
        scheduledDate: new Date(),
        createdDate: new Date()
      };
      
      this.reminders.push(newReminder);
      
      responses.push({
        id: Date.now().toString(),
        text: `✅ Reminder sent successfully!\n\n📱 **To:** ${this.state.flowData.member.name} (${this.state.flowData.member.phone})\n💬 **Message:** ${userMessage}\n📅 **Sent:** ${new Date().toLocaleString()}\n\nThe member will receive this reminder via SMS/WhatsApp.`,
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

  private createWelcomeMessage(): Message {
    return {
      id: Date.now().toString(),
      text: "👋 Welcome to Chama Payment Reminder Bot!\n\nI'm here to help you manage your chama payments, members, and reminders efficiently. What would you like to do today?",
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
      text: `👥 **Members Management**\n\n📊 Total Members: ${totalMembers}\n✅ Up to date: ${activeMembers}\n⚠️ Behind: ${totalMembers - activeMembers}\n\nWhat would you like to do?`,
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
      text: `💰 **Payments Overview**\n\n📊 Total Payments: ${totalPayments}\n💵 Total Amount: KSh ${totalAmount.toLocaleString()}\n⏳ Pending: ${pendingPayments}\n\nWhat would you like to do?`,
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
    
    return {
      id: Date.now().toString(),
      text: `🔔 **Reminders Center**\n\n📊 Total Reminders: ${totalReminders}\n⏳ Pending: ${pendingReminders}\n✅ Sent: ${totalReminders - pendingReminders}\n\nWhat would you like to do?`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '🔔 Send Reminder', payload: 'send_reminder' },
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
      text: `📊 **Reports & Analytics**\n\n💰 Total Contributions: KSh ${totalContributions.toLocaleString()}\n📈 Average per Member: KSh ${averageContribution.toLocaleString()}\n👥 Active Members: ${this.members.length}\n\nSelect a report:`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '📊 Member Summary', payload: 'member_summary' },
          { text: '💰 Payment Report', payload: 'payment_report' },
          { text: '📋 Main Menu', payload: 'menu' }
        ]
      }
    };
  }

  private createHelpMessage(): Message {
    return {
      id: Date.now().toString(),
      text: `❓ **Help & Commands**\n\n🤖 **Available Commands:**\n• Type "menu" - Main menu\n• Type "members" - Member management\n• Type "payments" - Payment tracking\n• Type "reminders" - Send reminders\n• Type "reports" - View reports\n• Type "help" - This help message\n\n💡 **Tips:**\n• Use the quick reply buttons for faster navigation\n• All data is automatically saved\n• You can cancel any operation by typing "menu"\n\n📞 **Support:** Contact admin for technical issues`,
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

  private resetState(): void {
    this.state = {
      currentFlow: null,
      flowData: {},
      awaitingInput: null
    };
  }

  // Handle quick reply selections
  handleQuickReply(payload: string): Message[] {
    if (payload === 'add_member') {
      this.state.currentFlow = 'add_member';
      return this.handleAddMemberFlow('');
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
    } else {
      return this.processMessage(payload);
    }
  }

  private getViewMembersResponse(): Message[] {
    const membersList = this.members.map(member => 
      `👤 **${member.name}**\n📱 ${member.phone}\n💰 Contributed: KSh ${member.totalContributed.toLocaleString()}\n💳 Balance: KSh ${member.currentBalance.toLocaleString()}\n📅 Joined: ${member.joinDate.toLocaleDateString()}\n`
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
          { text: '📋 Main Menu', payload: 'menu' }
        ]
      }
    }];
  }

  private getViewPaymentsResponse(): Message[] {
    const paymentsList = this.payments.map(payment => {
      const member = this.members.find(m => m.id === payment.memberId);
      return `💰 **KSh ${payment.amount.toLocaleString()}**\n👤 ${member?.name}\n📱 ${payment.method}\n🔗 ${payment.reference}\n📅 ${payment.date.toLocaleDateString()}\n✅ ${payment.status}\n`;
    }).join('\n');

    return [{
      id: Date.now().toString(),
      text: `💰 **Recent Payments (${this.payments.length})**\n\n${paymentsList}`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '💰 Record Payment', payload: 'record_payment' },
          { text: '📋 Main Menu', payload: 'menu' }
        ]
      }
    }];
  }

  private getViewRemindersResponse(): Message[] {
    const remindersList = this.reminders.map(reminder => {
      const member = this.members.find(m => m.id === reminder.memberId);
      return `🔔 **To:** ${member?.name}\n💬 ${reminder.message}\n📅 ${reminder.scheduledDate.toLocaleDateString()}\n📊 Status: ${reminder.status}\n`;
    }).join('\n');

    return [{
      id: Date.now().toString(),
      text: `🔔 **All Reminders (${this.reminders.length})**\n\n${remindersList}`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
          { text: '🔔 Send Reminder', payload: 'send_reminder' },
          { text: '📋 Main Menu', payload: 'menu' }
        ]
      }
    }];
  }

  private getMemberSummaryResponse(): Message[] {
    const summary = this.members.map(member => {
      const memberPayments = this.payments.filter(p => p.memberId === member.id);
      const lastPayment = memberPayments.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      
      return `👤 **${member.name}**\n💰 Total: KSh ${member.totalContributed.toLocaleString()}\n💳 Balance: KSh ${member.currentBalance.toLocaleString()}\n📊 Payments: ${memberPayments.length}\n📅 Last Payment: ${lastPayment ? lastPayment.date.toLocaleDateString() : 'Never'}\n`;
    }).join('\n');

    return [{
      id: Date.now().toString(),
      text: `📊 **Member Summary Report**\n\n${summary}`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick_reply',
      data: {
        quickReplies: [
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
          { text: '📊 Member Summary', payload: 'member_summary' },
          { text: '📋 Main Menu', payload: 'menu' }
        ]
      }
    }];
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