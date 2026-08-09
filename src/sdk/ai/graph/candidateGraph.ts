/**
 * Candidate Graph Module
 * Builds Map-indexed relationships from raw cache arrays.
 * Pure functions — no side effects, no imports from builders or providers.
 */
import type { CandidateTouchpointRecord } from '../schemas/context'

export interface CandidateGraphIndexes {
  /** interviews by contactId */
  interviewsByContact:  Map<string, any[]>
  /** followUps by contactId */
  followUpsByContact:   Map<string, any[]>
  /** touchpoints by contactId */
  touchpointsByContact: Map<string, CandidateTouchpointRecord[]>
  /** attribution by contactId (first attribution entry) */
  attributionByContact: Map<string, { sourceName: string | null, campaignName: string | null, attributedAt: string | null }>
}

export function buildCandidateGraphIndexes(
  interviews: any[],
  followUps:  any[],
  touchpoints: any[],
  attributions: any[],
  sources: any[],
  campaigns: any[],
): CandidateGraphIndexes {

  // Index: interviews by contact
  const interviewsByContact = new Map<string, any[]>()
  for (const i of interviews) {
    if (!interviewsByContact.has(i.contact_id)) interviewsByContact.set(i.contact_id, [])
    interviewsByContact.get(i.contact_id)!.push(i)
  }

  // Index: followUps by contact
  const followUpsByContact = new Map<string, any[]>()
  for (const f of followUps) {
    if (!followUpsByContact.has(f.contact_id)) followUpsByContact.set(f.contact_id, [])
    followUpsByContact.get(f.contact_id)!.push(f)
  }

  // Index: touchpoints by contact (with source name resolved)
  const sourceNameById = new Map<string, string>(sources.map(s => [s.id, s.name]))
  const touchpointsByContact = new Map<string, CandidateTouchpointRecord[]>()
  for (const t of touchpoints) {
    if (!touchpointsByContact.has(t.contact_id)) touchpointsByContact.set(t.contact_id, [])
    touchpointsByContact.get(t.contact_id)!.push({
      eventType: t.event_type,
      timestamp: t.timestamp,
      source:    sourceNameById.get(t.source_id ?? '') ?? 'Unknown',
    })
  }

  // Index: attribution by contact (earliest attribution per contact)
  const campaignNameById = new Map<string, string>(campaigns.map(c => [c.id, c.name]))
  const attributionByContact = new Map<string, { sourceName: string | null, campaignName: string | null, attributedAt: string | null }>()
  for (const a of attributions) {
    if (!attributionByContact.has(a.contact_id)) {
      attributionByContact.set(a.contact_id, {
        sourceName:   sourceNameById.get(a.source_id ?? '') ?? null,
        campaignName: campaignNameById.get(a.campaign_id ?? '') ?? null,
        attributedAt: a.created_at ?? null,
      })
    }
  }

  return { interviewsByContact, followUpsByContact, touchpointsByContact, attributionByContact }
}
