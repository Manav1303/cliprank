'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function Dashboard() {
  const params = useSearchParams()
  const job_id = params.get('job_id')
  const seoRaw = params.get('seo')
  const [seoData, setSeoData] = useState<any[]>([])
  const [activeClip, setActiveClip] = useState(0)
  const [activePlatform, setActivePlatform] = useState('youtube')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    if (seoRaw) {
      try { setSeoData(JSON.parse(decodeURIComponent(seoRaw))) } catch {}
    }
  }, [seoRaw])

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const platforms = ['youtube', 'facebook', 'tiktok', 'instagram']
  const platformColors: Record<string, string> = {
    youtube: 'text-red-400',
    facebook: 'text-blue-400',
    tiktok: 'text-pink-400',
    instagram: 'text-purple-400',
  }
  const platformIcons: Record<string, string> = {
    youtube: '▶️',
    facebook: '👤',
    tiktok: '🎵',
    instagram: '📸',
  }

  const seo = seoData[activeClip]

  return (
    <main className="min-h-screen bg-black text-white p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Dashboard 🎬</h1>
      <p className="text-gray-400 mb-2">Job ID: <span className="font-mono text-xs text-gray-600">{job_id}</span></p>

      {seoData.length === 0 ? (
        <div className="mt-10 text-center text-gray-500">
          <p>No data found. <a href="/clip" className="text-white underline">Process a video first →</a></p>
        </div>
      ) : (
        <>
          {/* Clip selector */}
          <div className="flex gap-2 mb-6 mt-6">
            {seoData.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveClip(i)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeClip === i ? 'bg-white text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                Clip {i + 1}
              </button>
            ))}
          </div>

          {/* Platform selector */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {platforms.map(p => (
              <button
                key={p}
                onClick={() => setActivePlatform(p)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition flex items-center gap-2 ${activePlatform === p ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}
              >
                {platformIcons[p]} {p}
              </button>
            ))}
          </div>

          {seo && (
            <div className="space-y-6">
              {/* YouTube */}
              {activePlatform === 'youtube' && (
                <>
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-red-400 font-semibold">▶️ YouTube Title</h2>
                      <button onClick={() => copy(seo.youtube?.title, 'yt-title')} className="text-xs text-gray-500 hover:text-white">{copied === 'yt-title' ? '✅ Copied!' : 'Copy'}</button>
                    </div>
                    <p className="text-white font-medium">{seo.youtube?.title}</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-red-400 font-semibold">Description</h2>
                      <button onClick={() => copy(seo.youtube?.description, 'yt-desc')} className="text-xs text-gray-500 hover:text-white">{copied === 'yt-desc' ? '✅ Copied!' : 'Copy'}</button>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{seo.youtube?.description}</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-red-400 font-semibold">Tags</h2>
                      <button onClick={() => copy(seo.youtube?.tags?.join(', '), 'yt-tags')} className="text-xs text-gray-500 hover:text-white">{copied === 'yt-tags' ? '✅ Copied!' : 'Copy'}</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {seo.youtube?.tags?.map((t: string) => <span key={t} className="bg-gray-800 px-3 py-1 rounded-full text-xs text-red-400">{t}</span>)}
                    </div>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">⏰ Best time to post: <span className="text-yellow-400">{seo.best_time?.youtube}</span></p>
                  </div>
                </>
              )}

              {/* Facebook */}
              {activePlatform === 'facebook' && (
                <>
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-blue-400 font-semibold">👤 Facebook Caption</h2>
                      <button onClick={() => copy(seo.facebook?.caption, 'fb-cap')} className="text-xs text-gray-500 hover:text-white">{copied === 'fb-cap' ? '✅ Copied!' : 'Copy'}</button>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{seo.facebook?.caption}</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-blue-400 font-semibold">Hashtags</h2>
                      <button onClick={() => copy(seo.facebook?.tags?.join(' '), 'fb-tags')} className="text-xs text-gray-500 hover:text-white">{copied === 'fb-tags' ? '✅ Copied!' : 'Copy'}</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {seo.facebook?.tags?.map((t: string) => <span key={t} className="bg-gray-800 px-3 py-1 rounded-full text-xs text-blue-400">{t}</span>)}
                    </div>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">⏰ Best time to post: <span className="text-yellow-400">{seo.best_time?.facebook}</span></p>
                  </div>
                </>
              )}

              {/* TikTok */}
              {activePlatform === 'tiktok' && (
                <>
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-pink-400 font-semibold">🎵 TikTok Caption</h2>
                      <button onClick={() => copy(seo.tiktok?.caption, 'tt-cap')} className="text-xs text-gray-500 hover:text-white">{copied === 'tt-cap' ? '✅ Copied!' : 'Copy'}</button>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{seo.tiktok?.caption}</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-pink-400 font-semibold">Hashtags</h2>
                      <button onClick={() => copy(seo.tiktok?.tags?.join(' '), 'tt-tags')} className="text-xs text-gray-500 hover:text-white">{copied === 'tt-tags' ? '✅ Copied!' : 'Copy'}</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {seo.tiktok?.tags?.map((t: string) => <span key={t} className="bg-gray-800 px-3 py-1 rounded-full text-xs text-pink-400">{t}</span>)}
                    </div>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">⏰ Best time to post: <span className="text-yellow-400">{seo.best_time?.tiktok}</span></p>
                  </div>
                  <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-4">
                    <p className="text-yellow-400 text-sm font-medium">📱 Manual Upload Required</p>
                    <p className="text-gray-400 text-xs mt-1">TikTok doesn't allow auto-upload via API. Copy the caption above and upload your clip manually.</p>
                  </div>
                </>
              )}

              {/* Instagram */}
              {activePlatform === 'instagram' && (
                <>
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-purple-400 font-semibold">📸 Instagram Caption</h2>
                      <button onClick={() => copy(seo.instagram?.caption, 'ig-cap')} className="text-xs text-gray-500 hover:text-white">{copied === 'ig-cap' ? '✅ Copied!' : 'Copy'}</button>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{seo.instagram?.caption}</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-purple-400 font-semibold">Hashtags</h2>
                      <button onClick={() => copy(seo.instagram?.tags?.join(' '), 'ig-tags')} className="text-xs text-gray-500 hover:text-white">{copied === 'ig-tags' ? '✅ Copied!' : 'Copy'}</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {seo.instagram?.tags?.map((t: string) => <span key={t} className="bg-gray-800 px-3 py-1 rounded-full text-xs text-purple-400">{t}</span>)}
                    </div>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">⏰ Best time to post: <span className="text-yellow-400">{seo.best_time?.instagram}</span></p>
                  </div>
                  <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-4">
                    <p className="text-yellow-400 text-sm font-medium">📱 Manual Upload Required</p>
                    <p className="text-gray-400 text-xs mt-1">Instagram restricts auto-upload. Copy caption + hashtags above and upload your clip manually.</p>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      <div className="mt-10 text-center">
        <a href="/clip" className="text-gray-500 hover:text-white transition text-sm">← Process another video</a>
      </div>
    </main>
  )
}

export default function DashboardPage() {
  return <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}><Dashboard /></Suspense>
}
