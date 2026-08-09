import { get, set } from 'idb-keyval'
import { supabase } from './supabase'

const IDB_ANALYTICS_KEY = 'leados_analytics'

export type AnalyticsState = {
  screenViews: Record<string, { count: number; totalTimeMs: number }>
  events: Record<string, number>
  searchTerms: Record<string, number>
  syncStats: {
    success: number
    failed: number
  }
}

const defaultState: AnalyticsState = {
  screenViews: {},
  events: {},
  searchTerms: {},
  syncStats: { success: 0, failed: 0 }
}

async function getState(): Promise<AnalyticsState> {
  try {
    const data = await get<AnalyticsState>(IDB_ANALYTICS_KEY)
    return data || defaultState
  } catch (e) {
    return defaultState
  }
}

async function saveState(state: AnalyticsState) {
  try {
    await set(IDB_ANALYTICS_KEY, state)
  } catch (e) {
    console.error('Failed to save analytics', e)
  }
}

class Analytics {
  private memoryState: AnalyticsState | null = null

  private async getActiveState() {
    if (!this.memoryState) {
      this.memoryState = await getState()
    }
    return this.memoryState
  }

  private async persist() {
    if (this.memoryState) {
      await saveState(this.memoryState)
    }
  }

  async trackScreenView(screenName: string, durationMs: number) {
    const state = await this.getActiveState()
    if (!state.screenViews[screenName]) {
      state.screenViews[screenName] = { count: 0, totalTimeMs: 0 }
    }
    state.screenViews[screenName].count += 1
    state.screenViews[screenName].totalTimeMs += durationMs
    this.persist()
  }

  async trackEvent(category: string, action: string, label?: string) {
    const state = await this.getActiveState()
    const key = [category, action, label].filter(Boolean).join(':')
    state.events[key] = (state.events[key] || 0) + 1
    this.persist()
  }

  async trackSearch(term: string) {
    const state = await this.getActiveState()
    const t = term.toLowerCase().trim()
    if (t) {
      state.searchTerms[t] = (state.searchTerms[t] || 0) + 1
      this.persist()
    }
  }

  async trackSyncResult(success: boolean) {
    const state = await this.getActiveState()
    if (success) state.syncStats.success += 1
    else state.syncStats.failed += 1
    this.persist()
  }

  async getReport() {
    return await this.getActiveState()
  }

  // Future: optional sync to Supabase (e.g. daily/weekly flush)
  async syncToCloud() {
    if (!navigator.onLine) return
    const state = await this.getActiveState()
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return
      
      const payload = {
        user_id: user.id,
        workspace_id: user.user_metadata?.workspace_id,
        screen_views: state.screenViews,
        events: state.events,
        search_terms: state.searchTerms,
        sync_stats: state.syncStats,
        recorded_at: new Date().toISOString()
      }

      const { error } = await supabase.from('analytics_events').insert(payload)
      if (!error) {
        // Clear local after sync? Or keep rolling window. For now just keep.
      }
    } catch (e) {
      // ignore
    }
  }
}

export const analytics = new Analytics()
