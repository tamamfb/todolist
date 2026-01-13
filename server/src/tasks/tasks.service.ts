// server/src/tasks/tasks.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Priority, Status, Visibility } from "@prisma/client";

export interface TaskFileDTO {
  id: number;
  file_path: string;
  original_name: string;
  mime_type: string;
  size: number;
}

export interface TaskFileDTO {
  id: number;
  file_path: string;
  original_name: string;
  mime_type: string;
  size: number;
}

export interface TodayTaskDTO {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  projectName: string | null;
  is_overdue: boolean;
  files: TaskFileDTO[];
  userId: number;
  ownerName: string | null;
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  // ================= TODAY LIST =================
  async getTodayForUser(userId: bigint): Promise<{
    today: TodayTaskDTO[];
    overdue: TodayTaskDTO[];
  }> {
    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    const tasks = await this.prisma.task.findMany({
      where: {
        OR: [
          {
            user_id: userId,
            status: { not: Status.complete },
            due_date: {
              lte: endOfToday,
            },
          },
          {
            user_id: { not: userId },
            visibility: Visibility.public,
            status: { not: Status.complete },
            due_date: {
              lte: endOfToday,
            },
          },
        ],
      },
      include: {
        category: true,
        files: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        due_date: "asc",
      },
    });

    const today: TodayTaskDTO[] = [];
    const overdue: TodayTaskDTO[] = [];

    for (const t of tasks) {
      const isOverdue = !!t.due_date && t.due_date < startOfToday;
      const dto: TodayTaskDTO = {
        id: Number(t.id),
        title: t.title,
        description: t.description ?? null,
        priority: t.priority,
        status: t.status,
        due_date: t.due_date ? t.due_date.toISOString() : null,
        projectName: t.category ? t.category.name : null,
        is_overdue: isOverdue,
        userId: Number(t.user_id),
        ownerName: t.user.name ?? null,
        files: t.files.map((f) => ({
          id: Number(f.id),
          file_path: f.file_path,
          original_name: f.original_name,
          mime_type: f.mime_type,
          size: Number(f.size),
        })),
      };

      if (isOverdue) overdue.push(dto);
      else today.push(dto);
    }

    return { today, overdue };
  }

  // ================= UPCOMING (7 days ahead) =================
  async getUpcomingForUser(userId: bigint): Promise<{
    overdue: TodayTaskDTO[];
    grouped: { [date: string]: TodayTaskDTO[] };
  }> {
    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    
    // Get tasks from today to next 7 days
    const endOf7Days = new Date(startOfToday);
    endOf7Days.setDate(endOf7Days.getDate() + 7);
    endOf7Days.setHours(23, 59, 59, 999);

    const tasks = await this.prisma.task.findMany({
      where: {
        OR: [
          {
            user_id: userId,
            status: { not: Status.complete },
            due_date: {
              gte: startOfToday,
              lte: endOf7Days,
            },
          },
          {
            user_id: { not: userId },
            visibility: Visibility.public,
            status: { not: Status.complete },
            due_date: {
              gte: startOfToday,
              lte: endOf7Days,
            },
          },
        ],
      },
      include: {
        category: true,
        files: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        due_date: "asc",
      },
    });

    // Also get overdue tasks
    const overdueTasks = await this.prisma.task.findMany({
      where: {
        OR: [
          {
            user_id: userId,
            status: { not: Status.complete },
            due_date: {
              lt: startOfToday,
            },
          },
          {
            user_id: { not: userId },
            visibility: Visibility.public,
            status: { not: Status.complete },
            due_date: {
              lt: startOfToday,
            },
          },
        ],
      },
      include: {
        category: true,
        files: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        due_date: "asc",
      },
    });

    // Convert tasks to DTOs
    const overdue: TodayTaskDTO[] = overdueTasks.map((t) => ({
      id: Number(t.id),
      title: t.title,
      description: t.description ?? null,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date ? t.due_date.toISOString() : null,
      projectName: t.category ? t.category.name : null,
      is_overdue: true,
      userId: Number(t.user_id),
      ownerName: t.user.name ?? null,
      files: t.files.map((f) => ({
        id: Number(f.id),
        file_path: f.file_path,
        original_name: f.original_name,
        mime_type: f.mime_type,
        size: Number(f.size),
      })),
    }));

    // Group upcoming tasks by date
    const grouped: { [date: string]: TodayTaskDTO[] } = {};
    for (const t of tasks) {
      const dto: TodayTaskDTO = {
        id: Number(t.id),
        title: t.title,
        description: t.description ?? null,
        priority: t.priority,
        status: t.status,
        due_date: t.due_date ? t.due_date.toISOString() : null,
        projectName: t.category ? t.category.name : null,
        is_overdue: false,
        userId: Number(t.user_id),
        ownerName: t.user.name ?? null,
        files: t.files.map((f) => ({
          id: Number(f.id),
          file_path: f.file_path,
          original_name: f.original_name,
          mime_type: f.mime_type,
          size: Number(f.size),
        })),
      };

      const dateStr = new Date(t.due_date!).toISOString().split('T')[0];
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(dto);
    }

    return { overdue, grouped };
  }

