import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, Button, IconButton, Typography } from "@mui/material";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import type { WeightLog } from "../../api/weightApi";
import type { DurationKey } from "../../hooks/useWeightData";
import DayCard from "./DayCard";
import MonthCard from "./MonthCard";

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Props {
  entries: WeightLog[];
  duration: DurationKey;
  currentDate: Dayjs;
  onPageChange: (date: Dayjs) => void;
  onEdit: (entry: WeightLog) => void;
  onDelete: (entry: WeightLog) => void;
  onAdd: (date: Dayjs) => void;
}

function buildMonthCells(monthDate: Dayjs): (Dayjs | null)[] {
  const start = monthDate.startOf("month");
  const daysInMonth = monthDate.daysInMonth();
  const cells: (Dayjs | null)[] = Array(start.day()).fill(null);
  for (let d = 0; d < daysInMonth; d++) cells.push(start.add(d, "day"));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function WeightCalendar({
  entries,
  duration,
  currentDate,
  onPageChange,
  onEdit,
  onDelete,
  onAdd,
}: Props) {
  // expandedMonth: 0–11, only used when duration === "1Y"
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  // Reset expanded month when duration changes
  useEffect(() => {
    setExpandedMonth(null);
  }, [duration]);

  const byDate = useMemo(() => {
    const map = new Map<string, WeightLog[]>();
    for (const e of entries) {
      const key = dayjs(e.logged_at).format("YYYY-MM-DD");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [entries]);

  const byMonth = useMemo(() => {
    const map = new Map<number, WeightLog[]>();
    for (const e of entries) {
      const m = dayjs(e.logged_at).month();
      if (!map.has(m)) map.set(m, []);
      map.get(m)!.push(e);
    }
    return map;
  }, [entries]);

  const isYearView = duration === "1Y";
  const isExpanded = isYearView && expandedMonth !== null;

  // Navigation title
  const title = useMemo(() => {
    if (duration === "1W") {
      const s = currentDate.startOf("week");
      const e = s.add(6, "day");
      return s.month() === e.month()
        ? `${s.format("D")} – ${e.format("D MMM YYYY")}`
        : `${s.format("D MMM")} – ${e.format("D MMM YYYY")}`;
    }
    if (duration === "1M") return currentDate.format("MMMM YYYY");
    if (isExpanded) return currentDate.month(expandedMonth!).format("MMMM YYYY");
    return String(currentDate.year());
  }, [duration, currentDate, expandedMonth, isExpanded]);

  const goBack = () => {
    if (duration === "1W") onPageChange(currentDate.subtract(1, "week"));
    else if (duration === "1M") onPageChange(currentDate.subtract(1, "month"));
    else if (isExpanded) {
      const prev = expandedMonth! - 1;
      if (prev >= 0) setExpandedMonth(prev);
    } else {
      onPageChange(currentDate.subtract(1, "year"));
    }
  };

  const goForward = () => {
    if (duration === "1W") onPageChange(currentDate.add(1, "week"));
    else if (duration === "1M") onPageChange(currentDate.add(1, "month"));
    else if (isExpanded) {
      const next = expandedMonth! + 1;
      if (next <= 11) setExpandedMonth(next);
    } else {
      onPageChange(currentDate.add(1, "year"));
    }
  };

  // Grid cells for current week (1W)
  const weekCells = useMemo(() => {
    const start = currentDate.startOf("week");
    return Array.from({ length: 7 }, (_, i) => start.add(i, "day"));
  }, [currentDate]);

  // Grid cells for month (1M or expanded year month)
  const monthCells = useMemo(() => {
    if (duration === "1M") return buildMonthCells(currentDate);
    if (isExpanded) return buildMonthCells(currentDate.month(expandedMonth!));
    return [];
  }, [duration, currentDate, expandedMonth, isExpanded]);

  // Shared grid renderer for week and month views
  const renderDayGrid = (cells: (Dayjs | null)[]) => (
    <Box>
      {/* Weekday column headers */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0.5,
          mb: 0.75,
        }}
      >
        {DAY_HEADERS.map((h) => (
          <Typography
            key={h}
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: "center", py: 0.5, letterSpacing: "0.04em", fontWeight: 700 }}
          >
            {h}
          </Typography>
        ))}
      </Box>

      {/* Day cards grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0.75,
          alignItems: "start",
        }}
      >
        {cells.map((day, i) =>
          day ? (
            <DayCard
              key={day.format("YYYY-MM-DD")}
              date={day}
              entries={byDate.get(day.format("YYYY-MM-DD")) ?? []}
              onEdit={onEdit}
              onDelete={onDelete}
              onAdd={onAdd}
            />
          ) : (
            <Box key={`empty-${i}`} />
          )
        )}
      </Box>
    </Box>
  );

  // Year overview: 4 × 3 month tiles
  const renderYearOverview = () => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 1.5,
      }}
    >
      {MONTH_NAMES.map((name, idx) => (
        <MonthCard
          key={name}
          monthIndex={idx}
          monthName={name}
          year={currentDate.year()}
          entries={byMonth.get(idx) ?? []}
          onClick={() => setExpandedMonth(idx)}
        />
      ))}
    </Box>
  );

  return (
    <Box>
      {/* Navigation bar */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        {isExpanded && (
          <Button
            size="small"
            onClick={() => setExpandedMonth(null)}
            sx={{ mr: 1, minWidth: 0, textTransform: "none", fontSize: "0.75rem", color: "text.secondary" }}
          >
            ← {currentDate.year()}
          </Button>
        )}
        <IconButton onClick={goBack} size="small" sx={{ color: "primary.main" }}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography
          variant="subtitle1"
          sx={{ flexGrow: 1, textAlign: "center", color: "text.primary", fontWeight: 700 }}
        >
          {title}
        </Typography>
        <IconButton onClick={goForward} size="small" sx={{ color: "primary.main" }}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {duration === "1W" && renderDayGrid(weekCells)}
      {duration === "1M" && renderDayGrid(monthCells)}
      {isYearView && !isExpanded && renderYearOverview()}
      {isYearView && isExpanded && renderDayGrid(monthCells)}
    </Box>
  );
}
