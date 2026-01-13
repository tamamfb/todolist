import { Module } from "@nestjs/common";
import { ReminderSchedulerService } from "./reminder.scheduler";
import { PrismaModule } from "../prisma/prisma.module";
import { MailModule } from "../mail/mail.module";

@Module({
  imports: [PrismaModule, MailModule],
  providers: [ReminderSchedulerService],
  exports: [ReminderSchedulerService],
})
export class SchedulerModule {}
