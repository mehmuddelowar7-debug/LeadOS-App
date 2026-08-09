/**
 * Context Builder (Composer)
 * Assembles domain contexts into RecruitOSContext v1 and wraps in ContextSnapshot.
 * RULE: Never import from providers/adapters/.
 */
import type {
  RecruitOSContext, ContextSnapshot, CandidateContext, MarketingContext,
  OperationsContext, RecruiterContext, WorkspaceContext
} from '../schemas/context'

/** 
 * Deterministic hash function for cacheRevision. 
 * Prevents unnecessary downstream recomputations.
 */
function hashStrings(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return hash.toString(36)
}

interface ComposeContextArgs {
  candidateCtx:  CandidateContext
  marketingCtx:  MarketingContext
  operationsCtx: OperationsContext
  recruiterCtx:  RecruiterContext
  workspaceCtx:  WorkspaceContext
  workspaceId:   string
  masked:        boolean
  
  // Cache revisions from React Query to deterministically hash the total context revision
  candidateRev:  number
  marketingRev:  number
  operationsRev: number
  workspaceRev:  number
}

let serialCounter = 0

export function buildRecruitOSContext(args: ComposeContextArgs): ContextSnapshot {
  const t0 = performance.now()
  
  const cacheRevisionStr = `${args.candidateRev}-${args.marketingRev}-${args.operationsRev}-${args.workspaceRev}`
  const cacheRevision = hashStrings(cacheRevisionStr)

  const context: RecruitOSContext = {
    _version: 'v1',
    _metadata: {
      contextVersion:  'v1',
      generatedAt:     new Date().toISOString(),
      buildDurationMs: 0, // Assigned below
      candidateCount:  args.candidateCtx.index.all.length,
      marketingCount:  args.marketingCtx.knowledge.totalCampaigns + args.marketingCtx.knowledge.totalSources,
      workspaceId:     args.workspaceId,
      cacheRevision,
      masked:          args.masked,
    },
    candidates: args.candidateCtx,
    marketing:  args.marketingCtx,
    operations: args.operationsCtx,
    recruiter:  args.recruiterCtx,
    workspace:  args.workspaceCtx,
  }

  const durationMs = performance.now() - t0
  context._metadata.buildDurationMs = durationMs

  const snapshot: ContextSnapshot = {
    id:          crypto.randomUUID ? crypto.randomUUID() : `ctx-${Date.now()}`,
    context,
    diagnostics: [
      args.candidateCtx.diagnostics,
      args.marketingCtx.diagnostics,
      args.operationsCtx.diagnostics,
      args.recruiterCtx.diagnostics,
      args.workspaceCtx.diagnostics,
    ],
    serial:      ++serialCounter,
    createdAt:   context._metadata.generatedAt,
  }

  return snapshot
}