  // ================= GET COMPLETED FOR USER =================
  async getCompletedForUser(userId: bigint) {
    const completedTasks = await this.prisma.task.findMany({
      where: {
        user_id: userId,
        status: Status.complete,
      },
      orderBy: {
        updated_at: "desc", // Urutkan berdasarkan waktu completed (updated_at)
      },
      include: {
        category: true,
        user: true,
        files: true,
      },
    });

    // Group by completion date
    const grouped: Record<string, any[]> = {};
    
    for (const t of completedTasks) {
      const dto = {
        id: Number(t.id),
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        due_date: t.due_date ? t.due_date.toISOString() : null,
        created_at: t.created_at.toISOString(),
        updated_at: t.updated_at.toISOString(),
        visibility: t.visibility,
        category: t.category
          ? {
              id: Number(t.category.id),
              name: t.category.name,
            }
          : null,
        user: {
          id: Number(t.user.id),
          email: t.user.email,
          name: t.user.name,
        },
        files: t.files.map((f) => ({
          id: Number(f.id),
          file_path: f.file_path,
          original_name: f.original_name,
          mime_type: f.mime_type,
          size: Number(f.size),
        })),
      };

      // Group by date (YYYY-MM-DD) from updated_at
      const dateStr = new Date(t.updated_at).toISOString().split('T')[0];
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(dto);
    }

    return { grouped };
  }

  // ================= SEARCH TASKS =================
  async searchTasks(userId: bigint, query: string) {
    if (!query || query.trim() === "") {
      return { results: [] };
    }

    const searchTerm = `%${query.toLowerCase()}%`;

    const tasks = await this.prisma.task.findMany({
      where: {
        OR: [
          // User's own tasks
          {
            user_id: userId,
            OR: [
              { title: { contains: query } },
              { description: { contains: query } },
            ],
          },
          // Public tasks from others
          {
            user_id: { not: userId },
            visibility: Visibility.public,
            OR: [
              { title: { contains: query } },
              { description: { contains: query } },
            ],
          },
        ],
      },
      include: {
        category: true,
        user: true,
        files: true,
      },
      orderBy: [
        { due_date: "asc" },
        { priority: "desc" },
        { updated_at: "desc" },
      ],
      take: 50, // Limit results
    });

    const results = tasks.map((t) => ({
      id: Number(t.id),
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date ? t.due_date.toISOString() : null,
      created_at: t.created_at.toISOString(),
      updated_at: t.updated_at.toISOString(),
      visibility: t.visibility,
      userId: Number(t.user_id),
      category: t.category
        ? {
            id: Number(t.category.id),
            name: t.category.name,
          }
        : null,
      user: {
        id: Number(t.user.id),
        email: t.user.email,
        name: t.user.name,
      },
      files: t.files.map((f) => ({
        id: Number(f.id),
        file_path: f.file_path,
        original_name: f.original_name,
        mime_type: f.mime_type,
        size: Number(f.size),
      })),
    }));

    return { results };
  }

