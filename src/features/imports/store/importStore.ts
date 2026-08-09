import { create } from 'zustand'

export type ImportStep = 'upload' | 'mapping' | 'duplicate_settings' | 'progress' | 'report'

export type ColumnMapping = {
  sheetColumn: string
  dbField: string | null // null means skip
}

export type DuplicateStrategy = 'skip' | 'update' | 'merge'

export interface ImportState {
  step: ImportStep
  file: File | null
  rawData: any[]
  headers: string[]
  mappings: ColumnMapping[]
  duplicateStrategy: DuplicateStrategy
  
  // Results
  importedCount: number
  skippedCount: number
  failedCount: number
  failedRows: any[] // to export as CSV later
  
  // Actions
  setStep: (step: ImportStep) => void
  setFile: (file: File | null) => void
  setRawData: (data: any[], headers: string[]) => void
  setMappings: (mappings: ColumnMapping[]) => void
  setDuplicateStrategy: (strategy: DuplicateStrategy) => void
  
  incrementImported: () => void
  incrementSkipped: () => void
  addFailedRow: (row: any, error: string) => void
  
  reset: () => void
}

export const useImportStore = create<ImportState>((set) => ({
  step: 'upload',
  file: null,
  rawData: [],
  headers: [],
  mappings: [],
  duplicateStrategy: 'skip',
  
  importedCount: 0,
  skippedCount: 0,
  failedCount: 0,
  failedRows: [],
  
  setStep: (step) => set({ step }),
  setFile: (file) => set({ file }),
  setRawData: (rawData, headers) => set({ rawData, headers }),
  setMappings: (mappings) => set({ mappings }),
  setDuplicateStrategy: (duplicateStrategy) => set({ duplicateStrategy }),
  
  incrementImported: () => set((state) => ({ importedCount: state.importedCount + 1 })),
  incrementSkipped: () => set((state) => ({ skippedCount: state.skippedCount + 1 })),
  addFailedRow: (row, error) => set((state) => ({
    failedCount: state.failedCount + 1,
    failedRows: [...state.failedRows, { ...row, _import_error: error }]
  })),
  
  reset: () => set({
    step: 'upload',
    file: null,
    rawData: [],
    headers: [],
    mappings: [],
    duplicateStrategy: 'skip',
    importedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    failedRows: []
  })
}))
