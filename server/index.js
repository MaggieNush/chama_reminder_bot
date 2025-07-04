import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { WhatsAppService } from '../src/services/whatsappService.js';
import { BotService } from '../src/services/botService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
const botService = new BotService();
const whatsappService = new WhatsAppService();

// Webhook verification endpoint
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verificationResult = WhatsAppService.verifyWebhook(mode, token, challenge);
  
  if (verificationResult) {
    console.log('Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('Webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

// Webhook endpoint for receiving messages
app.post('/webhook', async (req, res) => {
  try {
    console.log('Received webhook:', JSON.stringify(req.body, null, 2));
    
    const messageData = WhatsAppService.processWebhook(req.body);
    
    if (messageData) {
      console.log('Processing message from:', messageData.from);
      console.log('Message:', messageData.message);
      
      // Process message through bot service
      const responses = botService.processMessage(messageData.message);
      
      // Send responses back via WhatsApp
      for (const response of responses) {
        await whatsappService.sendMessage(messageData.from, response.text);
        
        // Handle quick replies as buttons
        if (response.type === 'quick_reply' && response.data?.quickReplies) {
          const buttons = response.data.quickReplies.slice(0, 3).map(reply => ({
            id: reply.payload,
            title: reply.text.substring(0, 20) // WhatsApp button title limit
          }));
          
          if (buttons.length > 0) {
            await whatsappService.sendButtonMessage(
              messageData.from,
              'Choose an option:',
              buttons
            );
          }
        }
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API endpoints for the web interface
app.get('/api/members', (req, res) => {
  res.json(botService.getMembers());
});

app.get('/api/payments', (req, res) => {
  res.json(botService.getPayments());
});

app.get('/api/reminders', (req, res) => {
  res.json(botService.getReminders());
});

// Test WhatsApp message endpoint
app.post('/api/test-message', async (req, res) => {
  try {
    const { phone, message } = req.body;
    await whatsappService.sendMessage(phone, message);
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Schedule automatic reminders
// Run every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily reminder check...');
  try {
    const members = botService.getMembers();
    const payments = botService.getPayments();
    
    // Check for upcoming deadlines and send reminders
    const reminderService = new (await import('../src/services/reminderService.js')).ReminderService();
    const upcomingReminders = reminderService.checkUpcomingDeadlines(members, payments);
    
    if (upcomingReminders.length > 0) {
      console.log(`Sending ${upcomingReminders.length} automatic reminders`);
      await reminderService.sendAutomaticReminders(upcomingReminders, members);
    }
  } catch (error) {
    console.error('Error in scheduled reminder check:', error);
  }
});

// Schedule weekly summary (every Sunday at 6 PM)
cron.schedule('0 18 * * 0', async () => {
  console.log('Sending weekly summary...');
  try {
    const members = botService.getMembers();
    const payments = botService.getPayments();
    
    const totalContributions = members.reduce((sum, m) => sum + m.totalContributed, 0);
    const weeklyPayments = payments.filter(p => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return p.date >= weekAgo;
    });
    
    const summaryMessage = `📊 Weekly Chama Summary\n\n💰 Total Contributions: KSh ${totalContributions.toLocaleString()}\n📈 This Week's Payments: ${weeklyPayments.length}\n👥 Active Members: ${members.length}\n\nHave a great week ahead! 🌟`;
    
    // Send to all members
    for (const member of members) {
      try {
        await whatsappService.sendMessage(member.phone, summaryMessage);
      } catch (error) {
        console.error(`Failed to send weekly summary to ${member.name}:`, error);
      }
    }
  } catch (error) {
    console.error('Error sending weekly summary:', error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Chama Bot Server running on port ${PORT}`);
  console.log(`📱 WhatsApp webhook URL: ${process.env.WEBHOOK_URL}/webhook`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`⏰ Automatic reminders scheduled for 9 AM daily`);
  console.log(`📊 Weekly summaries scheduled for Sundays at 6 PM`);
});

export default app;