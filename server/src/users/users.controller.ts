// src/users/users.controller.ts
import {
  Controller,
  Get,
  Req,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async getMe(@Req() req: any) {
    const userIdFromToken = req.user?.sub;

    if (userIdFromToken === undefined || userIdFromToken === null) {
      throw new UnauthorizedException("JWT payload does not contain sub");
    }

    const userId = BigInt(userIdFromToken);

    // Ini sudah meng-convert BigInt -> string di service
    return this.usersService.getProfile(userId);
  }
}
