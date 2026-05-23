import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import dayjs from "dayjs";
import type { WeightLog } from "../../api/weightApi";

interface Props {
  entry: WeightLog;
  onEdit: (entry: WeightLog) => void;
  onDelete: (entry: WeightLog) => void;
}

export default function EntryRow({ entry, onEdit, onDelete }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 0.5,
        px: 1,
        borderRadius: 1,
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Box>
        <Typography variant="body2" fontWeight={600}>
          {entry.weight_kg} kg
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {dayjs(entry.logged_at).format("h:mm A")}
        </Typography>
        {entry.note && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            · {entry.note}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <Tooltip title="Edit">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
            sx={{ color: "primary.main" }}
          >
            <EditIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            color="error"
            onClick={(e) => { e.stopPropagation(); onDelete(entry); }}
          >
            <DeleteIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
