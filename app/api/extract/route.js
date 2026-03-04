import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are extracting structured context from a person's professional background to seed a personal AI memory system.

Given the raw text (LinkedIn profile, resume, job description, or any professional bio), extract meaningful, specific thoughts across these categories:

1. CAREER HISTORY: Key roles, companies, transitions, major accomplishments. One thought per significant role or milestone.
2. CURRENT ROLE: Responsibilities, team size, stakeholders, key projects, challenges. Be specific.
3. GOALS & PRIORITIES: Career goals, current priorities, what success looks like for them. Infer from context where explicit.
4. KEY PEOPLE: Named people mentioned — their relationship, role, and context. One thought per person.
5. COMMUNICATION STYLE: Infer their communication and work style from language, roles, and context.

Rules:
- Each thought should be a complete, specific sentence that stands alone
- Write in third person using their name if available, otherwise "they"
- Be specific, avoid vague generalities
- Extract 3-6 thoughts per category minimum
- Return ONLY valid JSON, no markdown, no explanation

Return this exact structure:
{
  "career": ["thought1", "thought2"],
  "role": ["thought1", "thought2"],
  "goals": ["thought1", "thought2"],
  "people": ["thought1", "thought2"],
  "communication": ["thought1", "thought2"]
}`

export async function POST(request) {
  try {
    const { text, anthropicKey } = await request.json()
    if (!text || !anthropicKey) {
      return NextResponse.json({ error: 'Missing text or API key' }, { status: 400 })
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text }],
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      if (res.status === 401) {
        return NextResponse.json({ error: 'Invalid Anthropic API key. Check your credentials in Settings.' }, { status: 401 })
      }
      return NextResponse.json({ error: err.error?.message || 'Anthropic API error' }, { status: res.status })
    }
    const data = await res.json()
    const raw = data.content[0].text.replace(/json|/g, '').trim()
    const extracted = JSON.parse(raw)
    return NextResponse.json({ thoughts: extracted })
  } catch (e) {
    return NextResponse.json({ error: 'Extraction failed: ' + e.message }, { status: 500 })
  }
}
