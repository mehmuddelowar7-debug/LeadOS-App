// supabase/functions/ai-proxy/index.ts
// AI Proxy Edge Function — forwards PromptDocument to Gemini API
// Deployed on Supabase, keyed by GEMINI_API_KEY secret
// Constraint: No changes to builders/, schemas/, PromptBuilder, or RecruitOSContext v1.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")
const GEMINI_MODEL = "gemini-2.5-flash"
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

interface PromptMessage {
  role: "user" | "assistant"
  content: string
}

interface PromptDocument {
  system: string
  messages: PromptMessage[]
  metadata?: Record<string, unknown>
}

interface RequestBody {
  document: PromptDocument
  memory?: PromptDocument[]
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  if (!GEMINI_API_KEY) {
    console.error("[ai-proxy] GEMINI_API_KEY secret is not set")
    return new Response(
      JSON.stringify({ error: "AI provider not configured. Set GEMINI_API_KEY in Supabase secrets." }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const { document, memory = [] } = body

  if (!document?.messages?.length) {
    return new Response(JSON.stringify({ error: "document.messages is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // Build Gemini content array from memory + current document
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = []

  // Add memory context (prior conversations)
  for (const mem of memory) {
    for (const msg of mem.messages) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })
    }
  }

  // Add current document messages
  for (const msg of document.messages) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    })
  }

  const geminiPayload = {
    system_instruction: {
      parts: [{ text: document.system || "You are RecruitOS AI, an expert recruiting assistant." }],
    },
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  }

  try {
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    })

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error("[ai-proxy] Gemini API error:", geminiResponse.status, errText)
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${geminiResponse.status}`, detail: errText }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const geminiData = await geminiResponse.json()
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""

    // Try to parse as JSON (for structured prompts), fallback to raw text
    let parsedContent: unknown
    try {
      parsedContent = JSON.parse(rawText)
    } catch {
      parsedContent = { content: rawText, role: "assistant" }
    }

    return new Response(JSON.stringify(parsedContent), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[ai-proxy] Unexpected error:", message)
    return new Response(JSON.stringify({ error: `Internal error: ${message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
