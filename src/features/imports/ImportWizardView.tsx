import { motion, AnimatePresence } from 'framer-motion'
import { Database, FileUp, ListChecks, Play, CheckCircle } from 'lucide-react'
import { useImportStore } from './store/importStore'
import { UploadStep } from './components/UploadStep'
import { MappingStep } from './components/MappingStep'
import { DuplicateSettingsStep } from './components/DuplicateSettingsStep'
import { ProgressStep } from './components/ProgressStep'
import { ReportStep } from './components/ReportStep'

const STEPS = [
  { id: 'upload', icon: FileUp, label: 'Upload' },
  { id: 'mapping', icon: ListChecks, label: 'Map Columns' },
  { id: 'duplicate_settings', icon: Database, label: 'Duplicates' },
  { id: 'progress', icon: Play, label: 'Import' },
  { id: 'report', icon: CheckCircle, label: 'Report' }
]

export function ImportWizardView() {
  const step = useImportStore(state => state.step)
  
  const currentStepIndex = STEPS.findIndex(s => s.id === step)

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      
      {/* Wizard Header / Progress Indicator */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-emerald-500/10 text-emerald-600 rounded-lg flex items-center justify-center">
              <Database className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold">Historical Data Importer</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            {STEPS.map((s, idx) => {
              const Icon = s.icon
              const isPast = idx < currentStepIndex
              const isCurrent = idx === currentStepIndex
              
              return (
                <div key={s.id} className="flex items-center">
                  <div className={`flex flex-col items-center gap-1 ${isPast ? 'text-emerald-500' : isCurrent ? 'text-primary' : 'text-muted-foreground opacity-50'}`}>
                    <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${isPast ? 'bg-emerald-500 border-emerald-500 text-white' : isCurrent ? 'border-primary bg-primary/10' : 'border-dashed'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-8 h-px mx-2 ${isPast ? 'bg-emerald-500' : 'bg-border dashed'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="h-full flex flex-col"
          >
            {step === 'upload' && <UploadStep />}
            {step === 'mapping' && <MappingStep />}
            {step === 'duplicate_settings' && <DuplicateSettingsStep />}
            {step === 'progress' && <ProgressStep />}
            {step === 'report' && <ReportStep />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
