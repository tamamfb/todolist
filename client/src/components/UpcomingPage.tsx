import React, { useEffect, useState, useRef } from "react";
import Lottie from "lottie-react";
import * as pdfjsLib from "pdfjs-dist";
import loveIsBlind from "../assets/Loveisblind.json";
import {
  getUpcomingTasks,
  createTask,
  uploadTaskFiles,
  markTaskAsComplete,
  updateTask,
  deleteTaskFile,
  getCategories,
  createCategory as createCategoryAPI,
  type CategoryDTO as APICategoryDTO,
} from "../api";
import { playBellKlinkSound } from "../assets/bell-klink";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type TaskFileDTO = {
  id: number;
  file_path: string;
  original_name: string;
  mime_type: string;
  size: number;
};

type TaskDTO = {
  id: number;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "complete";
  due_date: string | null;
  projectName: string | null;
  is_overdue: boolean;
  userId: number;
  ownerName: string | null;
  files?: TaskFileDTO[];
};

type UpcomingResponse = {
  overdue: TaskDTO[];
  grouped: { [date: string]: TaskDTO[] };
};

type PrioritySelection = "high" | "medium" | "low" | null;
type CategoryDTO = APICategoryDTO;

const FileIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M9 1H3v14h10V5L9 1z" />
    <path d="M9 1v4h4" />
  </svg>
);

const FlagIcon: React.FC<{ color?: string }> = ({ color = "currentColor" }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M4 2v11"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M4 2h6l-1.3 2L10 6H4z"
      fill={color}
      stroke={color}
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    aria-hidden="true"
    focusable="false"
  >
    <rect
      x="2"
      y="3"
      width="12"
      height="11"
      rx="2"
      ry="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <path
      d="M5 3V2M11 3V2M3 6h10"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

const CategoryIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    aria-hidden="true"
    focusable="false"
  >
    <rect
      x="2.2"
      y="3"
      width="11.6"
      height="9.5"
      rx="2"
      ry="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <path
      d="M2.5 6h11"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    />
  </svg>
);

/* ===== DYNAMIC CATEGORY ICON ===== */
interface DynamicCategoryIconProps {
  name: string;
  color?: string;
  size?: number;
}

const DynamicCategoryIcon = ({ name, color = "currentColor", size = 16 }: DynamicCategoryIconProps) => {
  const icons: Record<string, React.ReactNode> = {
    folder: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
    phone: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
        <line x1="12" y1="18" x2="12.01" y2="18"></line>
      </svg>
    ),
    wifi: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
        <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
        <line x1="12" y1="20" x2="12.01" y2="20"></line>
      </svg>
    ),
    tag: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
        <line x1="7" y1="7" x2="7.01" y2="7"></line>
      </svg>
    ),
    home: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    ),
    cart: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
    ),
    heart: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    ),
    star: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    ),
    mail: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
      </svg>
    ),
    calendar: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    ),
    grid: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
    camera: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
      </svg>
    ),
    music: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"></path>
        <circle cx="6" cy="18" r="3"></circle>
        <circle cx="18" cy="16" r="3"></circle>
      </svg>
    ),
    smile: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
        <line x1="9" y1="9" x2="9.01" y2="9"></line>
        <line x1="15" y1="9" x2="15.01" y2="9"></line>
      </svg>
    ),
    code: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    ),
    briefcase: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
      </svg>
    ),
    hashtag: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="9" x2="20" y2="9"></line>
        <line x1="4" y1="15" x2="20" y2="15"></line>
        <line x1="10" y1="3" x2="8" y2="21"></line>
        <line x1="16" y1="3" x2="14" y2="21"></line>
      </svg>
    ),
    printer: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
    ),
    diamond: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
        <path d="M2 17l10 5 10-5"></path>
        <path d="M2 12l10 5 10-5"></path>
      </svg>
    ),
    mappin: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    ),
    bulb: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6"></path>
        <path d="M10 22h4"></path>
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
      </svg>
    ),
    upload: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
    ),
    sun: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    ),
  };

  return <>{icons[name] || icons.folder}</>;
};

const LockIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    aria-hidden="true"
    focusable="false"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
  >
    <rect x="3" y="6.5" width="10" height="7" rx="1" ry="1" />
    <path d="M5 6.5V4a3 3 0 0 1 6 0v2.5" strokeLinecap="round" />
  </svg>
);

const GlobeIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    aria-hidden="true"
    focusable="false"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
  >
    <circle cx="8" cy="8" r="6.5" />
    <path d="M2.5 8h11" strokeLinecap="round" />
    <path d="M8 1.5c1.2 0 2 2 2 6.5s-.8 6.5-2 6.5-2-2-2-6.5.8-6.5 2-6.5" />
  </svg>
);

const UserIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    aria-hidden="true"
    focusable="false"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
  >
    <circle cx="8" cy="5" r="3" />
    <path d="M2 13a6 6 0 0 1 12 0" strokeLinecap="round" />
  </svg>
);

const UpcomingPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [groupedTasks, setGroupedTasks] = useState<{ [date: string]: TaskDTO[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingClosing, setIsAddingClosing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);
  const [selectedTaskClosing, setSelectedTaskClosing] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    // Always start with current month (today's date, set to 1st)
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Form states for adding task
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<PrioritySelection>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isDraggingOverDropzone, setIsDraggingOverDropzone] = useState(false);
  const [existingFiles, setExistingFiles] = useState<TaskFileDTO[]>([]);
  const [categories, setCategories] = useState<APICategoryDTO[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const [res, cats] = await Promise.all([
          getUpcomingTasks() as Promise<UpcomingResponse>,
          getCategories().catch(() => []),
        ]);
        setGroupedTasks(res.grouped ?? {});
        setCategories(cats);
        
        // Set default category to first one
        if (cats.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(cats[0].id);
        }
      } catch (err) {
        console.error("Failed to load upcoming tasks", err);
        setError("Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    };
    
    // Ensure currentMonth is always set to current month on mount
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    setCurrentMonth(currentMonthDate);
    
    loadTasks();
    
    // Listen for task-updated events to refresh upcoming tasks
    const handleTaskUpdated = () => {
      loadTasks();
    };
    
    window.addEventListener("task-updated", handleTaskUpdated);
    
    // Close priority and visibility dropdowns when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".today-priority-chip-wrapper")) {
        setIsPriorityOpen(false);
      }
      if (!target.closest(".today-visibility-chip-wrapper")) {
        setIsVisibilityOpen(false);
      }
    };
    
    document.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("task-updated", handleTaskUpdated);
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Helper function to get the starting Sunday of the week containing the given date
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  // Helper function to generate calendar weeks for the month
  const getCalendarWeeks = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    let currentDate = getWeekStart(firstDay);
    
    while (currentDate <= lastDay) {
      currentWeek.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Add remaining days
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedDate) return;

    try {
      if (editingTaskId) {
        // UPDATE MODE
        await updateTask(editingTaskId, {
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          priority: priority ?? "medium",
          dueDate: selectedDate.toISOString(),
          categoryId: selectedCategoryId,
          visibility,
        });
      } else {
        // CREATE MODE
        const newTask = await createTask({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          priority: priority ?? "medium",
          dueDate: selectedDate.toISOString(),
          categoryId: selectedCategoryId,
          visibility,
        });

        if (filesToUpload.length > 0) {
          try {
            await uploadTaskFiles(newTask.id, filesToUpload);
          } catch (err) {
            console.error("Failed to upload files", err);
          }
        }
      }

      const res = (await getUpcomingTasks()) as UpcomingResponse;
      setGroupedTasks(res.grouped ?? {});

      handleCloseAddingModal();
      // Trigger sidebar counter refresh
      window.dispatchEvent(new Event("task-updated"));
    } catch (err) {
      console.error("Failed to create/update task", err);
      setError("Failed to create/update task.");
    }
  };

  const resetFormState = () => {
    setNewTitle("");
    setNewDescription("");
    setSelectedDate(null);
    setPriority(null);
    setSelectedCategoryId(categories[0]?.id ?? null);
    setVisibility("private");
    setFilesToUpload([]);
    setIsDraggingOverDropzone(false);
    setEditingTaskId(null);
    setExistingFiles([]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverDropzone(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if ((e.target as HTMLElement).className.includes("attachments-dropzone")) {
      setIsDraggingOverDropzone(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverDropzone(false);
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter((file) =>
      ["application/pdf", "image/jpeg", "image/png"].includes(file.type)
    );
    setFilesToUpload((prev) => [...prev, ...validFiles]);
  };

  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFilesToUpload((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (idx: number) => {
    setFilesToUpload((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCloseAddingModal = () => {
    setIsAddingClosing(true);
    setTimeout(() => {
      setIsAdding(false);
      setIsAddingClosing(false);
      resetFormState();
    }, 300);
  };

  const handleCloseSelectedTask = () => {
    setSelectedTaskClosing(true);
    setTimeout(() => {
      setSelectedTask(null);
      setSelectedTaskClosing(false);
    }, 300);
  };

  const handleEditTaskFromDetail = (task: TaskDTO) => {
    console.log("Edit button clicked for task:", task.id);
    // Populate form with task data
    setNewTitle(task.title);
    setNewDescription(task.description || "");
    setPriority(task.priority as PrioritySelection);
    setSelectedDate(task.due_date ? new Date(task.due_date) : null);
    setVisibility("private"); // Default, adjust if you have visibility in task
    setEditingTaskId(task.id);
    
    // Set existing files
    setExistingFiles(task.files || []);
    
    // Close detail modal and open ADD modal
    setSelectedTask(null);
    setIsAdding(true);
  };

  return (
    <>
      <header className="home-main-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div>
            <h1 className="home-main-title">Upcoming</h1>
            <span className="home-main-subtitle">Preview of the next days</span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => {
                const prev = new Date(currentMonth);
                prev.setMonth(prev.getMonth() - 1);
                // Allow going back to see past months
                setCurrentMonth(prev);
              }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#666", padding: "4px 8px" }}
            >
              ‹
            </button>
            <div style={{ minWidth: "140px", textAlign: "center", fontSize: "14px", fontWeight: 500 }}>
              {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
            <button
              onClick={() => {
                const next = new Date(currentMonth);
                next.setMonth(next.getMonth() + 1);
                // Limit to 12 months ahead from today
                const today = new Date();
                const twelveMonthsAhead = new Date(today);
                twelveMonthsAhead.setMonth(twelveMonthsAhead.getMonth() + 12);
                if (next <= twelveMonthsAhead) {
                  setCurrentMonth(next);
                }
              }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#666", padding: "4px 8px" }}
            >
              ›
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
                setCurrentMonth(currentMonthDate);
              }}
              style={{ marginLeft: "8px", padding: "4px 12px", background: "none", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", fontSize: "13px", color: "#666" }}
            >
              Today
            </button>
          </div>
        </div>
      </header>

      {/* Calendar Header with Days of Week */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "8px", marginTop: "20px" }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} style={{ textAlign: "center", fontSize: "13px", fontWeight: 600, color: "#6b7280", padding: "8px" }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid with Add Task buttons */}
      <div style={{ marginBottom: "20px" }}>
          {getCalendarWeeks(currentMonth).map((week, weekIdx) => (
            <div key={weekIdx} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "8px" }}>
              {week.map((date, dayIdx) => {
                // Ensure we're checking against the correct month
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
                const dateStr = date.toISOString().split("T")[0];
                const tasksForDate = groupedTasks[dateStr] || [];
                const today = new Date();
                // Compare using local date to avoid timezone issues
                const isToday = date.getDate() === today.getDate() && 
                               date.getMonth() === today.getMonth() && 
                               date.getFullYear() === today.getFullYear();
                
                return (
                  <div
                    key={dayIdx}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      backgroundColor: isToday ? "#fef3c7" : isCurrentMonth ? "#ffffff" : "#f9fafb",
                      opacity: isCurrentMonth ? 1 : 0.5,
                      minHeight: "140px",
                      display: "flex",
                      flexDirection: "column",
                      padding: "8px",
                    }}
                  >
                    {/* Date Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: isToday ? "#dc2626" : "#1f2937" }}>
                        {date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
                      </div>
                      {isToday && (
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "white", backgroundColor: "#dc2626", borderRadius: "3px", padding: "2px 5px" }}>
                          Today
                        </div>
                      )}
                    </div>

                    {/* Tasks for this day - show as colored bars */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px", minHeight: "40px", overflowY: "auto" }}>
                      {tasksForDate.length > 0 ? (
                        tasksForDate.map((task) => {
                          const priorityColor = {
                            high: "#ef4444",
                            medium: "#eab308",
                            low: "#22c55e",
                          }[task.priority];

                          return (
                            <button
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              style={{
                                padding: "4px 6px",
                                fontSize: "11px",
                                backgroundColor: priorityColor,
                                color: "white",
                                border: "none",
                                borderRadius: "3px",
                                cursor: "pointer",
                                textAlign: "left",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontWeight: 500,
                                transition: "opacity 0.2s",
                              }}
                              onMouseOver={(e) => {
                                (e.target as HTMLButtonElement).style.opacity = "0.8";
                              }}
                              onMouseOut={(e) => {
                                (e.target as HTMLButtonElement).style.opacity = "1";
                              }}
                              title={task.title}
                            >
                              {task.title}
                            </button>
                          );
                        })
                      ) : null}
                    </div>

                    {/* Add task button */}
                    {isCurrentMonth && (
                      <button
                        onClick={() => {
                          setSelectedDate(date);
                          setIsAdding(true);
                        }}
                        style={{
                          padding: "6px 8px",
                          fontSize: "12px",
                          color: "#ef4444",
                          background: "#fef2f2",
                          border: "1px solid #fee2e2",
                          borderRadius: "4px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseOver={(e) => {
                          (e.target as HTMLButtonElement).style.backgroundColor = "#fee2e2";
                        }}
                        onMouseOut={(e) => {
                          (e.target as HTMLButtonElement).style.backgroundColor = "#fef2f2";
                        }}
                      >
                        + Add task
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

      {isAdding && (
        <div
          className={`modal-backdrop${isAddingClosing ? " closing" : ""}`}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
          onClick={() => {
            handleCloseAddingModal();
          }}
        >
          <div
            className={`modal-content${isAddingClosing ? " closing" : ""}`}
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              maxWidth: "700px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "visible",
              padding: "16px 18px 12px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => handleCloseAddingModal()}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "none",
                border: "none",
                fontSize: "28px",
                cursor: "pointer",
                color: "#9ca3af",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.color = "#6b7280";
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.color = "#9ca3af";
              }}
            >
              ×
            </button>

            <form onSubmit={handleSubmitAdd} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Title input */}
              <input
                className="today-add-title-input"
                placeholder="Task name"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                required
              />

              {/* Description input */}
              <textarea
                className="today-add-description"
                placeholder="Description"
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />

              {/* ATTACHMENTS - drag & drop */}
              <div className="attachments-section">
                {/* Drag & drop area - always show */}
                <div
                  className={"attachments-dropzone" + (isDraggingOverDropzone ? " attachments-dropzone--dragging" : "")}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleDropzoneClick}
                >
                  <div className="attachments-dropzone-left">
                    <span className="attachments-icon">📎</span>
                    <div className="attachments-dropzone-text">
                      <div className="attachments-dropzone-title">Drag & drop files here, or click to browse</div>
                      <div className="attachments-dropzone-subtitle">PDF, JPG, PNG</div>
                    </div>
                  </div>
                </div>

                <input
                  type="file"
                  multiple
                  accept="application/pdf,image/jpeg,image/png"
                  ref={fileInputRef}
                  className="attachments-input-hidden"
                  onChange={handleFileInputChange}
                />

                {/* Show existing files in edit mode */}
                {editingTaskId && existingFiles.length > 0 && (
                  <div className="attachments-file-list">
                    {existingFiles.map((file) => (
                      <div key={file.id} className="attachments-file-item">
                        <span className="attachments-file-name">{file.original_name}</span>
                        <span className="attachments-file-size">{(file.size / 1024).toFixed(1)} KB</span>
                        <button
                          type="button"
                          className="attachments-file-remove"
                          onClick={async () => {
                            try {
                              await deleteTaskFile(editingTaskId, file.id);
                              setExistingFiles(existingFiles.filter(f => f.id !== file.id));
                            } catch (err) {
                              console.error("Failed to delete file", err);
                            }
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {filesToUpload.length > 0 && (
                  <div className="attachments-file-list">
                    {filesToUpload.map((file, idx) => (
                      <div key={idx} className="attachments-file-item">
                        <span className="attachments-file-name">{file.name}</span>
                        <span className="attachments-file-size">{(file.size / 1024).toFixed(1)} KB</span>
                        <button
                          type="button"
                          className="attachments-file-remove"
                          onClick={() => handleRemoveFile(idx)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* chips: DATE + PRIORITY */}
              <div className="today-add-chips">
                {/* DATE chip - Disabled (auto-set from calendar) */}
                <div className="today-date-chip-wrapper">
                  <button
                    type="button"
                    className="today-chip today-chip-date"
                    disabled
                    style={{
                      opacity: 0.7,
                      cursor: "not-allowed"
                    }}
                  >
                    <span className="today-chip-icon">
                      <CalendarIcon />
                    </span>
                    <span className="today-chip-label">
                      {selectedDate ? selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Add date"}
                    </span>
                  </button>
                </div>

                {/* PRIORITY chip */}
                <div className="today-priority-chip-wrapper">
                  <button
                    type="button"
                    className={`today-chip today-chip-priority today-chip-priority--${priority || "null"}`}
                    onClick={() => {
                      setIsPriorityOpen(!isPriorityOpen);
                      setIsVisibilityOpen(false);
                    }}
                  >
                    <span className="today-chip-icon">
                      <FlagIcon
                        color={
                          priority === "high" ? "#ef4444" : priority === "medium" ? "#eab308" : priority === "low" ? "#22c55e" : "#9ca3af"
                        }
                      />
                    </span>
                    <span className="today-chip-label">
                      {priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : "Priority"}
                    </span>
                    {priority && (
                      <span
                        className="today-chip-clear"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPriority(null);
                        }}
                        role="button"
                        aria-label="Clear priority"
                      >
                        ×
                      </span>
                    )}
                  </button>

                  {isPriorityOpen && (
                    <div className="priority-popover">
                      <div className="priority-list">
                        <button
                          type="button"
                          className="priority-item"
                          onClick={() => {
                            setPriority("high");
                            setIsPriorityOpen(false);
                          }}
                        >
                          <span className="priority-item-left">
                            <FlagIcon color="#ef4444" />
                            <span>High</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          className="priority-item"
                          onClick={() => {
                            setPriority("medium");
                            setIsPriorityOpen(false);
                          }}
                        >
                          <span className="priority-item-left">
                            <FlagIcon color="#eab308" />
                            <span>Medium</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          className="priority-item"
                          onClick={() => {
                            setPriority("low");
                            setIsPriorityOpen(false);
                          }}
                        >
                          <span className="priority-item-left">
                            <FlagIcon color="#22c55e" />
                            <span>Low</span>
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* VISIBILITY chip */}
                <div className="today-visibility-chip-wrapper">
                  <button
                    type="button"
                    className={`today-chip today-visibility-chip today-visibility-chip--${visibility}`}
                    onClick={() => {
                      setIsVisibilityOpen(!isVisibilityOpen);
                      setIsPriorityOpen(false);
                    }}
                  >
                    <span className="today-chip-icon">{visibility === "private" ? <LockIcon /> : <GlobeIcon />}</span>
                    <span className="today-chip-label">{visibility === "private" ? "Private" : "Public"}</span>
                  </button>

                  {isVisibilityOpen && (
                    <div className="priority-popover">
                      <div className="priority-list">
                        <button
                          type="button"
                          className="priority-item"
                          onClick={() => {
                            setVisibility("private");
                            setIsVisibilityOpen(false);
                          }}
                        >
                          <span className="priority-item-left">
                            <LockIcon />
                            <span>Private</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          className="priority-item"
                          onClick={() => {
                            setVisibility("public");
                            setIsVisibilityOpen(false);
                          }}
                        >
                          <span className="priority-item-left">
                            <GlobeIcon />
                            <span>Public</span>
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FOOTER: category + buttons */}
              <div className="today-add-footer">
                <div className="today-add-project-wrapper">
                  <button 
                    type="button" 
                    className="today-add-project" 
                    onClick={() => {
                      setIsCategoryOpen(!isCategoryOpen);
                      setIsPriorityOpen(false);
                      setIsVisibilityOpen(false);
                    }}
                  >
                    <span className="today-add-project-icon">
                      <DynamicCategoryIcon 
                        name={categories.find(c => c.id === selectedCategoryId)?.icon || 'folder'} 
                        color={categories.find(c => c.id === selectedCategoryId)?.color || '#6b7280'} 
                        size={14} 
                      />
                    </span>
                    <span className="today-add-project-label">
                      {categories.find(c => c.id === selectedCategoryId)?.name || "Home"}
                    </span>
                    <span className="today-add-project-caret">▾</span>
                  </button>

                  {isCategoryOpen && (
                    <div className="priority-popover" style={{ bottom: "100%", top: "auto", marginBottom: "4px" }}>
                      <div style={{ padding: "8px" }}>
                        <input
                          type="text"
                          placeholder="Type a category name"
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            fontSize: "13px",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                          }}
                        />
                      </div>
                      <div className="priority-list">
                        {categories
                          .filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
                          .map((cat) => {
                            const isActive = cat.id === selectedCategoryId;
                            const catColor = cat.color || '#6b7280';
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                className="priority-item"
                                onClick={() => {
                                  setSelectedCategoryId(cat.id);
                                  setIsCategoryOpen(false);
                                  setCategorySearch("");
                                }}
                                style={{
                                  backgroundColor: isActive ? `${catColor}15` : undefined,
                                  borderLeft: isActive ? `3px solid ${catColor}` : '3px solid transparent',
                                }}
                              >
                                <span className="priority-item-left">
                                  <DynamicCategoryIcon name={cat.icon || 'folder'} color={catColor} size={16} />
                                  <span>{cat.name}</span>
                                </span>
                                {isActive && (
                                  <span style={{ marginLeft: "auto", color: catColor }}>✓</span>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="today-add-actions">
                  <button
                    type="button"
                    className="today-btn-cancel"
                    onClick={() => handleCloseAddingModal()}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="today-btn-add" disabled={!newTitle.trim()}>
                    {editingTaskId ? "Save edit" : "Add task"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div className="lottie-zoom-animation" style={{ width: 200, height: 200, margin: "0 auto" }}>
            <Lottie
              animationData={loveIsBlind}
              loop
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>
      )}

      {!loading && error && <div className="error-message">{error}</div>}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div
          className={`modal-backdrop${selectedTaskClosing ? " closing" : ""}`}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => handleCloseSelectedTask()}
        >
          <div
            className={`modal-content${selectedTaskClosing ? " closing" : ""}`}
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              maxWidth: "700px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "visible",
              padding: "24px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => handleCloseSelectedTask()}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "none",
                border: "none",
                fontSize: "28px",
                cursor: "pointer",
                color: "#9ca3af",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.color = "#6b7280";
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.color = "#9ca3af";
              }}
            >
              ×
            </button>

            {/* Edit Button - always show for debugging, then add condition back */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const userId = Number(localStorage.getItem("user_id"));
                console.log("Edit clicked! Task userId:", selectedTask.userId, "Current userId:", userId);
                handleEditTaskFromDetail(selectedTask);
              }}
              style={{
                position: "absolute",
                top: "12px",
                right: "56px",
                width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#3b82f6";
                  e.currentTarget.style.borderColor = "#3b82f6";
                  const svg = e.currentTarget.querySelector("svg");
                  if (svg) (svg as SVGElement).style.stroke = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  const svg = e.currentTarget.querySelector("svg");
                  if (svg) (svg as SVGElement).style.stroke = "#6b7280";
                }}
                aria-label="Edit task"
                title="Edit task"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6b7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transition: "stroke 0.2s ease" }}
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>

            {/* Task Title */}
            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px", color: "#1f2937", paddingRight: "32px" }}>
              {selectedTask.title}
            </h2>

            {/* Task Meta Info with Icons */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px", fontSize: "13px", flexWrap: "wrap" }}>
              {selectedTask.due_date && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280" }}>
                  <div style={{ color: "#6b7280", display: "flex", alignItems: "center" }}>
                    <CalendarIcon />
                  </div>
                  <span>{new Date(selectedTask.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280" }}>
                <div style={{ color: selectedTask.priority === "high" ? "#ef4444" : selectedTask.priority === "medium" ? "#eab308" : "#22c55e", display: "flex", alignItems: "center" }}>
                  <FlagIcon
                    color={
                      selectedTask.priority === "high" ? "#ef4444" : selectedTask.priority === "medium" ? "#eab308" : "#22c55e"
                    }
                  />
                </div>
                <span>{selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)}</span>
              </div>
              {selectedTask.ownerName && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280" }}>
                  <div style={{ color: "#6b7280", display: "flex", alignItems: "center" }}>
                    <UserIcon />
                  </div>
                  <span>{selectedTask.ownerName}</span>
                </div>
              )}
            </div>

            {/* Task Description */}
            {selectedTask.description && (
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>Task Description</h3>
                <div style={{ padding: "12px", backgroundColor: "#f9fafb", borderRadius: "6px", fontSize: "14px", color: "#374151", lineHeight: "1.6" }}>
                  {selectedTask.description}
                </div>
              </div>
            )}

            {/* Task Files */}
            {selectedTask.files && selectedTask.files.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>Attachments</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedTask.files.map((file) => (
                    <a
                      key={file.id}
                      href={`http://localhost:3000/uploads/${file.file_path.split("/").pop()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "10px 12px",
                        backgroundColor: "#f9fafb",
                        borderRadius: "6px",
                        textDecoration: "none",
                        color: "#3b82f6",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        border: "1px solid #e5e7eb",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseOver={(e) => {
                        (e.target as HTMLAnchorElement).style.backgroundColor = "#f3f4f6";
                      }}
                      onMouseOut={(e) => {
                        (e.target as HTMLAnchorElement).style.backgroundColor = "#f9fafb";
                      }}
                    >
                      <FileIcon />
                      {file.original_name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Mark as Complete Button */}
            <button
              onClick={async () => {
                try {
                  await markTaskAsComplete(selectedTask.id);
                  // Refresh tasks
                  const res = (await getUpcomingTasks()) as UpcomingResponse;
                  setGroupedTasks(res.grouped || {});
                  setSelectedTask(null);
                  playBellKlinkSound();
                  // Trigger sidebar counter refresh
                  window.dispatchEvent(new Event("task-updated"));
                } catch (err) {
                  console.error("Failed to mark task as complete", err);
                }
              }}
              style={{
                width: "100%",
                padding: "10px 16px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                marginTop: "20px",
                transition: "filter 0.2s ease",
              }}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.filter = "brightness(1.05)";
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.filter = "brightness(1)";
              }}
            >
              Mark as Complete
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UpcomingPage;
