import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Skeleton,
  Snackbar,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import dayjs, { type Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import type { WeightLog } from "../api/weightApi";
import { useAuth } from "../auth/AuthContext";
import WeightCalendar from "../components/WeightCalendar/WeightCalendar";
import DurationSelector from "../components/WeightChart/DurationSelector";
import WeightChart from "../components/WeightChart/WeightChart";
import AddWeightDialog from "../components/WeightDialog/AddWeightDialog";
import DeleteConfirmDialog from "../components/WeightDialog/DeleteConfirmDialog";
import EditWeightDialog from "../components/WeightDialog/EditWeightDialog";
import { type DurationKey, useWeightData } from "../hooks/useWeightData";

function computeRange(duration: DurationKey, date: Dayjs) {
  if (duration === "24H") {
    return { fromDate: date.startOf("day"), toDate: date.endOf("day") };
  }
  if (duration === "1W") {
    const start = date.startOf("week");
    return { fromDate: start.startOf("day"), toDate: start.add(6, "day").endOf("day") };
  }
  if (duration === "1M") {
    return { fromDate: date.startOf("month"), toDate: date.endOf("month") };
  }
  // 1Y
  return { fromDate: date.startOf("year"), toDate: date.endOf("year") };
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [duration, setDuration] = useState<DurationKey>("24H");
  const [currentDate, setCurrentDate] = useState(dayjs());

  const { fromDate, toDate } = useMemo(
    () => computeRange(duration, currentDate),
    [duration, currentDate]
  );

  const { entries, isLoading, error, addEntry, editEntry, deleteEntry } =
    useWeightData(fromDate, toDate);

  const handleDurationChange = (d: DurationKey) => {
    setDuration(d);
    setCurrentDate(dayjs()); // reset to today when switching duration
  };

  const [addOpen, setAddOpen] = useState(false);
  const [addInitialDate, setAddInitialDate] = useState<dayjs.Dayjs | null>(null);
  const [editEntry_, setEditEntry] = useState<WeightLog | null>(null);
  const [deleteEntry_, setDeleteEntry] = useState<WeightLog | null>(null);
  const [snackMsg, setSnackMsg] = useState<string | null>(null);

  const openAddForDate = (date: dayjs.Dayjs) => {
    setAddInitialDate(date.hour(dayjs().hour()).minute(dayjs().minute()));
    setAddOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteEntry_) return;
    try {
      await deleteEntry(deleteEntry_.id);
      setSnackMsg("Entry deleted.");
    } catch {
      setSnackMsg("Failed to delete.");
    } finally {
      setDeleteEntry(null);
    }
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <AppBar position="sticky" elevation={0} sx={{ color: "#fff" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, color: "#fff", fontWeight: 700 }}>
            Weight Tracker
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openAddForDate(dayjs())}
            size="small"
            sx={{ mr: 2, bgcolor: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}
          >
            Log Weight
          </Button>
          {user?.picture && (
            <Tooltip title={user.name ?? user.email}>
              <Avatar
                src={user.picture}
                sx={{ width: 32, height: 32, mr: 1 }}
              />
            </Tooltip>
          )}
          <Tooltip title="Sign out">
            <IconButton onClick={logout} size="small">
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 2 }}>
        {/* Chart section */}
        <Box
          sx={{
            bgcolor: "background.paper",
            borderRadius: 3,
            p: 3,
            mb: 2,
            boxShadow: "0 2px 12px rgba(108,99,255,0.10)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Weight Over Time
            </Typography>
            <DurationSelector value={duration} onChange={handleDurationChange} />
          </Box>

          {isLoading ? (
            <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 1 }} />
          ) : (
            <WeightChart entries={entries} from={fromDate} to={toDate} duration={duration} />
          )}
        </Box>


        {/* Calendar section */}
        <Box
          sx={{
            bgcolor: "background.paper",
            borderRadius: 3,
            p: 3,
            boxShadow: "0 2px 12px rgba(108,99,255,0.10)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Daily Log
            </Typography>
            {isLoading && <CircularProgress size={18} sx={{ ml: 1.5 }} />}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <WeightCalendar
            entries={entries}
            duration={duration}
            currentDate={currentDate}
            onPageChange={setCurrentDate}
            onEdit={setEditEntry}
            onDelete={setDeleteEntry}
            onAdd={openAddForDate}
          />
        </Box>
      </Container>

      {/* Dialogs */}
      <AddWeightDialog
        open={addOpen}
        initialDate={addInitialDate}
        onClose={() => { setAddOpen(false); setAddInitialDate(null); }}
        onSave={async (data) => {
          await addEntry(data);
          setSnackMsg("Weight logged!");
        }}
      />
      <EditWeightDialog
        open={!!editEntry_}
        entry={editEntry_}
        onClose={() => setEditEntry(null)}
        onSave={async (id, data) => {
          await editEntry(id, data);
          setSnackMsg("Entry updated.");
        }}
      />
      <DeleteConfirmDialog
        open={!!deleteEntry_}
        entry={deleteEntry_}
        onClose={() => setDeleteEntry(null)}
        onConfirm={handleDelete}
      />

      <Snackbar
        open={!!snackMsg}
        autoHideDuration={3000}
        onClose={() => setSnackMsg(null)}
        message={snackMsg}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
