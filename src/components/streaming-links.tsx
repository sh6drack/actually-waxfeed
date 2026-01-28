"use client"

import { useState, useEffect } from "react"

interface StreamingLinksProps {
  spotifyUrl: string
}

interface PlatformLink {
  name: string
  url: string
  color: string
  icon: React.ReactNode
}

interface OdesliResponse {
  linksByPlatform?: {
    spotify?: { url: string }
    appleMusic?: { url: string }
    tidal?: { url: string }
    youtube?: { url: string }
    youtubeMusic?: { url: string }
    soundcloud?: { url: string }
    amazonMusic?: { url: string }
    deezer?: { url: string }
  }
}

const PLATFORM_CONFIG: Record<string, { name: string; color: string; icon: React.ReactNode }> = {
  spotify: {
    name: "Spotify",
    color: "#1DB954",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    )
  },
  appleMusic: {
    name: "Apple Music",
    color: "#FA243C",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.99c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.364-1.29.44-2.29 1.21-2.97 2.41-.322.565-.515 1.174-.62 1.826a9.233 9.233 0 00-.13 1.39c-.005.044-.011.087-.014.13V17.9c.009.132.016.264.025.396.052.738.136 1.474.383 2.173.423 1.19 1.142 2.144 2.196 2.835.58.38 1.21.624 1.89.768.457.098.92.147 1.388.167.165.007.332.016.497.017h11.948c.057 0 .114-.004.17-.006.616-.022 1.227-.076 1.823-.226 1.24-.31 2.27-1.002 3.034-2.043.463-.63.757-1.34.897-2.114.069-.38.118-.765.135-1.15.011-.24.027-.48.027-.72V6.37c0-.083-.006-.166-.01-.248l-.002-.003zm-6.468 4.74c-.008.52-.024 1.04-.024 1.56l.001 5.12c0 .378-.032.754-.112 1.124-.155.72-.551 1.23-1.245 1.478-.346.124-.703.167-1.067.148-.748-.04-1.386-.5-1.598-1.16-.26-.82.047-1.72.842-2.16.236-.13.49-.227.75-.294.325-.083.656-.145.982-.224.257-.063.46-.196.555-.46a1.03 1.03 0 00.065-.398c.002-2.13 0-4.26 0-6.39 0-.096-.014-.192-.026-.287-.034-.26-.193-.44-.45-.482-.16-.025-.326-.033-.49-.032-1.32.007-2.638.01-3.96.01-.206 0-.412.005-.616.03a.822.822 0 00-.587.376c-.093.15-.137.32-.142.499-.01.384-.017.768-.017 1.152l-.002 5.872c-.003.398-.03.792-.11 1.183-.167.815-.58 1.35-1.37 1.595-.33.103-.673.147-1.02.119-.675-.054-1.227-.324-1.576-.922-.26-.447-.31-.93-.205-1.424.148-.7.584-1.163 1.24-1.417.237-.092.487-.152.737-.21.313-.075.63-.132.94-.217.23-.062.423-.176.52-.407.054-.13.078-.27.08-.413.002-2.97 0-5.94.002-8.913 0-.14.013-.28.035-.417.052-.328.24-.543.566-.6.21-.038.426-.053.64-.053h7.01c.47 0 .942-.002 1.412.01.21.005.42.033.625.075.365.074.574.33.6.706.013.18.016.36.016.54l-.002 3.86v.006z"/>
      </svg>
    )
  },
  tidal: {
    name: "Tidal",
    color: "#000000",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996 4.004 12l4.004-4.004L12.012 12l-4.004 4.004 4.004 4.004 4.004-4.004L12.012 12l4.004-4.004-4.004-4.004zm4.004 4.004l4.004-4.004L24.024 7.996l-4.004 4.004-4.004-4.004z"/>
      </svg>
    )
  },
  youtubeMusic: {
    name: "YouTube Music",
    color: "#FF0000",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z"/>
      </svg>
    )
  },
  amazonMusic: {
    name: "Amazon",
    color: "#FF9900",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.492.124.072.116.079.198.02.244-.193.15-.55.385-1.07.705-1.18.73-2.54 1.32-4.08 1.76a14.98 14.98 0 01-4.405.66c-1.916 0-3.86-.328-5.833-.98-1.975-.652-3.65-1.544-5.027-2.673-.123-.09-.148-.196-.07-.295zM23.97 16.67c-.012-.14-.06-.29-.144-.444-.086-.15-.162-.26-.232-.33l-.14-.14c-.12-.12-.292-.302-.51-.546-.22-.245-.405-.468-.556-.668a3.03 3.03 0 01-.385-.63c-.08-.154-.116-.287-.11-.4a.32.32 0 01.13-.244c.074-.056.166-.073.276-.052.11.02.214.053.315.096.1.044.242.112.423.204l.397.2c.284.14.503.272.655.395.153.124.275.232.368.324l.105.12.12.105c.19.19.33.408.42.65.086.242.11.48.07.716a1.32 1.32 0 01-.337.644c-.18.192-.405.36-.676.502-.27.143-.556.25-.858.32a3.92 3.92 0 01-.92.11c-.154 0-.313-.01-.48-.03-.165-.02-.308-.044-.43-.074a8.98 8.98 0 01-.378-.088 1.62 1.62 0 01-.306-.11l-.11-.055c-.074-.036-.132-.07-.175-.1a.27.27 0 01-.11-.13.4.4 0 01-.027-.17v-.19c0-.06.02-.12.064-.19a.37.37 0 01.17-.15c.075-.045.162-.065.263-.06.1.005.218.035.352.09.135.054.262.102.383.143.12.04.25.08.393.12a3.1 3.1 0 00.758.13c.26 0 .49-.023.69-.07a1.62 1.62 0 00.477-.18c.126-.07.22-.16.283-.266a.63.63 0 00.095-.34.73.73 0 00-.25-.53zm-6.905-7.246c0 .812-.03 1.484-.088 2.016a6.063 6.063 0 01-.273 1.355 2.58 2.58 0 01-.513.925c-.22.25-.49.43-.82.544a3.42 3.42 0 01-1.14.172 3.78 3.78 0 01-1.16-.17 2.4 2.4 0 01-.878-.51 2.2 2.2 0 01-.537-.893c-.12-.368-.183-.808-.183-1.318V5.328h-2.84v6.097c0 .77.087 1.45.263 2.04.176.587.443 1.08.8 1.477.358.397.806.695 1.346.895.54.2 1.167.3 1.88.3.717 0 1.35-.1 1.9-.3s1.01-.5 1.38-.897c.37-.398.647-.89.83-1.476.184-.588.275-1.27.275-2.04V5.328h-2.84v4.096h-.002z"/>
      </svg>
    )
  },
  deezer: {
    name: "Deezer",
    color: "#FEAA2D",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.027h5.189V8.38h-5.19zm12.54 0v3.027H24V8.38h-5.19zM6.27 12.608v3.027h5.189v-3.027h-5.19zm6.27 0v3.027h5.19v-3.027h-5.19zm6.27 0v3.027H24v-3.027h-5.19zM0 16.835v3.027h5.19v-3.027H0zm6.27 0v3.027h5.189v-3.027h-5.19zm6.27 0v3.027h5.19v-3.027h-5.19zm6.27 0v3.027H24v-3.027h-5.19z"/>
      </svg>
    )
  }
}

