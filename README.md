 WhatsApp Chama Bot
A WhatsApp chatbot for Chamas (savings groups) — built with Bolt.new, deployed on Netlify, and powered by M-PESA, MongoDB, and the WhatsApp Business API.
It helps groups track members, collect contributions, send reminders, and generate reports, all through WhatsApp.

💡 Fast-built for a deadline, future-proofed for real use.

🧠 Main Features
Option	Description
🧍 Members	Add, list, or remove chama members
💰 Payments	Trigger M-PESA STK Push for member contributions
⏰ Reminders	Auto-send WhatsApp reminders before contribution due
📊 Reports	View/download PDF reports of all contributions
❓ Help	View available commands and guidance

🌍 Live Deployment
✅ Frontend: (https://chamachatbot.netlify.app/)
✅ Backend Webhook (optional): Hosted externally if needed for M-PESA, MongoDB, etc.

You can embed the Bolt.new app inside the Netlify site or deploy it as a separate flow endpoint.

⚙️ Tech Stack
Layer	Tool
Bot Engine	Bolt.new
UI Hosting	Netlify
Messaging	WhatsApp Business API (via Twilio or 360dialog)
Database	MongoDB Atlas
Payments	M-PESA STK Push
Scheduler	node-cron for reminders
PDF Reports	pdfkit

⚡ Setup Instructions
1. Clone the project
bash
Copy
Edit
git clone https://github.com/your-username/whatsapp-chama-bot.git
cd whatsapp-chama-bot
2. Configure .env for backend (host externally)
env
Copy
Edit
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/chama
PAYBILL=174379
PassKey=YOUR_MPESA_PASSKEY
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_number_id
WEBHOOK_URL=https://your-backend-url.com
OWN_WHATSAPP_NUMBER=2547XXXXXXXX
3. Deploy frontend on Netlify
Push your Bolt.new export or UI code to GitHub.

Connect your GitHub repo to Netlify.

Set any needed environment variables in Netlify > Site Settings > Environment Variables.

🔗 WhatsApp Integration (Twilio / 360dialog)
Register your business number.

Get:

WhatsApp API token

Phone Number ID

Set Webhook URL to your backend

Confirm webhook with:

arduino
Copy
Edit
https://your-backend-url.com/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=123456
📁 Folder Structure
bash
Copy
Edit
📦whatsapp-chama-bot/
├── public/                   # Static assets
├── bolt-logic.bolt          # Bot logic file (from Bolt.new)
├── server.js                # Node backend (for M-PESA, MongoDB)
├── .env                     # Secrets
├── netlify.toml             # Netlify config
├── README.md                # You are here
🧪 Sample Bot Flow
txt
Copy
Edit
User: /help
Bot: Welcome! Choose an option:
1. Members
2. Payments
3. Reminders
4. Reports
5. Help

User: payments
Bot: How much would you like to contribute?
User: 500
Bot: 📲 M-PESA STK push sent!
🚀 Deployment Tips
Frontend is best on Netlify.

Backend/API (M-PESA, MongoDB ops, reminders) should be hosted on:

Render

Railway

Vercel (backend serverless)

🔒 Security
Use .env to keep secrets safe

Limit Webhook calls to only WhatsApp or M-PESA IPs

Enable database access rules (e.g. IP whitelist for MongoDB Atlas)
