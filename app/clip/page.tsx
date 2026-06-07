'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ClipPage() {
  const [url, setUrl] = useState('')
  const [brief, setBrief] = useState('')
  const [niche, setNiche] = useState('')
  const [clipCount, setClipCount] = useState('3')
  const [clipDuration, setClipDuration] = useState('45')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleProcess() {
    if (!url) return
    setLoading(true)
    setError('')

    try {
      setStatus('⬇️ Downloading video...')
      const dlRes = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const dlData = await dlRes.json()
      if (dlData.error) throw new Error(dlData.error)

      setStatus('✂️ Creating clips...')
      const clipRes = await fetch('/api/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: dlData.job_id,
          output_path: dlData.output_path,
          clip_count: parseInt(clipCount),
          clip_duration: parseInt(clipDuration),
          brief,
        }),
      })
      const clipData = await clipRes.json()
      if (clipData.error) throw new Error(clipData.error)

      setStatus('🔍 Generating SEO + on-screen text...')
      const seoPromises = clipData.clips.map((_: any, i: number) =>
        fetch('/api/seo-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, niche, clip_number: i + 1, brief }),
        }).then(r => r.json())
      )
      const seoResults = await Promise.all(seoPromises)

      setStatus('✅ Done!')
      router.push(`/dashboard?job_id=${dlData.job_id}&seo=${encodeURIComponent(JSON.stringify(seoResults))}`)
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
      setLoading(false)
      setStatus('')
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-8 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">ClipRank ✂️</h1>
      <p className="text-gray-400 mb-8">Paste any video URL + campaign brief — we handle the rest</p>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Paste video URL (YouTube, Google Drive, Dropbox, f.io...)"
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white"
        />

        <textarea
          placeholder="Paste campaign brief here (optional but recommended for Clipster campaigns)..."
          value={brief}
          onChange={e => setBrief(e.target.value)}
          rows={6}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white resize-none text-sm"
        />

        <input
          type="text"
          placeholder="Niche (e.g. music, fitness, tech) — optional"
          value={niche}
          onChange={e => setNiche(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Number of clips</label>
            <select
              value={clipCount}
              onChange={e => setClipCount(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white"
            >
              <option value="1">1 clip</option>
              <option value="3">3 clips</option>
              <option value="5">5 clips</option>
              <option value="10">10 clips</option>
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Clip duration</label>
            <select
              value={clipDuration}
              onChange={e => setClipDuration(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white"
            >
              <option value="15">15 seconds</option>
              <option value="30">30 seconds</option>
              <option value="45">45 seconds</option>
              <option value="60">60 seconds</option>
            </select>
          </div>
        </div>

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
          {['⬇️ Download', '✂️ Clip', '📝 On-screen text', '🔍 SEO', '✅ Done'].map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-gray-500 text-sm">
              <div className={`w-2 h-2 rounded-full ${status.includes(step.slice(3, 6)) ? 'bg-white animate-pulse' : 'bg-gray-700'}`} />
              {step}
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3">💡 How to use with Clipster</h3>
        <ol className="space-y-2 text-gray-400 text-sm">
          <li>1. Open a Clipster campaign</li>
          <li>2. Copy the source video URL from the brief</li>
          <li>3. Paste the full campaign brief above</li>
          <li>4. Hit Process — AI reads the rules and clips accordingly</li>
          <li>5. Download clips and submit to Clipster</li>
        </ol>
      </div>
    </main>
  )
}
