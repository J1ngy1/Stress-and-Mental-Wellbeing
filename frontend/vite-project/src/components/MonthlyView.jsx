import { useState, useEffect } from "react";
import { Box, Grid, Text, ActionIcon, Tooltip } from "@mantine/core";
import { DayCell } from "./DayCell";
import { MonthSwitcher } from "./Monthswitch";
import Header from "./Header";
import AddEventModal from "./AddEventModal";
import { useNavigate } from "react-router-dom";
import { IconPencil } from "@tabler/icons-react";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatYmd(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function expandEvents(events, currentMonth, currentYear) {
  /*
  Ideally (if there is nothing wrong), calling this will generate a list of events containing event name, start&end time
  e.g.,
  {
    date: new Date(2025, 4, 10), 
    name: "test event",
    startTime: "14:00",
    endTime: "16:00"
  }
  Example Usage:
    const visibleEvents = expandEvents(events, date.getMonth(), date.getFullYear()); 
  */
  const expanded = [];

  for (const event of events) {
    const { startDate, endDate, startTime, endTime, name, repeat } = event;

    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const date = new Date(d);

      if (
        date.getMonth() !== currentMonth ||
        date.getFullYear() !== currentYear
      )
        continue;

      const isMatch =
        repeat === "Daily" ||
        (repeat === "Weekly" && date.getDay() === start.getDay()) ||
        (repeat === "Monthly" && date.getDate() === start.getDate()) ||
        (repeat === "Never" && date.toDateString() === start.toDateString());

      if (isMatch) {
        expanded.push({
          date,
          name,
          startTime,
          endTime,
        });
      }
    }
  }

  return expanded;
}

const getCalendarCells = (
  firstDayOfMonth,
  startDayIndex = 2,
  totalDays = 30,
  onAddClick,
  events = [],
  taskDates = new Set(),
  fullEvents = [],
  onEditClick,
  onDeleteEvent
) => {
  const cells = [];

  for (let i = 0; i < startDayIndex; i++) {
    cells.push(<Grid.Col span={1} key={`empty-${i}`} />);
  }

  for (let day = 1; day <= totalDays; day++) {
    const cellDate = new Date(firstDayOfMonth);
    cellDate.setDate(day);
    const cellKey = cellDate.toISOString().split("T")[0];

    const dayEvents = events.filter((e) => e.date.getDate() === day);
    const eventDisplay =
      dayEvents.length > 0
        ? [
            { text: dayEvents[0].name, highlight: true },
            { text: `${dayEvents[0].startTime} - ${dayEvents[0].endTime}` },
          ]
        : [];

    const hasTask = taskDates.has(cellKey);

    cells.push(
      <Grid.Col span={1} key={day}>
        <DayCell
          dayNumber={day}
          eventToDisplay={eventDisplay}
          events={fullEvents}
          onAddClick={onAddClick}
          hasTasks={hasTask}
          onEditClick={onEditClick}
          onDeleteEvent={onDeleteEvent}
        />
      </Grid.Col>
    );
  }

  return cells;
};

