import { Play, Copy, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useImportStore } from '../store/importStore'

export function DuplicateSettingsStep() {
  const { duplicateStrategy, setDuplicateStrategy, setStep } = useImportStore()

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full pb-20 pt-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Duplicate Strategy</h2>
        <p className="text-muted-foreground mt-2">How should we handle candidates that already exist in RecruitOS?</p>
      </div>

      <div className="space-y-4">
        {/* Skip Option (Forced for V1 for safety) */}
        <label className="flex items-start gap-4 p-5 rounded-2xl border-2 border-primary bg-primary/5 cursor-pointer relative overflow-hidden">
          <div className="absolute right-0 top-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl">
            V1 DEFAULT
          </div>
          <div className="mt-0.5">
            <input 
              type="radio" 
              className="h-5 w-5 text-primary focus:ring-primary" 
              checked={duplicateStrategy === 'skip'}
              onChange={() => setDuplicateStrategy('skip')}
            />
          </div>
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Copy className="h-4 w-4" /> Skip Duplicates
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              If a candidate with the same phone number already exists, the entire spreadsheet row will be skipped. Existing data is fully protected.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-4 p-5 rounded-2xl border-2 border-transparent bg-muted/30 opacity-50 cursor-not-allowed">
          <div className="absolute right-0 top-0 bg-muted-foreground/20 text-muted-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl">
            COMING SOON
          </div>
          <div className="mt-0.5">
            <input 
              type="radio" 
              className="h-5 w-5" 
              disabled
              checked={duplicateStrategy === 'merge'}
              onChange={() => {}}
            />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Merge Data (Safely Overwrite Nulls)</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Only empty fields in RecruitOS will be filled by spreadsheet data. Existing values will not be overwritten.
            </p>
          </div>
        </label>
      </div>

      <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm">
        <strong>Note:</strong> We match duplicates using the exact Phone Number after stripping all spaces, hyphens, and country codes (+91).
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t flex justify-end gap-3 z-10 md:static md:bg-transparent md:border-t-0 md:mt-8 md:p-0">
        <Button variant="outline" onClick={() => setStep('mapping')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setStep('progress')}>
          Start Import <Play className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
