import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
});

// Helper header auth
function authHeader() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// =======================
// USER
// =======================

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const res = await api.get<CurrentUser>("/users/me", {
    headers: authHeader(),
  });
  return res.data;
}

// =======================
// TASKS (TODAY)
// =======================

export type TaskFileDTO = {
  id: number;
  file_path: string;
  original_name: string;
  mime_type: string;
  size: number;
};

export type TaskDTO = {
  id: number;
  title: string;
  description?: string | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "complete";
  due_date: string | null;
  created_at?: string;
  updated_at?: string;
  projectName?: string | null;
  is_overdue: boolean;
  userId: number;
  ownerName?: string | null;
  visibility?: "private" | "public";
  files?: TaskFileDTO[];
  category?: {
    id: number;
    name: string;
  } | null;
  user?: {
    id: number;
    email: string;
    name: string;
  };
};

export interface TodayTasksResponse {
  overdue: TaskDTO[];
  today: TaskDTO[];
}

export interface UpcomingTasksResponse {
  overdue: TaskDTO[];
  grouped: { [date: string]: TaskDTO[] };
}

export async function getTodayTasks(): Promise<TodayTasksResponse> {
  const res = await api.get<TodayTasksResponse>("/tasks/today", {
    headers: authHeader(),
  });
  return res.data;
}

export async function getUpcomingTasks(): Promise<UpcomingTasksResponse> {
  const res = await api.get<UpcomingTasksResponse>("/tasks/upcoming", {
    headers: authHeader(),
  });
  return res.data;
}

// =======================
// SIDEBAR SUMMARY
// =======================

export type SidebarCategorySummary = {
  categoryId: number;
  categoryName: string;
  taskCount: number;
  color: string;
  icon: string;
};

export type SidebarSummaryResponse = {
  todayCount: number;
  upcomingCount: number;
  completedCount: number;
  categories: SidebarCategorySummary[];
};

export async function getSidebarSummary(): Promise<SidebarSummaryResponse> {
  const res = await api.get<SidebarSummaryResponse>("/tasks/sidebar-summary", {
    headers: authHeader(),
  });
  return res.data;
}

// =======================
// TASKS BY CATEGORY
// =======================

export interface CategoryTasksResponse {
  tasks: TaskDTO[];
  overdue: TaskDTO[];
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
}

export async function getTasksByCategory(categoryId: number): Promise<CategoryTasksResponse> {
  const res = await api.get<CategoryTasksResponse>(`/tasks/category/${categoryId}`, {
    headers: authHeader(),
  });
  return res.data;
}

// =======================
// COMPLETED TASKS
// =======================

export interface CompletedTasksResponse {
  grouped: Record<string, TaskDTO[]>;
}

export async function getCompletedTasks(): Promise<CompletedTasksResponse> {
  const res = await api.get<CompletedTasksResponse>("/tasks/completed", {
    headers: authHeader(),
  });
  return res.data;
}

// =======================
// SEARCH TASKS
// =======================

export interface SearchTasksResponse {
  results: TaskDTO[];
}

export async function searchTasks(query: string): Promise<SearchTasksResponse> {
  const res = await api.get<SearchTasksResponse>("/tasks/search", {
    params: { q: query },
    headers: authHeader(),
  });
  return res.data;
}

// =======================
// CREATE TASK
// =======================

export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  categoryId?: number | null;
  visibility?: "private" | "public";
  reminderAt?: string | null;
}

export async function createTask(
  payload: CreateTaskPayload
): Promise<TaskDTO> {
  const res = await api.post<TaskDTO>("/tasks", payload, {
    headers: {
      ...authHeader(),
      "Content-Type": "application/json",
    },
  });
  return res.data;
}

// =======================
// UPLOAD FILES for TASK
// =======================

export async function uploadTaskFiles(taskId: number, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await api.post(`/tasks/${taskId}/files`, formData, {
    headers: {
      ...authHeader(),
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}

// =======================
// DELETE FILE from TASK
// =======================

export async function deleteTaskFile(taskId: number, fileId: number) {
  const res = await api.delete(`/tasks/${taskId}/files/${fileId}`, {
    headers: authHeader(),
  });
  return res.data;
}

// =======================
// UPDATE TASK
// =======================

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  priority?: "low" | "medium" | "high";
  dueDate?: string | null;
  categoryId?: number | null;
  visibility?: "private" | "public";
  reminderAt?: string | null;
}

export async function updateTask(
  taskId: number,
  payload: UpdateTaskPayload
): Promise<TaskDTO> {
  const res = await api.patch<TaskDTO>(`/tasks/${taskId}`, payload, {
    headers: {
      ...authHeader(),
      "Content-Type": "application/json",
    },
  });
  return res.data;
}

// =======================
// MARK TASK AS COMPLETE
// =======================

export async function markTaskAsComplete(taskId: number): Promise<TaskDTO> {
  const res = await api.patch<TaskDTO>(`/tasks/${taskId}/complete`, {}, {
    headers: authHeader(),
  });
  return res.data;
}

// =======================
// CATEGORIES
// =======================

export type CategoryDTO = {
  id: number;
  name: string;
  color: string;
  icon: string;
  created_at: string;
};

export async function getCategories(): Promise<CategoryDTO[]> {
  const res = await api.get<CategoryDTO[]>("/categories", {
    headers: authHeader(),
  });
  return res.data;
}

export async function createCategory(
  name: string,
  color?: string,
  icon?: string
): Promise<CategoryDTO> {
  const res = await api.post<CategoryDTO>(
    "/categories",
    { name, color, icon },
    {
      headers: {
        ...authHeader(),
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
}

export async function deleteCategory(categoryId: number): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(`/categories/${categoryId}`, {
    headers: authHeader(),
  });
  return res.data;
}

export default api;