import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/features/auth/store/authStore'
import { Database, FileDown, Clock, AlertTriangle, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ImportAuditView() {
  const { workspace } = useAuthStore()
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rollingBack, setRollingBack] = useState<string | null>(null)

  useEffect(() => {
    if (!workspace) return
    fetchSessions()
  }, [workspace])

  const fetchSessions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('import_sessions')
      .select('*, uploaded_by ( email )')
      .eq('workspace_id', workspace!.id)
      .order('created_at', { ascending: false })
      
    if (data) setSessions(data)
    setLoading(false)
  }

  const handleRollback = async (sessionId: string) => {
    if (!confirm('Are you sure you want to rollback this import? This will permanently delete all candidates created during this session.')) return
    
    setRollingBack(sessionId)
    const { data, error } = await supabase.rpc('rollback_import_session', {
      p_session_id: sessionId
    })
    
    if (error || (data && !data.success)) {
      alert('Rollback failed: ' + (error?.message || data?.error))
    } else {
      await fetchSessions()
    }
    setRollingBack(null)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 md:px-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-emerald-500" /> Import History
          </h2>
          <p className="text-muted-foreground mt-1">Audit and rollback past data imports.</p>
        </div>
      </div>
      
      {sessions.length === 0 ? (
        <div className="p-12 text-center bg-muted/30 rounded-2xl border-2 border-dashed">
          <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold">No Imports Yet</h3>
          <p className="text-muted-foreground mt-2">Historical imports will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(s => (
            <div key={s.id} className="glass-card p-5 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{s.filename}</h3>
                  {s.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {s.status === 'rolled_back' && <RotateCcw className="h-4 w-4 text-amber-500" />}
                  {s.status === 'failed' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {s.status === 'processing' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-4">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(s.created_at).toLocaleString()}</span>
                  <span>By: {s.uploaded_by?.email || 'Unknown'}</span>
                  <span>Duration: {(s.duration_ms / 1000).toFixed(1)}s</span>
                </div>
              </div>
              
              <div className="flex items-center gap-8 px-8 py-2 bg-background/50 rounded-xl">
                <div className="text-center">
                  <div className="text-2xl font-bold">{s.total_rows}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rows</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-500">{s.imported || 0}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Imported</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{s.duplicates || 0}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Duplicates</div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 min-w-[140px]">
                {s.file_url && (
                  <Button variant="outline" size="sm" onClick={() => window.open(s.file_url, '_blank')}>
                    <FileDown className="h-4 w-4 mr-2" /> Original File
                  </Button>
                )}
                {s.status === 'completed' && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleRollback(s.id)}
                    disabled={rollingBack === s.id}
                  >
                    {rollingBack === s.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                    Rollback
                  </Button>
                )}
                {s.status === 'rolled_back' && (
                  <div className="text-center text-sm font-bold text-amber-500 py-1 bg-amber-500/10 rounded-md">
                    Rolled Back
                  </div>
                )}
              </div>
              
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