const Calendar = ({ user }) => {
  const [date, setDate] = useState(new Date());
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });

  const taskDates = new Set(
    tasks.flatMap((t) =>
      (t.slots || []).map((s) => {
        const d = new Date(s.date);
        return d.toISOString().split("T")[0];
      })
    )
  );

  const parseYmd = (str) => {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem("events");
    return saved
      ? JSON.parse(saved).map((e) => ({
          ...e,
          startDate: parseYmd(e.startDate),
          endDate: parseYmd(e.endDate),
        }))
      : [];
  });

  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();
  const visibleEvents = expandEvents(
    events,
    date.getMonth(),
    date.getFullYear()
  );

  useEffect(() => {
    const eventsForStorage = events.map((e) => ({
      ...e,
      startDate: formatYmd(e.startDate),
      endDate: formatYmd(e.endDate),
    }));

    localStorage.setItem("events", JSON.stringify(eventsForStorage));
  }, [events]);

  const navigate = useNavigate();

  const handlePrev = () => {
    setDate((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() - 1);
      return d;
    });
  };

  const handleNext = () => {
    setDate((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + 1);
      return d;
    });
  };

  const openModalForDay = (day) => {
    console.log("Opening modal for day", day);
    setSelectedDay(day);
    setModalOpened(true);
  };

  return (
    <>
      <Header
        title="WeekPlanr"
        user={user}
        showHome={true}
        onHomeClick={() => navigate("/")}
        currentView="monthly"
      />

      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}
      >
        <MonthSwitcher
          month={months[date.getMonth()]}
          year={date.getFullYear()}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      </div>

      <Box style={{ width: "100%", padding: "1rem" }}>
        <div style={{ padding: 16 }}>
          <Grid columns={7} gutter="xs">
            {daysOfWeek.map((day) => (
              <Grid.Col span={1} key={day}>
                <Text align="center" fw={700}>
                  {day}
                </Text>
              </Grid.Col>
            ))}
          </Grid>

          <Grid columns={7} gutter="xs">
            {getCalendarCells(
              firstDayOfMonth,
              firstDayOfMonth.getDay(),
              daysInMonth,
              openModalForDay,
              visibleEvents,
              taskDates,
              events,
              (event) => {
                setEditingEvent(event);
                setSelectedDay(null);
                setModalOpened(true);
              },
              (eventId) => {
                const confirmDelete = window.confirm(`Delete event?`);
                if (confirmDelete) {
                  setEvents((prev) => prev.filter((e) => e.id !== eventId));
                }
              }
            )}
          </Grid>
        </div>
      </Box>
      <AddEventModal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setEditingEvent(null);
        }}
        selectedDay={selectedDay}
        initialEvent={editingEvent}
        onCreate={(newEvent) => {
          if (editingEvent) {
            setEvents((prev) =>
              prev.map((e) =>
                e.id === editingEvent.id
                  ? { ...newEvent, id: editingEvent.id }
                  : e
              )
            );
          } else {
            setEvents((prev) => [
              ...prev,
              { ...newEvent, id: `e${prev.length + 1}` },
            ]);
          }

          setModalOpened(false);
          setEditingEvent(null);
        }}
      />
      {editModalOpen && (
        <div className="task-modal">
          <div
            className="task-modal-content"
            style={{
              maxHeight: "70vh",
              overflowY: "auto",
              paddingRight: "12px",
            }}
          >
            <h3>Edit Events</h3>

            {events.length === 0 && <p>No events yet.</p>}

            {events.map((event, index) => (
              <div
                key={event.id || index}
                style={{
                  marginBottom: "12px",
                  borderBottom: "1px solid #ccc",
                  paddingBottom: "8px",
                }}
              >
                <strong>{event.name}</strong>
                <p>
                  {formatYmd(event.startDate)} {event.startTime} —{" "}
                  {formatYmd(event.endDate)} {event.endTime}
                </p>
                <p>Repeat: {event.repeat}</p>

                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button
                    onClick={() => {
                      setEditModalOpen(false);
                      setTimeout(() => {
                        setEditingEvent(event);
                        setSelectedDay(null);
                        setModalOpened(true);
                      }, 0);
                    }}
                    style={{
                      backgroundColor: "#1976d2",
                      color: "white",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => {
                      const confirmDelete = window.confirm(
                        `Delete event "${event.name}"?`
                      );
                      if (confirmDelete) {
                        setEvents((prev) => prev.filter((e, i) => i !== index));
                      }
                    }}
                    style={{
                      backgroundColor: "#e53935",
                      color: "white",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            <button
              className="modal-button close-btn"
              onClick={() => setEditModalOpen(false)}
              style={{ marginTop: "16px" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          position: "fixed",
          top: 72,
          right: 24,
          display: "flex",
          flexDirection: "row",
          gap: "16px",
          zIndex: 1000,
        }}
      >
        <Tooltip label="Add Event" position="bottom" offset={8}>
          <ActionIcon
            variant="filled"
            color="green"
            radius="xl"
            size={64}
            onClick={() => {
              setSelectedDay(null);
              setModalOpened(true);
            }}
            style={{
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
              <span style={{ fontSize: 24, fontWeight: "bold", lineHeight: 1 }}>+</span>
            </div>
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Edit Events" position="bottom" offset={8}>
          <ActionIcon
            variant="filled"
            color="blue"
            radius="xl"
            size={64}
            onClick={() => setEditModalOpen(true)}
            style={{
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
            }}
          >
            <IconPencil size={32} />
          </ActionIcon>
        </Tooltip>
      </div>
    </>
  );
};

export default Calendar;
