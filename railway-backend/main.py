from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import os
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Find ffmpeg/ffprobe paths
def find_binary(name):
    result = subprocess.run(["find", "/", "-name", name, "-type", "f"], 
                          capture_output=True, text=True, timeout=10)
    lines = [l for l in result.stdout.strip().split('\n') if l and 'nix' in l]
    return lines[0] if lines else name

FFMPEG = find_binary("ffmpeg")
FFPROBE = find_binary("ffprobe")

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
        "ffprobe": FFPROBE,
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

        result = subprocess.run([
            FFPROBE, "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            original
        ], capture_output=True, text=True, check=True)
        duration = float(result.stdout.strip())

        clip_dur = min(req.clip_duration, duration)
        max_start = max(0, duration - clip_dur)
        step = max_start / max(req.clip_count, 1)
        start_points = [int(i * step) for i in range(req.clip_count)]

        clips = []
        for i, start in enumerate(start_points):
            clip_path = f"{work_dir}/clip_{i+1}.mp4"
            temp_path = f"{work_dir}/temp_{i+1}.mp4"

            subprocess.run([
                FFMPEG, "-i", original,
                "-ss", str(start), "-t", str(clip_dur),
                "-c:v", "libx264", "-c:a", "aac", "-y", temp_path
            ], check=True, timeout=180)

            if req.on_screen_text:
                text = req.on_screen_text.replace("'", "\\'")
                subprocess.run([
                    FFMPEG, "-i", temp_path,
                    "-vf", f"drawtext=text='{text}':fontcolor=white:fontsize=40:box=1:boxcolor=black@0.5:boxborderw=10:x=(w-text_w)/2:y=h-th-50",
                    "-c:a", "copy", "-y", clip_path
                ], check=True, timeout=180)
                os.remove(temp_path)
            else:
                os.rename(temp_path, clip_path)

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
