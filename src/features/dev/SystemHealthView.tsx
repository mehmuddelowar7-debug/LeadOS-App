import { useEffect, useState, useCallback } from 'react'
import {
  Database, Wifi, Zap, Bot,
  CheckCircle, XCircle, Loader2, Clock, RefreshCw,
  Server, Shield
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { getMutationQueue } from '@/lib/offlineSync'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type CheckStatus = 'checking' | 'ok' | 'warn' | 'error'

interface Check {
  label: string
  detail: string
  status: CheckStatus
  latencyMs?: number
  hint?: string
}

// ─────────────────────────────────────────────────────────────
// Individual probe functions — each returns a Check result
// ─────────────────────────────────────────────────────────────

async function probeDatabase(): Promise<Omit<Check, 'label'>> {
  if (!isSupabaseConfigured) {
    return { status: 'error', detail: 'Not configured', hint: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env' }
  }
  const t0 = performance.now()
  try {
    const { error } = await supabase.from('contacts').select('id').limit(1)
    const latencyMs = Math.round(performance.now() - t0)
    if (error) {
      return { status: 'error', detail: `Query failed: ${error.message}`, latencyMs, hint: 'Check RLS policies and Supabase project status' }
    }
    return { status: 'ok', detail: `Healthy · ${latencyMs}ms`, latencyMs }
  } catch (e: any) {
    return { status: 'error', detail: e.message, hint: 'Network or CORS issue' }
  }
}

async function probeAuth(): Promise<Omit<Check, 'label'>> {
  if (!isSupabaseConfigured) return { status: 'error', detail: 'Supabase not configured' }
  const t0 = performance.now()
  try {
    const { data, error } = await supabase.auth.getSession()
    const latencyMs = Math.round(performance.now() - t0)
    if (error) return { status: 'error', detail: error.message, latencyMs }
    const user = data.session?.user
    if (!user) return { status: 'warn', detail: 'Not authenticated', latencyMs, hint: 'Login to test auth properly' }
    return { status: 'ok', detail: `Authenticated as ${user.email}`, latencyMs }
  } catch (e: any) {
    return { status: 'error', detail: e.message }
  }
}

async function probeRealtime(): Promise<Omit<Check, 'label'>> {
  if (!isSupabaseConfigured) return { status: 'error', detail: 'Supabase not configured' }
  return new Promise(resolve => {
    const t0 = performance.now()
    const timeout = setTimeout(() => {
      supabase.removeChannel(channel)
      resolve({ status: 'error', detail: 'Subscription timed out after 5s', hint: 'Check Supabase Realtime is enabled for this project' })
    }, 5000)

    const channel = supabase.channel('system_health_probe')
    channel.subscribe((status) => {
      clearTimeout(timeout)
      const latencyMs = Math.round(performance.now() - t0)
      supabase.removeChannel(channel)
      if (status === 'SUBSCRIBED') {
        resolve({ status: 'ok', detail: `Connected · ${latencyMs}ms`, latencyMs })
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        resolve({ status: 'error', detail: `Status: ${status}`, latencyMs, hint: 'Realtime may be disabled or quota exceeded' })
      }
    })
  })
}

async function probeEdgeFunction(name: string): Promise<Omit<Check, 'label'>> {
  if (!isSupabaseConfigured) return { status: 'error', detail: 'Supabase not configured' }
  const t0 = performance.now()
  try {
    const { error } = await supabase.functions.invoke(name, {
      body: { _healthCheck: true }
    })
    const latencyMs = Math.round(performance.now() - t0)
    const ctx = (error as any)?.context

    if (!error) {
      return { status: 'ok', detail: `Deployed · ${latencyMs}ms`, latencyMs }
    }

    const status = ctx?.status
    if (status === 404) {
      return { status: 'error', detail: 'Not deployed (404)', latencyMs, hint: `Run: supabase functions deploy ${name}` }
    }
    if (status === 503) {
      return { status: 'error', detail: 'Deployed but missing API key (503)', latencyMs, hint: 'Set required secrets in Supabase Dashboard → Edge Functions → Secrets' }
    }
    if (status === 200 || status === 400) {
      // 400 on health check ping = function is alive, just rejected the payload
      return { status: 'ok', detail: `Deployed · ${latencyMs}ms`, latencyMs }
    }
    return { status: 'warn', detail: `HTTP ${status ?? 'unknown'}`, latencyMs, hint: error?.message }
  } catch (e: any) {
    return { status: 'error', detail: e.message }
  }
}

async function probeAiProxy(): Promise<Omit<Check, 'label'>> {
  if (!isSupabaseConfigured) return { status: 'error', detail: 'Supabase not configured' }
  const t0 = performance.now()
  try {
    const { error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        document: {
          system: 'Reply only with the word: OK',
          messages: [{ role: 'user', content: 'Health check' }]
        }
      }
    })
    const latencyMs = Math.round(performance.now() - t0)
    const ctx = (error as any)?.context
    const status = ctx?.status

    if (!error) {
      return { status: 'ok', detail: `Online · ${latencyMs}ms`, latencyMs }
    }
    if (status === 404) {
      return { status: 'error', detail: 'Not deployed (404)', latencyMs, hint: 'Run: supabase functions deploy ai-proxy' }
    }
    if (status === 503) {
      return { status: 'error', detail: 'Missing GEMINI_API_KEY (503)', latencyMs, hint: 'Set GEMINI_API_KEY in Supabase → Edge Functions → Secrets' }
    }
    if (status === 502) {
      return { status: 'error', detail: 'Gemini API error (502)', latencyMs, hint: 'Check your Gemini API key is valid and has quota' }
    }
    return { status: 'warn', detail: `HTTP ${status ?? 'unknown'} · ${error?.message}`, latencyMs }
  } catch (e: any) {
    return { status: 'error', detail: e.message }
  }
}

