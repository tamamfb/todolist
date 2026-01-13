import React, { useEffect, useState, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import { 
  getCurrentUser, 
  getSidebarSummary, 
  searchTasks, 
  markTaskAsComplete, 
  createTask, 
  uploadTaskFiles, 
  getCategories,
  createCategory,
  deleteCategory,
  getTasksByCategory,
  type TaskDTO,
  type CategoryDTO 
} from "../../api";
import { playBellKlinkSound } from "../../assets/bell-klink";
import loveIsBlind from "../../assets/Loveisblind.json";

// Tipe user lokal
interface CurrentUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

/** Tipe lokal untuk summary sidebar (supaya tidak perlu import type dari api.ts) */
type SidebarCategorySummary = {
  categoryId: number;
  categoryName: string;
  taskCount: number;
  color: string;
  icon: string;
};

type SidebarSummaryResponse = {
  todayCount: number;
  upcomingCount: number;
  completedCount: number;
  categories: SidebarCategorySummary[];
};

type CategoryTasksView = {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  tasks: TaskDTO[];
  overdue: TaskDTO[];
};

/* ------- SVG Icons pakai currentColor ------- */

const AddIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <circle
      cx="8"
      cy="8"
      r="7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M8 4.5v7M4.5 8h7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const SearchIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <circle
      cx="7"
      cy="7"
      r="4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M10 10l3 3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const TodayIcon: React.FC<{ day: number }> = ({ day }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
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
      d="M5 3V1.8M11 3V1.8M3 6h10"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <text
      x="8"
      y="11"
      textAnchor="middle"
      fontSize="7"
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      fill="currentColor"
    >
      {day}
    </text>
  </svg>
);

const UpcomingIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <rect
      x="2.5"
      y="3.5"
      width="11"
      height="10"
      rx="1.5"
      ry="1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M5 2.5v2M11 2.5v2M3 6h10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CompletedIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <circle
      cx="8"
      cy="8"
      r="7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M5 8.2L7 10l4-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HomeIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M2.5 7.5L8 2.5l5.5 5v5a1 1 0 0 1-1 1h-3v-3.2a1.3 1.3 0 0 0-1.3-1.3H7.8A1.3 1.3 0 0 0 6.5 10.3V13h-3a1 1 0 0 1-1-1v-4.5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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

