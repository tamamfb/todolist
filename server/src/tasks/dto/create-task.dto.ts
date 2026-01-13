import { Priority } from "@prisma/client";

export class CreateTaskDto {
  title!: string;
  description?: string;
  priority?: Priority;
  dueDate?: string | null;
  categoryId?: number | null;
}
