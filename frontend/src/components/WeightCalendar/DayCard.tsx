import AddIcon from "@mui/icons-material/Add";
import { Box, Card, CardContent, Tooltip, Typography } from "@mui/material";
import dayjs from "dayjs";
import type { WeightLog } from "../../api/weightApi";
import EntryRow from "./EntryRow";

interface Props {
  date: dayjs.Dayjs;
  entries: WeightLog[];
  onEdit: (entry: WeightLog) => void;
  onDelete: (entry: WeightLog) => void;
  onAdd: (date: dayjs.Dayjs) => void;
}

const dayColors = [
  { bg: "#F3F0FF", border: "#C4B9FF", text: "#6C63FF" },
  { bg: "#E8FBF8", border: "#9DE8DF", text: "#00897B" },
  { bg: "#FFF4E5", border: "#FFD699", text: "#E65100" },
  { bg: "#FCE4EC", border: "#F48FB1", text: "#C2185B" },
  { bg: "#E8F5E9", border: "#A5D6A7", text: "#2E7D32" },
  { bg: "#E3F2FD", border: "#90CAF9", text: "#1565C0" },
  { bg: "#FDE7FA", border: "#E0A0D8", text: "#8E24AA" },
];

export default function DayCard({ date, entries, onEdit, onDelete, onAdd }: Props) {
  const isToday = date.isSame(dayjs(), "day");
  const color = isToday
    ? { bg: "#EDE9FF", border: "#6C63FF", text: "#6C63FF" }
    : dayColors[date.day()];

  return (
    <Tooltip title="Click to log weight for this day" placement="top" arrow>
      <Card
        onClick={() => onAdd(date)}
        variant="outlined"
        sx={{
          bgcolor: color.bg,
          borderColor: color.border,
          borderWidth: isToday ? 2 : 1,
          cursor: "pointer",
          minHeight: 72,
          transition: "transform 0.15s, box-shadow 0.15s",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: `0 4px 16px ${color.border}88`,
          },
        }}
      >
        <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
          {/* Date number + add icon */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
              <Typography variant="body2" fontWeight={700} color={color.text} sx={{ lineHeight: 1 }}>
                {date.format("D")}
              </Typography>
              {date.date() === 1 && (
                <Typography variant="caption" color={color.text} sx={{ opacity: 0.75, fontSize: "0.6rem" }}>
                  {date.format("MMM")}
                </Typography>
              )}
              {isToday && (
                <Box
                  component="span"
                  sx={{
                    bgcolor: color.text,
                    color: "#fff",
                    px: 0.5,
                    borderRadius: 0.5,
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    lineHeight: 1.6,
                  }}
                >
                  Today
                </Box>
              )}
            </Box>
            <AddIcon sx={{ fontSize: 12, color: color.text, opacity: 0.5 }} />
          </Box>

          {entries.length === 0 ? (
            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic", fontSize: "0.6rem" }}>
              + add
            </Typography>
          ) : (
            <Box>
              {entries.map((e) => (
                <EntryRow key={e.id} entry={e} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Tooltip>
  );
}
