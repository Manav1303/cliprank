import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { url, clip_count, clip_duration, on_screen_text } = await req.json()
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

    const { data: job, error: jobError } = await supabaseAdmin
      .from('clip_jobs')
      .insert({ url, status: 'downloading' })
      .select()
      .single()

    if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 })

    const railwayUrl = process.env.RAILWAY_BACKEND_URL || 'https://cliprank-production.up.railway.app'
    const res = await fetch(`${railwayUrl}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, clip_count: clip_count || 3, clip_duration: clip_duration || 45, on_screen_text: on_screen_text || '' }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Railway error')

    await supabaseAdmin.from('clip_jobs').update({ status: 'done' }).eq('id', job.id)

    return NextResponse.json({ job_id: job.id, clips: data.clips, video_duration: data.video_duration })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