async function probeTables(): Promise<Omit<Check, 'label'>> {
  if (!isSupabaseConfigured) return { status: 'error', detail: 'Supabase not configured' }
  const tables = ['contacts', 'opportunities', 'interviews', 'follow_ups', 'referrals']
  const missing: string[] = []
  for (const t of tables) {
    const { error } = await supabase.from(t).select('id').limit(1)
    if (error?.code === 'PGRST205' || error?.message?.includes('not found')) {
      missing.push(t)
    }
  }
  if (missing.length === 0) return { status: 'ok', detail: `All ${tables.length} tables present` }
  return {
    status: missing.length === tables.length ? 'error' : 'warn',
    detail: `Missing: ${missing.join(', ')}`,
    hint: 'Run: supabase db push --linked  (applies migration 20260809100000)'
  }
}

async function probeOfflineQueue(): Promise<Omit<Check, 'label'>> {
  try {
    const queue = await getMutationQueue()
    if (queue.length === 0) return { status: 'ok', detail: 'Empty — all synced' }
    return { status: 'warn', detail: `${queue.length} mutation${queue.length !== 1 ? 's' : ''} pending sync` }
  } catch {
    return { status: 'warn', detail: 'Could not read IndexedDB' }
  }
}

// ─────────────────────────────────────────────────────────────
// Status icon
// ─────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'checking') return <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
  if (status === 'ok') return <CheckCircle className="w-4 h-4 text-emerald-400" />
  if (status === 'warn') return <CheckCircle className="w-4 h-4 text-amber-400" />
  return <XCircle className="w-4 h-4 text-red-400" />
}

