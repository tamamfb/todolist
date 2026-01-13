// client/src/components/TodayPage.tsx
import React, {
  useEffect,
  useState,
  useRef,
  type DragEvent as ReactDragEvent,
} from "react";
import Lottie from "lottie-react";
import * as pdfjsLib from "pdfjs-dist";
import loveIsBlind from "../assets/Loveisblind.json";
import { getTodayTasks, createTask, uploadTaskFiles, markTaskAsComplete, updateTask, deleteTaskFile, getCategories, createCategory as createCategoryAPI, type CategoryDTO as APICategoryDTO } from "../api";
import { playBellKlinkSound } from "../assets/bell-klink";

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Setelah import, sebelum type TaskDTO
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

type TodayResponse = {
  today: TaskDTO[];
  overdue: TaskDTO[];
  total?: number;
};

type PrioritySelection = "high" | "medium" | "low" | null;

// Use CategoryDTO from API
type CategoryDTO = APICategoryDTO;

/* ===== ICON KALENDER KECIL UNTUK CHIP TANGGAL ===== */
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

/* ===== ICON BENDERA KECIL UNTUK PRIORITY ===== */
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

/* ===== ICON JAM KECIL UNTUK REMINDER ===== */
const ClockIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    aria-hidden="true"
    focusable="false"
  >
    <circle
      cx="8"
      cy="8"
      r="6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <path
      d="M8 4.5v3l2 1.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
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

/* ===== ICON LOCK (untuk visibility private) ===== */
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

/* ===== ICON GLOBE (untuk visibility public) ===== */
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

/* ===== ICON FILE (untuk attachment) ===== */
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

const PdfIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <text x="9" y="16" fontSize="8" fontWeight="bold" fill="currentColor">
      PDF
    </text>
  </svg>
);

/* ===== PDF PREVIEW COMPONENT ===== */
const PdfPreview: React.FC<{ filePath: string }> = ({ filePath }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const renderPdf = async () => {
      try {
        setLoading(true);
        setError(false);
        const pdf = await pdfjsLib.getDocument(filePath).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 0.8 });

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext("2d") as CanvasRenderingContext2D;
        if (!context) return;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext as any).promise;

        setLoading(false);
      } catch (err) {
        console.error("Error rendering PDF preview:", err);
        setError(true);
        setLoading(false);
      }
    };

    renderPdf();
  }, [filePath]);

  if (error) {
    return (
      <div className="pdf-preview-container">
        <div className="pdf-preview-error">
          <PdfIcon className="task-file-pdf-icon" />
          <div>PDF</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pdf-preview-container">
        <div className="pdf-preview-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="pdf-preview-container">
      <canvas ref={canvasRef} className="pdf-preview-canvas" />
    </div>
  );
};

const startOfDay = (d: Date): Date => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const addDays = (d: Date, days: number): Date => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
};

// Senin minggu depan
const getNextWeekDate = (today: Date): Date => {
  const day = today.getDay(); // 0 Minggu, 1 Senin, ... 6 Sabtu
  let diff = (1 - day + 7) % 7;
  if (diff === 0) diff = 7; // kalau sudah Senin, ambil Senin depan
  return addDays(today, diff);
};

// Sabtu weekend *berikutnya* (bukan Sabtu minggu ini)
const getNextWeekendDate = (today: Date): Date => {
  const day = today.getDay(); // 0 Minggu ... 6 Sabtu
  let diff = (6 - day + 7) % 7; // jarak ke Sabtu
  if (diff <= 0) diff += 7; // kalau sudah Sabtu/Minggu → Sabtu minggu depan
  return addDays(today, diff);
};

const formatWeekdayShort = (d: Date): string =>
  d.toLocaleDateString(undefined, { weekday: "short" });

const formatDayMonthShort = (d: Date): string =>
  d.toLocaleDateString(undefined, { day: "numeric", month: "short" });

const toInputDateValue = (d: Date): string => {
  // yyyy-mm-dd untuk <input type="date">
  return d.toISOString().slice(0, 10);
};

