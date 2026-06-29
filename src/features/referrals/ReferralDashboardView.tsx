import { useState, useMemo } from 'react'
import { PerformanceProfiler } from '@/components/dev/PerformanceProfiler'
import { useRenderProfiler } from '@/hooks/useRenderProfiler'
import { Users, Award, Search, ArrowUpRight, CheckCircle2, Clock, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import { useReferrals } from '@/hooks/useReferrals'
import { useReferralEarnings } from '@/hooks/useReferralEarnings'
import { AddReferralSheet } from './AddReferralSheet'
import { Plus } from 'lucide-react'
import type { Referral } from '@/types'

const getContactName = (contactData: unknown): string => {
  if (Array.isArray(contactData)) return contactData[0]?.name || 'Unknown'
  if (contactData && typeof contactData === 'object' && 'name' in contactData) {
    return (contactData as { name: string }).name || 'Unknown'
  }
  return 'Unknown'
}

export function ReferralDashboardView() {
  const [search, setSearch] = useState('')
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [editingReferral, setEditingReferral] = useState<Referral | undefined>(undefined)

  const { data: metrics } = useDashboardMetrics()
  const { data: referrals, isLoading: loadingReferrals } = useReferrals()
  const { data: earnings, isLoading: loadingEarnings } = useReferralEarnings()

  useRenderProfiler('ReferralDashboardView', {}, { search, metrics, referrals, earnings })

  const filteredReferrals = useMemo(() => {
    return (referrals || []).filter(r =>
      getContactName((r as any).opportunity?.contact)?.toLowerCase().includes(search.toLowerCase()) ||
      getContactName(r.referrer)?.toLowerCase().includes(search.toLowerCase())
    )
  }, [referrals, search])

  if (loadingReferrals && !referrals) {
    // Skeleton shell: stats cards + list placeholders
    return (
      <div className="flex flex-col h-full px-4 pt-4 md:px-6 lg:px-8 space-y-6 pb-32">
        <div className="flex items-center justify-between pt-2">
          <div className="h-8 w-32 bg-muted animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 h-28 bg-muted animate-pulse rounded-[24px]" />
          <div className="h-20 bg-muted animate-pulse rounded-2xl" />
          <div className="h-20 bg-muted animate-pulse rounded-2xl" />
        </div>
        <div className="space-y-3 pt-2">
          {[1,2,3,4].map(i => <div key={i} className="h-20 w-full bg-muted animate-pulse rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <PerformanceProfiler id="ReferralDashboardView">
      <div className="flex flex-col h-full px-4 pt-4 md:px-6 lg:px-8 space-y-6 overflow-y-auto scrollbar-hide pb-32">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-black text-foreground tracking-tight">Referrals</h1>
        <Button 
          onClick={() => {
            setEditingReferral(undefined)
            setAddSheetOpen(true)
          }}
          className="min-h-[44px] bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold touch-target"
        >
          <Plus className="h-4 w-4 mr-2 stroke-[3]" /> Add Referral
        </Button>
      </div>

      {/* Massive Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 glass-card rounded-[24px] p-6 bg-primary/10 border-primary/20 flex flex-col justify-between shadow-sm touch-target">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-primary uppercase tracking-wider">Total Commission</span>
            <Award className="h-6 w-6 text-primary" />
          </div>
          <p className="text-5xl font-black text-foreground tracking-tighter">
            {loadingEarnings ? <span className="inline-block w-32 h-10 bg-primary/10 animate-pulse rounded" /> : `₹${(earnings?.total || 0).toLocaleString()}`}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between shadow-sm border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-foreground tracking-tight">₹{(earnings?.pending || 0).toLocaleString()}</p>
        </div>
        
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between shadow-sm border-blue-500/20 bg-blue-500/5">
           <div className="flex items-center justify-between mb-2">
             <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Approved</span>
             <CheckCircle2 className="h-4 w-4 text-blue-500" />
           </div>
           <p className="text-2xl font-black text-foreground tracking-tight">₹{(earnings?.approved || 0).toLocaleString()}</p>
        </div>

        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between shadow-sm border-emerald-500/20 bg-emerald-500/5">
           <div className="flex items-center justify-between mb-2">
             <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Paid</span>
             <Award className="h-4 w-4 text-emerald-500" />
           </div>
           <p className="text-2xl font-black text-foreground tracking-tight">₹{(earnings?.paid || 0).toLocaleString()}</p>
        </div>

        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between shadow-sm border-red-500/20 bg-red-500/5">
           <div className="flex items-center justify-between mb-2">
             <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Rejected</span>
             <X className="h-4 w-4 text-red-500" />
           </div>
           <p className="text-2xl font-black text-foreground tracking-tight">₹{(earnings?.rejected || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative pt-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 mt-1 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search referrals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 h-14 rounded-2xl text-lg bg-muted/50 border-transparent focus:bg-background shadow-sm"
        />
      </div>

      {/* Referral List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Recent Referrals</h2>
        {filteredReferrals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="font-bold">No referrals yet.</p>
          </div>
        ) : filteredReferrals.map((ref) => (
          <div key={ref.id} className="relative">
            <div
              onClick={() => {
                setEditingReferral(ref as unknown as Referral)
                setAddSheetOpen(true)
              }}
              className={cn("glass-card rounded-2xl p-4 flex items-center justify-between z-10 relative shadow-sm cursor-pointer active:scale-95 transition-transform", ref.status === 'paid' && ref.paid_date ? "rounded-b-none border-b-0" : "")}
            >
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-foreground truncate">{getContactName((ref as any).opportunity?.contact) || 'Unknown Candidate'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 text-primary" />
                  By <span className="font-bold text-foreground truncate">{getContactName(ref.referrer) || 'Unknown'}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-lg font-black text-foreground tracking-tight">₹{ref.commission_amount || 0}</p>
                {ref.status === 'paid' ? (
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-500 mt-1 bg-emerald-500/10 px-2 py-0.5 rounded-full capitalize">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Paid
                  </span>
                ) : ref.status === 'approved' ? (
                  <span className="inline-flex items-center text-[10px] font-bold text-blue-500 mt-1 bg-blue-500/10 px-2 py-0.5 rounded-full capitalize">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                  </span>
                ) : ref.status === 'rejected' ? (
                  <span className="inline-flex items-center text-[10px] font-bold text-red-500 mt-1 bg-red-500/10 px-2 py-0.5 rounded-full capitalize">
                    <X className="h-3 w-3 mr-1" /> Rejected
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-bold text-amber-500 mt-1 bg-amber-500/10 px-2 py-0.5 rounded-full capitalize">
                    <Clock className="h-3 w-3 mr-1" /> Pending
                  </span>
                )}
              </div>
            </div>
            {ref.status === 'paid' && ref.paid_date && (
              <div className="bg-muted/30 border-x border-b border-border/50 rounded-b-2xl p-3 text-xs text-muted-foreground relative z-0 font-medium flex items-center justify-between">
                <span>Paid Date: <span className="font-mono text-foreground">{ref.paid_date}</span></span>
                {ref.remarks && <span className="truncate max-w-[50%] text-right">{ref.remarks}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
      </div>

      <AddReferralSheet 
        open={addSheetOpen} 
        onClose={() => {
          setAddSheetOpen(false)
          setEditingReferral(undefined)
        }} 
        existingReferral={editingReferral}
      />
    </PerformanceProfiler>
  )
}