export function StreamingLinks({ spotifyUrl }: StreamingLinksProps) {
  const [links, setLinks] = useState<PlatformLink[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    async function fetchLinks() {
      try {
        const response = await fetch(
          `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(spotifyUrl)}`
        )
        const data: OdesliResponse = await response.json()

        if (data.linksByPlatform) {
          const platformLinks: PlatformLink[] = []

          const platformOrder = ["spotify", "appleMusic", "tidal", "youtubeMusic", "amazonMusic", "deezer"]

          for (const platform of platformOrder) {
            const linkData = data.linksByPlatform[platform as keyof typeof data.linksByPlatform]
            const config = PLATFORM_CONFIG[platform]

            if (linkData?.url && config) {
              platformLinks.push({
                name: config.name,
                url: linkData.url,
                color: config.color,
                icon: config.icon
              })
            }
          }

          setLinks(platformLinks)
        }
      } catch (error) {
        console.error("Failed to fetch streaming links:", error)
        // Fallback to just Spotify
        setLinks([{
          name: "Spotify",
          url: spotifyUrl,
          color: PLATFORM_CONFIG.spotify.color,
          icon: PLATFORM_CONFIG.spotify.icon
        }])
      } finally {
        setLoading(false)
      }
    }

    fetchLinks()
  }, [spotifyUrl])

  if (loading) {
    return (
      <div className="flex gap-2">
        <div className="w-24 h-8 bg-[--surface] animate-pulse" />
        <div className="w-24 h-8 bg-[--surface] animate-pulse" />
      </div>
    )
  }

  if (links.length === 0) return null

  const visibleLinks = expanded ? links : links.slice(0, 3)
  const hasMore = links.length > 3

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visibleLinks.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] text-xs font-medium transition-all no-underline border border-[--border] hover:border-[--border] bg-[--surface] hover:bg-[--surface-raised]"
          style={{ color: link.color }}
        >
          {link.icon}
          <span className="text-[--foreground]">{link.name}</span>
        </a>
      ))}
      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="px-3 py-2.5 min-h-[44px] text-xs text-[--muted] border border-[--border] hover:border-[--border] hover:text-[--foreground] transition-colors"
        >
          +{links.length - 3} more
        </button>
      )}
    </div>
  )
}
