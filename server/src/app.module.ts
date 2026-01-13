import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { MailModule } from "./mail/mail.module";
import { AuthModule } from "./auth/auth.module";
import { TasksModule } from "./tasks/tasks.module";
import { UsersModule } from "./users/users.module";
import { CategoriesModule } from "./categories/categories.module";
import { SchedulerModule } from "./scheduler/scheduler.module";

@Module({
  imports: [
    PrismaModule,
    MailModule,
    AuthModule,
    TasksModule,
    UsersModule,
    CategoriesModule,
    SchedulerModule,
  ],
})
export class AppModule {}
