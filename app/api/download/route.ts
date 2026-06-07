import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { supabaseAdmin } from '@/lib/supabase'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

    // Create job in Supabase
    const { data: job, error: jobError } = await supabaseAdmin
      .from('clip_jobs')
      .insert({ url, status: 'downloading' })
      .select()
      .single()

    if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 })

    const outputDir = path.join('/tmp', job.id)
    fs.mkdirSync(outputDir, { recursive: true })

    const outputPath = path.join(outputDir, 'original.mp4')

    // Download video
    await execAsync(
      `yt-dlp -f "best[ext=mp4]/best" --merge-output-format mp4 -o "${outputPath}" "${url}"`,
      { timeout: 120000 }
    )

    // Update status
    await supabaseAdmin
      .from('clip_jobs')
      .update({ status: 'clipping' })
      .eq('id', job.id)

    return NextResponse.json({ job_id: job.id, output_path: outputPath })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
