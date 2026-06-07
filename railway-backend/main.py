from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import os
import uuid
import imageio_ffmpeg

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

class DownloadRequest(BaseModel):
    url: str
    clip_count: int = 3
    clip_duration: int = 45
    on_screen_text: str = ""

@app.get("/health")
def health():
    return {
        "status": "ok",
        "ffmpeg": FFMPEG,
        "yt_dlp": subprocess.run(["which", "yt-dlp"], capture_output=True, text=True).stdout.strip()
    }

@app.post("/process")
async def process_video(req: DownloadRequest):
    job_id = str(uuid.uuid4())
    work_dir = f"/tmp/{job_id}"
    os.makedirs(work_dir, exist_ok=True)

    try:
        original = f"{work_dir}/original.mp4"
        subprocess.run([
            "yt-dlp", "-f", "best[ext=mp4]/best",
            "--merge-output-format", "mp4",
            "-o", original, req.url
        ], check=True, timeout=180)

        result = subprocess.run([FFMPEG, "-i", original], capture_output=True, text=True)
        duration = None
        for line in result.stderr.split('\n'):
            if 'Duration' in line:
                time_str = line.split('Duration:')[1].split(',')[0].strip()
                h, m, s = time_str.split(':')
                duration = int(h)*3600 + int(m)*60 + float(s)
                break
        if not duration:
            duration = 60

        clip_dur = min(req.clip_duration, duration)
        max_start = max(0, duration - clip_dur)
        step = max_start / max(req.clip_count, 1)
        start_points = [int(i * step) for i in range(req.clip_count)]

        clips = []
        for i, start in enumerate(start_points):
            clip_path = f"{work_dir}/clip_{i+1}.mp4"

            subprocess.run([
                FFMPEG, "-i", original,
                "-ss", str(start), "-t", str(clip_dur),
                "-c:v", "libx264", "-c:a", "aac", "-y", clip_path
            ], check=True, timeout=180)

            clips.append({
                "filename": f"clip_{i+1}.mp4",
                "path": clip_path,
                "start": start,
                "duration": clip_dur,
                "size": os.path.getsize(clip_path)
            })

        return {"job_id": job_id, "clips": clips, "video_duration": duration}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from fastapi.responses import FileResponse

@app.get("/download/{job_id}/{filename}")
def download_clip(job_id: str, filename: str):
    path = f"/tmp/{job_id}/{filename}"
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type="video/mp4", filename=filename)
