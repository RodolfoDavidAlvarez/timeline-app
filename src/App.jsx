import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Calendar, X, Trash2, Trash } from 'lucide-react'
import './App.css'

function App() {
  // Load events from localStorage or use default sample data
  const loadEvents = () => {
    const savedEvents = localStorage.getItem('timelineEvents')
    if (savedEvents) {
      return JSON.parse(savedEvents)
    }
    // Default sample data for first-time users
    return [
      {
        id: 1,
        title: "Project Kickoff",
        date: "2024-01-15",
        description: "Initial team meeting and project planning session",
        color: "#3B82F6"
      },
      {
        id: 2,
        title: "Design Phase Complete",
        date: "2024-02-28",
        description: "Finalized all UI/UX designs and received stakeholder approval",
        color: "#10B981"
      },
      {
        id: 3,
        title: "Development Sprint 1",
        date: "2024-03-15",
        description: "Completed core functionality implementation",
        color: "#EF4444"
      },
      {
        id: 4,
        title: "Beta Testing",
        date: "2024-04-10",
        description: "Released beta version to selected users for feedback",
        color: "#F59E0B"
      },
      {
        id: 5,
        title: "Product Launch",
        date: "2024-05-01",
        description: "Official product launch with marketing campaign",
        color: "#8B5CF6"
      },
      {
        id: 6,
        title: "First Update",
        date: "2024-05-20",
        description: "Released version 1.1 with bug fixes and new features",
        color: "#06B6D4"
      }
    ]
  }

  const [events, setEvents] = useState(loadEvents)

  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [zoom, setZoom] = useState(1)
  const timelineRef = useRef(null)
  const scrollContainerRef = useRef(null)

  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('timelineEvents', JSON.stringify(events))
  }, [events])

  const getTimelinePosition = (dateStr) => {
    const date = new Date(dateStr)
    const allDates = [...events.map(e => new Date(e.date)), date]
    const minDate = new Date(Math.min(...allDates))
    const maxDate = new Date(Math.max(...allDates))
    
    // If only one date or dates are the same, space them out
    const range = maxDate - minDate
    if (range === 0) {
      // If all events are on the same date, distribute them evenly
      const eventIndex = events.findIndex(e => new Date(e.date).getTime() === date.getTime())
      return 200 + (eventIndex + 1) * 200
    }
    
    const position = ((date - minDate) / range) * 1600 + 200
    return position
  }

  const openModal = (event = null) => {
    setEditingEvent(event)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingEvent(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const eventData = {
      title: formData.get('title'),
      date: formData.get('date'),
      description: formData.get('description'),
      color: formData.get('color')
    }

    if (editingEvent) {
      setEvents(events.map(event => 
        event.id === editingEvent.id 
          ? { ...event, ...eventData }
          : event
      ))
    } else {
      setEvents([...events, { 
        id: Date.now(), 
        ...eventData 
      }])
    }
    closeModal()
  }

  const deleteEvent = (id) => {
    setEvents(events.filter(event => event.id !== id))
    closeModal()
  }

  const clearAllEvents = () => {
    if (window.confirm('Are you sure you want to clear all events? This action cannot be undone.')) {
      setEvents([])
      localStorage.removeItem('timelineEvents')
    }
  }

  const zoomIn = () => setZoom(Math.min(zoom + 0.2, 3))
  const zoomOut = () => setZoom(Math.max(zoom - 0.2, 0.5))

  return (
    <div className="app">
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="header"
      >
        <div>
          <h1>Timeline Builder</h1>
          <p className="instructions">Use the scrollbar to navigate • Zoom buttons to scale</p>
        </div>
        <div className="controls">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openModal()} 
            className="btn btn-primary"
          >
            <Plus size={20} />
            Add Event
          </motion.button>
          {events.length > 0 && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearAllEvents} 
              className="btn btn-danger"
            >
              <Trash size={20} />
              Clear All
            </motion.button>
          )}
          <div className="zoom-controls">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={zoomOut} 
              className="zoom-btn"
            >
              <Minus size={18} />
            </motion.button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={zoomIn} 
              className="zoom-btn"
            >
              <Plus size={18} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div 
        ref={scrollContainerRef}
        className="timeline-wrapper"
      >
        <motion.div 
          ref={timelineRef}
          className="timeline-container"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'left center',
            '--zoom-level': zoom
          }}
        >
          <div className="timeline-line" />
          
          {events.length === 0 && (
            <div className="empty-state">
              <p>No events yet. Click "Add Event" to create your first timeline event!</p>
            </div>
          )}
          
          {events.sort((a, b) => new Date(a.date) - new Date(b.date)).map((event, index) => {
            const position = getTimelinePosition(event.date)
            const isTop = index % 2 === 0
            
            return (
              <motion.div
                key={event.id}
                className={`timeline-event ${isTop ? 'top' : 'bottom'}`}
                style={{ left: `${position}px` }}
                initial={{ opacity: 0, y: isTop ? -50 : 50 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => openModal(event)}
              >
                <div 
                  className="event-marker" 
                  style={{ backgroundColor: event.color }}
                />
                <div className="event-connector" />
                <motion.div 
                  className="event-card"
                  style={{ borderColor: event.color }}
                  whileHover={{ boxShadow: `0 8px 30px ${event.color}40` }}
                >
                  <motion.button
                    className="delete-btn-quick"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteEvent(event.id)
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={16} />
                  </motion.button>
                  <div className="event-date">
                    <Calendar size={14} />
                    {new Date(event.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                  <h3 className="event-title">{event.title}</h3>
                  <p className="event-description">{event.description}</p>
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div 
              className="modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{editingEvent ? 'Edit Event' : 'Add New Event'}</h2>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModal} 
                  className="close-btn"
                >
                  <X size={20} />
                </motion.button>
              </div>
              
              <form onSubmit={handleSubmit} className="event-form">
                <div className="form-group">
                  <label htmlFor="title">Event Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    defaultValue={editingEvent?.title}
                    required
                    placeholder="Enter event title"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    defaultValue={editingEvent?.date}
                    required
                  />
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
                  <input
                    type="color"
                    id="color"
                    name="color"
                    defaultValue={editingEvent?.color || '#3B82F6'}
                  />
                </div>
                
                <div className="form-actions">
                  <motion.button 
                    type="submit" 
                    className="btn btn-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {editingEvent ? 'Save Changes' : 'Add Event'}
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
    </div>
  )
}

export default App
