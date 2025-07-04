import axios from 'axios';

export class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private apiUrl: string;
  
  constructor() {
    this.accessToken = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || '';
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
  }
  
  async sendMessage(to: string, message: string): Promise<void> {
    try {
      // Clean phone number (remove + and spaces)
      const cleanPhone = to.replace(/[\s+]/g, '');
      
      const payload = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: {
          body: message
        }
      };
      
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('WhatsApp message sent successfully:', response.data);
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  }
  
  async sendTemplateMessage(to: string, templateName: string, parameters: string[]): Promise<void> {
    try {
      const cleanPhone = to.replace(/[\s+]/g, '');
      
      const payload = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'en'
          },
          components: [
            {
              type: 'body',
              parameters: parameters.map(param => ({
                type: 'text',
                text: param
              }))
            }
          ]
        }
      };
      
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('WhatsApp template message sent successfully:', response.data);
    } catch (error) {
      console.error('Failed to send WhatsApp template message:', error);
      throw error;
    }
  }
  
  async sendButtonMessage(to: string, bodyText: string, buttons: Array<{id: string, title: string}>): Promise<void> {
    try {
      const cleanPhone = to.replace(/[\s+]/g, '');
      
      const payload = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: bodyText
          },
          action: {
            buttons: buttons.map(button => ({
              type: 'reply',
              reply: {
                id: button.id,
                title: button.title
              }
            }))
          }
        }
      };
      
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('WhatsApp button message sent successfully:', response.data);
    } catch (error) {
      console.error('Failed to send WhatsApp button message:', error);
      throw error;
    }
  }
  
  // Verify webhook
  static verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = import.meta.env.VITE_WEBHOOK_VERIFY_TOKEN || 'chama_bot';
    
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    
    return null;
  }
  
  // Process incoming webhook
  static processWebhook(body: any): any {
    try {
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        
        if (value?.messages) {
          const message = value.messages[0];
          const from = message.from;
          const messageBody = message.text?.body || '';
          const messageType = message.type;
          
          return {
            from,
            message: messageBody,
            type: messageType,
            timestamp: message.timestamp
          };
        }
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
    }
    
    return null;
  }
}