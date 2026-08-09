import { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, ShieldCheck, Search, Users, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useImportStore } from '../store/importStore'
import { buildPayload } from '@/lib/importer/payloadBuilder'
import { useAuthStore } from '@/features/auth/store/authStore'

export function DryRunStep() {
  const { 
    rawData, mappings, setStep, setDryRunResults,
    dryRunReadyCount, dryRunWarningsCount, dryRunMissingPhoneCount, dryRunQualityScore, dryRunData
  } = useImportStore()
  
  const { workspace, session } = useAuthStore()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    if (!workspace || !session) return
    
    // Process dry run
    const processDryRun = () => {
      let ready = 0
      let warnings = 0
      let missingPhone = 0
      let totalScore = 0
      
      const processed = rawData.map(row => {
        const payload = buildPayload(row, mappings, workspace.id, session.user.id)
        
        let rowScore = 0
        const maxScore = 5
        let rowWarnings = []
        
        if (!payload.phone) {
          missingPhone++
          rowWarnings.push('Missing Phone Number')
        } else {
          rowScore++
          ready++
        }
        
        if (payload.name) rowScore++
        if (payload.origin && payload.origin !== 'other') rowScore++
        if (payload.education) rowScore++
        if (payload.current_salary) rowScore++
        
        if (payload.opportunity?.status === 'selected' && !payload.walkin_attended) {
          rowWarnings.push('Selected but Walk-in not marked as attended')
          warnings++
        }
        
        if (payload.finance?.pr_done && !payload.finance?.pr_amount) {
          rowWarnings.push('PR Done marked Yes, but PR amount is empty')
          warnings++
        }
        
        if (payload.age && payload.age < 18) {
          rowWarnings.push('Age below 18')
          warnings++
        }
        
        totalScore += (rowScore / maxScore) * 100
        
        return {
          original: row,
          payload,
          warnings: rowWarnings,
          score: (rowScore / maxScore) * 100
        }
      })
      
      const avgScore = rawData.length > 0 ? Math.round(totalScore / rawData.length) : 0
      setDryRunResults(ready, warnings, missingPhone, avgScore, processed)
      setIsProcessing(false)
    }
    
    // Simulate slight delay for heavy files
    setTimeout(processDryRun, 500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 max-w-xl mx-auto w-full text-center">
        <ShieldCheck className="h-20 w-20 text-primary animate-pulse mb-8" />
        <h2 className="text-3xl font-bold mb-2">Validating Business Rules</h2>
        <p className="text-muted-foreground">Running Dry Run simulation safely...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto w-full py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Import Validation Report</h2>
        <p className="text-muted-foreground">Please review the simulation before writing to the database.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 flex flex-col">
          <Database className="h-5 w-5 text-muted-foreground mb-2" />
          <span className="text-2xl font-bold">{rawData.length}</span>
          <span className="text-xs font-medium text-muted-foreground uppercase">Total Rows</span>
        </div>
        <div className="glass-card rounded-xl p-4 flex flex-col">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-2" />
          <span className="text-2xl font-bold text-emerald-500">{dryRunReadyCount}</span>
          <span className="text-xs font-medium text-muted-foreground uppercase">Ready to Import</span>
        </div>
        <div className="glass-card rounded-xl p-4 flex flex-col">
          <AlertTriangle className="h-5 w-5 text-amber-500 mb-2" />
          <span className="text-2xl font-bold text-amber-500">{dryRunWarningsCount}</span>
          <span className="text-xs font-medium text-muted-foreground uppercase">Warnings</span>
        </div>
        <div className="glass-card rounded-xl p-4 flex flex-col">
          <ShieldCheck className="h-5 w-5 text-blue-500 mb-2" />
          <span className="text-2xl font-bold text-blue-500">{dryRunQualityScore}%</span>
          <span className="text-xs font-medium text-muted-foreground uppercase">Data Quality Score</span>
        </div>
      </div>
      
      {dryRunMissingPhoneCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3 text-red-500 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-1">Missing Phones Detected</span>
            {dryRunMissingPhoneCount} rows are missing a valid phone number. These will be automatically skipped during import.
          </div>
        </div>
      )}
      
      <div className="flex justify-between pt-6 border-t border-border/50">
        <Button variant="ghost" onClick={() => setStep('duplicate_settings')}>
          Back
        </Button>
        <Button onClick={() => setStep('progress')} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
          Execute Import
        </Button>
      </div>
    </div>
  )
}
