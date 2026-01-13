// src/users/users.module.ts
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      // harus konsisten dengan AuthModule / TasksModule
      secret: process.env.JWT_SECRET || "fp-pbkk-secret",
      signOptions: { expiresIn: "1d" },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, JwtAuthGuard],
})
export class UsersModule {}
