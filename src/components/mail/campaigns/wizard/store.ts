import { create } from 'zustand';

interface CampaignData {
    name: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    audienceIds: string[]; // Contact IDs
    contentJson: any; // Email content
    scheduledAt: Date | null;
}

interface WizardState {
    step: number;
    data: CampaignData;
    setStep: (step: number) => void;
    updateData: (data: Partial<CampaignData>) => void;
    reset: () => void;
}

const INITIAL_DATA: CampaignData = {
    name: '',
    subject: '',
    fromName: '', // Should fetch defaults
    fromEmail: '',
    audienceIds: [],
    contentJson: null,
    scheduledAt: null,
};

export const useWizardStore = create<WizardState>((set) => ({
    step: 1,
    data: INITIAL_DATA,
    setStep: (step) => set({ step }),
    updateData: (updates) => set((state) => ({ data: { ...state.data, ...updates } })),
    reset: () => set({ step: 1, data: INITIAL_DATA }),
}));
