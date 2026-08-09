export const PIPELINE_THEME: Record<string, { bg: string, text: string, border: string }> = {
  // Old legacy keys
  new: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
  interested: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20' },
  registration: { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20' },
  recharge_pending: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
  recharge_completed: { bg: 'bg-teal-500/10', text: 'text-teal-500', border: 'border-teal-500/20' },
  training: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20' },
  activated: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
  lost: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' },
  // New pipeline keys
  lead: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
  interview: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' },
  selected: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20' },
  recharge: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
  joined: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' }
}

export type PipelineStageId = keyof typeof PIPELINE_THEME
