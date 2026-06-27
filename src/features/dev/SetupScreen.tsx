import { useEffect, useState } from 'react'
import { Server, Database, CheckCircle2, XCircle, Loader2, AlertTriangle, KeySquare } from 'lucide-react'
import { runStartupDiagnostics, type DiagnosticReport, type DiagnosticStatus } from '@/lib/diagnostics'
import { Button } from '@/components/ui/button'

export function SetupScreen({ onComplete }: { onComplete: () => void }) {
  const [report, setReport] = useState<DiagnosticReport | null>(null)
  const [isRetrying, setIsRetrying] = useState(true) // Start true to run immediately

  useEffect(() => {
    if (!isRetrying) return
    let mounted = true
    
    runStartupDiagnostics().then(res => {
      if (mounted) {
        setReport(res)
        setIsRetrying(false)
        if (res.isReady) {
          // Add a tiny delay so user sees green before transition
          setTimeout(onComplete, 800)
        }
      }
    })

    return () => { mounted = false }
  }, [isRetrying, onComplete])

  const renderStatusIcon = (status: DiagnosticStatus) => {
    switch (status) {
      case 'ok': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'pending': 
      case 'idle':
      default: return <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-zinc-950 text-foreground selection:bg-primary/30">
      <div className="max-w-lg w-full bg-black border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="h-16 w-16 bg-zinc-900 border border-zinc-800 text-primary rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <Server className="h-8 w-8" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2 tracking-tight">System Boot</h2>
          <p className="text-zinc-400 text-sm mb-8">
            Verifying repository deployment readiness...
          </p>

          <div className="w-full space-y-3 mb-8 text-left">
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="bg-zinc-800 p-2 rounded-lg"><KeySquare className="h-4 w-4 text-zinc-300" /></div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">Environment Variables</p>
                  <p className="text-[10px] text-zinc-500 font-mono">.env.local / Vercel Env</p>
                </div>
              </div>
              {renderStatusIcon(report?.state.envVars || 'idle')}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="bg-zinc-800 p-2 rounded-lg"><Server className="h-4 w-4 text-zinc-300" /></div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">Supabase Connection</p>
                  <p className="text-[10px] text-zinc-500 font-mono">VITE_SUPABASE_URL</p>
                </div>
              </div>
              {renderStatusIcon(report?.state.supabaseConnection || 'idle')}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="bg-zinc-800 p-2 rounded-lg"><Database className="h-4 w-4 text-zinc-300" /></div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">Schema Validation</p>
                  <p className="text-[10px] text-zinc-500 font-mono">schema.sql executed</p>
                </div>
              </div>
              {renderStatusIcon(report?.state.schemaValidation || 'idle')}
            </div>
          </div>

          {report?.details && report.details.length > 0 && (
            <div className="w-full mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
              <h4 className="text-red-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Action Required
              </h4>
              <ul className="text-sm text-red-200/80 space-y-2 list-disc pl-4">
                {report.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            </div>
          )}

          <Button 
            onClick={() => setIsRetrying(true)} 
            disabled={isRetrying || report?.isReady}
            className="w-full h-12 rounded-xl font-bold bg-white text-black hover:bg-zinc-200"
          >
            {isRetrying ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
            ) : report?.isReady ? (
              <><CheckCircle2 className="mr-2 h-4 w-4" /> Boot Successful</>
            ) : (
              'Retry Diagnostics'
            )}
          </Button>

        </div>
      </div>
    </div>
  )
}
