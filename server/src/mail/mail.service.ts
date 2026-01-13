import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

interface TaskReminderData {
  taskTitle: string;
  taskDescription?: string | null;
  dueDate?: Date | null;
  priority: string;
  categoryName?: string | null;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // Gmail: 587 + STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendOtpEmail(to: string, otp: string) {
    const from = process.env.SMTP_FROM || "no-reply@example.com";

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <h2 style="margin-bottom: 8px;">Email Verification</h2>
        <p style="margin-bottom: 16px;">Here is your verification code:</p>
        <div style="
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0.3em;
          padding: 12px 16px;
          border-radius: 999px;
          background: #0f172a;
          color: #ffffff;
          display: inline-block;
        ">
          ${otp}
        </div>
        <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
          This code will expire in 10 minutes. If you did not request this, you can ignore this email.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: "Your TodoList Email Verification Code",
        html,
      });

      this.logger.log(`OTP email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send OTP email to ${to}`, err as any);
      // untuk production bisa lempar error, tapi buat dev kita diemkan saja
    }
  }

  // ================= TASK REMINDER EMAIL =================
  async sendTaskReminderEmail(to: string, userName: string, task: TaskReminderData) {
    const from = process.env.SMTP_FROM || "no-reply@example.com";

    // Priority colors
    const priorityColors: Record<string, { bg: string; text: string }> = {
      high: { bg: "#fee2e2", text: "#991b1b" },
      medium: { bg: "#fef3c7", text: "#92400e" },
      low: { bg: "#dcfce7", text: "#166534" },
    };

    const priorityStyle = priorityColors[task.priority] || priorityColors.medium;

    // Format due date
    const formatDueDate = (date: Date | null | undefined) => {
      if (!date) return "No due date";
      return new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px 40px; border-radius: 16px 16px 0 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                            ⏰ Task Reminder
                          </h1>
                          <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                            Hey ${userName}, don't forget about this task!
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <!-- Task Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; border-left: 4px solid ${priorityStyle.text};">
                      <tr>
                        <td style="padding: 24px;">
                          <!-- Task Title -->
                          <h2 style="margin: 0 0 12px; color: #1f2937; font-size: 20px; font-weight: 600;">
                            ${task.taskTitle}
                          </h2>
                          
                          ${task.taskDescription ? `
                          <!-- Task Description -->
                          <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                            ${task.taskDescription}
                          </p>
                          ` : ""}
                          
                          <!-- Task Meta -->
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <!-- Priority Badge -->
                              <td style="padding-right: 12px;">
                                <span style="
                                  display: inline-block;
                                  padding: 6px 12px;
                                  background-color: ${priorityStyle.bg};
                                  color: ${priorityStyle.text};
                                  font-size: 12px;
                                  font-weight: 600;
                                  border-radius: 9999px;
                                  text-transform: capitalize;
                                ">
                                  ${task.priority} Priority
                                </span>
                              </td>
                              
                              ${task.categoryName ? `
                              <!-- Category Badge -->
                              <td>
                                <span style="
                                  display: inline-block;
                                  padding: 6px 12px;
                                  background-color: #e5e7eb;
                                  color: #374151;
                                  font-size: 12px;
                                  font-weight: 600;
                                  border-radius: 9999px;
                                ">
                                  📁 ${task.categoryName}
                                </span>
                              </td>
                              ` : ""}
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Due Date Section -->
                    ${task.dueDate ? `
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                      <tr>
                        <td style="background-color: #fef3c7; padding: 16px 20px; border-radius: 8px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-right: 12px; vertical-align: middle;">
                                <span style="font-size: 24px;">📅</span>
                              </td>
                              <td>
                                <p style="margin: 0; color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                                  Due Date
                                </p>
                                <p style="margin: 4px 0 0; color: #78350f; font-size: 16px; font-weight: 600;">
                                  ${formatDueDate(task.dueDate)}
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    ` : ""}
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                      <tr>
                        <td align="center">
                          <a href="http://localhost:5174/today" style="
                            display: inline-block;
                            padding: 14px 32px;
                            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                            color: #ffffff;
                            font-size: 14px;
                            font-weight: 600;
                            text-decoration: none;
                            border-radius: 9999px;
                            box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
                          ">
                            Open TodoList App →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                      This reminder was sent by TodoList App.<br>
                      You set this reminder to help you stay on track.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: `⏰ Reminder: ${task.taskTitle}`,
        html,
      });

      this.logger.log(`Task reminder email sent to ${to} for task: ${task.taskTitle}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send task reminder email to ${to}`, err as any);
      return false;
    }
  }
}
