import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import type { DurationKey } from "../../hooks/useWeightData";

interface Props {
  value: DurationKey;
  onChange: (v: DurationKey) => void;
}

const options: { label: string; value: DurationKey }[] = [
  { label: "1 Week", value: "1W" },
  { label: "1 Month", value: "1M" },
  { label: "1 Year", value: "1Y" },
];

export default function DurationSelector({ value, onChange }: Props) {
  return (
    <FormControl size="small" sx={{ minWidth: 140 }}>
      <InputLabel id="duration-label">Duration</InputLabel>
      <Select
        labelId="duration-label"
        value={value}
        label="Duration"
        onChange={(e) => onChange(e.target.value as DurationKey)}
      >
        {options.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