// Label di chip tanggal (Today / Tomorrow / Sunday / 6 Dec, dst)
const formatChipLabel = (
  selectedDate: Date | null,
  source: "today" | "tomorrow" | "nextWeek" | "nextWeekend" | "manual" | null,
  todayBase: Date
): string => {
  if (!selectedDate) return "Due date";

  if (source === "today") return "Today";
  if (source === "tomorrow") return "Tomorrow";

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

// Label untuk chip Reminders
const formatReminderChipLabel = (dt: Date | null): string => {
  if (!dt) return "Reminders";

  const weekday = dt.toLocaleDateString(undefined, { weekday: "short" });
  const day = dt.toLocaleDateString(undefined, { day: "2-digit" });
  const month = dt.toLocaleDateString(undefined, { month: "short" });
  const time = dt
    .toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(":", ".");

  return `Remind me at ${weekday}, ${day} ${month} ${time}`;
};

const TodayPage: React.FC = () => {
  const [overdue, setOverdue] = useState<TaskDTO[]>([]);
  const [todayTasks, setTodayTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // untuk sapaan di empty state
  const [userName, setUserName] = useState<string>("Tamam");
  const [userId, setUserId] = useState<number | null>(null);

  // state untuk form Add Task
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  
  // State untuk tracking edit mode (bukan create)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  // ===== state Display Filter =====
  const [displayFilter, setDisplayFilter] = useState({
    own: true,
    public: false,
  });
  const [isDisplayFilterOpen, setIsDisplayFilterOpen] = useState(false);

  // ===== state ATTACHMENTS =====
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isDraggingOverDropzone, setIsDraggingOverDropzone] =
    useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [existingFiles, setExistingFiles] = useState<TaskFileDTO[]>([]);

  // ===== state tanggal di Add Task =====
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    startOfDay(new Date())
  );
  const [dateSource, setDateSource] = useState<
    "today" | "tomorrow" | "nextWeek" | "nextWeekend" | "manual" | null
  >("today");
  const [dateInput, setDateInput] = useState<string>(
    toInputDateValue(startOfDay(new Date()))
  );

  // ===== state Priority di Add Task =====
  const [priority, setPriority] = useState<PrioritySelection>(null);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);

  // ===== state Reminders =====
  const [reminderDateTime, setReminderDateTime] = useState<Date | null>(
    null
  );
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isPickingCustomReminder, setIsPickingCustomReminder] =
    useState(false);
  const [customReminderDateInput, setCustomReminderDateInput] = useState(
    () => toInputDateValue(startOfDay(new Date()))
  );
  const [customReminderHour, setCustomReminderHour] = useState("09");
  const [customReminderMinute, setCustomReminderMinute] = useState("00");

  // ===== state Category (Home) =====
  const [categories, setCategories] =
    useState<CategoryDTO[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  // ===== state untuk completing task =====
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<number>>(
    new Set()
  );

  // ===== state Visibility (Private / Public) =====
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.name) setUserName(parsed.name);
        if (parsed?.id) setUserId(parsed.id);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [res, cats] = await Promise.all([
          getTodayTasks() as Promise<TodayResponse>,
          getCategories().catch(() => []),
        ]);

        const todayList = res.today ?? [];
        const overdueList = res.overdue ?? [];

        setTodayTasks(todayList);
        setOverdue(overdueList);
        setCategories(cats);
        
        // Set default category to first one
        if (cats.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(cats[0].id);
        }
      } catch (err) {
        console.error("Failed to load tasks for today", err);
        setError("Failed to load tasks for today.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ===== helper untuk filter tasks berdasarkan display filter ===== */
  const filterTasksByDisplay = (tasks: TaskDTO[]): TaskDTO[] => {
    if (!userId) return tasks;
    
    return tasks.filter((task) => {
      const isOwnTask = task.userId === userId;

      if (displayFilter.own && displayFilter.public) {
        return true;
      } else if (displayFilter.own) {
        return isOwnTask;
      } else if (displayFilter.public) {
        return !isOwnTask;
      }
      return false;
    });
  };

  const filteredTodayTasks = filterTasksByDisplay(todayTasks);
  const filteredOverdueTasks = filterTasksByDisplay(overdue);
  const hasFilteredTasks = filteredTodayTasks.length > 0 || filteredOverdueTasks.length > 0;
  const showEmpty = !loading && !error && !hasFilteredTasks && !isAdding;

  const handleStartAdd = () => {
    setIsAdding(true);
  };

  const resetFormState = () => {
    setNewTitle("");
    setNewDescription("");

    const today = startOfDay(new Date());
    setSelectedDate(today);
    setDateSource("today");
    setDateInput(toInputDateValue(today));
    setIsDateOpen(false);

    setPriority(null);
    setIsPriorityOpen(false);

    setReminderDateTime(null);
    setIsReminderOpen(false);
    setIsPickingCustomReminder(false);

    setSelectedCategoryId(categories[0]?.id ?? null);
    setIsCategoryOpen(false);
    setCategorySearch("");

    setVisibility("private");
    setIsVisibilityOpen(false);

    // attachments
    setFilesToUpload([]);
    setIsDraggingOverDropzone(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    // Reset edit mode
    setEditingTaskId(null);
    setExistingFiles([]);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    resetFormState();
  };

  /* ===== ATTACHMENTS handlers ===== */

  const handleDropzoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setFilesToUpload((prev) => [...prev, ...files]);
  };

  const handleDrop = (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverDropzone(false);

    const files = Array.from(e.dataTransfer.files ?? []);
    if (!files.length) return;
    setFilesToUpload((prev) => [...prev, ...files]);
  };

  const handleDragOver = (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverDropzone(true);
  };

  const handleDragLeave = (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverDropzone(false);
  };

  const handleRemoveFile = (index: number) => {
    setFilesToUpload((prev) => prev.filter((_, i) => i !== index));
  };

  /* ===== SUBMIT (create task + upload files) ===== */

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      return;
    }

    const effectivePriority: "low" | "medium" | "high" =
      priority ?? "medium";

    try {
      if (editingTaskId) {
        // MODE UPDATE - edit task yang sudah ada
        await updateTask(editingTaskId, {
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          priority: effectivePriority,
          dueDate: selectedDate ? selectedDate.toISOString() : null,
          reminderAt: reminderDateTime ? reminderDateTime.toISOString() : null,
        });

        // Upload files baru jika ada
        if (filesToUpload.length > 0) {
          try {
            await uploadTaskFiles(editingTaskId, filesToUpload);
          } catch (err) {
            console.error("Failed to upload files", err);
          }
        }
      } else {
        // MODE CREATE - buat task baru
        const newTask = await createTask({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          priority: effectivePriority,
          dueDate: selectedDate ? selectedDate.toISOString() : null,
          categoryId: selectedCategoryId,
          visibility: visibility,
          reminderAt: reminderDateTime ? reminderDateTime.toISOString() : null,
        });

        // Upload files jika ada
        if (filesToUpload.length > 0) {
          try {
            await uploadTaskFiles(newTask.id, filesToUpload);
          } catch (err) {
            console.error("Failed to upload files", err);
          }
        }
      }

      // Refresh list "today"
      const res = (await getTodayTasks()) as TodayResponse;
      const todayList = res.today ?? [];
      const overdueList = res.overdue ?? [];

      setTodayTasks(todayList);
      setOverdue(overdueList);

      setIsAdding(false);
      resetFormState();
      setEditingTaskId(null);
      // Trigger sidebar counter refresh
      window.dispatchEvent(new Event("task-updated"));
    } catch (err) {
      console.error("Failed to save task", err);
      setError("Failed to save task.");
    }
  };

  /* ====== helper tanggal & reminder ====== */

  const todayBase = startOfDay(new Date());
  const tomorrowDate = addDays(todayBase, 1);
  const nextWeekDate = getNextWeekDate(todayBase);
  const nextWeekendDate = getNextWeekendDate(todayBase);

  const chipLabel = formatChipLabel(selectedDate, dateSource, todayBase);

  // untuk text di popup reminder (Later today / Tomorrow)
  const laterToday = (() => {
    const d = new Date();
    d.setHours(17, 0, 0, 0);
    return d;
  })();
  const laterTodayRight = laterToday
    .toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(":", ":");

  const tomorrowReminderDate = addDays(todayBase, 1);
  const tomorrowRight = `${tomorrowReminderDate.toLocaleDateString(
    undefined,
    {
      weekday: "short",
    }
  )}, 09:00`;

  /* ====== POPUP TOGGLES (biar gak tabrakan) ====== */

  const closeOtherPopups = (
    except?: "date" | "priority" | "reminder" | "category" | "visibility"
  ) => {
    if (except !== "date") setIsDateOpen(false);
    if (except !== "priority") setIsPriorityOpen(false);
    if (except !== "reminder") {
      setIsReminderOpen(false);
      setIsPickingCustomReminder(false);
    }
    if (except !== "category") setIsCategoryOpen(false);
    if (except !== "visibility") setIsVisibilityOpen(false);
  };

  const toggleDateOpen = () => {
    closeOtherPopups("date");
    setIsDateOpen((prev) => !prev);
  };

  const togglePriorityOpen = () => {
    closeOtherPopups("priority");
    setIsPriorityOpen((prev) => !prev);
  };

  const toggleReminderOpen = () => {
    closeOtherPopups("reminder");
    setIsReminderOpen((prev) => !prev);
    setIsPickingCustomReminder(false);
  };

  const toggleCategoryOpen = () => {
    closeOtherPopups("category");
    setIsCategoryOpen((prev) => !prev);
  };

  const toggleVisibilityOpen = () => {
    closeOtherPopups("visibility");
    setIsVisibilityOpen((prev) => !prev);
  };

  /* ====== handler date popup ====== */

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
  const handlePickNextWeekend = () =>
    pickQuickDate(nextWeekendDate, "nextWeekend");

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

  // warna chip tanggal
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

  const dateChipClassName = [
    "today-chip",
    "today-chip-date",
    chipVariant,
    isDateOpen ? "today-chip-date--open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  /* ===== handler Priority popup ===== */

  const priorityColorMap: Record<string, string> = {
    high: "#ef4444",
    medium: "#eab308",
    low: "#22c55e",
    null: "#6b7280",
  };

  const pickPriority = (level: PrioritySelection) => {
    setPriority(level);
    setIsPriorityOpen(false);
  };

  const handleClearPriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPriority(null);
  };

  const priorityChipLabel =
    priority === "high"
      ? "High priority"
      : priority === "medium"
      ? "Medium priority"
      : priority === "low"
      ? "Low priority"
      : "Priority";

  const priorityChipVariant =
    priority === "high"
      ? "today-chip-priority--high"
      : priority === "medium"
      ? "today-chip-priority--medium"
      : priority === "low"
      ? "today-chip-priority--low"
      : "";

  const priorityChipClassName = [
    "today-chip",
    "today-chip-priority",
    priorityChipVariant,
    isPriorityOpen ? "today-chip-priority--open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  /* ===== handler Reminders popup ===== */

  const reminderChipLabel = formatReminderChipLabel(reminderDateTime);

  const reminderChipClassName = [
    "today-chip-reminder",
    reminderDateTime ? "today-chip-reminder--active" : "",
    isReminderOpen ? "today-chip-reminder--open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleReminderClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReminderDateTime(null);
  };

  const handleReminderLaterToday = () => {
    setReminderDateTime(laterToday);
    setIsReminderOpen(false);
  };

  const handleReminderTomorrow = () => {
    const d = addDays(todayBase, 1);
    d.setHours(9, 0, 0, 0);
    setReminderDateTime(d);
    setIsReminderOpen(false);
  };

  const handleOpenCustomReminder = () => {
    setIsPickingCustomReminder(true);
  };

  const handleCustomReminderCancel = () => {
    setIsPickingCustomReminder(false);
  };

  const handleCustomReminderSave = () => {
    const dateVal = customReminderDateInput;
    if (!dateVal) return;

    const hour = customReminderHour.padStart(2, "0");
    const minute = customReminderMinute.padStart(2, "0");
    const parsed = new Date(`${dateVal}T${hour}:${minute}:00`);

    if (isNaN(parsed.getTime())) return;

    setReminderDateTime(parsed);
    setIsPickingCustomReminder(false);
    setIsReminderOpen(false);
  };

  /* ===== handler Category popup ===== */

  const selectedCategory = categories.find(
    (c) => c.id === selectedCategoryId
  );
  const categoryLabel = selectedCategory?.name ?? "Home";

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.trim().toLowerCase())
  );

  const handleSelectCategory = (id: number) => {
    setSelectedCategoryId(id);
    setIsCategoryOpen(false);
    setCategorySearch("");
  };

  const handleCreateCategory = async () => {
    const name = categorySearch.trim();
    if (!name) return;

    try {
      const newCategory = await createCategoryAPI(name);
      setCategories((prev) => [...prev, newCategory]);
      setSelectedCategoryId(newCategory.id);
      setCategorySearch("");
      setIsCategoryOpen(false);
      window.dispatchEvent(new Event("task-updated"));
    } catch (err) {
      console.error("Failed to create category", err);
      alert("Failed to create category. Name might already exist.");
    }
  };

  /* ===== helper untuk sort tasks by priority ===== */
  const sortTasksByPriority = (tasks: TaskDTO[]): TaskDTO[] => {
    const priorityOrder: Record<string, number> = {
      high: 0,
      medium: 1,
      low: 2,
    };

    return [...tasks].sort(
      (a, b) =>
        (priorityOrder[a.priority] ?? 999) - (priorityOrder[b.priority] ?? 999)
    );
  };

  /* ===== helper untuk file preview ===== */
  const getFileUrl = (filePath: string) => {
    // filePath is like "uploads/files-1764490013876-829098223.jpg"
    // We need to extract just the filename part
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

  /* ===== handler untuk mark task complete ===== */
  const handleCompleteTask = async (task: TaskDTO) => {
    // Play sound & add to completing set untuk fade effect
    playBellKlinkSound();
    setCompletingTaskIds((prev) => new Set(prev).add(task.id));

    try {
      // Call API untuk mark sebagai complete
      await markTaskAsComplete(task.id);

      // Tunggu fade animation selesai sebelum hapus task
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Hapus task dari list
      setTodayTasks((prev) => prev.filter((t) => t.id !== task.id));
      setOverdue((prev) => prev.filter((t) => t.id !== task.id));
      // Trigger sidebar counter refresh
      window.dispatchEvent(new Event("task-updated"));
    } catch (err) {
      console.error("Failed to complete task", err);
      // Remove dari completing set jika failed
      setCompletingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  /* ===== render task ===== */
  const renderTask = (task: TaskDTO) => {
    const isCompleting = completingTaskIds.has(task.id);
    const isBeingEdited = editingTaskId === task.id;

    // Hide task jika sedang diedit
    if (isBeingEdited) {
      return null;
    }

    // Priority border colors
    const priorityBorderColors: Record<string, string> = {
      high: "#ef4444",
      medium: "#f59e0b", 
      low: "#22c55e",
    };

    const borderColor = priorityBorderColors[task.priority] || "#e5e7eb";

    return (
      <div
        key={task.id}
        className={`task-item ${isCompleting ? "task-item--completing" : ""}`}
        style={{ 
          position: "relative",
          border: `1px solid ${borderColor}`,
          borderLeft: `4px solid ${borderColor}`,
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "12px",
          backgroundColor: "#fff",
        }}
      >
        <button
          className="task-checkbox"
          aria-label="Complete task"
          onClick={() => handleCompleteTask(task)}
          style={{
            borderColor: borderColor,
          }}
        />
        <div 
          className="task-content"
          style={{ paddingBottom: task.userId === userId ? "40px" : "16px" }}
        >
          {/* TASK HEADER: Title di kiri, Project/Priority di kanan */}
          <div className="task-header">
            <div className="task-title" style={{ maxWidth: task.userId === userId ? "calc(100% - 160px)" : "calc(100% - 140px)" }}>{task.title}</div>
            <div className="task-meta-top" style={{ gap: "8px", flexWrap: "nowrap" }}>
              {task.projectName && (
                <span className="task-project">{task.projectName}</span>
              )}
              <span className="task-owner">
                {task.userId === userId ? "My own task" : `By ${task.ownerName}`}
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
                          console.error(`Failed to load image: ${getFileUrl(file.file_path)}`);
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
                    <FileIcon />
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

        {/* EDIT BUTTON ICON - pojok kanan bawah task-item */}
        {task.userId === userId && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditTaskInline(task);
            }}
            style={{
              position: "absolute",
              bottom: "12px",
              right: "12px",
              width: "32px",
              height: "32px",
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
          >
            <svg
              width="16"
              height="16"
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
        )}
      </div>
      );
  };  // ===== EDIT TASK HANDLERS =====
  const handleEditTaskInline = (task: TaskDTO) => {
    // Populate form dengan data task yang akan di-edit
    setNewTitle(task.title);
    setNewDescription(task.description || "");
    setPriority(task.priority as PrioritySelection);
    
    // Set tanggal jika ada
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      setSelectedDate(startOfDay(dueDate));
      setDateInput(toInputDateValue(startOfDay(dueDate)));
      setDateSource("manual");
    }
    
    // Set category jika ada
    // setSelectedCategoryId(task.category_id || DEFAULT_CATEGORIES[0]?.id);
    
    // Set existing files
    setExistingFiles(task.files || []);
    
    // Simpan task ID untuk update (bukan create)
    setEditingTaskId(task.id);
    
    // Buka modal add task
    setIsAdding(true);
  };


  return (
    <div className="today-page">
      {/* HEADER ATAS */}
      <div className="today-header-row">
        <h1 className="today-title">Today</h1>
        <div style={{ position: "relative" }}>
          <button
            className="ghost-btn"
            onClick={() => setIsDisplayFilterOpen((prev) => !prev)}
          >
            Display ▾
          </button>
          {isDisplayFilterOpen && (
            <div
              className="display-filter-popover"
              onClick={(e) => e.stopPropagation()}
            >
              <label className="display-filter-item">
                <input
                  type="checkbox"
                  checked={displayFilter.own}
                  onChange={(e) =>
                    setDisplayFilter((prev) => ({
                      ...prev,
                      own: e.target.checked,
                    }))
                  }
                />
                <span>My own tasks</span>
              </label>
              <label className="display-filter-item">
                <input
                  type="checkbox"
                  checked={displayFilter.public}
                  onChange={(e) =>
                    setDisplayFilter((prev) => ({
                      ...prev,
                      public: e.target.checked,
                    }))
                  }
                />
                <span>Public tasks</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* ROW / CARD ADD TASK */}
      <div className="today-add-wrapper">
        {!isAdding ? (
          <button className="task-add-row" onClick={handleStartAdd}>
            <span className="task-add-plus">+</span>
            <span>Add task</span>
          </button>
        ) : (
          <form className="today-add-card" onSubmit={handleSubmitAdd}>
            <input
              className="today-add-title-input"
              placeholder="Task name"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />

            <textarea
              className="today-add-description"
              placeholder="Description"
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />

            {/* ATTACHMENTS - drag & drop (di atas chips) */}
            <div className="attachments-section">
              {/* Drag & drop area - always show */}
              <div
                className={
                  "attachments-dropzone" +
                  (isDraggingOverDropzone
                    ? " attachments-dropzone--dragging"
                    : "")
                }
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleDropzoneClick}
              >
                <div className="attachments-dropzone-left">
                  <span className="attachments-icon">📎</span>
                  <div className="attachments-dropzone-text">
                    <div className="attachments-dropzone-title">
                      Drag &amp; drop files here, or click to browse
                    </div>
                    <div className="attachments-dropzone-subtitle">
                      PDF, JPG, PNG
                    </div>
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
                      <span className="attachments-file-name">
                        {file.name}
                      </span>
                      <span className="attachments-file-size">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
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

            {/* chips: DATE + PRIORITY + REMINDERS */}
            <div className="today-add-chips">
              {/* DATE */}
              <div className="today-date-chip-wrapper">
                <button
                  type="button"
                  className={dateChipClassName}
                  onClick={toggleDateOpen}
                >
                  <span className="today-chip-icon">
                    <CalendarIcon />
                  </span>
                  <span className="today-chip-label">{chipLabel}</span>
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

                      {/* Next week */}
                      <button
                        type="button"
                        className="date-quick-item"
                        onClick={handlePickNextWeek}
                      >
                        <span>Next week</span>
                        <span className="date-quick-right">
                          {`${formatWeekdayShort(
                            nextWeekDate
                          )}, ${formatDayMonthShort(nextWeekDate)}`}
                        </span>
                      </button>

                      {/* Next weekend */}
                      <button
                        type="button"
                        className="date-quick-item"
                        onClick={handlePickNextWeekend}
                      >
                        <span>Next weekend</span>
                        <span className="date-quick-right">
                          {`${formatWeekdayShort(
                            nextWeekendDate
                          )}, ${formatDayMonthShort(nextWeekendDate)}`}
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

              {/* PRIORITY */}
              <div className="today-priority-chip-wrapper">
                <button
                  type="button"
                  className={priorityChipClassName}
                  onClick={togglePriorityOpen}
                >
                  <span className="today-chip-icon">
                    <FlagIcon color={priorityColorMap[priority || "null"]} />
                  </span>
                  <span className="today-chip-label">
                    {priorityChipLabel}
                  </span>
                  {priority && (
                    <span
                      className="today-chip-clear"
                      onClick={handleClearPriority}
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
                        onClick={() => pickPriority("high")}
                      >
                        <span className="priority-item-left">
                          <FlagIcon color="#ef4444" />
                          <span>High</span>
                        </span>
                      </button>

                      <button
                        type="button"
                        className="priority-item"
                        onClick={() => pickPriority("medium")}
                      >
                        <span className="priority-item-left">
                          <FlagIcon color="#eab308" />
                          <span>Medium</span>
                        </span>
                      </button>

                      <button
                        type="button"
                        className="priority-item"
                        onClick={() => pickPriority("low")}
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

              {/* REMINDERS */}
              <div className="today-reminder-chip-wrapper">
                <button
                  type="button"
                  className={reminderChipClassName}
                  onClick={toggleReminderOpen}
                >
                  <span className="today-chip-icon">
                    <ClockIcon />
                  </span>
                  <span className="today-chip-label">
                    {reminderChipLabel}
                  </span>
                  {reminderDateTime && (
                    <span
                      className="today-chip-clear"
                      onClick={handleReminderClear}
                      role="button"
                      aria-label="Clear reminder"
                    >
                      ×
                    </span>
                  )}
                </button>

                {isReminderOpen && (
                  <div className="reminder-popover">
                    {!isPickingCustomReminder ? (
                      <div className="reminder-list">
                        <button
                          type="button"
                          className="reminder-item"
                          onClick={handleReminderLaterToday}
                        >
                          <span className="reminder-item-left">
                            <ClockIcon />
                            <span>Later today</span>
                          </span>
                          <span className="reminder-item-right">
                            {laterTodayRight}
                          </span>
                        </button>

                        <button
                          type="button"
                          className="reminder-item"
                          onClick={handleReminderTomorrow}
                        >
                          <span className="reminder-item-left">
                            <ClockIcon />
                            <span>Tomorrow</span>
                          </span>
                          <span className="reminder-item-right">
                            {tomorrowRight}
                          </span>
                        </button>

                        <button
                          type="button"
                          className="reminder-item reminder-item-full"
                          onClick={handleOpenCustomReminder}
                        >
                          <span className="reminder-item-left">
                            <ClockIcon />
                            <span>Pick a date &amp; time</span>
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="reminder-picker">
                        <div className="reminder-picker-row">
                          <span className="reminder-picker-label">Date</span>
                          <div className="reminder-picker-date">
                            <input
                              type="date"
                              className="reminder-picker-date-input"
                              value={customReminderDateInput}
                              onChange={(e) =>
                                setCustomReminderDateInput(e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="reminder-picker-row">
                          <span className="reminder-picker-label">Time</span>
                          <div className="reminder-picker-time">
                            <input
                              className="reminder-picker-time-input"
                              value={customReminderHour}
                              onChange={(e) =>
                                setCustomReminderHour(e.target.value)
                              }
                            />
                            <span>:</span>
                            <input
                              className="reminder-picker-time-input"
                              value={customReminderMinute}
                              onChange={(e) =>
                                setCustomReminderMinute(e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="reminder-picker-footer">
                          <button
                            type="button"
                            className="reminder-picker-btn reminder-picker-btn-cancel"
                            onClick={handleCustomReminderCancel}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="reminder-picker-btn reminder-picker-btn-save"
                            onClick={handleCustomReminderSave}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* VISIBILITY */}
              <div className="today-visibility-chip-wrapper">
                <button
                  type="button"
                  className={`today-visibility-chip today-visibility-chip--${visibility} ${
                    isVisibilityOpen ? "today-visibility-chip--open" : ""
                  }`}
                  onClick={toggleVisibilityOpen}
                >
                  <span className="today-chip-icon">
                    {visibility === "private" ? <LockIcon /> : <GlobeIcon />}
                  </span>
                  <span className="today-chip-label">
                    {visibility === "private" ? "Private" : "Public"}
                  </span>
                </button>

                {isVisibilityOpen && (
                  <div className="visibility-popover">
                    <button
                      type="button"
                      className={`visibility-item ${
                        visibility === "private" ? "visibility-item-active" : ""
                      }`}
                      onClick={() => {
                        setVisibility("private");
                        setIsVisibilityOpen(false);
                      }}
                    >
                      <span className="visibility-item-icon">
                        <LockIcon />
                      </span>
                      <span className="visibility-item-text">Private</span>
                      {visibility === "private" && (
                        <span className="visibility-item-check">✓</span>
                      )}
                    </button>

                    <button
                      type="button"
                      className={`visibility-item ${
                        visibility === "public" ? "visibility-item-active" : ""
                      }`}
                      onClick={() => {
                        setVisibility("public");
                        setIsVisibilityOpen(false);
                      }}
                    >
                      <span className="visibility-item-icon">
                        <GlobeIcon />
                      </span>
                      <span className="visibility-item-text">Public</span>
                      {visibility === "public" && (
                        <span className="visibility-item-check">✓</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="today-add-footer">
              {/* CATEGORY (Home) */}
              <div className="today-add-project-wrapper">
                <button
                  type="button"
                  className="today-add-project"
                  onClick={toggleCategoryOpen}
                >
                  <span className="today-add-project-icon">
                    <DynamicCategoryIcon 
                      name={categories.find(c => c.id === selectedCategoryId)?.icon || 'folder'} 
                      color={categories.find(c => c.id === selectedCategoryId)?.color || '#6b7280'} 
                      size={14} 
                    />
                  </span>
                  <span className="today-add-project-label">
                    {categoryLabel}
                  </span>
                  <span className="today-add-project-caret">▾</span>
                </button>

                {isCategoryOpen && (
                  <div className="category-popover">
                    <div className="category-popover-search">
                      <input
                        className="category-search-input"
                        placeholder="Type a category name"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                      />
                    </div>

                    {filteredCategories.length > 0 && (
                      <div className="category-popover-list">
                        {filteredCategories.map((cat) => {
                          const isActive = cat.id === selectedCategoryId;
                          const catColor = cat.color || '#6b7280';
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              className={
                                "category-item" +
                                (isActive ? " category-item-active" : "")
                              }
                              onClick={() => handleSelectCategory(cat.id)}
                              style={{
                                backgroundColor: isActive ? `${catColor}15` : undefined,
                                borderLeft: isActive ? `3px solid ${catColor}` : '3px solid transparent',
                              }}
                            >
                              <span className="category-item-left">
                                <DynamicCategoryIcon name={cat.icon || 'folder'} color={catColor} size={16} />
                                <span>{cat.name}</span>
                              </span>
                              {isActive && (
                                <span className="category-item-check" style={{ color: catColor }}>✓</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {filteredCategories.length === 0 && (
                      <div className="category-empty">
                        <div className="category-empty-text">
                          Category not found
                        </div>
                        {categorySearch.trim() && (
                          <button
                            type="button"
                            className="category-create"
                            onClick={handleCreateCategory}
                          >
                            <span className="category-create-plus">＋</span>
                            <span>
                              Create &quot;{categorySearch.trim()}&quot;
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="today-add-actions">
                <button
                  type="button"
                  className="today-btn-cancel"
                  onClick={handleCancelAdd}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="today-btn-add"
                  disabled={!newTitle.trim()}
                >
                  {editingTaskId ? "Save edit" : "Add task"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* KONTEN BAWAH */}
      {loading && (
        <div className="today-loading">Loading today&apos;s tasks...</div>
      )}

      {!loading && error && <div className="today-error">{error}</div>}

      {showEmpty && (
        <div className="today-empty">
          <div className="today-empty-illustration">
            <Lottie animationData={loveIsBlind} loop autoplay />
          </div>
          <h2 className="today-empty-title">
            You&apos;re all done for today, {userName}!
          </h2>
          <p className="today-empty-text">
            Enjoy the rest of your day and don&apos;t forget to keep your tasks
            on track tomorrow.
          </p>
        </div>
      )}

      {!loading && !error && hasFilteredTasks && (
        <div className="today-groups">
          {filteredOverdueTasks.length > 0 && (
            <section className="task-group">
              <div className="task-group-header">
                <div className="task-group-label task-group-overdue">
                  <span className="task-group-caret">▾</span>
                  <span>Overdue</span>
                </div>
              </div>
              {sortTasksByPriority(filteredOverdueTasks).map(renderTask)}
            </section>
          )}

          <section className="task-group">
            {sortTasksByPriority(filteredTodayTasks).map(renderTask)}
          </section>
        </div>
      )}
    </div>
  );
};

export default TodayPage;
