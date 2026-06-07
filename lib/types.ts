export interface ClipJob {
  id: string
  url: string
  status: 'pending' | 'downloading' | 'clipping' | 'done' | 'error'
  clips: Clip[]
  created_at: string
}

export interface Clip {
  id: string
  job_id: string
  filename: string
  duration: number
  seo: PlatformSEO
}

export interface PlatformSEO {
  youtube: { title: string; description: string; tags: string[] }
  facebook: { caption: string; tags: string[] }
  tiktok: { caption: string; tags: string[] }
  instagram: { caption: string; tags: string[] }
}