const CategoryFolderIcon: React.FC = () => (
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

/* ------- Helper Functions untuk Date ------- */

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toInputDateValue = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatWeekdayShort = (date: Date): string => {
  return date.toLocaleDateString(undefined, { weekday: "short" });
};

const formatDayMonthShort = (date: Date): string => {
  const day = date.toLocaleDateString(undefined, { day: "2-digit" });
  const month = date.toLocaleDateString(undefined, { month: "short" });
  return `${day} ${month}`;
};

const formatDateChipLabel = (
  selectedDate: Date | null,
  dateSource: "today" | "tomorrow" | "nextWeek" | "nextWeekend" | "manual" | null,
  todayBase: Date
): string => {
  if (!selectedDate) return "Add date";
  if (dateSource === "today") return "Today";
  if (dateSource === "tomorrow") return "Tomorrow";

  const oneDayMs = 24 * 60 * 60 * 1000;
  const diffDays =
    (startOfDay(selectedDate).getTime() - startOfDay(todayBase).getTime()) /
    oneDayMs;

  if (diffDays > 1 && diffDays <= 7) {
    return selectedDate.toLocaleDateString(undefined, {
      weekday: "long",
    });
  }

  return selectedDate.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
};

/* ------- Constants ------- */

const AVAILABLE_COLORS = [
  "#FFFFFF", // White
  "#EF4444", // Red
  "#F97316", // Orange  
  "#EAB308", // Yellow
  "#22C55E", // Green
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
];

const AVAILABLE_ICONS = [
  "folder",
  "briefcase",
  "phone",
  "graduation-cap",
  "tag",
  "home",
  "shopping-cart",
  "heart",
  "star",
  "mail",
  "calendar",
  "book",
  "camera",
  "music",
  "palette",
  "code",
  "coffee",
  "gift",
  "car",
  "plane",
  "rocket",
  "trophy",
  "umbrella",
  "sun",
];

/* ------- Category Icon Components ------- */
interface CategoryIconProps {
  name: string;
  color?: string;
  size?: number;
}

const CategoryIcon = ({ name, color = "currentColor", size = 20 }: CategoryIconProps) => {
  const iconMap: Record<string, React.ReactNode> = {
    "folder": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M2 4C2 3.44772 2.44772 3 3 3H7.58579C7.851 3 8.10536 3.10536 8.29289 3.29289L10 5H17C17.5523 5 18 5.44772 18 6V16C18 16.5523 17.5523 17 17 17H3C2.44772 17 2 16.5523 2 16V4Z" stroke={color} strokeWidth="1.5"/></svg>,
    "briefcase": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M7 5C7 3.89543 7.89543 3 9 3H11C12.1046 3 13 3.89543 13 5V6H7V5Z" stroke={color} strokeWidth="1.5"/><rect x="2" y="6" width="16" height="11" rx="2" stroke={color} strokeWidth="1.5"/></svg>,
    "phone": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><rect x="5" y="2" width="10" height="16" rx="2" stroke={color} strokeWidth="1.5"/><path d="M9 15H11" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>,
    "graduation-cap": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M2 8L10 4L18 8L10 12L2 8Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/><path d="M6 10V14C6 14 8 16 10 16C12 16 14 14 14 14V10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>,
    "tag": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M3 10L10 3L17 10L10 17L3 10Z" stroke={color} strokeWidth="1.5"/><circle cx="10" cy="10" r="1.5" fill={color}/></svg>,
    "home": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M3 10L10 3L17 10V17H12V13H8V17H3V10Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/></svg>,
    "shopping-cart": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><circle cx="8" cy="17" r="1" fill={color}/><circle cx="15" cy="17" r="1" fill={color}/><path d="M1 1H4L6 13H16L18 5H5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    "heart": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M10 17L3 10C1 8 1 5 3 3C5 1 8 1 10 3C12 1 15 1 17 3C19 5 19 8 17 10L10 17Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/></svg>,
    "star": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/></svg>,
    "mail": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="12" rx="2" stroke={color} strokeWidth="1.5"/><path d="M2 6L10 11L18 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    "calendar": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="14" rx="2" stroke={color} strokeWidth="1.5"/><path d="M3 8H17" stroke={color} strokeWidth="1.5"/><path d="M7 2V6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M13 2V6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>,
    "book": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M4 3H16V17H4V3Z" stroke={color} strokeWidth="1.5"/><path d="M10 3V17" stroke={color} strokeWidth="1.5"/><path d="M4 10H16" stroke={color} strokeWidth="1.5"/></svg>,
    "camera": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2" stroke={color} strokeWidth="1.5"/><circle cx="10" cy="11" r="3" stroke={color} strokeWidth="1.5"/><path d="M7 5L8 3H12L13 5" stroke={color} strokeWidth="1.5"/></svg>,
    "music": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M7 15V5L16 3V13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><circle cx="5" cy="15" r="2" stroke={color} strokeWidth="1.5"/><circle cx="14" cy="13" r="2" stroke={color} strokeWidth="1.5"/></svg>,
    "palette": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.5"/><circle cx="7" cy="8" r="1" fill={color}/><circle cx="10" cy="6" r="1" fill={color}/><circle cx="13" cy="8" r="1" fill={color}/><circle cx="8" cy="12" r="1" fill={color}/></svg>,
    "code": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M7 6L3 10L7 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 6L17 10L13 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    "coffee": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M4 8H14" stroke={color} strokeWidth="1.5"/><path d="M4 8V15C4 16.1046 4.89543 17 6 17H12C13.1046 17 14 16.1046 14 15V8" stroke={color} strokeWidth="1.5"/><path d="M14 10H15C16.1046 10 17 10.8954 17 12C17 13.1046 16.1046 14 15 14H14" stroke={color} strokeWidth="1.5"/><path d="M7 4V6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M11 4V6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>,
    "gift": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><rect x="3" y="8" width="14" height="10" rx="1" stroke={color} strokeWidth="1.5"/><path d="M3 8H17V11H3V8Z" stroke={color} strokeWidth="1.5"/><path d="M10 8V18" stroke={color} strokeWidth="1.5"/><path d="M10 8C10 6 8 4 6 4C4 4 3 5 3 6C3 7 4 8 6 8H10Z" stroke={color} strokeWidth="1.5"/><path d="M10 8C10 6 12 4 14 4C16 4 17 5 17 6C17 7 16 8 14 8H10Z" stroke={color} strokeWidth="1.5"/></svg>,
    "car": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M3 12L5 6H15L17 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="2" y="12" width="16" height="4" rx="1" stroke={color} strokeWidth="1.5"/><circle cx="6" cy="14" r="1" fill={color}/><circle cx="14" cy="14" r="1" fill={color}/></svg>,
    "plane": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M2 10L10 2L18 10L14 11L10 18L6 11L2 10Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/></svg>,
    "rocket": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M10 18V12M10 2C10 2 16 4 16 10C16 10 16 12 14 14L10 18L6 14C4 12 4 10 4 10C4 4 10 2 10 2Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="8" r="1.5" fill={color}/></svg>,
    "trophy": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M6 3H14V9C14 11.2091 12.2091 13 10 13C7.79086 13 6 11.2091 6 9V3Z" stroke={color} strokeWidth="1.5"/><path d="M10 13V16" stroke={color} strokeWidth="1.5"/><path d="M7 16H13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M6 5H4C3.44772 5 3 5.44772 3 6V7C3 7.55228 3.44772 8 4 8H6" stroke={color} strokeWidth="1.5"/><path d="M14 5H16C16.5523 5 17 5.44772 17 6V7C17 7.55228 16.5523 8 16 8H14" stroke={color} strokeWidth="1.5"/></svg>,
    "umbrella": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M10 3V18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M2 10C2 6 6 3 10 3C14 3 18 6 18 10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M10 15V17C10 17.5523 10.4477 18 11 18C11.5523 18 12 17.5523 12 17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>,
    "sun": <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="4" stroke={color} strokeWidth="1.5"/><path d="M10 2V4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M10 16V18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M18 10H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M4 10H2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M15.5 4.5L14 6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M6 14L4.5 15.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M15.5 15.5L14 14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M6 6L4.5 4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  };

  return iconMap[name] || iconMap["folder"];
};

/* ------- Task Card Component for Category View ------- */
interface TaskCardProps {
  task: TaskDTO;
  onComplete: (taskId: number) => void;
  isOverdue: boolean;
}

/* ===== PDF Preview Component ===== */
const PdfPreview: React.FC<{ filePath: string }> = ({ filePath: _filePath }) => {
  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f3f4f6",
      borderRadius: "8px",
    }}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#6b7280"
        strokeWidth="2"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <span style={{ fontSize: "11px", color: "#3b82f6", marginTop: "4px", fontWeight: 600 }}>PDF</span>
    </div>
  );
};

