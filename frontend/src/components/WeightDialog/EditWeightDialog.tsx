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
import type { WeightLog, WeightLogUpdate } from "../../api/weightApi";

interface Props {
  open: boolean;
  entry: WeightLog | null;
  onClose: () => void;
  onSave: (id: number, data: WeightLogUpdate) => Promise<void>;
}

export default function EditWeightDialog({ open, entry, onClose, onSave }: Props) {
  const [weightKg, setWeightKg] = useState("");
  const [loggedAt, setLoggedAt] = useState<Dayjs | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (entry) {
      setWeightKg(String(entry.weight_kg));
      setLoggedAt(dayjs(entry.logged_at));
      setNote(entry.note ?? "");
      setError("");
    }
  }, [entry]);

  const handleSave = async () => {
    if (!entry) return;
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
      await onSave(entry.id, {
        weight_kg: parsed,
        logged_at: loggedAt.toISOString(),
        note: note.trim() || null,
      });
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Edit Entry</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Weight (kg)"
            type="number"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            slotProps={{ input: { inputProps: { step: "0.1", min: "0" } } }}
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
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? "Saving…" : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
