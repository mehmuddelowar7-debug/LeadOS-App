import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface HistoricalReport {
  id: string
  date: string
  text: string
  timestamp: number
}

export type MentionTemplate = 'urban_company' | 'custom'
export type ReportTemplateType = 'A' | 'B' | 'C'

export type FieldKey = 'date' | 'leads' | 'walkin' | 'screening' | 'recharge' | 'training' | 'activation' | 'rejected' | 'expected_walkin' | 'comments' | 'mentions'

export interface ReportSettingsState {
  mentionTemplate: MentionTemplate
  managerName: string
  tlName: string
  supervisorName: string
  commentsDraft: string
  templateType: ReportTemplateType
  hideZeroValues: boolean
  history: HistoricalReport[]
  customOrder: FieldKey[]
  
  setMentionTemplate: (template: MentionTemplate) => void
  setManagerName: (name: string) => void
  setTlName: (name: string) => void
  setSupervisorName: (name: string) => void
  setCommentsDraft: (draft: string) => void
  setTemplateType: (type: ReportTemplateType) => void
  setHideZeroValues: (hide: boolean) => void
  addHistory: (report: HistoricalReport) => void
  clearHistory: () => void
  setCustomOrder: (order: FieldKey[]) => void
}

const DEFAULT_ORDER: FieldKey[] = [
  'date', 'leads', 'walkin', 'expected_walkin', 'screening', 
  'recharge', 'training', 'activation', 'rejected', 'comments', 'mentions'
]

export const useReportSettingsStore = create<ReportSettingsState>()(
  persist(
    (set) => ({
      mentionTemplate: 'urban_company',
      managerName: '',
      tlName: '',
      supervisorName: '',
      commentsDraft: '',
      templateType: 'A',
      hideZeroValues: true,
      history: [],
      customOrder: DEFAULT_ORDER,
      
      setMentionTemplate: (t) => set({ mentionTemplate: t }),
      setManagerName: (name) => set({ managerName: name }),
      setTlName: (name) => set({ tlName: name }),
      setSupervisorName: (name) => set({ supervisorName: name }),
      setCommentsDraft: (draft) => set({ commentsDraft: draft }),
      setTemplateType: (type) => set({ templateType: type }),
      setHideZeroValues: (hide) => set({ hideZeroValues: hide }),
      addHistory: (report) => set((state) => ({ history: [report, ...state.history].slice(0, 30) })), // keep last 30
      clearHistory: () => set({ history: [] }),
      setCustomOrder: (order) => set({ customOrder: order })
    }),
    {
      name: 'leados-report-settings-v2', // bumped version to avoid conflicts
    }
  )
)
