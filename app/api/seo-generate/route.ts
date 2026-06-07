import { NextRequest, NextResponse } from 'next/server'
import { groq } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { url, niche, clip_number, brief } = await req.json()

    const briefSection = brief ? `\nCampaign Brief:\n${brief}\n\nIMPORTANT: Follow the brief rules strictly. Generate on-screen text that matches the campaign guidelines.` : ''

    const prompt = `You are a viral social media SEO expert and video editor.${briefSection}

Video URL: ${url}
Niche: ${niche || 'general'}
Clip number: ${clip_number || 1}

Generate optimized content. Respond ONLY with valid JSON, no markdown:
{
  "on_screen_text": "<short punchy text to burn onto the video, following brief rules if provided>",
  "youtube": {
    "title": "<catchy YouTube Shorts title under 60 chars>",
    "description": "<YouTube description with keywords>",
    "tags": ["<15 tags>"]
  },
  "facebook": {
    "caption": "<engaging Facebook caption>",
    "tags": ["<10 hashtags>"]
  },
  "tiktok": {
    "caption": "<punchy TikTok caption under 150 chars>",
    "tags": ["<10 hashtags>"]
  },
  "instagram": {
    "caption": "<Instagram caption with hook and CTA>",
    "tags": ["<15 hashtags>"]
  },
  "best_time": {
    "youtube": "<best posting time>",
    "facebook": "<best posting time>",
    "tiktok": "<best posting time>",
    "instagram": "<best posting time>"
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
