import * as SibApiV3Sdk from "@getbrevo/brevo";
import { PrismaClient } from "@prisma/client";
import { EMAIL_CONFIG } from "../config/buildingEmails.js";

const prisma = new PrismaClient();

let emailClient = null;

// Initialize Brevo transporter
export const initializeBrevoTransporter = () => {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.warn(
        "⚠️ BREVO_API_KEY not set in environment. Email service disabled."
      );
      console.warn(
        "Set BREVO_API_KEY environment variable to enable email sending."
      );
      return false;
    }

    // Configure Brevo API client
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications["api-key"];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    emailClient = new SibApiV3Sdk.TransactionalEmailsApi();

    console.log("✅ Brevo email transporter initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize Brevo transporter:", error.message);
    return false;
  }
};

// Send email with PDF attachment
export const sendEmailWithPDF = async (
  recipientEmail,
  recipientName,
  subject,
  htmlContent,
  pdfBuffer,
  fileName
) => {
  try {
    if (!emailClient) {
      throw new Error(
        "Brevo email client not initialized. Check BREVO_API_KEY in environment variables."
      );
    }

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {
      name: EMAIL_CONFIG.senderName,
      email: EMAIL_CONFIG.senderEmail,
    };
    sendSmtpEmail.to = [
      {
        email: recipientEmail,
        name: recipientName,
      },
    ];

    // Add PDF attachment
    sendSmtpEmail.attachment = [
      {
        content: pdfBuffer.toString("base64"),
        name: fileName,
      },
    ];

    // Send email with timeout
    const sendPromise = emailClient.sendTransacEmail(sendSmtpEmail);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Email send timeout after 30s")), 30000)
    );

    const result = await Promise.race([sendPromise, timeoutPromise]);

    console.log(
      `✅ Email sent successfully to ${recipientEmail} (Message ID: ${result.messageId})`
    );

    // Log email send in database
    try {
      await prisma.emailLog.create({
        data: {
          building: recipientName,
          recipientEmail,
          subject,
          status: "sent",
          messageId: result.messageId,
          sentAt: new Date(),
        },
      });
    } catch (logError) {
      console.warn("⚠️ Failed to log email in database:", logError.message);
    }

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Failed to send email to ${recipientEmail}:`,
      error.message
    );

    // Log failed email send in database
    try {
      await prisma.emailLog.create({
        data: {
          building: recipientName,
          recipientEmail,
          subject,
          status: "failed",
          errorMessage: error.message,
          sentAt: new Date(),
        },
      });
    } catch (logError) {
      console.warn(
        "⚠️ Failed to log error email in database:",
        logError.message
      );
    }

    return { success: false, error: error.message };
  }
};

// Generate HTML email template
export const generateEmailTemplate = (buildingName, date) => {
  const istDate = new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px; text-align: center; }
          .content { margin: 20px 0; }
          .footer { background-color: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center; font-size: 12px; color: #666; }
          .info { background-color: #e8f4f8; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Daily Panel Log Report</h1>
            <p>${buildingName}</p>
          </div>

          <div class="content">
            <p>Dear Building Administrator,</p>

            <p>Please find attached the HT/LT Panel Log Report for your building for ${istDate}.</p>

            <div class="info">
              <strong>📋 Report Details:</strong><br/>
              • Building: ${buildingName}<br/>
              • Date: ${istDate}<br/>
              • Report Generated: ${new Date().toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })} IST
            </div>

            <p>Please review the attached PDF document which contains:</p>
            <ul>
              <li>HT Panel Log data (Voltage, Current, Transformers)</li>
              <li>LT Panel Log data (Incomers, Voltage, Current)</li>
              <li>All entries for the reporting day</li>
            </ul>

            <p>If you have any questions or require additional information, please contact the Atlanwa BMS support team.</p>

            <p>Best regards,<br/>
            <strong>Atlanwa BMS Dashboard</strong><br/>
            Automated Daily Report</p>
          </div>

          <div class="footer">
            <p>This is an automated email. Please do not reply directly to this email.</p>
            <p>© 2025 Atlanwa. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Test email connection
export const testEmailConnection = async () => {
  try {
    if (!emailClient) {
      return {
        success: false,
        error: "Email client not initialized",
      };
    }

    console.log("✅ Brevo email transporter verified");
    return { success: true, message: "Brevo connection verified" };
  } catch (error) {
    console.error("❌ Brevo verification failed:", error.message);
    return { success: false, error: error.message };
  }
};
