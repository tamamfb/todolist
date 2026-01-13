import React, { useEffect, useState } from "react";
import { getCompletedTasks, type TaskDTO } from "../api";

interface GroupedTasks {
  [date: string]: TaskDTO[];
}

// SVG Icons
function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function FlagIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}

const CompletedPage: React.FC = () => {
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks>({});
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);
  const [selectedTaskClosing, setSelectedTaskClosing] = useState(false);

  useEffect(() => {
    loadCompletedTasks();

    // Listen for task updates
    const handleTaskUpdate = () => {
      loadCompletedTasks();
    };
    window.addEventListener("task-updated", handleTaskUpdate);

    return () => {
      window.removeEventListener("task-updated", handleTaskUpdate);
    };
  }, []);

  async function loadCompletedTasks() {
    try {
      setLoading(true);
      const data = await getCompletedTasks();
      setGroupedTasks(data.grouped);
    } catch (error) {
      console.error("Failed to load completed tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatDateHeader(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
    };
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const formattedDate = date.toLocaleDateString("en-US", options);

    // Check if today, yesterday, or other
    const dateOnly = dateStr; // YYYY-MM-DD
    const todayStr = today.toISOString().split("T")[0];
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (dateOnly === todayStr) {
      return `${formattedDate} · Today · ${dayName}`;
    } else if (dateOnly === yesterdayStr) {
      return `${formattedDate} · Yesterday · ${dayName}`;
    } else {
      return `${formattedDate} · ${dayName}`;
    }
  }

  function formatTime(isoString: string): string {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function handleOpenTask(task: TaskDTO) {
    setSelectedTask(task);
    setSelectedTaskClosing(false);
  }

  function handleCloseSelectedTask() {
    setSelectedTaskClosing(true);
    setTimeout(() => {
      setSelectedTask(null);
      setSelectedTaskClosing(false);
    }, 200);
  }

  const sortedDates = Object.keys(groupedTasks).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (loading) {
    return (
      <>
        <header className="home-main-header">
          <div>
            <h1 className="home-main-title">Completed</h1>
            <span className="home-main-subtitle">
              Tasks you&apos;ve already finished
            </span>
          </div>
        </header>
        <section className="home-task-groups">
          <div style={{ color: "#999" }}>Loading...</div>
        </section>
      </>
    );
  }

  if (sortedDates.length === 0) {
    return (
      <>
        <header className="home-main-header">
          <div>
            <h1 className="home-main-title">Completed</h1>
            <span className="home-main-subtitle">
              Tasks you&apos;ve already finished
            </span>
          </div>
        </header>
        <section className="home-task-groups">
          <div className="task-group">
            <div className="task-group-header">
              <div className="task-group-label">
                <span>Recently completed</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              No completed tasks yet. Once you mark a task as done, it will
              appear here.
            </p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <header className="home-main-header">
        <div>
          <h1 className="home-main-title">Completed</h1>
          <span className="home-main-subtitle">
            Tasks you&apos;ve already finished
          </span>
        </div>
      </header>

      {/* Activity Timeline */}
      <section className="home-task-groups" style={{ maxWidth: 900 }}>
        <div style={{ position: "relative" }}>
          {/* Vertical line - dashed */}
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 0,
              bottom: 0,
              width: 2,
              background: "transparent",
              borderLeft: "2px dashed #e5e5e5",
            }}
          />

          {sortedDates.map((dateStr) => (
            <div key={dateStr} style={{ marginBottom: 48 }}>
              {/* Date Header */}
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#333",
                  marginBottom: 20,
                  paddingLeft: 56,
                }}
              >
                {formatDateHeader(dateStr)}
              </div>

              {/* Tasks for this date - sorted by time descending */}
              {groupedTasks[dateStr]
                .sort((a, b) => {
                  const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
                  const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
                  return timeB - timeA; // Descending order (newest first)
                })
                .map((task) => (
                <div
                  key={task.id}
                  style={{
                    position: "relative",
                    marginBottom: 24,
                    paddingLeft: 56,
                  }}
                >
                  {/* Time label only (no avatar) */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {/* Time label */}
                    {task.updated_at && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          fontWeight: 700,
                        }}
                      >
                        {formatTime(task.updated_at)}
                      </span>
                    )}
                  </div>

                  {/* Activity Content */}
                  <div
                    style={{
                      background: "white",
                      border: "1px solid #e5e5e5",
                      borderRadius: 8,
                      padding: "12px 16px",
                      transition: "box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Activity text */}
                    <div
                      style={{
                        fontSize: 14,
                        color: "#333",
                        marginBottom: 4,
                        cursor: "pointer",
                      }}
                      onClick={() => handleOpenTask(task)}
                    >
                      <span style={{ color: "#666" }}>
                        You completed a task:{" "}
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "#000",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = "underline";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = "none";
                        }}
                      >
                        {task.title}
                      </span>
                    </div>

                    {/* Metadata row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        fontSize: 12,
                        color: "#999",
                      }}
                    >
                      {/* Category */}
                      {task.category && (
                        <>
                          <span>{task.category.name}</span>
                        </>
                      )}

                      {/* Priority badge */}
                      {task.priority && (
                        <>
                          {task.category && <span>·</span>}
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
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
                            {task.priority.charAt(0).toUpperCase() +
                              task.priority.slice(1)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Description if exists */}
                    {task.description && (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 13,
                          color: "#666",
                          lineHeight: 1.5,
                        }}
                      >
                        {task.description}
                      </div>
                    )}

                    {/* Files if exists */}
                    {task.files && task.files.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
                        📎 {task.files.length} file
                        {task.files.length > 1 ? "s" : ""} attached
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

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
              overflow: "auto",
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

            {/* Task Title */}
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 600,
                marginBottom: "16px",
                color: "#1f2937",
                paddingRight: "32px",
              }}
            >
              {selectedTask.title}
            </h2>

            {/* Completed Badge */}
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                background: "#d1fae5",
                color: "#065f46",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "6px",
                marginBottom: "16px",
              }}
            >
              ✓ Completed
            </div>

            {/* Task Meta Info with Icons */}
            <div
              style={{
                display: "flex",
                gap: "20px",
                marginBottom: "20px",
                fontSize: "13px",
                flexWrap: "wrap",
              }}
            >
              {selectedTask.due_date && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#6b7280",
                  }}
                >
                  <div
                    style={{
                      color: "#6b7280",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <CalendarIcon />
                  </div>
                  <span>
                    {new Date(selectedTask.due_date).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" }
                    )}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#6b7280",
                }}
              >
                <div
                  style={{
                    color:
                      selectedTask.priority === "high"
                        ? "#ef4444"
                        : selectedTask.priority === "medium"
                        ? "#eab308"
                        : "#22c55e",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <FlagIcon
                    color={
                      selectedTask.priority === "high"
                        ? "#ef4444"
                        : selectedTask.priority === "medium"
                        ? "#eab308"
                        : "#22c55e"
                    }
                  />
                </div>
                <span>
                  {selectedTask.priority.charAt(0).toUpperCase() +
                    selectedTask.priority.slice(1)}
                </span>
              </div>
              {selectedTask.user && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#6b7280",
                  }}
                >
                  <div
                    style={{
                      color: "#6b7280",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <UserIcon />
                  </div>
                  <span>{selectedTask.user.name}</span>
                </div>
              )}
              {selectedTask.updated_at && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#6b7280",
                  }}
                >
                  <span>Completed at {formatTime(selectedTask.updated_at)}</span>
                </div>
              )}
            </div>

            {/* Task Description */}
            {selectedTask.description && (
              <div style={{ marginBottom: "20px" }}>
                <h3
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "8px",
                    color: "#374151",
                  }}
                >
                  Task Description
                </h3>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#374151",
                    lineHeight: "1.6",
                  }}
                >
                  {selectedTask.description}
                </div>
              </div>
            )}

            {/* Task Files */}
            {selectedTask.files && selectedTask.files.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h3
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "8px",
                    color: "#374151",
                  }}
                >
                  Attachments
                </h3>
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
                        (e.target as HTMLAnchorElement).style.backgroundColor =
                          "#f3f4f6";
                      }}
                      onMouseOut={(e) => {
                        (e.target as HTMLAnchorElement).style.backgroundColor =
                          "#f9fafb";
                      }}
                    >
                      <FileIcon />
                      {file.original_name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CompletedPage;
