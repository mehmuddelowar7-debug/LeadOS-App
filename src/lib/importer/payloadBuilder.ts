import { ColumnMapping } from '@/features/imports/store/importStore'
import { normalizePhone, normalizeString, normalizeDate } from './normalizer'
import { mapPipelineStage, mapSource, mapConnectionStatus, mapCandidateCategory } from './enumMappings'

export const buildPayload = (row: any, mapConfig: ColumnMapping[], workspaceId: string, userId: string) => {
  const result: any = {
    workspace_id: workspaceId,
    created_by: userId,
    custom_fields: {},
    opportunity: {},
    activities: [],
    finance: {}
  }

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

  return result
}
