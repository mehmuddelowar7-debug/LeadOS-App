/**
 * Context Serializer
 * Formats the ContextSnapshot into various string representations.
 * RULE: Never import from providers/adapters/.
 */
import type { ContextSnapshot, SerializableDomain } from '../schemas/context'

export const ContextSerializer = {
  /**
   * Token-optimized minimal representation for AI API calls.
   * Strips nulls, empty arrays, and diagnostics.
   */
  compact(snapshot: ContextSnapshot): string {
    const cleanContext = JSON.parse(JSON.stringify(snapshot.context, (key, value) => {
      if (value === null) return undefined
      if (Array.isArray(value) && value.length === 0) return undefined
      if (key === 'diagnostics' || key === '_metadata') return undefined // _metadata handled separately if needed
      return value
    }))
    return JSON.stringify(cleanContext)
  },

  /**
   * Full detail JSON representation for debugging.
   */
  verbose(snapshot: ContextSnapshot): string {
    return JSON.stringify(snapshot.context, null, 2)
  },

  /**
   * Includes context + diagnostics for deep debugging.
   */
  debug(snapshot: ContextSnapshot): string {
    return JSON.stringify(snapshot, null, 2)
  },

  /**
   * Raw JSON dump.
   */
  toJSON(snapshot: ContextSnapshot): string {
    return JSON.stringify(snapshot.context)
  },

  /**
   * Human-readable markdown report for the context.
   */
  toMarkdown(snapshot: ContextSnapshot): string {
    const ctx = snapshot.context
    let md = `# RecruitOS Context v1 (Generated ${ctx._metadata.generatedAt})\n\n`
    
    md += `## Workspace Health: ${ctx.workspace.knowledge.pipelineHealth}\n`
    md += `- Total Candidates: ${ctx.workspace.knowledge.totalCandidates}\n`
    md += `- Conversion Rate: ${ctx.workspace.knowledge.conversionRate}%\n\n`

    md += `## Operations Mission\n`
    md += `- Calls to Make: ${ctx.operations.knowledge.mission.callsToMake}\n`
    md += `- Interviews to Confirm: ${ctx.operations.knowledge.mission.interviewsToConfirm}\n\n`

    return md
  },

  /**
   * Partial serialization — serialize ONE domain only.
   */
  serializeDomain(snapshot: ContextSnapshot, domain: SerializableDomain): string {
    const ctx = snapshot.context
    switch (domain) {
      case 'candidate': return JSON.stringify(ctx.candidates)
      case 'marketing': return JSON.stringify(ctx.marketing)
      case 'operations': return JSON.stringify(ctx.operations)
      case 'recruiter': return JSON.stringify(ctx.recruiter)
      case 'workspace': return JSON.stringify(ctx.workspace)
      default: throw new Error(`Unknown domain: ${domain}`)
    }
  }
}
