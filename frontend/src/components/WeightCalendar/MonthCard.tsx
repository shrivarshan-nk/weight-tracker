import { Box, Card, CardActionArea, CardContent, Typography } from "@mui/material";
import type { WeightLog } from "../../api/weightApi";

const monthColors = [
  { bg: "#F3F0FF", border: "#C4B9FF", text: "#6C63FF" },
  { bg: "#E8FBF8", border: "#9DE8DF", text: "#00897B" },
  { bg: "#FFF4E5", border: "#FFD699", text: "#E65100" },
  { bg: "#FCE4EC", border: "#F48FB1", text: "#C2185B" },
  { bg: "#E8F5E9", border: "#A5D6A7", text: "#2E7D32" },
  { bg: "#E3F2FD", border: "#90CAF9", text: "#1565C0" },
  { bg: "#FDE7FA", border: "#E0A0D8", text: "#8E24AA" },
  { bg: "#FFF8E1", border: "#FFE082", text: "#F57F17" },
  { bg: "#E0F7FA", border: "#80DEEA", text: "#00838F" },
  { bg: "#F1F8E9", border: "#C5E1A5", text: "#558B2F" },
  { bg: "#EDE7F6", border: "#CE93D8", text: "#7B1FA2" },
  { bg: "#E8EAF6", border: "#9FA8DA", text: "#3949AB" },
];

interface Props {
  monthIndex: number;
  monthName: string;
  year: number;
  entries: WeightLog[];
  onClick: () => void;
}

export default function MonthCard({ monthIndex, monthName, year, entries, onClick }: Props) {
  const color = monthColors[monthIndex % monthColors.length];
  const weights = entries.map((e) => e.weight_kg);
  const avg =
    weights.length
      ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)
      : null;

  return (
    <Card
      variant="outlined"
      sx={{
        bgcolor: color.bg,
        borderColor: color.border,
        transition: "transform 0.15s, box-shadow 0.15s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 6px 20px ${color.border}99`,
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ p: 0 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Typography variant="subtitle1" fontWeight={700} color={color.text}>
            {monthName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {year}
          </Typography>
          {entries.length > 0 ? (
            <Box sx={{ mt: 0.75 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </Typography>
              {avg && (
                <Typography variant="caption" fontWeight={700} color={color.text}>
                  avg {avg} kg
                </Typography>
              )}
            </Box>
          ) : (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ fontStyle: "italic", mt: 0.75, display: "block" }}
            >
              No entries
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
