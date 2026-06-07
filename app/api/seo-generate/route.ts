import { NextRequest, NextResponse } from 'next/server'
import { groq } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { url, niche, clip_number } = await req.json()

    const prompt = `You are a viral social media SEO expert. Generate optimized SEO content for a short video clip.

Video source URL: ${url}
Niche: ${niche || 'general'}
Clip number: ${clip_number || 1}

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "youtube": {
    "title": "<catchy YouTube title under 60 chars>",
    "description": "<YouTube description 150 words with keywords>",
    "tags": ["<15 relevant YouTube tags>"]
  },
  "facebook": {
    "caption": "<engaging Facebook caption with emojis>",
    "tags": ["<10 Facebook hashtags>"]
  },
  "tiktok": {
    "caption": "<punchy TikTok caption under 150 chars>",
    "tags": ["<10 TikTok hashtags>"]
  },
  "instagram": {
    "caption": "<Instagram caption with hook and CTA>",
    "tags": ["<15 Instagram hashtags>"]
  },
  "best_time": {
    "youtube": "<best day and time to post>",
    "facebook": "<best day and time to post>",
    "tiktok": "<best day and time to post>",
    "instagram": "<best day and time to post>"
  }
}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const text = completion.choices[0].message.content || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    const result = JSON.parse(clean.slice(start, end + 1))
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