function StatusDot({ status }: { status: CheckStatus }) {
  const colors = {
    checking: 'bg-zinc-500',
    ok: 'bg-emerald-400',
    warn: 'bg-amber-400',
    error: 'bg-red-500',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]} ${status === 'ok' ? 'shadow-[0_0_6px_theme(colors.emerald.400)]' : ''}`} />
}

// ─────────────────────────────────────────────────────────────
// Single check row
// ─────────────────────────────────────────────────────────────

function CheckRow({ check }: { check: Check }) {
  return (
    <div className="py-3 border-b border-zinc-800/60 last:border-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <StatusIcon status={check.status} />
          <span className="text-sm font-medium text-zinc-200">{check.label}</span>
        </div>
        <div className="flex items-center gap-2 text-right">
          {check.latencyMs !== undefined && (
            <span className="text-[10px] text-zinc-600 font-mono">{check.latencyMs}ms</span>
          )}
          <span className={`text-xs font-mono ${
            check.status === 'ok' ? 'text-emerald-400' :
            check.status === 'warn' ? 'text-amber-400' :
            check.status === 'checking' ? 'text-zinc-500' :
            'text-red-400'
          }`}>
            {check.detail}
          </span>
        </div>
      </div>
      {check.hint && check.status !== 'ok' && (
        <p className="mt-1.5 ml-7 text-[11px] text-zinc-500 font-mono">
          ↳ {check.hint}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Section card
// ─────────────────────────────────────────────────────────────

function Section({
  icon: Icon, title, checks
}: {
  icon: React.ElementType
  title: string
  checks: Check[]
}) {
  const overall = checks.every(c => c.status === 'ok') ? 'ok'
    : checks.some(c => c.status === 'checking') ? 'checking'
    : checks.some(c => c.status === 'error') ? 'error'
    : 'warn'

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{title}</span>
        </div>
        <StatusDot status={overall} />
      </div>
      <div className="px-4">
        {checks.map(c => <CheckRow key={c.label} check={c} />)}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

function makeChecking(label: string): Check {
  return { label, status: 'checking', detail: 'Checking...' }
}

export function SystemHealthView() {
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const [dbChecks, setDbChecks] = useState<Check[]>([
    makeChecking('Database'), makeChecking('Tables'), makeChecking('Auth'),
  ])
  const [realtimeChecks, setRealtimeChecks] = useState<Check[]>([
    makeChecking('Realtime Channel'),
  ])
  const [edgeChecks, setEdgeChecks] = useState<Check[]>([
    makeChecking('webhook-gateway'), makeChecking('ai-proxy'),
  ])
  const [aiChecks, setAiChecks] = useState<Check[]>([
    makeChecking('Gemini via ai-proxy'),
  ])
  const [systemChecks, setSystemChecks] = useState<Check[]>([
    makeChecking('Network'), makeChecking('Service Worker'), makeChecking('Offline Queue'),
  ])

  const runChecks = useCallback(async () => {
    setIsRunning(true)

    // Reset all to checking
    setDbChecks([makeChecking('Database'), makeChecking('Tables'), makeChecking('Auth')])
    setRealtimeChecks([makeChecking('Realtime Channel')])
    setEdgeChecks([makeChecking('webhook-gateway'), makeChecking('ai-proxy (deployed?)')])
    setAiChecks([makeChecking('Gemini via ai-proxy')])
    setSystemChecks([makeChecking('Network'), makeChecking('Service Worker'), makeChecking('Offline Queue')])

    // Run all checks in parallel for speed
    const [db, tables, auth, realtime, webhookGw, aiProxy, offlineQ] = await Promise.all([
      probeDatabase(),
      probeTables(),
      probeAuth(),
      probeRealtime(),
      probeEdgeFunction('webhook-gateway'),
      probeEdgeFunction('ai-proxy'),
      probeOfflineQueue(),
    ])

    // AI check only runs after we know ai-proxy is deployed
    let aiResult: Omit<Check, 'label'>
    if (aiProxy.status === 'ok') {
      aiResult = await probeAiProxy()
    } else {
      aiResult = { status: 'error', detail: 'Skipped — ai-proxy not deployed', hint: 'Deploy ai-proxy first (Track 2)' }
    }

    setDbChecks([
      { label: 'Database', ...db },
      { label: 'Tables', ...tables },
      { label: 'Auth', ...auth },
    ])
    setRealtimeChecks([{ label: 'Realtime Channel', ...realtime }])
    setEdgeChecks([
      { label: 'webhook-gateway', ...webhookGw },
      { label: 'ai-proxy', ...aiProxy },
    ])
    setAiChecks([{ label: 'Gemini via ai-proxy', ...aiResult }])
    setSystemChecks([
      { label: 'Network', status: navigator.onLine ? 'ok' : 'error', detail: navigator.onLine ? 'Online' : 'Offline' },
      { label: 'Service Worker', status: 'serviceWorker' in navigator ? 'ok' : 'warn', detail: 'serviceWorker' in navigator ? 'Supported' : 'Unsupported' },
      { label: 'Offline Queue', ...offlineQ },
    ])

    setCheckedAt(new Date())
    setIsRunning(false)
  }, [])

  useEffect(() => {
    runChecks()
  }, [runChecks])

  const allChecks = [...dbChecks, ...realtimeChecks, ...edgeChecks, ...aiChecks, ...systemChecks]
  const totalOk = allChecks.filter(c => c.status === 'ok').length
  const totalErr = allChecks.filter(c => c.status === 'error').length
  const totalWarn = allChecks.filter(c => c.status === 'warn').length
  const isAllOk = totalErr === 0 && totalWarn === 0 && !isRunning

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-200 font-mono">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5 text-emerald-400" />
          <h1 className="text-sm font-bold uppercase tracking-widest text-white">System Health</h1>
          <span className="text-[10px] text-zinc-600 uppercase">RecruitOS v1.0 RC</span>
        </div>
        <div className="flex items-center gap-4">
          {checkedAt && (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <Clock className="w-3 h-3" />
              Last checked {checkedAt.toLocaleTimeString()}
            </div>
          )}
          <button
            onClick={runChecks}
            disabled={isRunning}
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} />
            Re-check
          </button>
        </div>
      </div>

      {/* Overall banner */}
      <div className={`px-6 py-3 border-b text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
        isRunning ? 'bg-zinc-900 border-zinc-800 text-zinc-400' :
        isAllOk ? 'bg-emerald-900/20 border-emerald-800/30 text-emerald-400' :
        totalErr > 0 ? 'bg-red-900/20 border-red-800/30 text-red-400' :
        'bg-amber-900/20 border-amber-800/30 text-amber-400'
      }`}>
        {isRunning ? (
          <><Loader2 className="w-3 h-3 animate-spin" /> Running probes...</>
        ) : isAllOk ? (
          <><CheckCircle className="w-3 h-3" /> All systems operational — {totalOk}/{allChecks.length} checks passed</>
        ) : (
          <><XCircle className="w-3 h-3" /> {totalErr} error{totalErr !== 1 ? 's' : ''}{totalWarn > 0 ? `, ${totalWarn} warning${totalWarn !== 1 ? 's' : ''}` : ''} — {totalOk}/{allChecks.length} checks passed</>
        )}
      </div>

      {/* Check grid */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto">
        <Section icon={Database} title="Database" checks={dbChecks} />
        <Section icon={Wifi} title="Realtime" checks={realtimeChecks} />
        <Section icon={Zap} title="Edge Functions" checks={edgeChecks} />
        <Section icon={Bot} title="AI — Gemini" checks={aiChecks} />
        <Section icon={Shield} title="System" checks={systemChecks} />
      </div>

      {/* Deployment guide hint */}
      {!isRunning && totalErr > 0 && (
        <div className="px-6 pb-6 max-w-5xl mx-auto">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-xs text-zinc-400 space-y-1">
            <p className="text-zinc-200 font-bold mb-2">Deployment quick reference</p>
            <p>Track 1 (CRM): <span className="text-emerald-400">supabase db push --linked</span></p>
            <p>Track 2 (AI):  <span className="text-emerald-400">supabase functions deploy ai-proxy</span> → set GEMINI_API_KEY secret</p>
            <p className="mt-2 text-zinc-600">See DEPLOYMENT.md for full instructions.</p>
          </div>
        </div>
      )}

      <div className="text-center text-[10px] text-zinc-700 pb-8 uppercase tracking-widest">
        RecruitOS System Diagnostics · /system
      </div>
    </div>
  )
}
