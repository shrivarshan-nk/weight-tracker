import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeightLog } from "../../api/weightApi";
import type { DurationKey } from "../../hooks/useWeightData";

interface Props {
  entries: WeightLog[];
  from: dayjs.Dayjs;
  to: dayjs.Dayjs;
  duration: DurationKey;
}

interface DatePoint {
  date: string;
  weight: number | null;
}

interface TsPoint {
  ts: number;
  weight: number;
}

function buildDateData(entries: WeightLog[], from: dayjs.Dayjs, to: dayjs.Dayjs): DatePoint[] {
  // Last entry per day wins
  const byDate = new Map<string, number>();
  for (const e of entries) {
    const d = dayjs(e.logged_at).format("YYYY-MM-DD");
    byDate.set(d, e.weight_kg);
  }
  const points: DatePoint[] = [];
  let cursor = from.startOf("day");
  while (cursor.isBefore(to) || cursor.isSame(to, "day")) {
    const key = cursor.format("YYYY-MM-DD");
    points.push({ date: key, weight: byDate.get(key) ?? null });
    cursor = cursor.add(1, "day");
  }
  return points;
}

function buildTsData(entries: WeightLog[]): TsPoint[] {
  return [...entries]
    .sort((a, b) => dayjs(a.logged_at).valueOf() - dayjs(b.logged_at).valueOf())
    .map((e) => ({ ts: dayjs(e.logged_at).valueOf(), weight: e.weight_kg }));
}

export default function WeightChart({ entries, from, to, duration }: Props) {
  const useTimestamps = duration === "24H" || duration === "1W";
  const data = useTimestamps ? buildTsData(entries) : buildDateData(entries, from, to);
  const hasData = entries.length > 0;

  const domainStart = from.startOf("day").valueOf();
  const domainEnd = to.endOf("day").valueOf();

  // X ticks: hourly for 24H, noon-of-day for 1W
  const xTicks: number[] = useTimestamps
    ? duration === "24H"
      ? [0, 6, 12, 18, 24].map((h) => from.startOf("day").add(h, "hour").valueOf())
      : Array.from({ length: 7 }, (_, i) =>
          from.startOf("day").add(i, "day").add(12, "hour").valueOf()
        )
    : [];

  return (
    <Box sx={{ width: "100%", height: 280, position: "relative" }}>
      {!hasData && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <Typography color="text.secondary" variant="body2">
            No data for this period. Log your first weight!
          </Typography>
        </Box>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data as object[]} margin={{ top: 10, right: 24, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ede9ff" />

          {useTimestamps ? (
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={[domainStart, domainEnd]}
              ticks={xTicks}
              tickFormatter={(v: number) =>
                duration === "24H"
                  ? dayjs(v).format("h A")
                  : dayjs(v).format("ddd")
              }
              tick={{ fontSize: 12, fill: "#888" }}
              axisLine={false}
              tickLine={false}
            />
          ) : (
            <XAxis
              dataKey="date"
              tickFormatter={(v) => dayjs(v).format("MMM D")}
              tick={{ fontSize: 12, fill: "#888" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
          )}

          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={(v) => `${v} kg`}
            tick={{ fontSize: 12, fill: "#888" }}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip
            formatter={(value) => [`${value} kg`, "Weight"]}
            labelFormatter={(label) =>
              duration === "24H"
                ? dayjs(label).format("h:mm A")
                : duration === "1W"
                ? dayjs(label).format("ddd, MMM D · h:mm A")
                : dayjs(label).format("ddd, MMM D YYYY")
            }
            contentStyle={{
              borderRadius: 10,
              border: "none",
              boxShadow: "0 4px 20px rgba(108,99,255,0.2)",
              fontSize: 13,
            }}
          />
          <Area
            type="monotone"
            dataKey="weight"
            stroke="#6C63FF"
            strokeWidth={3}
            fill="url(#weightGradient)"
            dot={{ r: 5, fill: "#6C63FF", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 7, fill: "#6C63FF", stroke: "#fff", strokeWidth: 2 }}
            connectNulls={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}
