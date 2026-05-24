"use client";

import { create } from "zustand";
import type { PickingListRow } from "./types";

interface PickingListStore {
  rows: PickingListRow[];
  setRows: (rows: PickingListRow[]) => void;
  clearRows: () => void;
}

export const usePickingListStore = create<PickingListStore>((set) => ({
  rows: [],
  setRows: (rows) => set({ rows }),
  clearRows: () => set({ rows: [] }),
}));
