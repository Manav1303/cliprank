import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { supabaseAdmin } from '@/lib/supabase'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const { job_id, output_path } = await req.json()
    const outputDir = path.join('/tmp', job_id)

    // Get video duration
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${output_path}"`
    )
    const duration = parseFloat(stdout.trim())

    const clips = []
    const clipDuration = duration <= 60 ? duration : 45

    // Create 3 clips from different parts
    const startPoints = duration <= 60
      ? [0]
      : [0, Math.floor(duration * 0.3), Math.floor(duration * 0.6)]

    for (let i = 0; i < startPoints.length; i++) {
      const start = startPoints[i]
      const clipPath = path.join(outputDir, `clip_${i + 1}.mp4`)

      await execAsync(
        `ffmpeg -i "${output_path}" -ss ${start} -t ${clipDuration} -c:v libx264 -c:a aac -y "${clipPath}"`
      )

      const clipSize = fs.statSync(clipPath).size
      clips.push({ filename: `clip_${i + 1}.mp4`, path: clipPath, duration: clipDuration, size: clipSize })
    }

    // Save clips to Supabase
    for (const clip of clips) {
      await supabaseAdmin.from('clips').insert({
        job_id,
        filename: clip.filename,
        duration: clip.duration,
      })
    }

    await supabaseAdmin.from('clip_jobs').update({ status: 'done' }).eq('id', job_id)

    return NextResponse.json({ clips, job_id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
