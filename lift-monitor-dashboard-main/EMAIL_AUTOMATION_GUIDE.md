# Email Automation System - Implementation Guide

## Overview

This email automation system automatically generates and sends daily HT/LT panel log PDFs to building administrators at 12:00 noon IST.

## Features

- ✅ **Daily Scheduler**: Automatically sends reports at 12:00 IST every day
- ✅ **Building-wise PDFs**: Each building gets their own PDF in the email
- ✅ **Gmail Integration**: Uses Gmail SMTP with app-specific passwords
- ✅ **Email Logging**: Tracks all sent emails and failures
- ✅ **Manual Triggers**: API endpoints to trigger emails on-demand
- ✅ **Previous Day Data**: Sends yesterday's logs at 12:00 noon today
- ✅ **Dummy Data Ready**: Pre-configured with dummy emails for testing

## Setup Instructions

### 1. Configure Gmail Account

1. Go to https://myaccount.google.com/apppasswords
2. Create an app-specific password for "Mail" and "Windows PC"
3. Copy the generated password (16 characters)

### 2. Set Environment Variables

Update `.env` in the backend directory:

```env
GMAIL_USER=atlanwa.logs@gmail.com
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Your 16-character app password
```

### 3. Update Building Admin Emails

Edit `backend/config/buildingEmails.js` and replace dummy emails:

```javascript
export const BUILDING_ADMIN_EMAILS = {
  "PRESTIGE POLYGON": {
    email: "actual-email@example.com", // TODO: Replace
    adminName: "Admin Name",
  },
  // ... other buildings
};
```

**Current Dummy Emails (for testing):**

- PRESTIGE POLYGON: polygon.admin@example.com
- PRESTIGE PALLADIUM: palladium.admin@example.com
- PRESTIGE METROPOLITAN: metropolitan.admin@example.com
- PRESTIGE COSMOPOLITAN: cosmopolitan.admin@example.com
- PRESTIGE CYBER TOWERS: cybertowers.admin@example.com

### 4. Run Migrations

```bash
cd backend
npx prisma migrate deploy
```

This creates the `email_logs` table to track sent emails.

### 5. Start the Server

```bash
npm start  # or yarn start
```

**Expected Output:**

```
✅ Email transporter initialized successfully
🚀 Email Scheduler initializing...
📅 Scheduled to send daily reports at 12:00 IST
⏰ Next report will be sent at: [timestamp]
✅ Email scheduler started
```

## API Endpoints

### 1. Test Email Connection

```bash
GET /api/email/test
```

**Response:**

```json
{
  "success": true,
  "message": "Email connection successful"
}
```

### 2. Trigger Email Reports (Previous Day)

```bash
POST /api/email/trigger-reports
```

Sends reports for yesterday's logs. Useful for testing.

**Response:**

```json
{
  "success": true,
  "message": "Email reports triggered successfully",
  "result": {
    "successCount": 5,
    "failureCount": 0
  }
}
```

### 3. Trigger Email Reports for Specific Date

```bash
POST /api/email/trigger-reports/2025-12-13
```

Sends reports for a specific date (YYYY-MM-DD format).

### 4. Get Email Logs

```bash
GET /api/email/logs?building=PRESTIGE%20POLYGON&status=sent&days=7
```

**Query Parameters:**

- `building` (optional): Filter by building name
- `status` (optional): "sent" or "failed"
- `days` (optional, default=7): Number of days to look back

**Response:**

```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "building": "PRESTIGE POLYGON",
      "recipientEmail": "polygon.admin@example.com",
      "subject": "Daily Panel Log Report - PRESTIGE POLYGON - 13/12/2025",
      "status": "sent",
      "messageId": "<abc123@gmail.com>",
      "sentAt": "2025-12-14T06:30:00.000Z"
    }
  ],
  "count": 1
}
```

### 5. Get Building Admin Emails

```bash
GET /api/email/config/buildings
```

**Response:**

```json
{
  "success": true,
  "buildingEmails": [
    {
      "building": "PRESTIGE POLYGON",
      "email": "polygon.admin@example.com",
      "adminName": "Polygon Admin"
    }
    // ... other buildings
  ]
}
```

## System Architecture

### Components

