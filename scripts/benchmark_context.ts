import fs from 'fs'
import path from 'path'
import { ContextSerializer } from '../src/sdk/ai/serializer/contextSerializer'
import type { CandidateKnowledge, ContextSnapshot, RecruitOSContext } from '../src/sdk/ai/schemas/context'

function generateMockCandidates(count: number): CandidateKnowledge[] {
  const candidates: CandidateKnowledge[] = []
  for (let i = 0; i < count; i++) {
    candidates.push({
      id: `c_${i}`,
      name: `Candidate ${i}`,
      phone: `+9199999${i.toString().padStart(5, '0')}`,
      stage: ['New', 'Contacted', 'Interview', 'Selected'][i % 4],
      health: ['Healthy', 'Warning', 'Critical', 'Completed'][i % 4] as any,
      priority: ['P0', 'P1', 'P2', 'P3'][i % 4] as any,
      risk: ['Low', 'Medium', 'High', 'Critical'][i % 4] as any,
      nextAction: 'Follow up',
      daysSinceContact: i % 10,
      daysSinceStageChange: i % 5,
      daysInCurrentStage: i % 5,
      slaBreached: i % 10 === 0,
      activeAutomations: ['auto_reply'],
      interviews: [],
      followUps: [],
      touchpoints: [],
      acquisitionSource: 'Facebook',
      acquisitionCampaign: 'August Drive',
      attributedAt: new Date().toISOString(),
      _sources: ['contacts']
    })
  }
  return candidates
}

function createMockSnapshot(candidateCount: number): ContextSnapshot {
  const allCandidates = generateMockCandidates(candidateCount)
  const byId = new Map(allCandidates.map(c => [c.id, c]))
  
  const context: RecruitOSContext = {
    _version: 'v1',
    _metadata: {
      contextVersion: 'v1',
      generatedAt: new Date().toISOString(),
      buildDurationMs: 0,
      candidateCount,
      marketingCount: 5,
      workspaceId: 'ws_1',
      cacheRevision: 'rev_1',
      masked: false
    },
    candidates: {
      index: {
        all: allCandidates,
        byId,
        byPriority: { P0: [], P1: [], P2: [], P3: [] },
        byRisk: { Low: [], Medium: [], High: [], Critical: [] },
        byStage: new Map(),
        byHealth: { Healthy: [], Warning: [], Critical: [], Completed: [] }
      },
      diagnostics: { domain: 'candidates', durationMs: 0, processed: candidateCount, diagnostics: [] }
    },
    marketing: {
      knowledge: {
        totalSources: 1, totalCampaigns: 1, totalLeadsGenerated: 100, totalJoined: 10, overallConversionRate: 10,
        topPerformingSource: 'FB', worstPerformingSource: 'IG', sources: [], campaigns: [], recommendations: [], recentImports: []
      },
      diagnostics: { domain: 'marketing', durationMs: 0, processed: 1, diagnostics: [] }
    },
    operations: {
      knowledge: {
        mission: { callsToMake: 10, interviewsToConfirm: 5, rechargesToCollect: 2, referralsToAsk: 1, totalActionable: 18 },
        queues: { toCall: 10, recharge: 2, interviews: 5, cold: 0, stale: 0 },
        automations: { totalPending: 0, escalations: 0, suggestions: 0 },
        sla: { breached: 0, atRisk: 0 }
      },
      diagnostics: { domain: 'operations', durationMs: 0, processed: 1, diagnostics: [] }
    },
    recruiter: {
      knowledge: {
        workload: { estimatedHoursToday: 4, tasksCompleted: 5, tasksPending: 15 },
        todayHighlights: { interviewsScheduled: 5, followUpsDue: 10, rechargesDue: 2 },
        recentActivity: []
      },
      diagnostics: { domain: 'recruiter', durationMs: 0, processed: 1, diagnostics: [] }
    },
    workspace: {
      knowledge: {
        totalCandidates: candidateCount, activeCandidates: candidateCount, joinedThisMonth: 10, joinedThisWeek: 5,
        conversionRate: 10, pipelineHealth: 'Healthy', kpis: []
      },
      diagnostics: { domain: 'workspace', durationMs: 0, processed: 1, diagnostics: [] }
    }
  }

  return {
    id: `snap_${candidateCount}`,
    context,
    diagnostics: [],
    serial: 1,
    createdAt: new Date().toISOString()
  }
}

async function runBenchmark() {
  const counts = [100, 500, 1000, 2500, 5000]
  
  let md = `# AI Context Build & Serialization Benchmark\n\n`
  md += `| Candidates | Build Memory (MB) | Serialized Size (KB) | Serialize Time (ms) | Approx Tokens |\n`
  md += `|------------|-------------------|----------------------|---------------------|---------------|\n`

  for (const count of counts) {
    global.gc?.()
    const memBefore = process.memoryUsage().heapUsed

    const snapshot = createMockSnapshot(count)
    
    const start = performance.now()
    // Test the specific compact serialization used for prompts
    const compactString = ContextSerializer.compact(snapshot)
    const timeTaken = performance.now() - start
    
    const memAfter = process.memoryUsage().heapUsed
    const memDiff = Math.max(0, (memAfter - memBefore) / 1024 / 1024).toFixed(2)
    
    const sizeKb = (Buffer.byteLength(compactString, 'utf8') / 1024).toFixed(2)
    const approxTokens = Math.floor(compactString.length / 4) // Rough estimate for LLMs
    
    md += `| ${count} | ${memDiff} MB | ${sizeKb} KB | ${timeTaken.toFixed(2)} ms | ~${approxTokens.toLocaleString()} |\n`
  }

  // Need to write it to the artifact directory. I'll print it and the calling agent will write it, 
  // or I'll just write it directly.
  const outPath = path.resolve(process.env.HOME || '', '.gemini/antigravity-ide/brain/cd43389f-84a5-43b8-bf61-4731cd591f0a/MEMORY_PROFILE.md')
  fs.writeFileSync(outPath, md)
  console.log(`Benchmark complete. Results written to ${outPath}`)
}

runBenchmark()
