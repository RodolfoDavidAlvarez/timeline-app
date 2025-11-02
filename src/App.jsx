import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Calendar, X, Trash2, Trash, FileText, ExternalLink, Link2, Download } from "lucide-react";
import "./App.css";

const departments = ["Research and Development", "Operations", "Marketing", "Sales", "Administrative"];
const BASE_TIMELINE_SPAN = 1600;
const TIMELINE_SIDE_PADDING = 200;
const SINGLE_DATE_SPACING = 200;
const EXTRA_RIGHT_MARGIN = 320;

const deriveTitleFromLink = (urlLike) => {
  try {
    const url = typeof urlLike === "string" ? new URL(urlLike) : urlLike;
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      const lastSegment = decodeURIComponent(segments[segments.length - 1]);
      const withoutExtension = lastSegment.replace(/\.[^.]+$/, "");
      const cleaned = withoutExtension.replace(/[-_]+/g, " ").trim();
      if (cleaned) {
        return cleaned;
      }
    }
    return url.hostname.replace(/^www\./, "");
  } catch {
    return typeof urlLike === "string" ? urlLike : "Document";
  }
};

function App() {
  const loadEvents = () => {
    const savedEvents = localStorage.getItem("timelineEvents");
    if (savedEvents) {
      return JSON.parse(savedEvents);
    }
    return [
      {
        id: 1,
        title: "Project Kickoff",
        date: "2024-01-15",
        description: "Initial team meeting and project planning session",
        color: "#3B82F6",
      },
      {
        id: 2,
        title: "Design Phase Complete",
        date: "2024-02-28",
        description: "Finalized all UI/UX designs and received stakeholder approval",
        color: "#10B981",
      },
      {
        id: 3,
        title: "Development Sprint 1",
        date: "2024-03-15",
        description: "Completed core functionality implementation",
        color: "#EF4444",
      },
      {
        id: 4,
        title: "Beta Testing",
        date: "2024-04-10",
        description: "Released beta version to selected users for feedback",
        color: "#F59E0B",
      },
      {
        id: 5,
        title: "Product Launch",
        date: "2024-05-01",
        description: "Official product launch with marketing campaign",
        color: "#8B5CF6",
      },
      {
        id: 6,
        title: "First Update",
        date: "2024-05-20",
        description: "Released version 1.1 with bug fixes and new features",
        color: "#06B6D4",
      },
    ];
  };

  const loadDocuments = () => {
    const saved = localStorage.getItem("companyDocuments");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const normalized = {};

        Object.entries(parsed || {}).forEach(([department, docs]) => {
          if (Array.isArray(docs)) {
            normalized[department] = docs.map((doc) => ({
              ...doc,
              title: doc?.title ? doc.title : deriveTitleFromLink(doc?.url || ""),
              description: doc?.description || "",
            }));
          }
        });

        departments.forEach((department) => {
          if (!normalized[department]) {
            normalized[department] = [];
          }
        });

        return normalized;
      } catch {
        // Fallback to fresh state if parsing fails
        console.warn("Unable to parse stored documents, resetting.");
      }
    }
    return departments.reduce((acc, department) => {
      acc[department] = [];
      return acc;
    }, {});
  };

  const [activeView, setActiveView] = useState("timeline");
  const [events, setEvents] = useState(loadEvents);
  const [documents, setDocuments] = useState(loadDocuments);
  const [showModal, setShowModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [documentDepartment, setDocumentDepartment] = useState(departments[0]);
  const [documentLink, setDocumentLink] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const [linkError, setLinkError] = useState("");
  const [titleError, setTitleError] = useState("");
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);
  const [zoom, setZoom] = useState(1);
  const timelineRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("timelineEvents", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem("companyDocuments", JSON.stringify(documents));
  }, [documents]);

  const getYearMarkers = () => {
    if (events.length === 0) return [];

    const allDates = events.map((event) => new Date(event.date));
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));

    // Get all years in the range
    const minYear = minDate.getFullYear();
    const maxYear = maxDate.getFullYear();
    const years = [];

    for (let year = minYear; year <= maxYear; year++) {
      // Check if any events fall in this year
      const hasEvents = allDates.some((date) => date.getFullYear() === year);

      if (hasEvents) {
        // Position marker at the start of the year (January 1st)
        const yearStart = new Date(year, 0, 1);
        // If the year start is before the min date, use the min date instead
        const markerDate = yearStart < minDate ? minDate : yearStart;
        years.push({
          year,
          date: markerDate,
        });
      }
    }

    return years;
  };

  const getMonthMarkers = () => {
    if (events.length === 0) return [];

    const allDates = events.map((event) => new Date(event.date));
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));

    // Start from the first day of the month containing minDate
    const startDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    // End at the last day of the month containing maxDate
    const endDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);

    const months = [];
    const currentDate = new Date(startDate);

    // Add all months continuously from start to end
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const monthStart = new Date(year, month, 1);

      months.push({
        year,
        month,
        date: monthStart < minDate ? minDate : monthStart > maxDate ? maxDate : monthStart,
      });

      // Move to the first day of the next month
      currentDate.setMonth(month + 1);
      currentDate.setDate(1);
    }

    return months;
  };

  const getTimelinePosition = (dateStr, zoomLevel = zoom) => {
    const date = new Date(dateStr);
    const allDates = [...events.map((event) => new Date(event.date)), date];
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    const range = maxDate - minDate;

    if (range === 0) {
      const eventIndex = events.findIndex((event) => new Date(event.date).getTime() === date.getTime());
      if (eventIndex === -1) {
        return TIMELINE_SIDE_PADDING + SINGLE_DATE_SPACING * zoomLevel;
      }
      return TIMELINE_SIDE_PADDING + (eventIndex + 1) * SINGLE_DATE_SPACING * zoomLevel;
    }

    const scaledSpan = BASE_TIMELINE_SPAN * zoomLevel;
    return ((date - minDate) / range) * scaledSpan + TIMELINE_SIDE_PADDING;
  };

  const openEventModal = (event = null) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const closeEventModal = () => {
    setShowModal(false);
    setEditingEvent(null);
  };

  const openDocumentModal = () => {
    setDocumentLink("");
    setDocumentTitle("");
    setDocumentDescription("");
    setLinkError("");
    setTitleError("");
    setIsTitleManuallyEdited(false);
    setShowDocumentModal(true);
  };

  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setDocumentLink("");
    setDocumentTitle("");
    setDocumentDescription("");
    setLinkError("");
    setTitleError("");
    setIsTitleManuallyEdited(false);
  };

  const handleDocumentLinkChange = (event) => {
    const value = event.target.value;
    setDocumentLink(value);
    setLinkError("");
    setTitleError("");

    const trimmed = value.trim();
    if (!isTitleManuallyEdited) {
      if (!trimmed) {
        setDocumentTitle("");
        return;
      }
      const autoTitle = deriveTitleFromLink(trimmed);
      if (autoTitle) {
        setDocumentTitle(autoTitle);
      }
    }
  };

  const handleDocumentTitleChange = (event) => {
    setDocumentTitle(event.target.value);
    setIsTitleManuallyEdited(true);
    setTitleError("");
  };

  const handleEventSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const eventData = {
      title: formData.get("title"),
      date: formData.get("date"),
      description: formData.get("description"),
      color: formData.get("color"),
    };

    if (editingEvent) {
      setEvents(events.map((existingEvent) => (existingEvent.id === editingEvent.id ? { ...existingEvent, ...eventData } : existingEvent)));
    } else {
      setEvents([
        ...events,
        {
          id: Date.now(),
          ...eventData,
        },
      ]);
    }
    closeEventModal();
  };

  const handleDocumentSubmit = (event) => {
    event.preventDefault();
    setLinkError("");
    setTitleError("");

    let trimmedLink = documentLink.trim();
    if (!trimmedLink) {
      setLinkError("Please provide a link to the document.");
      return;
    }

    if (!/^https?:\/\//i.test(trimmedLink)) {
      trimmedLink = `https://${trimmedLink}`;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(trimmedLink);
    } catch {
      setLinkError("Enter a valid URL.");
      return;
    }

    const title = documentTitle.trim();
    if (!title) {
      setTitleError("Please add a title for this document.");
      return;
    }

    const newDoc = {
      id: Date.now(),
      title,
      description: documentDescription.trim(),
      url: parsedUrl.toString(),
    };

    setDocuments((previous) => ({
      ...previous,
      [documentDepartment]: [...(previous[documentDepartment] || []), newDoc],
    }));

    closeDocumentModal();
  };

  const deleteEvent = (id) => {
    setEvents(events.filter((event) => event.id !== id));
    closeEventModal();
  };

  const deleteDocument = (department, id) => {
    setDocuments((previous) => ({
      ...previous,
      [department]: previous[department].filter((document) => document.id !== id),
    }));
  };

  const clearAllEvents = () => {
    if (window.confirm("Are you sure you want to clear all events? This action cannot be undone.")) {
      setEvents([]);
      localStorage.removeItem("timelineEvents");
    }
  };

  const exportTimeline = () => {
    const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    const payload = JSON.stringify(sortedEvents, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `timeline-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const zoomIn = () => setZoom(Math.min(zoom + 0.2, 3));
  const zoomOut = () => setZoom(Math.max(zoom - 0.2, 0.5));

  const eventPositions = events.map((eventItem) => getTimelinePosition(eventItem.date));
  const baseTimelineWidth = TIMELINE_SIDE_PADDING * 2 + BASE_TIMELINE_SPAN * zoom;
  const furthestPosition = eventPositions.length > 0 ? Math.max(...eventPositions) : 0;
  const timelineWidth = Math.max(baseTimelineWidth, furthestPosition + EXTRA_RIGHT_MARGIN);

  return (
    <div className="app">
      <motion.header initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="header">
        <div className="header-left">
          <h1>Soil, Seed &amp; Water Hub</h1>
          <p className="instructions">
            {activeView === "timeline"
              ? "Use the timeline builder to map projects, zoom, and export milestones."
              : "Browse every document by department, keep links current, and launch resources instantly."}
          </p>
          <div className="nav-tabs">
            <button type="button" className={`nav-tab ${activeView === "timeline" ? "active" : ""}`} onClick={() => setActiveView("timeline")}>
              Timeline Builder
            </button>
            <button type="button" className={`nav-tab ${activeView === "library" ? "active" : ""}`} onClick={() => setActiveView("library")}>
              Resource Library
            </button>
          </div>
        </div>

        <div className="controls">
          {activeView === "timeline" && (
            <>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openEventModal()} className="btn btn-primary">
                <Plus size={20} />
                Add Event
              </motion.button>
              {events.length > 0 && (
                <>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportTimeline} className="btn btn-secondary">
                    <Download size={18} />
                    Export
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={clearAllEvents} className="btn btn-danger">
                    <Trash size={20} />
                    Clear All
                  </motion.button>
                </>
              )}
              <div className="zoom-controls">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={zoomOut} className="zoom-btn">
                  <Minus size={18} />
                </motion.button>
                <span className="zoom-level">{Math.round(zoom * 100)}%</span>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={zoomIn} className="zoom-btn">
                  <Plus size={18} />
                </motion.button>
              </div>
            </>
          )}

          {activeView === "library" && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openDocumentModal} className="btn btn-primary">
              <Plus size={20} />
              Add Document
            </motion.button>
          )}
        </div>
      </motion.header>

      {activeView === "timeline" && (
        <div ref={scrollContainerRef} className="timeline-wrapper">
          <motion.div
            ref={timelineRef}
            className="timeline-container"
            style={{
              width: `${timelineWidth}px`,
              "--zoom-level": zoom,
            }}
          >
            <div className="timeline-line" />

            {events.length > 0 &&
              getYearMarkers().map((yearMarker) => {
                const dateStr = `${yearMarker.date.getFullYear()}-${String(yearMarker.date.getMonth() + 1).padStart(2, "0")}-${String(yearMarker.date.getDate()).padStart(2, "0")}`;
                const position = getTimelinePosition(dateStr);
                return (
                  <motion.div
                    key={yearMarker.year}
                    className="year-marker"
                    style={{ left: `${position}px` }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="year-marker-line" />
                    <div className="year-marker-label">{yearMarker.year}</div>
                  </motion.div>
                );
              })}

            {events.length > 0 &&
              getMonthMarkers().map((monthMarker) => {
                const dateStr = `${monthMarker.date.getFullYear()}-${String(monthMarker.date.getMonth() + 1).padStart(2, "0")}-${String(monthMarker.date.getDate()).padStart(2, "0")}`;
                const position = getTimelinePosition(dateStr);
                const monthName = new Date(monthMarker.year, monthMarker.month, 1).toLocaleDateString("en-US", { month: "short" });
                return (
                  <motion.div
                    key={`${monthMarker.year}-${monthMarker.month}`}
                    className="month-marker"
                    style={{ left: `${position}px` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="month-marker-line" />
                    <div className="month-marker-label">{monthName}</div>
                  </motion.div>
                );
              })}

            {events.length === 0 && (
              <div className="empty-state">
                <p>No events yet. Click &quot;Add Event&quot; to create your first timeline event!</p>
              </div>
            )}

            {events
              .slice()
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((eventItem, index) => {
                const position = getTimelinePosition(eventItem.date);
                const isTop = index % 2 === 0;

                return (
                  <motion.div
                    key={eventItem.id}
                    className={`timeline-event ${isTop ? "top" : "bottom"}`}
                    style={{ left: `${position}px` }}
                    initial={{ opacity: 0, y: isTop ? -50 : 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => openEventModal(eventItem)}
                  >
                    <div className="event-marker" style={{ backgroundColor: eventItem.color }} />
                    <div className="event-connector" />
                    <motion.div
                      className="event-card"
                      style={{ borderColor: eventItem.color }}
                      whileHover={{ boxShadow: `0 8px 30px ${eventItem.color}40` }}
                    >
                      <motion.button
                        className="delete-btn-quick"
                        onClick={(mouseEvent) => {
                          mouseEvent.stopPropagation();
                          deleteEvent(eventItem.id);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X size={16} />
                      </motion.button>
                      <div className="event-date">
                        <Calendar size={14} />
                        {new Date(eventItem.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <h3 className="event-title">{eventItem.title}</h3>
                      <p className="event-description">{eventItem.description}</p>
                    </motion.div>
                  </motion.div>
                );
              })}
          </motion.div>
        </div>
      )}

      {activeView === "library" && (
        <motion.div className="library-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {departments.map((department) => {
            const departmentDocuments = documents[department] || [];
            return (
              <motion.section key={department} className="department-card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <div className="department-header">
                  <h2>{department}</h2>
                  <span className="document-count">
                    {departmentDocuments.length} {departmentDocuments.length === 1 ? "link" : "links"}
                  </span>
                </div>
                {departmentDocuments.length === 0 ? (
                  <p className="department-empty">No resources yet. Add a link to keep this team moving.</p>
                ) : (
                  <div className="document-grid">
                    {departmentDocuments.map((document) => (
                      <motion.div
                        key={document.id}
                        className="document-item"
                        whileHover={{ translateY: -6 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      >
                        <div className="document-icon">
                          <FileText size={28} />
                        </div>
                        <div className="document-info">
                          <p className="document-title">{document.title}</p>
                          {document.description && <p className="document-description">{document.description}</p>}
                          <a href={document.url} target="_blank" rel="noreferrer" className="document-link">
                            Open link
                            <ExternalLink size={14} />
                          </a>
                        </div>
                        <button
                          type="button"
                          className="document-delete"
                          onClick={() => deleteDocument(department, document.id)}
                          aria-label="Remove document"
                        >
                          <X size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.section>
            );
          })}
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeEventModal}>
            <motion.div
              className="modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{editingEvent ? "Edit Event" : "Add New Event"}</h2>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={closeEventModal} className="close-btn">
                  <X size={20} />
                </motion.button>
              </div>

              <form onSubmit={handleEventSubmit} className="event-form">
                <div className="form-group">
                  <label htmlFor="title">Event Title</label>
                  <input type="text" id="title" name="title" defaultValue={editingEvent?.title} required placeholder="Enter event title" />
                </div>

                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input type="date" id="date" name="date" defaultValue={editingEvent?.date} required />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    defaultValue={editingEvent?.description}
                    rows="3"
                    placeholder="Add a description..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="color">Color</label>
                  <input type="color" id="color" name="color" defaultValue={editingEvent?.color || "#3B82F6"} />
                </div>

                <div className="form-actions">
                  <motion.button type="submit" className="btn btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    {editingEvent ? "Save Changes" : "Add Event"}
                  </motion.button>
                  {editingEvent && (
                    <motion.button
                      type="button"
                      className="btn btn-danger"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => deleteEvent(editingEvent.id)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </motion.button>
                  )}
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDocumentModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDocumentModal}>
            <motion.div
              className="modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Add Document Link</h2>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={closeDocumentModal} className="close-btn">
                  <X size={20} />
                </motion.button>
              </div>

              <form onSubmit={handleDocumentSubmit} className="event-form">
                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <select id="department" value={documentDepartment} onChange={(event) => setDocumentDepartment(event.target.value)}>
                    {departments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="document-link">Document Link</label>
                  <div className={`input-with-icon ${linkError ? "has-error" : ""}`}>
                    <Link2 size={16} />
                    <input
                      type="url"
                      id="document-link"
                      value={documentLink}
                      onChange={handleDocumentLinkChange}
                      placeholder="https://..."
                      required
                    />
                  </div>
                  {linkError && <p className="input-error">{linkError}</p>}
                  <p className="input-hint">Paste any internal or external link. We will suggest a title automatically.</p>
                </div>

                <div className="form-group">
                  <label htmlFor="document-title">Document Title</label>
                  <input
                    type="text"
                    id="document-title"
                    value={documentTitle}
                    onChange={handleDocumentTitleChange}
                    placeholder="e.g. Soil Sampling SOP"
                    required
                  />
                  {titleError && <p className="input-error">{titleError}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="document-description">Description</label>
                  <textarea
                    id="document-description"
                    value={documentDescription}
                    onChange={(event) => setDocumentDescription(event.target.value)}
                    rows="3"
                    placeholder="Give a short summary of when and how to use this resource (optional)."
                  />
                  <p className="input-hint">Optional context so teammates know when to use this link.</p>
                </div>

                <div className="form-actions">
                  <motion.button type="submit" className="btn btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    Save Document
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
