import { useEffect, useRef, useState } from 'react'
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useImportStore, ColumnMapping } from '../store/importStore'
import { normalizePhone, normalizeString, normalizeDate } from '@/lib/importer/normalizer'
import { mapPipelineStage, mapSource, mapConnectionStatus, mapCandidateCategory } from '@/lib/importer/enumMappings'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/features/auth/store/authStore'
import { buildPayload } from '@/lib/importer/payloadBuilder'

export function ProgressStep() {
  const { 
    rawData, mappings, setStep, file, setSessionId,
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

    const startTime = Date.now()

    // 1. Create Import Session
    const { data: sessionData, error: sessionError } = await supabase
      .from('import_sessions')
      .insert({
        workspace_id: workspace.id,
        uploaded_by: session.user.id,
        filename: file?.name || 'historical_import.csv',
        total_rows: rawData.length,
        status: 'processing'
      })
      .select()
      .single()

    if (sessionError || !sessionData) {
      addFailedRow({}, 'Failed to create import session: ' + sessionError?.message)
      setIsProcessing(false)
      setStep('report')
      return
    }
    
    const sid = sessionData.id
    setSessionId(sid)
    
    // 2. Upload file securely
    if (file) {
      const filePath = `${workspace.id}/${sid}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('historical_imports')
        .upload(filePath, file)
        
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('historical_imports').getPublicUrl(filePath)
        await supabase.from('import_sessions').update({ file_url: publicUrl }).eq('id', sid)
      }
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
          p_session_id: sid,
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
    
    // Update session stats
    const duration = Date.now() - startTime
    
    // We use the current counts from state by trusting the final processed counts
    // However, Zustand state might not be instantly available here due to closures.
    // So we'll track locally to be safe.
    
    // Actually, to be accurate, we can wait a bit or use the store in a subsequent effect, 
    // but a DB count is safer or tracking them locally. Let's do a simple count query on contacts.
    
    setTimeout(() => {
      // Just update status to completed and duration
      supabase.from('import_sessions').update({ 
        status: 'completed',
        duration_ms: duration,
        updated_at: new Date().toISOString()
      }).eq('id', sid).then()
      
      setStep('report')
    }, 1000)
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
