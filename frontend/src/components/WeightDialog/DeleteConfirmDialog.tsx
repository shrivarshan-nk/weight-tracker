import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import type { WeightLog } from "../../api/weightApi";

interface Props {
  open: boolean;
  entry: WeightLog | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmDialog({ open, entry, onClose, onConfirm }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Entry</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Remove the {entry?.weight_kg} kg entry? This cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
