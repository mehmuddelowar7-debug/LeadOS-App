import { useState } from 'react'
import { Target, Loader2, Download, TrendingUp, Users } from 'lucide-react'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import { toast } from 'sonner'
import { downloadCsv, jsonToCsv } from '@/lib/export'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/AuthStore'

export function AnalyticsView() {
  const user = useAuthStore(state => state.user)
  const { data: metrics, isLoading } = useDashboardMetrics()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (type: string, label: string) => {
    if (!user) return
    const workspaceId = user.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000'
    const today = new Date()
    
    try {
      setIsExporting(true)
      toast.loading(`Generating ${label}...`, { id: 'export-toast' })
      let data: any[] | null = null
      
      if (type === 'end_day') {
        const startOfDay = new Date(today.setHours(0,0,0,0)).toISOString()
        const res = await supabase.from('contacts').select('id, name, phone, roles, origin, current_area, created_at').eq('workspace_id', workspaceId).gte('created_at', startOfDay)
        data = res.data
      } else if (type === 'weekly') {
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const res = await supabase.from('contacts').select('id, name, phone, roles, origin, current_area, created_at').eq('workspace_id', workspaceId).gte('created_at', lastWeek)
        data = res.data
      } else if (type === 'monthly') {
        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const res = await supabase.from('contacts').select('id, name, phone, roles, origin, current_area, created_at').eq('workspace_id', workspaceId).gte('created_at', lastMonth)
        data = res.data
      } else if (type === 'referral') {
        const res = await supabase.from('referrals').select('id, status, reward_status, reward_amount, payment_method, created_at, contacts(name, phone)').eq('workspace_id', workspaceId)
        data = res.data?.map(r => {
          const contact = Array.isArray(r.contacts) ? r.contacts[0] : r.contacts
          return {
            ...r,
            referrer_name: contact?.name,
            referrer_phone: contact?.phone,
            contacts: undefined 
          }
        }) || null
      }
      
      if (data && data.length > 0) {
        const csv = jsonToCsv(data)
        downloadCsv(`${type}_report_${new Date().getTime()}.csv`, csv)
        toast.success(`${label} exported successfully.`, { id: 'export-toast' })
      } else {
        toast.error(`No data found for ${label}.`, { id: 'export-toast' })
      }
    } catch (e) {
      console.error(e)
      toast.error(`Failed to generate ${label}.`, { id: 'export-toast' })
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    )
  }

  const conversionRate = metrics?.contacts.total ? Math.round((metrics.contacts.active / metrics.contacts.total) * 100) : 0

  return (
    <div className="flex flex-col h-full px-4 pt-4 md:px-6 lg:px-8 space-y-6 overflow-y-auto scrollbar-hide pb-32">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-black text-foreground tracking-tight">Insights</h1>
      </div>

      <div className="space-y-6">
        
        {/* Massive KPI Cards Above Fold */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-[24px] p-6 bg-primary/10 border-primary/20 flex flex-col justify-between shadow-sm touch-target col-span-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-primary uppercase tracking-wider">Network Size</span>
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="text-5xl font-black text-foreground tracking-tighter">{metrics?.contacts.total || 0}</div>
          </div>

          <div className="glass-card rounded-2xl p-4 flex flex-col justify-between shadow-sm touch-target">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Conversion</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-foreground tracking-tight">{conversionRate}%</div>
            <div className="text-[10px] text-muted-foreground mt-1 font-semibold">from {metrics?.contacts.active || 0} active</div>
          </div>
          
          <div className="glass-card rounded-2xl p-4 flex flex-col justify-between shadow-sm touch-target">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Target</span>
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-3xl font-black text-foreground tracking-tight">10</div>
            <div className="text-[10px] text-muted-foreground mt-1 font-semibold">daily goal</div>
          </div>
        </div>

        {/* Report Export Buttons */}
        <div className="pt-2 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Download className="h-5 w-5 text-violet-500" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Export Reports</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'End Day Report (Today)', type: 'end_day' },
              { label: 'Weekly Performance Report', type: 'weekly' },
              { label: 'Monthly Conversion Report', type: 'monthly' },
              { label: 'Referral & Earnings Ledger', type: 'referral' },
            ].map((report, i) => (
              <button 
                key={i} 
                disabled={isExporting}
                onClick={() => handleExport(report.type, report.label)}
                className="w-full min-h-[64px] flex justify-between items-center text-base font-bold bg-muted/50 p-4 rounded-2xl hover:bg-muted transition-colors border-2 border-transparent hover:border-primary/20 disabled:opacity-50 touch-target active:scale-[0.98]"
              >
                <span className="text-foreground">{report.label}</span>
                <Download className="h-6 w-6 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
