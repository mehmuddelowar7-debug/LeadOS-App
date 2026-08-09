import type { AIProvider, AssistantResponse } from '../types'
import type { PromptDocument } from '../../schemas/context'
import { GeminiDirectProvider } from './GeminiDirectProvider'
import { supabase } from '@/lib/supabase' 
import { env } from '@/config/env'

const IS_DEV = import.meta.env.DEV

export class EdgeFunctionAdapter implements AIProvider {
  private provider: AIProvider
  
  get capabilities() {
    return this.provider.capabilities
  }

  constructor() {
    // In local dev, if a Gemini key is provided, we bypass Edge Functions 
    // to avoid needing a local Supabase instance spun up.
    if (IS_DEV && env.VITE_GEMINI_API_KEY) {
      this.provider = new GeminiDirectProvider()
    } else {
      // In production, or without local keys, the adapter would fall back to Supabase.
      // But for this adapter, we will assume Supabase Edge Function is the target.
      // We still map 'capabilities' to the real GeminiDirectProvider to mimic what the Edge function supports.
      this.provider = new GeminiDirectProvider() 
    }
  }

  async send<T = AssistantResponse>(document: PromptDocument, memory?: PromptDocument[], signal?: AbortSignal): Promise<T> {
    if (IS_DEV && env.VITE_GEMINI_API_KEY) {
      return this.provider.send<T>(document, memory, signal)
    }

    // Call actual Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: { document, memory }
    })

    if (error) {
      throw new Error(`AI Edge Function Failed: ${error.message}`)
    }

    return data as T
  }



  async stream(document: PromptDocument, callbacks: import('../types').StreamCallbacks, memory?: PromptDocument[], signal?: AbortSignal): Promise<void> {
    if (IS_DEV && env.VITE_GEMINI_API_KEY && this.provider.stream) {
      return this.provider.stream(document, callbacks, memory, signal)
    }

    throw new Error('NotImplemented: EdgeFunctionAdapter streaming not yet implemented.')
  }
}
