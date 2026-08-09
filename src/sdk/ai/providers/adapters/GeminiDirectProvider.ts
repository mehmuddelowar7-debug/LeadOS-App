import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIProvider, AssistantResponse, ProviderCapabilities, StreamCallbacks } from '../types'
import type { PromptDocument } from '../../schemas/context'
import { env } from '@/config/env'

export class GeminiDirectProvider implements AIProvider {
  capabilities: ProviderCapabilities = {
    streaming: true,
    jsonMode: true,
    functionCalling: false
  }

  private genAI: GoogleGenerativeAI | null = null

  constructor() {
    if (env.VITE_GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(env.VITE_GEMINI_API_KEY)
    }
  }

  private getModel(jsonMode: boolean = false) {
    if (!this.genAI) {
      throw new Error('Gemini API key is not configured.')
    }
    
    // Use gemini-1.5-flash for speed, or gemini-1.5-pro for reasoning
    return this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: jsonMode ? { responseMimeType: 'application/json' } : undefined
    })
  }

  private buildPromptText(document: PromptDocument): string {
    return `
SYSTEM INSTRUCTIONS:
${document.system}

CONTEXT:
${document.context}

USER REQUEST:
${document.instructions}
`
  }

  async send<T = AssistantResponse>(
    document: PromptDocument,
    _memory?: PromptDocument[],
    signal?: AbortSignal
  ): Promise<T> {
    const isJsonExpected = document.instructions.toLowerCase().includes('json') || document.system.toLowerCase().includes('json')
    const model = this.getModel(isJsonExpected)
    
    // Basic memory handling could be added here by mapping memory to chat history
    
    const prompt = this.buildPromptText(document)
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }, { signal })

    const text = result.response.text()

    if (isJsonExpected) {
      try {
        return JSON.parse(text) as T
      } catch (err) {
        console.error('Failed to parse Gemini JSON:', text)
        throw new Error('Invalid JSON response from AI')
      }
    }

    return {
      message: text,
      actions: [],
      citations: [],
      confidence: 'high'
    } as unknown as T
  }

  async stream(
    document: PromptDocument,
    callbacks: StreamCallbacks,
    _memory?: PromptDocument[],
    signal?: AbortSignal
  ): Promise<void> {
    try {
      const isJsonExpected = document.instructions.toLowerCase().includes('json') || document.system.toLowerCase().includes('json')
      const model = this.getModel(isJsonExpected)
      
      const prompt = this.buildPromptText(document)
      
      callbacks.onStart()
      
      const result = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }, { signal })

      let fullText = ''
      
      for await (const chunk of result.stream) {
        if (signal?.aborted) {
          throw new Error('AbortError')
        }
        const chunkText = chunk.text()
        fullText += chunkText
        
        // Only stream tokens if we aren't expecting a pure JSON blob that needs parsing at the end
        if (!isJsonExpected) {
          callbacks.onToken(chunkText)
        }
      }

      if (isJsonExpected) {
        try {
          const parsed = JSON.parse(fullText)
          callbacks.onComplete(parsed)
        } catch (e) {
          callbacks.onError(new Error('Failed to parse JSON stream'))
        }
      } else {
        callbacks.onComplete({
          message: fullText,
          actions: [],
          citations: [],
          confidence: 'high'
        })
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message.includes('AbortError')) {
        callbacks.onError(new Error('AbortError'))
      } else {
        callbacks.onError(err)
      }
    }
  }
}
