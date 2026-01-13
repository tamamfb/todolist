// src/users/users.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ambil user by id (BigInt) dari database
   */
  async findById(id: bigint) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Profil yang aman untuk dikirim ke frontend:
   * - id: number (dari BigInt)
   * - tanggal: string ISO
   */
  async getProfile(id: bigint) {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      id: Number(user.id),                // <-- BigInt -> number (not string!)
      name: user.name,
      email: user.email,
      is_verified: user.is_verified,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };
  }
}
