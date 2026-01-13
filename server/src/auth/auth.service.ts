import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto, RegisterDto, ResendOtpDto, VerifyOtpDto } from "./dto";
import * as bcrypt from "bcryptjs";
import { JwtService } from "@nestjs/jwt";
import { MailService } from "../mail/mail.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
      },
    });

    const otp = this.generateOtp();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);

    await this.prisma.emailVerificationToken.create({
      data: {
        user_id: user.id, // BigInt
        otp_code: otp,
        expires_at: expires,
        used: false,
      },
    });

    // kirim email OTP
    await this.mail.sendOtpEmail(user.email, otp);

    // FE cukup tahu bahwa email dikirim
    return {
      status: "ok",
      email: user.email,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (!user.is_verified) {
      throw new UnauthorizedException("Email is not verified");
    }

    const payload = { sub: user.id.toString(), email: user.email };
    const access_token = await this.jwt.signAsync(payload);

    return { access_token };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const now = new Date();

    const token = await this.prisma.emailVerificationToken.findFirst({
      where: {
        user_id: user.id,
        otp_code: dto.otp,
        used: false,
        expires_at: { gt: now },
      },
      orderBy: { created_at: "desc" },
    });

    if (!token) {
      throw new BadRequestException("Invalid or expired OTP");
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: token.id },
        data: { used: true },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { is_verified: true },
      }),
    ]);

    // Create default "Home" category for new verified user
    await this.prisma.category.create({
      data: {
        user_id: user.id,
        name: 'Home',
      },
    });

    return { status: "ok" };
  }

  async resendOtp(dto: ResendOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.is_verified) {
      throw new BadRequestException("Email already verified");
    }

    // nonaktifkan OTP lama yang belum dipakai
    await this.prisma.emailVerificationToken.updateMany({
      where: {
        user_id: user.id,
        used: false,
      },
      data: {
        used: true,
      },
    });

    const otp = this.generateOtp();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);

    await this.prisma.emailVerificationToken.create({
      data: {
        user_id: user.id,
        otp_code: otp,
        expires_at: expires,
        used: false,
      },
    });

    await this.mail.sendOtpEmail(user.email, otp);

    return {
      status: "ok",
      email: user.email,
    };
  }
}