  // ================= CREATE TASK =================
  async createTaskForUser(userId: bigint, body: any) {
    const {
      title,
      description,
      priority,
      dueDate,
      categoryId,
      visibility,
      reminderAt,
    } = body;

    const data: any = {
      user_id: userId,
      title,
      description: description ?? null,
      priority: (priority ?? "medium") as Priority,
      status: Status.pending,
      visibility: (visibility ?? "private") as Visibility,
    };

    if (dueDate) {
      data.due_date = new Date(dueDate);
    }

    if (categoryId) {
      data.category_id = BigInt(categoryId);
    }

    // Handle reminder
    if (reminderAt) {
      data.reminder_at = new Date(reminderAt);
      data.reminder_sent = false;
    }

    const task = await this.prisma.task.create({ data });

    return {
      id: Number(task.id),
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      due_date: task.due_date ? task.due_date.toISOString() : null,
      category_id: task.category_id ? Number(task.category_id) : null,
      reminder_at: task.reminder_at ? task.reminder_at.toISOString() : null,
    };
  }

  // ================= ATTACH FILES =================
  async attachFilesToTask(
    userId: bigint,
    taskId: bigint,
    files: Express.Multer.File[]
  ) {
    // pastikan task milik user ini
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        user_id: userId,
      },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    const created = await this.prisma.$transaction(
      files.map((f) =>
        this.prisma.taskFile.create({
          data: {
            task_id: taskId,
            file_path: `uploads/${f.filename}`, // Gunakan f.filename dan tambahkan prefix 'uploads/'
            original_name: f.originalname,
            mime_type: f.mimetype,
            size: BigInt(f.size),
          },
        })
      )
    );