/* ===== File Icon Component ===== */
const FileIconSvg: React.FC = () => (
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

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, isOverdue }) => {
  // Priority border colors - matching TodayPage
  const priorityBorderColors: Record<string, string> = {
    high: "#ef4444",
    medium: "#f59e0b",
    low: "#22c55e",
  };

  const borderColor = priorityBorderColors[task.priority] || "#e5e7eb";

  // Helper functions for file preview
  const getFileUrl = (filePath: string) => {
    const parts = filePath.split('/');
    const filename = parts[parts.length - 1];
    return `http://localhost:3000/uploads/${filename}`;
  };

  const isImageFile = (mimeType: string) => {
    return mimeType.startsWith("image/");
  };

  const isPdfFile = (mimeType: string) => {
    return mimeType === "application/pdf";
  };

  return (
    <div
      className="task-item"
      style={{ 
        position: "relative",
        border: `1px solid ${borderColor}`,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: "8px",
        padding: "12px",
        marginBottom: "12px",
        backgroundColor: isOverdue ? "#fef2f2" : "#fff",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
      }}
    >
      {/* Checkbox */}
      <button
        className="task-checkbox"
        aria-label="Complete task"
        onClick={() => onComplete(task.id)}
        style={{
          borderColor: borderColor,
        }}
      />
      
      {/* Content */}
      <div className="task-content" style={{ paddingBottom: "16px" }}>
        {/* TASK HEADER: Title di kiri, Project/Priority di kanan */}
        <div className="task-header">
          <div className="task-title">{task.title}</div>
          <div className="task-meta-top" style={{ gap: "8px", flexWrap: "nowrap" }}>
            {task.projectName && (
              <span className="task-project">{task.projectName}</span>
            )}
            <span className="task-owner">
              {task.ownerName ? `By ${task.ownerName}` : "My own task"}
            </span>
            <span className={`task-priority task-priority--${task.priority}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          </div>
        </div>

        {/* FILES PREVIEW */}
        {task.files && task.files.length > 0 && (
          <div className="task-files">
            {task.files.map((file) => (
              <div key={file.id} className="task-file-item">
                {isImageFile(file.mime_type) ? (
                  <div className="task-file-image-wrapper">
                    <a
                      href={getFileUrl(file.file_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="task-file-image-link"
                    >
                      <img
                        src={getFileUrl(file.file_path)}
                        alt={file.original_name}
                        className="task-file-image"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </a>
                    <span className="task-file-image-name">{file.original_name}</span>
                  </div>
                ) : isPdfFile(file.mime_type) ? (
                  <div className="task-file-pdf-wrapper">
                    <a
                      href={getFileUrl(file.file_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="task-file-pdf-link"
                    >
                      <PdfPreview filePath={getFileUrl(file.file_path)} />
                    </a>
                    <span className="task-file-pdf-name">{file.original_name}</span>
                  </div>
                ) : (
                  <a
                    href={getFileUrl(file.file_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="task-file-link"
                  >
                    <FileIconSvg />
                    <span className="task-file-name">{file.original_name}</span>
                    <span className="task-file-size">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* DESCRIPTION */}
        {task.description && (
          <div className="task-description">{task.description}</div>
        )}
      </div>
    </div>
  );
};

/* ------- Layout utama ------- */

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const todayNumber = new Date().getDate();

  const [user, setUser] = useState<CurrentUser | null>(null);

  // summary untuk badge di sidebar
  const [sidebarSummary, setSidebarSummary] =
    useState<SidebarSummaryResponse | null>(null);

  // Search modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TaskDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);
  const [selectedTaskClosing, setSelectedTaskClosing] = useState(false);

  // Add Task modal state
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddTaskClosing, setIsAddTaskClosing] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateSource, setDateSource] = useState<"today" | "tomorrow" | "nextWeek" | "nextWeekend" | "manual" | null>(null);
  const [dateInput, setDateInput] = useState<string>("");
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [priority, setPriority] = useState<"high" | "medium" | "low" | null>(null);
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isDraggingOverDropzone, setIsDraggingOverDropzone] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories state
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  
  // Create Category Modal state
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isCreateCategoryModalClosing, setIsCreateCategoryModalClosing] = useState(false);
  const [categoryNameInput, setCategoryNameInput] = useState("");
  const [selectedColor, setSelectedColor] = useState("#6b7280");
  const [selectedIcon, setSelectedIcon] = useState("folder");

  // Category tasks view state
  const [categoryTasksView, setCategoryTasksView] = useState<CategoryTasksView | null>(null);
  const [isLoadingCategoryTasks, setIsLoadingCategoryTasks] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  // Base dates untuk date picker
  const todayBase = startOfDay(new Date());
  const tomorrowDate = new Date(todayBase.getTime() + 24 * 60 * 60 * 1000);
  const nextWeekDate = new Date(todayBase.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextWeekendDate = (() => {
    const dayOfWeek = todayBase.getDay();
    const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
    return new Date(todayBase.getTime() + (daysUntilSaturday + 7) * 24 * 60 * 60 * 1000);
  })();

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [u, summary, cats] = await Promise.all([
          getCurrentUser(),
          getSidebarSummary().catch((err) => {
            console.error("Failed to load sidebar summary", err);
            return null as SidebarSummaryResponse | null;
          }),
          getCategories().catch((err) => {
            console.error("Failed to load categories", err);
            return [] as CategoryDTO[];
          }),
        ]);
        setUser(u);
        setSidebarSummary(summary);
        setCategories(cats);
        
        // Set default category to first one (usually "Home")
        if (cats.length > 0) {
          setSelectedCategoryId(cats[0].id);
        }
        
        // Simpan user data ke localStorage agar bisa diakses di komponen lain
        localStorage.setItem("user", JSON.stringify(u));
        localStorage.setItem("user_id", u.id.toString());
      } catch (err) {
        console.error("Failed to load current user", err);
        // kalau mau: navigate("/signin");
      }
    };

    loadAll();

    // Listen for task updates from child components
    const handleTaskUpdate = () => {
      Promise.all([
        getSidebarSummary(),
        getCategories(),
      ])
        .then(([summary, cats]) => {
          setSidebarSummary(summary);
          setCategories(cats);
        })
        .catch((err) => console.error("Failed to refresh sidebar data", err));
    };

    window.addEventListener("task-updated", handleTaskUpdate);
    return () => window.removeEventListener("task-updated", handleTaskUpdate);
  }, []);

  // Search handler with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const result = await searchTasks(searchQuery);
        setSearchResults(result.results);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        handleOpenSearch();
      }
      // ESC to close search
      if (e.key === "Escape" && isSearchOpen) {
        handleCloseSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleOpenTaskDetail = (task: TaskDTO) => {
    setSelectedTask(task);
    setSelectedTaskClosing(false);
  };

  const handleCloseTaskDetail = () => {
    setSelectedTaskClosing(true);
    setTimeout(() => {
      setSelectedTask(null);
      setSelectedTaskClosing(false);
    }, 200);
  };

  const handleMarkAsComplete = async (taskId: number) => {
    try {
      await markTaskAsComplete(taskId);
      // Refresh search results
      if (searchQuery.trim()) {
        const result = await searchTasks(searchQuery);
        setSearchResults(result.results);
      }
      // Close detail modal
      setSelectedTask(null);
      // Trigger sidebar update
      window.dispatchEvent(new Event("task-updated"));
    } catch (error) {
      console.error("Failed to mark task as complete:", error);
    }
  };

  // Add Task modal handlers
  const handleOpenAddTask = () => {
    setIsAddTaskOpen(true);
  };

  const handleCloseAddTask = () => {
    setIsAddTaskClosing(true);
    setTimeout(() => {
      setIsAddTaskOpen(false);
      setIsAddTaskClosing(false);
      resetAddTaskForm();
    }, 300);
  };

  const resetAddTaskForm = () => {
    setNewTitle("");
    setNewDescription("");
    setSelectedDate(null);
    setDateSource(null);
    setDateInput("");
    setIsDateOpen(false);
    setPriority(null);
    setVisibility("private");
    setFilesToUpload([]);
    setIsDraggingOverDropzone(false);
    setIsCategoryOpen(false);
    setIsAddingCategory(false);
    setNewCategoryName("");
    // Reset to first category (usually Home)
    if (categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
  };

  // Date picker handlers
  const toggleDateOpen = () => {
    setIsDateOpen((prev) => !prev);
    setIsPriorityOpen(false);
    setIsVisibilityOpen(false);
  };

  const pickQuickDate = (
    date: Date,
    source: "today" | "tomorrow" | "nextWeek" | "nextWeekend"
  ) => {
    const normalized = startOfDay(date);
    setSelectedDate(normalized);
    setDateSource(source);
    setDateInput(toInputDateValue(normalized));
    setIsDateOpen(false);
  };

  const handlePickToday = () => pickQuickDate(todayBase, "today");
  const handlePickTomorrow = () => pickQuickDate(tomorrowDate, "tomorrow");
  const handlePickNextWeek = () => pickQuickDate(nextWeekDate, "nextWeek");
  const handlePickNextWeekend = () => pickQuickDate(nextWeekendDate, "nextWeekend");

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateInput(value);

    if (!value) {
      setSelectedDate(null);
      setDateSource(null);
      return;
    }

    const parsed = new Date(value + "T00:00:00");
    if (!isNaN(parsed.getTime())) {
      setSelectedDate(startOfDay(parsed));
      setDateSource("manual");
    }
  };

  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(null);
    setDateSource(null);
    setDateInput("");
  };

  // Date chip className
  const getDateChipClassName = () => {
    let chipVariant = "";
    if (selectedDate) {
      const diffDaysChip =
        (startOfDay(selectedDate).getTime() - todayBase.getTime()) /
        (24 * 60 * 60 * 1000);

      if (dateSource === "today") {
        chipVariant = "today-chip-date--today";
      } else if (dateSource === "tomorrow") {
        chipVariant = "today-chip-date--tomorrow";
      } else if (diffDaysChip > 1 && diffDaysChip <= 7) {
        chipVariant = "today-chip-date--weekday";
      } else {
        chipVariant = "today-chip-date--date";
      }
    }

    return [
      "today-chip",
      "today-chip-date",
      chipVariant,
      isDateOpen ? "today-chip-date--open" : "",
    ]
      .filter(Boolean)
      .join(" ");
  };

  const handleSubmitAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedDate) return;

    try {
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

      handleCloseAddTask();
      window.dispatchEvent(new Event("task-updated"));
    } catch (err) {
      console.error("Failed to create task", err);
    }
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

  // Create Category Modal handlers
  const handleOpenCreateCategoryModal = () => {
    setCategoryNameInput("");
    setSelectedColor("#6b7280");
    setSelectedIcon("folder");
    setIsCreateCategoryModalOpen(true);
  };

  const handleCloseCreateCategoryModal = () => {
    setIsCreateCategoryModalClosing(true);
    setTimeout(() => {
      setIsCreateCategoryModalOpen(false);
      setIsCreateCategoryModalClosing(false);
      setCategoryNameInput("");
      setSelectedColor("#6b7280");
      setSelectedIcon("folder");
    }, 300);
  };

  const handleSubmitCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = categoryNameInput.trim();
    if (!trimmedName) return;

    try {
      const newCat = await createCategory(trimmedName, selectedColor, selectedIcon);
      setCategories([...categories, newCat]);
      handleCloseCreateCategoryModal();
      window.dispatchEvent(new Event("task-updated"));
    } catch (err: any) {
      console.error("Failed to create category", err);
      
      // Extract error message from response
      let errorMessage = "Failed to create category.";
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    }
  };

  // Category click handler - load tasks for that category
  const handleCategoryClick = async (categoryId: number) => {
    setActiveCategoryId(categoryId);
    setIsLoadingCategoryTasks(true);
    
    try {
      const response = await getTasksByCategory(categoryId);
      setCategoryTasksView({
        categoryId,
        categoryName: response.categoryName,
        categoryColor: response.categoryColor,
        categoryIcon: response.categoryIcon,
        tasks: response.tasks,
        overdue: response.overdue,
      });
    } catch (err) {
      console.error("Failed to load category tasks", err);
      setCategoryTasksView(null);
    } finally {
      setIsLoadingCategoryTasks(false);
    }
  };

  // Clear category view when navigating away
  const handleNavClick = (to: string) => () => {
    setActiveCategoryId(null);
    setCategoryTasksView(null);
    navigate(to);
  };

  // Handle task completion in category view
  const handleCategoryTaskComplete = async (taskId: number) => {
    // Play bell sound
    playBellKlinkSound();
    
    try {
      await markTaskAsComplete(taskId);
      // Refresh category tasks
      if (activeCategoryId) {
        const response = await getTasksByCategory(activeCategoryId);
        setCategoryTasksView({
          categoryId: activeCategoryId,
          categoryName: response.categoryName,
          categoryColor: response.categoryColor,
          categoryIcon: response.categoryIcon,
          tasks: response.tasks,
          overdue: response.overdue,
        });
      }
      // Refresh sidebar summary
      const summary = await getSidebarSummary();
      setSidebarSummary(summary);
      window.dispatchEvent(new Event("task-updated"));
    } catch (err) {
      console.error("Failed to complete task", err);
    }
  };

  const path = location.pathname;
  const isToday = path === "/today";
  const isUpcoming = path === "/upcoming";
  const isCompleted = path === "/completed";

  const avatarInitial = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : "?";

  const todayCount = sidebarSummary?.todayCount ?? 0;
  const upcomingCount = sidebarSummary?.upcomingCount ?? 0;
  const completedCount = sidebarSummary?.completedCount ?? 0;
  const sidebarCategories = sidebarSummary?.categories ?? [];

  return (
    <div className="home-page">
      {/* SIDEBAR */}
      <aside className="home-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-avatar">{avatarInitial}</div>
          <div className="sidebar-user">
            <div className="sidebar-user-name">
              {user?.name ?? "Loading..."}
            </div>
            <div className="sidebar-user-email">{user?.email ?? ""}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="sidebar-nav-item sidebar-nav-add" onClick={handleOpenAddTask}>
            <span className="sidebar-icon">
              <AddIcon />
            </span>
            <span className="sidebar-label">Add task</span>
          </button>

          <button className="sidebar-nav-item" onClick={handleOpenSearch}>
            <span className="sidebar-icon">
              <SearchIcon />
            </span>
            <span className="sidebar-label">Search</span>
            <span className="sidebar-shortcut">⌘K</span>
          </button>

          {/* TODAY */}
          <button
            className={`sidebar-nav-item ${isToday && !activeCategoryId ? "sidebar-nav-active" : ""}`}
            onClick={handleNavClick("/today")}
          >
            <span className="sidebar-icon">
              <TodayIcon day={todayNumber} />
            </span>
            <span className="sidebar-label">Today</span>
            {todayCount > 0 && (
              <span className="sidebar-badge badge">{todayCount}</span>
            )}
          </button>

          {/* UPCOMING */}
          <button
            className={`sidebar-nav-item ${
              isUpcoming && !activeCategoryId ? "sidebar-nav-active" : ""
            }`}
            onClick={handleNavClick("/upcoming")}
          >
            <span className="sidebar-icon">
              <UpcomingIcon />
            </span>
            <span className="sidebar-label">Upcoming</span>
            {upcomingCount > 0 && (
              <span className="sidebar-badge badge">{upcomingCount}</span>
            )}
          </button>

          {/* COMPLETED */}
          <button
            className={`sidebar-nav-item ${
              isCompleted && !activeCategoryId ? "sidebar-nav-active" : ""
            }`}
            onClick={handleNavClick("/completed")}
          >
            <span className="sidebar-icon">
              <CompletedIcon />
            </span>
            <span className="sidebar-label">Completed</span>
            {completedCount > 0 && (
              <span className="sidebar-badge badge">{completedCount}</span>
            )}
          </button>
        </nav>

        {/* SECTION CATEGORIES */}
        <div className="sidebar-section-title">Categories</div>
        <div className="sidebar-projects">
          {categories.map((cat) => {
            const catColor = cat.color || '#6b7280';
            const isActive = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                className={`sidebar-project-item ${isActive ? "sidebar-project-active" : ""}`}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                style={{
                  backgroundColor: isActive ? `${catColor}40` : `${catColor}20`,
                  borderLeft: `3px solid ${catColor}`,
                }}
              >
                <span className="sidebar-icon">
                  <CategoryIcon name={cat.icon || 'folder'} color={catColor} size={18} />
                </span>
                <span className="sidebar-label">{cat.name}</span>
              </button>
            );
          })}
          
          <button
            className="sidebar-project-item"
            onClick={handleOpenCreateCategoryModal}
            style={{ color: "#6b7280", fontStyle: "italic" }}
          >
            <span className="sidebar-icon">+</span>
            <span className="sidebar-label">Add category</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="home-main">
        {categoryTasksView && activeCategoryId ? (
          <div style={{ padding: "20px" }}>
            {/* Category Header */}
            <div style={{ 
              display: "flex", 
              alignItems: "baseline", 
              gap: "12px",
              marginBottom: "24px" 
            }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <CategoryIcon 
                  name={categoryTasksView.categoryIcon} 
                  color={categoryTasksView.categoryColor} 
                  size={28} 
                />
              </div>
              <h1 style={{ 
                fontSize: "24px", 
                fontWeight: "600",
                color: "#1f2937",
                margin: 0
              }}>
                {categoryTasksView.categoryName}
              </h1>
              <span style={{
                backgroundColor: categoryTasksView.categoryColor,
                color: "#fff",
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: "500"
              }}>
                {categoryTasksView.tasks.length + categoryTasksView.overdue.length} tasks
              </span>
            </div>

            {isLoadingCategoryTasks ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                Loading tasks...
              </div>
            ) : (
              <>
                {/* Overdue Section */}
                {categoryTasksView.overdue.length > 0 && (
                  <div style={{ marginBottom: "24px" }}>
                    <h2 style={{ 
                      fontSize: "14px", 
                      fontWeight: "600", 
                      color: "#ef4444",
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <span style={{ 
                        width: "8px", 
                        height: "8px", 
                        borderRadius: "50%", 
                        backgroundColor: "#ef4444" 
                      }}></span>
                      Overdue
                    </h2>
                    {categoryTasksView.overdue.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleCategoryTaskComplete}
                        isOverdue={true}
                      />
                    ))}
                  </div>
                )}

                {/* Today/Upcoming Tasks Section */}
                {categoryTasksView.tasks.length > 0 ? (
                  <div>
                    <h2 style={{ 
                      fontSize: "14px", 
                      fontWeight: "600", 
                      color: "#374151",
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <span style={{ 
                        width: "8px", 
                        height: "8px", 
                        borderRadius: "50%", 
                        backgroundColor: categoryTasksView.categoryColor 
                      }}></span>
                      Tasks
                    </h2>
                    {categoryTasksView.tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleCategoryTaskComplete}
                        isOverdue={false}
                      />
                    ))}
                  </div>
                ) : (
                  categoryTasksView.overdue.length === 0 && (
                    <div className="today-empty">
                      <div className="today-empty-illustration">
                        <Lottie animationData={loveIsBlind} loop autoplay />
                      </div>
                      <h2 className="today-empty-title">
                        No pending tasks in {categoryTasksView.categoryName}
                      </h2>
                      <p className="today-empty-text">
                        All tasks in this category are complete. Great job!
                      </p>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      {/* SEARCH MODAL */}
      {isSearchOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            zIndex: 2000,
            paddingTop: "10vh",
          }}
          onClick={handleCloseSearch}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              maxWidth: "640px",
              width: "90%",
              maxHeight: "70vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <SearchIcon />
              <input
                type="text"
                placeholder="Search or type a command..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: "15px",
                  color: "#1f2937",
                }}
              />
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>ESC</span>
            </div>

            {/* Search Results */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "8px",
              }}
            >
              {isSearching && (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#9ca3af" }}>
                  Searching...
                </div>
              )}

              {!isSearching && searchQuery.trim() === "" && (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#9ca3af" }}>
                  Start typing to search tasks...
                </div>
              )}

              {!isSearching && searchQuery.trim() !== "" && searchResults.length === 0 && (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#9ca3af" }}>
                  No tasks found for "{searchQuery}"
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {searchResults.map((task) => {
                    const priorityColors = {
                      high: { bg: "#fee2e2", border: "#fca5a5" },
                      medium: { bg: "#fef3c7", border: "#fcd34d" },
                      low: { bg: "#dbeafe", border: "#93c5fd" },
                    };
                    const colors = priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.low;
                    
                    // Check if task belongs to current user
                    const currentUserId = Number(localStorage.getItem("user_id"));
                    const isOwnTask = task.userId === currentUserId;
                    
                    return (
                      <button
                        key={task.id}
                        onClick={() => {
                          handleOpenTaskDetail(task);
                          handleCloseSearch();
                        }}
                        style={{
                          padding: "12px 14px",
                          border: `1px solid ${colors.border}`,
                          background: colors.bg,
                          borderRadius: "8px",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {/* Title */}
                          <div style={{ fontSize: "15px", color: "#111827", fontWeight: 700, lineHeight: "1.4" }}>
                            {task.title}
                          </div>
                          
                          {/* Metadata row with Owner */}
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            {/* Owner Name - ALWAYS SHOW */}
                            {task.user && (
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  padding: "3px 10px",
                                  borderRadius: "4px",
                                  background: isOwnTask ? "#e0e7ff" : "#f3f4f6",
                                  color: isOwnTask ? "#4338ca" : "#6b7280",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                                {isOwnTask ? "You" : task.user.name}
                              </span>
                            )}
                            
                            {/* Public badge for public tasks */}
                            {task.visibility === "public" && !isOwnTask && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  background: "#e0f2fe",
                                  color: "#0369a1",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="2" y1="12" x2="22" y2="12" />
                                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                </svg>
                                Public
                              </span>
                            )}
                            
                            {/* Due date */}
                            {task.due_date && (
                              <span style={{ fontSize: "12px", color: "#4b5563", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                            
                            {/* Status badge */}
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "3px 8px",
                                borderRadius: "4px",
                                background: task.status === "complete" ? "#d1fae5" : "#dbeafe",
                                color: task.status === "complete" ? "#065f46" : "#1e40af",
                              }}
                            >
                              {task.status === "complete" ? "Completed" : "Pending"}
                            </span>
                            
                            {/* Priority badge */}
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "3px 8px",
                                borderRadius: "4px",
                                background:
                                  task.priority === "high"
                                    ? "#fee2e2"
                                    : task.priority === "medium"
                                    ? "#fef3c7"
                                    : "#dbeafe",
                                color:
                                  task.priority === "high"
                                    ? "#dc2626"
                                    : task.priority === "medium"
                                    ? "#d97706"
                                    : "#2563eb",
                              }}
                            >
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                            
                            {/* Category */}
                            {task.category && (
                              <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>
                                {task.category.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {isAddTaskOpen && (
        <div
          className={`modal-backdrop${isAddTaskClosing ? " closing" : ""}`}
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
          onClick={handleCloseAddTask}
        >
          <div
            className={`modal-content${isAddTaskClosing ? " closing" : ""}`}
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
              onClick={handleCloseAddTask}
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

            <form onSubmit={handleSubmitAddTask} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                {/* Drag & drop area */}
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
                {/* DATE chip */}
                <div className="today-date-chip-wrapper">
                  <button
                    type="button"
                    className={getDateChipClassName()}
                    onClick={toggleDateOpen}
                  >
                    <span className="today-chip-icon">
                      <CalendarIcon />
                    </span>
                    <span className="today-chip-label">
                      {formatDateChipLabel(selectedDate, dateSource, todayBase)}
                    </span>
                    {selectedDate && (
                      <span
                        className="today-chip-clear"
                        onClick={handleClearDate}
                        role="button"
                        aria-label="Clear due date"
                      >
                        ×
                      </span>
                    )}
                  </button>

                  {isDateOpen && (
                    <div className="date-popover">
                      <div className="date-quick-list">
                        <button
                          type="button"
                          className="date-quick-item"
                          onClick={handlePickToday}
                        >
                          <span>Today</span>
                          <span className="date-quick-right">
                            {formatWeekdayShort(todayBase)}
                          </span>
                        </button>

                        <button
                          type="button"
                          className="date-quick-item"
                          onClick={handlePickTomorrow}
                        >
                          <span>Tomorrow</span>
                          <span className="date-quick-right">
                            {formatWeekdayShort(tomorrowDate)}
                          </span>
                        </button>

                        <button
                          type="button"
                          className="date-quick-item"
                          onClick={handlePickNextWeek}
                        >
                          <span>Next week</span>
                          <span className="date-quick-right">
                            {`${formatWeekdayShort(nextWeekDate)}, ${formatDayMonthShort(nextWeekDate)}`}
                          </span>
                        </button>

                        <button
                          type="button"
                          className="date-quick-item"
                          onClick={handlePickNextWeekend}
                        >
                          <span>Next weekend</span>
                          <span className="date-quick-right">
                            {`${formatWeekdayShort(nextWeekendDate)}, ${formatDayMonthShort(nextWeekendDate)}`}
                          </span>
                        </button>
                      </div>

                      <div className="date-input-row">
                        <input
                          type="date"
                          className="date-input"
                          value={dateInput}
                          onChange={handleDateInputChange}
                        />
                      </div>
                    </div>
                  )}
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
                      setIsDateOpen(false);
                    }}
                  >
                    <span className="today-add-project-icon">
                      <CategoryIcon 
                        name={categories.find(c => c.id === selectedCategoryId)?.icon || 'folder'} 
                        color={categories.find(c => c.id === selectedCategoryId)?.color || '#6b7280'} 
                        size={14} 
                      />
                    </span>
                    <span className="today-add-project-label">
                      {categories.find(c => c.id === selectedCategoryId)?.name ?? "Home"}
                    </span>
                    <span className="today-add-project-caret">▾</span>
                  </button>

                  {isCategoryOpen && (
                    <div className="priority-popover" style={{ bottom: "100%", top: "auto", marginBottom: "4px" }}>
                      <div className="priority-list">
                        {categories.map((cat) => {
                          const isActive = selectedCategoryId === cat.id;
                          const catColor = cat.color || '#6b7280';
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              className="priority-item"
                              onClick={() => {
                                setSelectedCategoryId(cat.id);
                                setIsCategoryOpen(false);
                              }}
                              style={{
                                backgroundColor: isActive ? `${catColor}15` : undefined,
                                borderLeft: isActive ? `3px solid ${catColor}` : '3px solid transparent',
                              }}
                            >
                              <span className="priority-item-left">
                                <CategoryIcon name={cat.icon || 'folder'} color={catColor} size={16} />
                                <span>{cat.name}</span>
                              </span>
                              {isActive && (
                                <span style={{ marginLeft: "auto", color: catColor }}>✓</span>
                              )}
                            </button>
                          );
                        })}
                        
                        <div style={{ borderTop: "1px solid #e5e7eb", margin: "4px 0" }} />
                        
                        {isAddingCategory ? (
                          <div style={{ padding: "8px" }}>
                            <input
                              type="text"
                              placeholder="New category"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onKeyDown={async (e) => {
                                if (e.key === "Enter" && newCategoryName.trim()) {
                                  e.preventDefault();
                                  try {
                                    const newCat = await createCategory(newCategoryName.trim());
                                    setCategories([...categories, newCat]);
                                    setSelectedCategoryId(newCat.id);
                                    setNewCategoryName("");
                                    setIsAddingCategory(false);
                                    setIsCategoryOpen(false);
                                    window.dispatchEvent(new Event("task-updated"));
                                  } catch (err) {
                                    console.error("Failed to create category", err);
                                    alert("Failed to create category. Name might already exist.");
                                  }
                                } else if (e.key === "Escape") {
                                  setNewCategoryName("");
                                  setIsAddingCategory(false);
                                }
                              }}
                              autoFocus
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                fontSize: "13px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                              }}
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="priority-item"
                            onClick={() => setIsAddingCategory(true)}
                            style={{ color: "#6b7280", fontStyle: "italic" }}
                          >
                            <span className="priority-item-left">
                              <span>+ Add category</span>
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="today-add-actions">
                  <button
                    type="button"
                    className="today-btn-cancel"
                    onClick={handleCloseAddTask}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="today-btn-add" disabled={!newTitle.trim() || !selectedDate}>
                    Add task
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {isCreateCategoryModalOpen && (
        <div
          className={`modal-backdrop${isCreateCategoryModalClosing ? " closing" : ""}`}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            zIndex: 999,
          }}
          onClick={handleCloseCreateCategoryModal}
        >
          <div
            className={`modal-content${isCreateCategoryModalClosing ? " closing" : ""}`}
            style={{
              backgroundColor: "white",
              width: "450px",
              height: "100vh",
              overflow: "auto",
              padding: "24px",
              position: "relative",
              boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleCloseCreateCategoryModal}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
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

            <form onSubmit={handleSubmitCreateCategory} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h2 style={{ margin: "0", fontSize: "20px", color: "#1f2937", fontWeight: "600" }}>
                Create Category
              </h2>

              {/* Category Name Input */}
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: "#6b7280", fontWeight: "500" }}>
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryNameInput}
                  onChange={(e) => setCategoryNameInput(e.target.value)}
                  placeholder="Enter category name..."
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    color: "#1f2937",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                  }}
                />
              </div>

              {/* Color Picker */}
              <div>
                <label style={{ display: "block", marginBottom: "12px", fontSize: "13px", color: "#6b7280", fontWeight: "500" }}>
                  Color
                </label>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: color,
                        border: selectedColor === color ? "3px solid #3b82f6" : color === "#FFFFFF" ? "2px solid #e5e7eb" : "2px solid transparent",
                        cursor: "pointer",
                        transition: "transform 0.15s, border 0.15s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label style={{ display: "block", marginBottom: "12px", fontSize: "13px", color: "#6b7280", fontWeight: "500" }}>
                  Icon
                </label>
                <div 
                  style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(6, 1fr)", 
                    gap: "8px",
                    maxHeight: "320px",
                    overflowY: "auto",
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  {AVAILABLE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedIcon(icon)}
                      style={{
                        padding: "12px",
                        backgroundColor: selectedIcon === icon ? "#dbeafe" : "white",
                        border: selectedIcon === icon ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedIcon !== icon) {
                          e.currentTarget.style.backgroundColor = "#f3f4f6";
                          e.currentTarget.style.borderColor = "#d1d5db";
                        }
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        if (selectedIcon !== icon) {
                          e.currentTarget.style.backgroundColor = "white";
                          e.currentTarget.style.borderColor = "#e5e7eb";
                        }
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      title={icon}
                    >
                      <CategoryIcon name={icon} color={selectedIcon === icon ? "#3b82f6" : "#6b7280"} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={handleCloseCreateCategoryModal}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    color: "#6b7280",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!categoryNameInput.trim()}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: categoryNameInput.trim() ? "#3b82f6" : "#e5e7eb",
                    border: "none",
                    borderRadius: "6px",
                    color: categoryNameInput.trim() ? "#fff" : "#9ca3af",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: categoryNameInput.trim() ? "pointer" : "not-allowed",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (categoryNameInput.trim()) {
                      e.currentTarget.style.backgroundColor = "#2563eb";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (categoryNameInput.trim()) {
                      e.currentTarget.style.backgroundColor = "#3b82f6";
                    }
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAIL MODAL */}
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
            zIndex: 2001,
          }}
          onClick={handleCloseTaskDetail}
        >
          <div
            className={`modal-content${selectedTaskClosing ? " closing" : ""}`}
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              maxWidth: "700px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
              padding: "24px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleCloseTaskDetail}
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

            {/* Task Title */}
            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px", color: "#1f2937", paddingRight: "32px" }}>
              {selectedTask.title}
            </h2>

            {/* Status Badge */}
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                background: selectedTask.status === "complete" ? "#d1fae5" : "#dbeafe",
                color: selectedTask.status === "complete" ? "#065f46" : "#1e40af",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "6px",
                marginBottom: "16px",
              }}
            >
              {selectedTask.status === "complete" ? "✓ Completed" : "○ Pending"}
            </div>

            {/* Task Meta Info */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px", fontSize: "13px", flexWrap: "wrap" }}>
              {selectedTask.due_date && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{new Date(selectedTask.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={selectedTask.priority === "high" ? "#ef4444" : selectedTask.priority === "medium" ? "#eab308" : "#22c55e"} strokeWidth="2">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                <span>{selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)}</span>
              </div>
              {selectedTask.user && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>{selectedTask.user.name}</span>
                </div>
              )}
            </div>

            {/* Task Description */}
            {selectedTask.description && (
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>Description</h3>
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
                      href={`http://localhost:3000/${file.file_path}`}
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                        <polyline points="13 2 13 9 20 9" />
                      </svg>
                      {file.original_name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Mark as Complete Button (only if pending) */}
            {selectedTask.status !== "complete" && (
              <button
                onClick={() => handleMarkAsComplete(selectedTask.id)}
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
