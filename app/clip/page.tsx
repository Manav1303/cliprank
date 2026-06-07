'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ClipPage() {
  const [url, setUrl] = useState('')
  const [niche, setNiche] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleProcess() {
    if (!url) return
    setLoading(true)
    setError('')

    try {
      // Step 1: Download
      setStatus('⬇️ Downloading video...')
      const dlRes = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const dlData = await dlRes.json()
      if (dlData.error) throw new Error(dlData.error)

      // Step 2: Clip
      setStatus('✂️ Creating clips...')
      const clipRes = await fetch('/api/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: dlData.job_id, output_path: dlData.output_path }),
      })
      const clipData = await clipRes.json()
      if (clipData.error) throw new Error(clipData.error)

      // Step 3: SEO
      setStatus('🔍 Generating SEO for all platforms...')
      const seoPromises = clipData.clips.map((_: any, i: number) =>
        fetch('/api/seo-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, niche, clip_number: i + 1 }),
        }).then(r => r.json())
      )
      const seoResults = await Promise.all(seoPromises)

      setStatus('✅ Done! Redirecting to dashboard...')
      router.push(`/dashboard?job_id=${dlData.job_id}&seo=${encodeURIComponent(JSON.stringify(seoResults))}`)
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
      setLoading(false)
      setStatus('')
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="w-full max-w-xl">
        <h1 className="text-4xl font-bold mb-2">ClipRank ✂️</h1>
        <p className="text-gray-400 mb-10">Paste any video URL — we'll clip, optimize and prepare it for every platform</p>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Paste any video URL (YouTube, TikTok, Instagram, Twitter...)"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white"
          />
          <input
            type="text"
            placeholder="Niche (e.g. fitness, food, tech) — optional"
            value={niche}
            onChange={e => setNiche(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white"
          />
          <button
            onClick={handleProcess}
            disabled={loading || !url}
            className="w-full bg-white text-black py-3 rounded-xl font-semibold text-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            {loading ? status || 'Processing...' : 'Process Video →'}
          </button>
        </div>

        {error && (
          <div className="mt-6 bg-red-900/30 border border-red-700 rounded-xl p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {loading && (
          <div className="mt-8 space-y-3">
            {['⬇️ Download video', '✂️ Create clips', '🔍 Generate SEO', '✅ Ready'].map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-500">
                <div className={`w-2 h-2 rounded-full ${status.includes(step.slice(3, 8)) ? 'bg-white animate-pulse' : 'bg-gray-700'}`} />
                {step}
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 grid grid-cols-2 gap-4">
          {[
            { icon: '📥', label: 'Any URL supported', sub: 'YouTube, TikTok, Instagram & more' },
            { icon: '✂️', label: 'Auto clipping', sub: '30-60 sec viral clips' },
            { icon: '🔍', label: 'SEO per platform', sub: 'Title, caption, hashtags' },
            { icon: '🚀', label: 'Multi-platform', sub: 'YouTube, Facebook, TikTok, IG' },
          ].map((f, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-2xl mb-1">{f.icon}</p>
              <p className="text-white font-medium text-sm">{f.label}</p>
              <p className="text-gray-500 text-xs mt-1">{f.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