    return {
      uploaded: created.length,
      files: created.map((c) => ({
        id: Number(c.id),
        original_name: c.original_name,
        mime_type: c.mime_type,
        size: Number(c.size),
        file_path: c.file_path,
      })),
    };
  }

  // ================= SIDEBAR SUMMARY =================
  async getSidebarSummary(userId: bigint) {
    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    const startOfNextWeek = new Date(now);
    startOfNextWeek.setDate(now.getDate() + (1 - now.getDay() + 7) % 7);
    startOfNextWeek.setHours(0, 0, 0, 0);

    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
    endOfNextWeek.setHours(23, 59, 59, 999);

    // COUNT: Today tasks (status != complete, due_date in today)
    const todayCount = await this.prisma.task.count({
      where: {
        user_id: userId,
        status: { not: Status.complete },
        due_date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    // COUNT: Upcoming tasks (status != complete, due_date > today, <= next week end)
    const upcomingCount = await this.prisma.task.count({
      where: {
        user_id: userId,
        status: { not: Status.complete },
        due_date: {
          gt: endOfToday,
          lte: endOfNextWeek,
        },
      },
    });

    // COUNT: Completed tasks (status = complete)
    const completedCount = await this.prisma.task.count({
      where: {
        user_id: userId,
        status: Status.complete,
      },
    });

    // GET: All categories with PENDING task counts only
    const categories = await this.prisma.category.findMany({
      where: {
        user_id: userId,
      },
      include: {
        tasks: {
          where: {
            status: { not: Status.complete },
          },
          select: {
            id: true,
          },
        },
      },
    });

    return {
      todayCount,
      upcomingCount,
      completedCount,
      categories: categories.map((cat) => ({
        categoryId: Number(cat.id),
        categoryName: cat.name,
        taskCount: cat.tasks.length,
        color: cat.color || '#6b7280',
        icon: cat.icon || 'folder',
      })),
    };
  }

  // ================= GET TASKS BY CATEGORY =================
  async getTasksByCategory(userId: bigint, categoryId: bigint): Promise<{
    tasks: TodayTaskDTO[];
    overdue: TodayTaskDTO[];
    categoryName: string;
    categoryColor: string;
    categoryIcon: string;
  }> {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );

    // Get category info
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        user_id: userId,
      },
    });

    if (!category) {
      return {
        tasks: [],
        overdue: [],
        categoryName: 'Unknown',
        categoryColor: '#6b7280',
        categoryIcon: 'folder',
      };
    }

    // Get pending tasks for this category
    const pendingTasks = await this.prisma.task.findMany({
      where: {
        user_id: userId,
        category_id: categoryId,
        status: { not: Status.complete },
      },
      include: {
        category: true,
        files: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        due_date: 'asc',
      },
    });

    const tasks: TodayTaskDTO[] = [];
    const overdue: TodayTaskDTO[] = [];

    for (const t of pendingTasks) {
      const isOverdue = !!t.due_date && t.due_date < startOfToday;
      const dto: TodayTaskDTO = {
        id: Number(t.id),
        title: t.title,
        description: t.description ?? null,
        priority: t.priority,
        status: t.status,
        due_date: t.due_date ? t.due_date.toISOString() : null,
        projectName: t.category ? t.category.name : null,
        is_overdue: isOverdue,
        userId: Number(t.user_id),
        ownerName: t.user.name ?? null,
        files: t.files.map((f) => ({
          id: Number(f.id),
          file_path: f.file_path,
          original_name: f.original_name,
          mime_type: f.mime_type,
          size: Number(f.size),
        })),
      };

      if (isOverdue) overdue.push(dto);
      else tasks.push(dto);
    }

    return {
      tasks,
      overdue,
      categoryName: category.name,
      categoryColor: category.color || '#6b7280',
      categoryIcon: category.icon || 'folder',
    };
  }

  // ================= UPDATE TASK =================
  async updateTask(userId: bigint, taskId: bigint, updateData: any) {
    // Verify task exists and belongs to user
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        user_id: userId,
      },
    });

    if (!task) {
      throw new NotFoundException("Task not found or you don't have permission to edit it");
    }

    const { title, description, priority, dueDate, categoryId, visibility, reminderAt } = updateData;

    const data: any = {};

    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (priority !== undefined) data.priority = priority as Priority;
    if (visibility !== undefined) data.visibility = visibility as Visibility;
    
    if (dueDate !== undefined) {
      data.due_date = dueDate ? new Date(dueDate) : null;
    }

    if (categoryId !== undefined) {
      data.category_id = categoryId ? BigInt(categoryId) : null;
    }

    // Handle reminder update
    if (reminderAt !== undefined) {
      if (reminderAt) {
        data.reminder_at = new Date(reminderAt);
        data.reminder_sent = false; // Reset reminder_sent when updating reminder time
      } else {
        data.reminder_at = null;
        data.reminder_sent = false;
      }
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        category: true,
        files: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      id: Number(updatedTask.id),
      title: updatedTask.title,
      description: updatedTask.description ?? null,
      priority: updatedTask.priority,
      status: updatedTask.status,
      visibility: updatedTask.visibility,
      due_date: updatedTask.due_date ? updatedTask.due_date.toISOString() : null,
      projectName: updatedTask.category ? updatedTask.category.name : null,
      category_id: updatedTask.category_id ? Number(updatedTask.category_id) : null,
      userId: Number(updatedTask.user_id),
      ownerName: updatedTask.user.name ?? null,
      reminder_at: (updatedTask as any).reminder_at ? (updatedTask as any).reminder_at.toISOString() : null,
      files: updatedTask.files.map((f) => ({
        id: Number(f.id),
        file_path: f.file_path,
        original_name: f.original_name,
        mime_type: f.mime_type,
        size: Number(f.size),
      })),
    };
  }

  // ================= DELETE TASK FILE =================
  async deleteTaskFile(userId: bigint, taskId: bigint, fileId: bigint) {
    // Pastikan task milik user ini
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        user_id: userId,
      },
    });

    if (!task) {
      throw new NotFoundException("Task not found or you don't have permission");
    }

    // Cari file
    const file = await this.prisma.taskFile.findFirst({
      where: {
        id: fileId,
        task_id: taskId,
      },
    });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    // Hapus file dari disk
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), file.file_path);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Hapus record dari database
    await this.prisma.taskFile.delete({
      where: { id: fileId },
    });

    return { message: "File deleted successfully" };
  }

  // ================= MARK TASK AS COMPLETE =================
  async markTaskAsComplete(userId: bigint, taskId: bigint) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        user_id: userId,
      },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    // Update status task menjadi complete
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { status: Status.complete },
      include: {
        category: true,
        files: true,
      },
    });

    return {
      id: Number(updatedTask.id),
      title: updatedTask.title,
      description: updatedTask.description ?? null,
      priority: updatedTask.priority,
      status: updatedTask.status,
      due_date: updatedTask.due_date ? updatedTask.due_date.toISOString() : null,
      projectName: updatedTask.category ? updatedTask.category.name : null,
      is_overdue: false,
      files: updatedTask.files.map((f) => ({
        id: Number(f.id),
        file_path: f.file_path,
        original_name: f.original_name,
        mime_type: f.mime_type,
        size: Number(f.size),
      })),
    };
  }
}