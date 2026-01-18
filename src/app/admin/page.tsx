"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [stats, setStats] = useState({ totalAlbums: 0, totalArtists: 0, recentImports: 0 })
  const [importMethod, setImportMethod] = useState<"ids" | "urls" | "artist" | "search">("search")
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    total: number
    imported: number
    failed: number
    errors: string[]
  } | null>(null)
  const [billboardLoading, setBillboardLoading] = useState(false)
  const [billboardResult, setBillboardResult] = useState<string | null>(null)

  const isAdmin = session?.user?.role === "ADMIN"

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && !isAdmin) {
      router.push("/")
    }
    if (isAdmin) {
      fetchStats()
    }
  }, [status, router, isAdmin])

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/albums/import")
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const handleImport = async () => {
    setLoading(true)
    setResult(null)

    try {
      let body: Record<string, unknown> = {}

      switch (importMethod) {
        case "ids":
          body = { spotifyIds: input.split(/[\n,]/).map(s => s.trim()).filter(Boolean) }
          break
        case "urls":
          body = { spotifyUrls: input.split(/[\n,]/).map(s => s.trim()).filter(Boolean) }
          break
        case "artist":
          body = { artistName: input.trim() }
          break
        case "search":
          body = { searchQueries: input.split(/[\n]/).map(s => s.trim()).filter(Boolean) }
          break
      }

      const res = await fetch("/api/albums/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (data.success) {
        setResult(data.data)
        fetchStats()
      } else {
        setResult({ total: 0, imported: 0, failed: 0, errors: [data.error] })
      }
    } catch (error) {
      setResult({ total: 0, imported: 0, failed: 0, errors: [String(error)] })
    }

    setLoading(false)
  }

  const handleBillboardUpdate = async () => {
    setBillboardLoading(true)
    setBillboardResult(null)

    try {
      const res = await fetch("/api/cron/billboard")
      const data = await res.json()

      if (res.ok) {
        setBillboardResult(`Updated ${data.updated} albums from Billboard 200`)
        fetchStats()
      } else {
        setBillboardResult(`Error: ${data.error}`)
      }
    } catch (error) {
      setBillboardResult(`Error: ${String(error)}`)
    }

    setBillboardLoading(false)
  }

  if (status === "loading") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-[#888]">Loading...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-[#888]">Access denied. Admin privileges required.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold tracking-tighter mb-8">Admin - Album Import</h1>

      {/* Billboard Update Section */}
      <div className="mb-8 border border-[#222] p-6">
        <h2 className="font-bold mb-4">Billboard 200 Update</h2>
        <p className="text-sm text-[#888] mb-4">
          Manually trigger the Billboard 200 chart update. This runs automatically daily at midnight via cron job.
        </p>
        <button
          onClick={handleBillboardUpdate}
          disabled={billboardLoading}
          className="bg-white text-black px-6 py-3 font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {billboardLoading ? "Updating..." : "Update Billboard 200"}
        </button>
        {billboardResult && (
          <div className={`mt-4 p-4 border ${billboardResult.startsWith("Error") ? "border-red-500 text-red-500" : "border-green-500 text-green-500"}`}>
            {billboardResult}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-[#222] p-4">
          <p className="text-3xl font-bold">{stats.totalAlbums.toLocaleString()}</p>
          <p className="text-sm text-[#888]">Total Albums</p>
        </div>
        <div className="border border-[#222] p-4">
          <p className="text-3xl font-bold">{stats.totalArtists.toLocaleString()}</p>
          <p className="text-sm text-[#888]">Total Artists</p>
        </div>
        <div className="border border-[#222] p-4">
          <p className="text-3xl font-bold">{stats.recentImports.toLocaleString()}</p>
          <p className="text-sm text-[#888]">Imported (24h)</p>
        </div>
      </div>

      {/* Import Method Selector */}
      <div className="mb-6">
        <label className="block text-sm text-[#888] mb-2">Import Method</label>
        <div className="flex gap-2">
          <button
            onClick={() => setImportMethod("search")}
            className={`px-4 py-2 text-sm ${importMethod === "search" ? "bg-white text-black" : "border border-[#333]"}`}
          >
            Search Queries
          </button>
          <button
            onClick={() => setImportMethod("ids")}
            className={`px-4 py-2 text-sm ${importMethod === "ids" ? "bg-white text-black" : "border border-[#333]"}`}
          >
            Spotify IDs
          </button>
          <button
            onClick={() => setImportMethod("urls")}
            className={`px-4 py-2 text-sm ${importMethod === "urls" ? "bg-white text-black" : "border border-[#333]"}`}
          >
            Spotify URLs
          </button>
          <button
            onClick={() => setImportMethod("artist")}
            className={`px-4 py-2 text-sm ${importMethod === "artist" ? "bg-white text-black" : "border border-[#333]"}`}
          >
            Artist Name
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="mb-6">
        <label className="block text-sm text-[#888] mb-2">
          {importMethod === "search" && "Search Queries (one per line)"}
          {importMethod === "ids" && "Spotify Album IDs (comma or newline separated)"}
          {importMethod === "urls" && "Spotify URLs (comma or newline separated)"}
          {importMethod === "artist" && "Artist Name"}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={importMethod === "artist" ? 1 : 10}
          placeholder={
            importMethod === "search" ? "radiohead\nkendrick lamar\nfrank ocean" :
            importMethod === "ids" ? "6dVIqQ8qmQ5GBnJ9shOYGE\n0bUTHlWbkSQysoM3VsWldT" :
            importMethod === "urls" ? "https://open.spotify.com/album/..." :
            "Radiohead"
          }
          className="w-full"
        />
        <p className="text-xs text-[#666] mt-1">
          {importMethod === "search" && "Each search will import top results. Good for bulk importing popular albums."}
          {importMethod === "ids" && "Direct Spotify album IDs. Most efficient for specific albums."}
          {importMethod === "urls" && "Paste Spotify album URLs. IDs will be extracted automatically."}
          {importMethod === "artist" && "Import all albums from an artist's discography."}
        </p>
      </div>

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={loading || !input.trim()}
        className="bg-white text-black px-6 py-3 font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Importing..." : "Import Albums"}
      </button>

      {/* Results */}
      {result && (
        <div className="mt-8 border border-[#222] p-6">
          <h2 className="font-bold mb-4">Import Results</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-2xl font-bold text-green-500">{result.imported}</p>
              <p className="text-sm text-[#888]">Imported</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{result.failed}</p>
              <p className="text-sm text-[#888]">Failed</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{result.total}</p>
              <p className="text-sm text-[#888]">Total Attempted</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div>
              <p className="text-sm text-[#888] mb-2">Errors:</p>
              <div className="bg-[#111] p-4 text-xs text-red-500 max-h-48 overflow-auto">
                {result.errors.map((error, i) => (
                  <p key={i}>{error}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Import Suggestions */}
      <div className="mt-12 border-t border-[#222] pt-8">
        <h2 className="font-bold mb-4">Quick Import Suggestions</h2>
        <p className="text-sm text-[#888] mb-4">
          Click to auto-fill search queries for popular album collections:
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Top 100 Hip-Hop", queries: "kendrick lamar\nkanye west\ntravis scott\njay-z\nnas\ntyler the creator\nfrank ocean\nmf doom\noutkast\nlil wayne" },
            { label: "Classic Rock", queries: "led zeppelin\npink floyd\nthe beatles\nthe rolling stones\nqueen\nfleetwood mac\neagles\nthe who\nblack sabbath\ndeep purple" },
            { label: "Indie/Alt", queries: "radiohead\narcade fire\nthe strokes\narctic monkeys\ntame impala\nthe national\nbon iver\nvampire weekend\nfleet foxes\nsufjan stevens" },
            { label: "R&B/Soul", queries: "sza\nthe weeknd\nbeyonce\nfrank ocean\ndaniel caesar\njorja smith\nsolange\nhosier\njames blake\nkali uchis" },
            { label: "Electronic", queries: "daft punk\naphex twin\nboards of canada\nflume\nkaytranada\njamie xx\nnicolas jaar\nfour tet\njon hopkins\nbonobo" },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setImportMethod("search")
                setInput(preset.queries)
              }}
              className="px-3 py-1 text-sm border border-[#333] hover:bg-[#111] transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
