import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";
import { generateSingleBuildingPDF } from "./exportService.js";
import { EMAIL_CONFIG } from "../config/buildingEmails.js";

const prisma = new PrismaClient();

let emailTransporter = null;

// Initialize email transporter (Gmail SMTP)
export const initializeEmailTransporter = () => {
  try {
    if (!EMAIL_CONFIG.senderPassword) {
      console.warn(
        "⚠️ Gmail password not set in environment. Email service disabled."
      );
      console.warn(
        "Set GMAIL_PASSWORD environment variable to enable email sending."
      );
      return false;
    }

    emailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_CONFIG.senderEmail,
        pass: EMAIL_CONFIG.senderPassword,
      },
    });

    console.log("✅ Email transporter initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize email transporter:", error.message);
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
    if (!emailTransporter) {
      throw new Error(
        "Email transporter not initialized. Check GMAIL_PASSWORD in environment variables."
      );
    }

    const mailOptions = {
      from: `${EMAIL_CONFIG.senderName} <${EMAIL_CONFIG.senderEmail}>`,
      to: recipientEmail,
      subject,
      html: htmlContent,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    const result = await emailTransporter.sendMail(mailOptions);

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

// Send daily reports for all buildings
export const sendDailyReports = async (date = null) => {
  try {
    const reportDate = date || new Date().toISOString().split("T")[0];

    console.log(`\n📧 Starting email reports for ${reportDate}...`);

    const buildings = [
      "PRESTIGE POLYGON",
      "PRESTIGE PALLADIUM",
      "PRESTIGE METROPOLITAN",
      "PRESTIGE COSMOPOLITAN",
      "PRESTIGE CYBER TOWERS",
    ];

    let successCount = 0;
    let failureCount = 0;

    for (const building of buildings) {
      try {
        // Fetch logs for this building and date
        const logs = await prisma.panelLog.findMany({
          where: {
            building,
            date: reportDate,
          },
          orderBy: { time: "asc" },
        });

        if (logs.length === 0) {
          console.warn(
            `⚠️ No logs found for ${building} on ${reportDate}. Skipping email.`
          );
          continue;
        }

        // Generate PDF for this building
        let pdfBuffer;
        try {
          pdfBuffer = await generateSingleBuildingPDF(building, logs);
        } catch (pdfError) {
          console.error(
            `❌ Failed to generate PDF for ${building}:`,
            pdfError.message
          );
          failureCount++;
          continue;
        }

        // Get building admin email
        const { BUILDING_ADMIN_EMAILS } = await import(
          "../config/buildingEmails.js"
        );
        const buildingConfig = BUILDING_ADMIN_EMAILS[building];

        if (!buildingConfig) {
          console.warn(
            `⚠️ No email configuration found for ${building}. Skipping email.`
          );
          continue;
        }

        // Generate email content
        const subject = `Daily Panel Log Report - ${building} - ${new Date(
          reportDate
        ).toLocaleDateString("en-IN")}`;
        const htmlContent = generateEmailTemplate(building, reportDate);

        // Send email
        const result = await sendEmailWithPDF(
          buildingConfig.email,
          building,
          subject,
          htmlContent,
          pdfBuffer,
          `${building}-PanelLog-${reportDate}.pdf`
        );

        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (buildingError) {
        console.error(
          `❌ Error processing ${building}:`,
          buildingError.message
        );
        failureCount++;
      }
    }

    console.log(
      `\n✅ Email reports completed. Sent: ${successCount} | Failed: ${failureCount}`
    );

    return { successCount, failureCount };
  } catch (error) {
    console.error("❌ Error in sendDailyReports:", error.message);
    throw error;
  }
};

// Test email connection
export const testEmailConnection = async () => {
  try {
    if (!emailTransporter) {
      return {
        success: false,
        error: "Email transporter not initialized",
      };
    }

    await emailTransporter.verify();
    console.log("✅ Email transporter verification successful");
    return { success: true };
  } catch (error) {
    console.error("❌ Email transporter verification failed:", error.message);
    return { success: false, error: error.message };
  }
};
