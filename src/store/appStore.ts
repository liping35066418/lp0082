import { create } from 'zustand';

interface AppState {
  subjects: string[];
  selectedSubject: string | null;
  selectedStatus: string | null;
  setSelectedSubject: (subject: string | null) => void;
  setSelectedStatus: (status: string | null) => void;
  clearFilters: () => void;
}

const DEFAULT_SUBJECTS = [
  '物理学',
  '化学',
  '生物学',
  '计算机科学',
  '材料科学',
  '环境科学',
];

export const useAppStore = create<AppState>((set) => ({
  subjects: DEFAULT_SUBJECTS,
  selectedSubject: null,
  selectedStatus: null,

  setSelectedSubject: (subject: string | null) => {
    set({ selectedSubject: subject });
  },

  setSelectedStatus: (status: string | null) => {
    set({ selectedStatus: status });
  },

  clearFilters: () => {
    set({
      selectedSubject: null,
      selectedStatus: null,
    });
  },
}));