1. **emailService.js**

   - Handles Gmail SMTP connection
   - Generates PDF attachments
   - Creates HTML email templates
   - Logs all email activities

2. **emailScheduler.js**

   - Runs daily at 12:00 IST
   - Calculates time until next noon
   - Handles previous day's data
   - Orchestrates email sending

3. **buildingEmails.js**

   - Building admin email mapping
   - Configuration management
   - Easy updates (currently in code, can be moved to DB)

4. **Prisma Model**
   - EmailLog table tracks all email activities
   - Status: sent/failed/pending
   - Stores error messages for debugging

### Workflow

```
12:00 IST Every Day
    ↓
Email Scheduler Triggers
    ↓
Fetch Yesterday's Logs
    ↓
For Each Building:
    ├─ Fetch logs for that building
    ├─ Generate PDF
    ├─ Create HTML email
    └─ Send via Gmail
    ↓
Log Results in Database
    ↓
Report Success/Failure Counts
```

## Testing

### Local Testing with Dummy Data

1. **Test Email Connection:**

   ```bash
   curl http://localhost:3001/api/email/test
   ```

2. **Trigger Manual Report:**

   ```bash
   curl -X POST http://localhost:3001/api/email/trigger-reports
   ```

3. **Check Email Logs:**
   ```bash
   curl http://localhost:3001/api/email/logs
   ```

### Using Gmail Sandbox (for testing without real emails)

Use temporary email services:

- https://temp-mail.org
- https://maildrop.cc
- https://guerrillamail.com

Update dummy emails in `buildingEmails.js` with these temporary emails for testing.

## Future Enhancements

1. **Database Configuration Storage**

   - Move building emails to database
   - Allow admin UI to update emails
   - Add email verification

2. **Email Templates**

   - Customizable HTML templates
   - Building-specific branding
   - Multiple language support

3. **Advanced Scheduling**

   - Send at multiple times per day
   - Weekly/monthly reports
   - Custom time per building

4. **Email Attachments**

   - Include multiple formats (PDF + Excel)
   - Add cover page
   - Include charts/graphs

5. **Notification System**
   - SMS alerts for critical issues
   - Slack integration
   - Teams integration

## Troubleshooting

### Email Not Sending

1. Check if `GMAIL_PASSWORD` is set in `.env`
2. Verify Gmail App Password (16 chars with spaces)
3. Test connection: `GET /api/email/test`
4. Check email logs: `GET /api/email/logs?status=failed`

### No Logs in Database

1. Verify Prisma migration was applied: `npx prisma migrate status`
2. Check database connection in `DATABASE_URL`
3. Check `email_logs` table exists: `\dt email_logs` (in PostgreSQL)

### Scheduler Not Running

1. Check server logs for "Email Scheduler initializing..."
2. Verify current time and IST timezone conversion
3. Check if GMAIL_PASSWORD is set (scheduler won't start without it)

### Wrong Time for Sending

1. Verify IST timezone calculation (UTC+5:30)
2. Check server system time: `date`
3. Logs show expected send time at startup

## Database Cleanup

Clear old email logs:

```sql
DELETE FROM email_logs WHERE sentAt < NOW() - INTERVAL '90 days';
```

## File Structure

```
backend/
├── config/
│   └── buildingEmails.js          # Building admin email mapping
├── services/
│   ├── emailService.js            # Email sending logic
│   └── emailScheduler.js          # Scheduled email triggers
├── prisma/
│   ├── schema.prisma              # Includes EmailLog model
│   └── migrations/
│       └── 20251214124120_add_email_logs/
│           └── migration.sql      # EmailLog table creation
├── server.js                       # API endpoints + scheduler init
├── package.json                    # nodemailer dependency
└── .env.example                    # Environment setup guide
```

## Security Notes

1. **Gmail App Password**: Never commit `.env` with actual passwords
2. **Building Emails**: Keep email config away from client-side code
3. **Email Logs**: Contains PII - consider data retention policies
4. **API Endpoints**: Add authentication middleware for email trigger endpoints

## Support

For issues or questions:

1. Check email logs: `GET /api/email/logs?status=failed`
2. Test Gmail connection: `GET /api/email/test`
3. Review server logs for error messages
4. Verify all environment variables are set
