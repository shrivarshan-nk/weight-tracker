import { useCallback, useEffect, useState } from "react";
import type { Dayjs } from "dayjs";
import { weightApi, type WeightLog, type WeightLogCreate, type WeightLogUpdate } from "../api/weightApi";

export type DurationKey = "24H" | "1W" | "1M" | "1Y";

export function useWeightData(from: Dayjs, to: Dayjs) {
  const [entries, setEntries] = useState<WeightLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await weightApi.list({ from: fromIso, to: toIso });
      setEntries(data);
    } catch {
      setError("Failed to load weight entries.");
    } finally {
      setIsLoading(false);
    }
  }, [fromIso, toIso]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = useCallback(async (body: WeightLogCreate) => {
    const { data } = await weightApi.create(body);
    setEntries((prev) => [...prev, data].sort((a, b) => a.logged_at.localeCompare(b.logged_at)));
    return data;
  }, []);

  const editEntry = useCallback(async (id: number, body: WeightLogUpdate) => {
    const { data } = await weightApi.update(id, body);
    setEntries((prev) => prev.map((e) => (e.id === id ? data : e)));
    return data;
  }, []);

  const deleteEntry = useCallback(async (id: number) => {
    await weightApi.remove(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, isLoading, error, addEntry, editEntry, deleteEntry, refetch: fetchEntries };
}
