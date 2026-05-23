import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import type { WeightLogCreate } from "../../api/weightApi";

interface Props {
  open: boolean;
  initialDate?: Dayjs | null;
  onClose: () => void;
  onSave: (data: WeightLogCreate) => Promise<void>;
}

export default function AddWeightDialog({ open, initialDate, onClose, onSave }: Props) {
  const [weightKg, setWeightKg] = useState("");
  const [loggedAt, setLoggedAt] = useState<Dayjs | null>(initialDate ?? dayjs());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync loggedAt whenever the dialog opens with a new initialDate
  useEffect(() => {
    if (open) setLoggedAt(initialDate ?? dayjs());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialDate]);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const parsed = parseFloat(weightKg);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid weight.");
      return;
    }
    if (!loggedAt || !loggedAt.isValid()) {
      setError("Select a valid date and time.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        weight_kg: parsed,
        logged_at: loggedAt.toISOString(),
        note: note.trim() || null,
      });
      handleClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setWeightKg("");
    setLoggedAt(initialDate ?? dayjs());
    setNote("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Log Weight</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Weight (kg)"
            type="number"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            inputProps={{ step: "0.1", min: "0" }}
            error={!!error && !weightKg}
            autoFocus
            fullWidth
          />
          <DateTimePicker
            label="Date & Time"
            value={loggedAt}
            onChange={setLoggedAt}
            disableFuture
            slotProps={{ textField: { fullWidth: true } }}
          />
          <TextField
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
          {error && (
            <p style={{ color: "#d32f2f", margin: 0, fontSize: 13 }}>{error}</p>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
