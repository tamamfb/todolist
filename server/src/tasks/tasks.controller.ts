// server/src/tasks/tasks.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Req,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  ParseIntPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TasksService } from "./tasks.service";
import { FilesInterceptor } from "@nestjs/platform-express";

@Controller("tasks")
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // ========= TODAY =========
  @Get("today")
  async getToday(@Req() req: any) {
    const userIdFromToken = req.user?.sub;
    if (userIdFromToken === undefined || userIdFromToken === null) {
      throw new Error("JWT payload does not contain sub");
    }
    const userId = BigInt(userIdFromToken);
    return this.tasksService.getTodayForUser(userId);
  }

  // ========= UPCOMING =========
  @Get("upcoming")
  async getUpcoming(@Req() req: any) {
    const userIdFromToken = req.user?.sub;
    if (userIdFromToken === undefined || userIdFromToken === null) {
      throw new Error("JWT payload does not contain sub");
    }
    const userId = BigInt(userIdFromToken);
    return this.tasksService.getUpcomingForUser(userId);
  }

  // ========= COMPLETED =========
  @Get("completed")
  async getCompleted(@Req() req: any) {
    const userIdFromToken = req.user?.sub;
    if (userIdFromToken === undefined || userIdFromToken === null) {
      throw new Error("JWT payload does not contain sub");
    }
    const userId = BigInt(userIdFromToken);
    return this.tasksService.getCompletedForUser(userId);
  }

  // ========= SIDEBAR SUMMARY =========
  @Get("sidebar-summary")
  async getSidebarSummary(@Req() req: any) {
    const userIdFromToken = req.user?.sub;
    if (userIdFromToken === undefined || userIdFromToken === null) {
      throw new Error("JWT payload does not contain sub");
    }
    const userId = BigInt(userIdFromToken);
    return this.tasksService.getSidebarSummary(userId);
  }

  // ========= GET TASKS BY CATEGORY =========
  @Get("category/:categoryId")
  async getTasksByCategory(
    @Req() req: any,
    @Param("categoryId") categoryId: string,
  ) {
    const userIdFromToken = req.user?.sub;
    if (userIdFromToken === undefined || userIdFromToken === null) {
      throw new Error("JWT payload does not contain sub");
    }
    const userId = BigInt(userIdFromToken);
    return this.tasksService.getTasksByCategory(userId, BigInt(categoryId));
  }

  // ========= SEARCH TASKS =========
  @Get("search")
  async searchTasks(@Req() req: any, @Query("q") query: string) {
    const userIdFromToken = req.user?.sub;
    if (userIdFromToken === undefined || userIdFromToken === null) {
      throw new Error("JWT payload does not contain sub");
    }
    const userId = BigInt(userIdFromToken);
    return this.tasksService.searchTasks(userId, query || "");
  }

  // ========= CREATE TASK =========
  @Post()
  async createTask(@Req() req: any, @Body() body: any) {
    const userIdFromToken = req.user?.sub;
    if (userIdFromToken === undefined || userIdFromToken === null) {
      throw new Error("JWT payload does not contain sub");
    }
    const userId = BigInt(userIdFromToken);

    return this.tasksService.createTaskForUser(userId, body);
  }

  // ========= UPLOAD FILES UNTUK TASK =========
  @Post(":id/files")
  @UseInterceptors(FilesInterceptor("files", 10))
  async uploadFilesForTask(
    @Req() req: any,
    @Param("id") id: string,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const userIdFromToken = req.user?.sub;
    if (userIdFromToken === undefined || userIdFromToken === null) {
      throw new Error("JWT payload does not contain sub");
    }
    const userId = BigInt(userIdFromToken);

    const taskId = BigInt(id);

    if (!files || files.length === 0) {
      throw new BadRequestException("No files uploaded");
    }

    return this.tasksService.attachFilesToTask(userId, taskId, files);
  }

  // ========= DELETE FILE FROM TASK =========
  @Delete(":id/files/:fileId")
  async deleteFileFromTask(
    @Req() req: any,
    @Param("id", ParseIntPipe) taskId: number,
    @Param("fileId", ParseIntPipe) fileId: number
  ) {
    const userIdFromToken = req.user?.sub;
    if (userIdFromToken === undefined || userIdFromToken === null) {
      throw new Error("JWT payload does not contain sub");
    }
    const userId = BigInt(userIdFromToken);

    return this.tasksService.deleteTaskFile(userId, BigInt(taskId), BigInt(fileId));
  }

  // ========= UPDATE TASK =========
  @Patch(":id")
  async updateTask(
    @Req() req: any,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: any
  ) {
    const userIdFromToken = req.user?.sub;
    if (userIdFromToken === undefined || userIdFromToken === null) {
      throw new Error("JWT payload does not contain sub");
    }
    const userId = BigInt(userIdFromToken);
    const taskId = BigInt(id);

    return this.tasksService.updateTask(userId, taskId, body);
  }

  // ========= MARK TASK AS COMPLETE =========
  @Patch(":id/complete")
  async completeTask(@Req() req: any, @Param("id") id: string) {
    const userIdFromToken = req.user?.sub;
    if (userIdFromToken === undefined || userIdFromToken === null) {
      throw new Error("JWT payload does not contain sub");
    }
    const userId = BigInt(userIdFromToken);
    const taskId = BigInt(id);

    return this.tasksService.markTaskAsComplete(userId, taskId);
  }
}