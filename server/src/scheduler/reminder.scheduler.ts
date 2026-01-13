import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { Status, EmailType } from "@prisma/client";

@Injectable()
export class ReminderSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(ReminderSchedulerService.name);
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}

  onModuleInit() {
    this.logger.log("Starting reminder scheduler...");
    // Check every minute for pending reminders
    this.intervalId = setInterval(() => {
      this.processReminders();
    }, 60 * 1000); // 60 seconds

    // Also run immediately on startup
    this.processReminders();
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async processReminders() {
    const now = new Date();
    
    this.logger.debug(`Checking for pending reminders at ${now.toISOString()}`);

    try {
      // Find all tasks with reminder_at <= now AND reminder_sent = false AND status = pending
      const tasksToRemind = await this.prisma.task.findMany({
        where: {
          reminder_at: {
            lte: now,
          },
          reminder_sent: false,
          status: Status.pending,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
        },
      });

      if (tasksToRemind.length === 0) {
        return;
      }

      this.logger.log(`Found ${tasksToRemind.length} task(s) to send reminders`);

      for (const task of tasksToRemind) {
        try {
          // Send reminder email
          const emailSent = await this.mailService.sendTaskReminderEmail(
            task.user.email,
            task.user.name,
            {
              taskTitle: task.title,
              taskDescription: task.description,
              dueDate: task.due_date,
              priority: task.priority,
              categoryName: task.category?.name,
            }
          );

          if (emailSent) {
            // Mark reminder as sent
            await this.prisma.task.update({
              where: { id: task.id },
              data: { reminder_sent: true },
            });

            // Log the email
            await this.prisma.emailLog.create({
              data: {
                user_id: task.user_id,
                task_id: task.id,
                type: EmailType.deadline_reminder,
              },
            });

            this.logger.log(
              `Reminder sent for task "${task.title}" to ${task.user.email}`
            );
          }
        } catch (err) {
          this.logger.error(
            `Failed to process reminder for task ${task.id}`,
            err
          );
        }
      }
    } catch (err) {
      this.logger.error("Error processing reminders", err);
    }
  }
}
