import axiosClient from "./axiosClient";

export interface WeightLog {
  id: number;
  user_id: number;
  weight_kg: number;
  logged_at: string; // ISO datetime string
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeightLogCreate {
  weight_kg: number;
  logged_at: string;
  note?: string | null;
}

export interface WeightLogUpdate {
  weight_kg?: number;
  logged_at?: string;
  note?: string | null;
}

export const weightApi = {
  list(params?: { from?: string; to?: string }) {
    return axiosClient.get<WeightLog[]>("/weight", { params });
  },
  create(body: WeightLogCreate) {
    return axiosClient.post<WeightLog>("/weight", body);
  },
  update(id: number, body: WeightLogUpdate) {
    return axiosClient.patch<WeightLog>(`/weight/${id}`, body);
  },
  remove(id: number) {
    return axiosClient.delete(`/weight/${id}`);
  },
};
