import { useEffect, useRef, useState } from 'react'
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useImportStore, ColumnMapping } from '../store/importStore'
import { normalizePhone, normalizeString, normalizeDate } from '@/lib/importer/normalizer'
import { mapPipelineStage, mapSource, mapConnectionStatus, mapCandidateCategory } from '@/lib/importer/enumMappings'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/features/auth/store/authStore'

export function ProgressStep() {
  const { 
    rawData, mappings, setStep, 
    incrementImported, incrementSkipped, addFailedRow,
    importedCount, skippedCount, failedCount 
  } = useImportStore()
  
  const { workspace, session } = useAuthStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(true)
  const hasStarted = useRef(false)

  const total = rawData.length
  const progressPercent = Math.round((currentIndex / total) * 100)

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true
    processImport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const processImport = async () => {
    if (!workspace || !session) {
      addFailedRow({}, 'No active workspace or session.')
      setIsProcessing(false)
      setStep('report')
      return
    }

    const BATCH_SIZE = 100
    const chunks = []
    
    // Split into batches
    for (let i = 0; i < rawData.length; i += BATCH_SIZE) {
      chunks.push(rawData.slice(i, i + BATCH_SIZE))
    }

    let processedCount = 0

    for (const chunk of chunks) {
      const batchPayload = []
      const originalRows = []

      for (const row of chunk) {
        processedCount++
        setCurrentIndex(processedCount)
        
        try {
          const payload = buildPayload(row, mappings, workspace.id, session.user.id)
          
          if (!payload.phone) {
            addFailedRow(row, 'Missing or invalid phone number')
            continue
          }

          if (!payload.name) {
            payload.name = 'Unknown Candidate'
          }

          batchPayload.push(payload)
          originalRows.push(row)
        } catch (err: any) {
          addFailedRow(row, err.message || 'Unknown error building payload')
        }
      }

      if (batchPayload.length > 0) {
        const { data, error } = await supabase.rpc('import_historical_batch_v3', {
          batch_payload: batchPayload
        })

        if (error) {
          // Entire batch failed (network or fatal RPC error)
          originalRows.forEach(row => addFailedRow(row, error.message))
        } else if (Array.isArray(data)) {
          // RPC returns array of results
          data.forEach((result, idx) => {
            const originalRow = originalRows[idx]
            if (result.success === false) {
              if (result.error === 'DUPLICATE') {
                incrementSkipped()
              } else {
                addFailedRow(originalRow, result.error)
              }
            } else {
              incrementImported()
            }
          })
        }
      }
      
      // Yield to main thread after each batch
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    setIsProcessing(false)
    setTimeout(() => {
      setStep('report')
    }, 1000)
  }

  const buildPayload = (row: any, mapConfig: ColumnMapping[], workspaceId: string, userId: string) => {
    // Construct the JSON structure required by the RPC
    const result: any = {
      workspace_id: workspaceId,
      created_by: userId,
      custom_fields: {},
      opportunity: {},
      activities: []
    }

    // Default historical activity
    const nowStr = new Date().toISOString()
    let hasExplicitDate = false

    mapConfig.forEach(m => {
      if (!m.dbField) return
      
      const rawVal = row[m.sheetColumn]
      if (rawVal === undefined || rawVal === null || rawVal === '') return

      if (m.dbField === 'phone') result.phone = normalizePhone(rawVal)
      else if (m.dbField === 'whatsapp') result.whatsapp = normalizePhone(rawVal)
      else if (m.dbField === 'name') result.name = normalizeString(rawVal)
      else if (m.dbField === 'created_at') {
        const d = normalizeDate(rawVal)
        if (d) {
          result.created_at = d
          hasExplicitDate = true
        }
      }
      else if (m.dbField === 'age') result.age = parseInt(rawVal) || null
      else if (m.dbField === 'gender') {
        const g = normalizeString(rawVal)?.toLowerCase()
        if (g?.startsWith('m')) result.gender = 'male'
        else if (g?.startsWith('f')) result.gender = 'female'
        else result.gender = 'other'
      }
      else if (m.dbField === 'connection_status') result.connection_status = mapConnectionStatus(rawVal)
      else if (m.dbField === 'origin') result.origin = mapSource(rawVal)
      else if (m.dbField === 'current_area') result.current_area = normalizeString(rawVal)
      else if (m.dbField === 'notes') result.notes = normalizeString(rawVal)
      
      // Direct Contact fields
      else if (m.dbField === 'hometown') result.hometown = normalizeString(rawVal)
      else if (m.dbField === 'currently_in_bangalore') {
        const val = String(rawVal).toLowerCase().trim()
        result.currently_in_bangalore = val === 'yes' || val === 'true' || val === '1'
      }
      else if (m.dbField === 'bangalore_tenure') result.bangalore_tenure = normalizeString(rawVal)
      else if (m.dbField === 'education') result.education = normalizeString(rawVal)
      else if (m.dbField === 'current_occupation') result.current_occupation = normalizeString(rawVal)
      else if (m.dbField === 'current_salary') result.current_salary = parseInt(String(rawVal).replace(/\D/g, '')) || 0
      else if (m.dbField === 'total_experience') result.total_experience = parseInt(rawVal) || 0
      
      // Opportunity (Using new JSON struct if needed, but the RPC expects them at root or opportunity)
      else if (m.dbField === 'opportunity.highest_qualification') result.education = normalizeString(rawVal) // Fallback mapping
      else if (m.dbField === 'opportunity.current_occupation') result.current_occupation = normalizeString(rawVal) // Fallback mapping
      else if (m.dbField === 'opportunity.current_salary') result.current_salary = parseInt(String(rawVal).replace(/\D/g, '')) || 0 // Fallback mapping
      else if (m.dbField === 'opportunity.total_experience') result.total_experience = parseInt(rawVal) || 0 // Fallback mapping
      else if (m.dbField === 'opportunity.status') result.opportunity.pipeline_stage = mapPipelineStage(rawVal)
      else if (m.dbField === 'opportunity.candidate_category') result.opportunity.candidate_category = mapCandidateCategory(rawVal)
      
      // Dates
      else if (m.dbField === 'follow_up_date') result.follow_up_date = normalizeDate(rawVal)
      else if (m.dbField === 'walkin_date') result.walkin_date = normalizeDate(rawVal)
      else if (m.dbField === 'walkin_attended') {
        const val = String(rawVal).toLowerCase().trim()
        result.walkin_attended = val === 'yes' || val === 'true' || val === '1'
      }
      
      // Finance
      else if (m.dbField.startsWith('finance.')) {
        if (!result.finance) result.finance = {}
        const fieldName = m.dbField.replace('finance.', '')
        
        if (fieldName === 'pr_done' || fieldName === 'agent_referral') {
          const val = String(rawVal).toLowerCase().trim()
          result.finance[fieldName] = val === 'yes' || val === 'true' || val === '1' || val === 'done'
        } else {
          result.finance[fieldName] = parseFloat(String(rawVal).replace(/,/g, '')) || 0
        }
      }
    })

    // Generate timeline
    const createdDate = result.created_at || nowStr
    result.activities.push({
      type: 'note',
      created_at: createdDate,
      content: 'Imported from historical spreadsheet data.'
    })

    if (result.walkin_date) {
      result.activities.push({
        type: 'interview_scheduled',
        created_at: createdDate,
        content: `Walk-in historically scheduled for ${new Date(result.walkin_date).toLocaleDateString()}`
      })
    }

    return result
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 max-w-xl mx-auto w-full text-center">
      
      <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
        {isProcessing ? (
          <Loader2 className="h-20 w-20 text-primary animate-spin" />
        ) : failedCount === 0 ? (
          <CheckCircle className="h-20 w-20 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-20 w-20 text-amber-500" />
        )}
      </div>

      <h2 className="text-3xl font-bold mb-2">
        {isProcessing ? 'Importing Data...' : 'Import Complete'}
      </h2>
      
      <p className="text-muted-foreground mb-8">
        {isProcessing 
          ? `Processing row ${currentIndex} of ${total}`
          : 'Generating your final report...'}
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-3 mb-8 overflow-hidden">
        <div 
          className="bg-primary h-full transition-all duration-300 ease-out" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 w-full">
        <div className="glass-card rounded-xl p-4 flex flex-col items-center">
          <span className="text-2xl font-bold text-emerald-500">{importedCount}</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Imported</span>
        </div>
        <div className="glass-card rounded-xl p-4 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-500">{skippedCount}</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Skipped</span>
        </div>
        <div className="glass-card rounded-xl p-4 flex flex-col items-center">
          <span className="text-2xl font-bold text-red-500">{failedCount}</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Failed</span>
        </div>
      </div>
    </div>
  )
}
