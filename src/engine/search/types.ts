export type SearchResultType = 
  | 'candidate' 
  | 'campaign' 
  | 'creative' 
  | 'source' 
  | 'followup' 
  | 'interview' 
  | 'report' 
  | 'setting' 
  | 'action'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle?: string
  icon?: string // emoji or identifier for icon
  route: string
  keywords?: string[]
  priority: number // Base priority for default sorting before ranking
  
  // Computed fields
  rankScore?: number
}
