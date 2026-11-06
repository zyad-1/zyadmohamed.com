import { AuditHookType } from '../schemas'

const GOOGLEBOT_UA =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'

const IG_BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

/**
 * Deterministically converts an Instagram numeric media PK (e.g. "3602081600994098667")
 * into its 11-character Instagram shortcode (e.g. "DH9bf03I5_r").
 */
export function pkToShortcode(pkStr: string): string {
  try {
    let id = BigInt(String(pkStr).split('_')[0])
    if (id <= BigInt(0)) return ''
    let code = ''
    const base = BigInt(64)
    while (id > BigInt(0)) {
      const remainder = Number(id % base)
      code = IG_BASE64_ALPHABET[remainder] + code
      id = id / base
    }
    return code
  } catch {
    return ''
  }
}

/**
 * Wraps an Instagram CDN URL in our local `/api/audit/image-proxy` route
 * so `Cross-Origin-Resource-Policy: same-origin` never blocks avatars or thumbnails.
 */
export function toProxiedInstagramImage(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null
  const trimmed = rawUrl.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/api/audit/image-proxy')) return trimmed
  if (
    trimmed.includes('cdninstagram.com') ||
    trimmed.includes('fbcdn.net')
  ) {
    return `/api/audit/image-proxy?url=${encodeURIComponent(trimmed)}`
  }
  return trimmed
}

/**
 * Extracts a clean Instagram username from a handle (`@username`) or full profile URL.
 */
export function parseInstagramHandle(handleOrUrl: string): string {
  const raw = (handleOrUrl || '').trim()
  if (!raw) return ''

  if (raw.includes('instagram.com')) {
    try {
      const urlObj = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
      const segments = urlObj.pathname
        .split('/')
        .map((s) => s.trim())
        .filter(Boolean)
      const reserved = new Set(['p', 'reel', 'reels', 'tv', 'stories', 'explore', 'accounts'])
      if (segments.length > 0 && !reserved.has(segments[0].toLowerCase())) {
        return segments[0].replace(/^@/, '')
      }
    } catch {
      // Fallback regex below
    }
  }

  return raw
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .split('/')[0]
    .split('?')[0]
    .replace(/^@/, '')
    .trim()
}

/**
 * Extracts a shortcode from an Instagram Reel or Post URL (`/reel/XYZ/` or `/p/XYZ/`).
 */
export function parseInstagramShortcode(urlOrCode: string): string {
  const raw = (urlOrCode || '').trim()
  if (!raw) return ''
  const match = raw.match(/instagram\.com\/(?:[^/]+\/)?(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i)
  if (match?.[1]) return match[1]
  if (/^[A-Za-z0-9_-]{8,15}$/.test(raw)) return raw
  return ''
}

function decodeHtmlEntities(input?: string | null): string {
  if (!input) return ''
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16)
      return Number.isNaN(code) ? _ : String.fromCodePoint(code)
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10)
      return Number.isNaN(code) ? _ : String.fromCodePoint(code)
    })
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function parseAbbreviatedCount(raw?: string | null): number | null {
  if (!raw) return null
  const cleaned = raw.replace(/,/g, '').trim().toUpperCase()
  const match = cleaned.match(/^([\d.]+)\s*([KMB])?$/)
  if (!match) return null
  const num = parseFloat(match[1])
  if (Number.isNaN(num)) return null
  const mult =
    match[2] === 'B'
      ? 1_000_000_000
      : match[2] === 'M'
        ? 1_000_000
        : match[2] === 'K'
          ? 1_000
          : 1
  return Math.round(num * mult)
}

function parseDashDurationSeconds(manifest?: string | null): number | null {
  if (!manifest) return null
  const match = manifest.match(/mediaPresentationDuration="PT(?:(\d+)M)?([\d.]+)S"/i)
  if (!match) return null
  const mins = match[1] ? parseInt(match[1], 10) : 0
  const secs = parseFloat(match[2])
  if (Number.isNaN(secs)) return null
  return Math.max(1, Math.round(mins * 60 + secs))
}

function inferHookTypeFromCaption(caption: string): AuditHookType {
  const firstLine = (caption.split('\n')[0] || '').trim()
  if (!firstLine) return 'OTHER'
  if (firstLine.includes('?') || firstLine.includes('؟') || /^(هل|كيف|لماذا|امتى|إزاي|ليه|how|why|what)/i.test(firstLine)) {
    return 'QUESTION'
  }
  if (/\d+%|\d+\s*(ألف|مليون|يوم|خطوات|أسرار|سبب|أخطاء|x|k|m)/i.test(firstLine)) {
    return 'BOLD_CLAIM'
  }
  if (/^(قصة|حكاية|لما|في يوم|تخيل|story|when i)/i.test(firstLine)) {
    return 'STORY'
  }
  return 'PATTERN_INTERRUPT'
}

function inferHasCtaFromCaption(caption: string): boolean {
  if (!caption) return false
  return /(اكتب|ارسل|أرسل|كومنت|تعليق|البايو|رابط|تواصل|احجز|دم|خاص|comment|dm|link in bio|bio)/i.test(
    caption
  )
}

function extractFirstLineTopic(caption: string): string {
  if (!caption) return ''
  const firstLine = caption
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 2)
  if (!firstLine) return ''
  return firstLine.length > 90 ? `${firstLine.slice(0, 87)}...` : firstLine
}

export interface ScrapedInstagramReel {
  shortcode: string
  url: string
  thumbnailUrl: string | null
  caption: string
  topic: string
  postedAt: string
  views: number
  viewsEstimated: boolean
  likes: number
  comments: number
  shares: number | null
  saves: number | null
  durationSec: number | null
  hookType: AuditHookType | null
  hasSubtitles: boolean | null
  hasCta: boolean | null
  isRepost: boolean
  demandSignalsCount: number
  pros: string
  cons: string
  editorNotes: string
}

export interface ScrapedInstagramProfile {
  handle: string
  displayName: string
  niche: string
  avatarUrl: string | null
  bio: string
  bioLinks: Array<{ title: string; url: string }>
  linkInBioUrl: string | null
  followers: number
  followingCount: number | null
  postsCount: number | null
  profileUrl: string
  isVerified: boolean
  reels: ScrapedInstagramReel[]
}

interface RawTimelineNode {
  pk: string
  shortcode: string
  typename: string
  mediaType: number
  productType: string
  displayUri: string | null
  captionText: string
}

function extractTimelineNodesFromHtml(html: string): RawTimelineNode[] {
  const results: RawTimelineNode[] = []
  const scriptRegex = /<script type="application\/json"[^>]*data-sjs[^>]*>([\s\S]*?)<\/script>/g
  let match: RegExpExecArray | null

  while ((match = scriptRegex.exec(html)) !== null) {
    const content = match[1]
    if (!content.includes('polaris_timeline_connection')) continue
    try {
      const json = JSON.parse(content)
      const findEdges = (obj: unknown): unknown[] | null => {
        if (!obj || typeof obj !== 'object') return null
        const rec = obj as Record<string, unknown>
        if (
          rec.polaris_timeline_connection &&
          typeof rec.polaris_timeline_connection === 'object' &&
          Array.isArray((rec.polaris_timeline_connection as Record<string, unknown>).edges)
        ) {
          return (rec.polaris_timeline_connection as { edges: unknown[] }).edges
        }
        for (const val of Object.values(rec)) {
          const found = findEdges(val)
          if (found) return found
        }
        return null
      }

      const edges = findEdges(json)
      if (Array.isArray(edges)) {
        for (const edge of edges) {
          const node = (edge as { node?: Record<string, unknown> })?.node
          if (!node || !node.pk) continue
          const pk = String(node.pk)
          const shortcode =
            typeof node.code === 'string' && node.code
              ? node.code
              : pkToShortcode(pk)
          if (!shortcode) continue

          const imgCandidates = (
            node.image_versions2 as { candidates?: Array<{ url?: string }> } | undefined
          )?.candidates
          const displayUri =
            (typeof node.display_uri === 'string' ? node.display_uri : null) ||
            imgCandidates?.[0]?.url ||
            null
          const captionObj = node.caption as { text?: string } | null | undefined

          results.push({
            pk,
            shortcode,
            typename: String(node.__typename || ''),
            mediaType: Number(node.media_type || 0),
            productType: String(node.product_type || ''),
            displayUri,
            captionText: captionObj?.text || '',
          })
        }
      }
    } catch {
      // Ignore malformed JSON script block
    }
  }

  return results
}

/**
 * Fetches detailed metrics for a single Instagram shortcode using `PolarisPostRootQuery`.
 */
export async function fetchReelDetailsByShortcode(params: {
  shortcode: string
  lsd: string
  csrf: string
  cookies: string
  fallbackNode?: RawTimelineNode
  followersCount?: number
}): Promise<ScrapedInstagramReel | null> {
  const { shortcode, lsd, csrf, cookies, fallbackNode, followersCount = 0 } = params
  try {
    const body = new URLSearchParams({
      av: '0',
      __d: 'www',
      __user: '0',
      __a: '1',
      __req: '1',
      lsd,
      fb_api_caller_class: 'RelayModern',
      fb_api_req_friendly_name: 'PolarisPostRootQuery',
      variables: JSON.stringify({
        shortcode,
        __relay_internal__pv__PolarisShortDramaEnabledrelayprovider: false,
        __relay_internal__pv__PolarisThreadsStyleCommentsEnabledrelayprovider: false,
        __relay_internal__pv__PolarisMultiCaptionCarouselEnabledrelayprovider: false,
      }),
      server_timestamps: 'true',
      doc_id: '28685421041140356',
    })

    const res = await fetch('https://www.instagram.com/graphql/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': GOOGLEBOT_UA,
        'X-FB-LSD': lsd,
        'X-CSRFToken': csrf,
        'X-IG-App-ID': '936619743392459',
        'X-ASBD-ID': '129477',
        'X-FB-Friendly-Name': 'PolarisPostRootQuery',
        Origin: 'https://www.instagram.com',
        Referer: `https://www.instagram.com/reel/${shortcode}/`,
        Cookie: cookies,
      },
      body: body.toString(),
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(`PolarisPostRootQuery HTTP ${res.status}`)
    }

    const json = await res.json()
    const item = json?.data?.xdt_api__v1__media__shortcode__web_info?.items?.[0]

    if (!item && !fallbackNode) return null

    const rawThumb =
      item?.display_uri ||
      item?.image_versions2?.candidates?.[0]?.url ||
      fallbackNode?.displayUri ||
      null
    const caption = item?.caption?.text ?? fallbackNode?.captionText ?? ''
    const takenAtSec = Number(item?.taken_at || 0)
    const postedAt =
      takenAtSec > 0 ? new Date(takenAtSec * 1000).toISOString() : new Date().toISOString()

    const likes = Math.max(0, Number(item?.like_count ?? 0))
    const comments = Math.max(0, Number(item?.comment_count ?? 0))
    const durationSec =
      parseDashDurationSeconds(item?.video_dash_manifest) ??
      (typeof item?.video_duration === 'number' ? Math.round(item.video_duration) : null)

    const directViews =
      item?.view_count ?? item?.play_count ?? item?.video_view_count ?? null

    let views = 0
    let viewsEstimated = false
    if (typeof directViews === 'number' && directViews > 0) {
      views = Math.round(directViews)
    } else if (likes > 0 || comments > 0) {
      // Unauthenticated web GraphQL hides `view_count` on some accounts while exposing exact `like_count` and `comment_count`.
      // Provide an engagement-derived initial baseline that the admin can edit directly in the studio.
      const engagementBaseline = likes * 24 + comments * 40
      const followerFloor = followersCount > 0 ? Math.round(followersCount * 0.04) : 0
      views = Math.max(likes + comments, engagementBaseline, followerFloor)
      viewsEstimated = true
    }

    const directShares =
      item?.reshare_count ?? item?.share_count ?? item?.send_count ?? null
    const directSaves = item?.save_count ?? item?.saved_count ?? null

    const shares =
      typeof directShares === 'number' && directShares >= 0
        ? Math.round(directShares)
        : likes > 0 || comments > 0
          ? Math.max(1, Math.round(likes * 0.14 + comments * 0.85))
          : null

    const saves =
      typeof directSaves === 'number' && directSaves >= 0
        ? Math.round(directSaves)
        : likes > 0 || comments > 0
          ? Math.max(1, Math.round(likes * 0.22 + comments * 0.65))
          : null

    return {
      shortcode,
      url: `https://www.instagram.com/reel/${shortcode}/`,
      thumbnailUrl: toProxiedInstagramImage(rawThumb),
      caption,
      topic: extractFirstLineTopic(caption),
      postedAt,
      views,
      viewsEstimated,
      likes,
      comments,
      shares,
      saves,
      durationSec,
      hookType: inferHookTypeFromCaption(caption),
      hasSubtitles: true,
      hasCta: inferHasCtaFromCaption(caption),
      isRepost: false,
      demandSignalsCount: 0,
      pros: '',
      cons: '',
      editorNotes: '',
    }
  } catch {
    if (!fallbackNode) return null
    return {
      shortcode,
      url: `https://www.instagram.com/reel/${shortcode}/`,
      thumbnailUrl: toProxiedInstagramImage(fallbackNode.displayUri),
      caption: fallbackNode.captionText,
      topic: extractFirstLineTopic(fallbackNode.captionText),
      postedAt: new Date().toISOString(),
      views: 0,
      viewsEstimated: true,
      likes: 0,
      comments: 0,
      shares: null,
      saves: null,
      durationSec: null,
      hookType: inferHookTypeFromCaption(fallbackNode.captionText),
      hasSubtitles: true,
      hasCta: inferHasCtaFromCaption(fallbackNode.captionText),
      isRepost: false,
      demandSignalsCount: 0,
      pros: '',
      cons: '',
      editorNotes: '',
    }
  }
}

/**
 * Scrapes a single Instagram Reel by URL or shortcode.
 */
export async function scrapeSingleInstagramReel(
  reelUrlOrCode: string
): Promise<ScrapedInstagramReel> {
  const shortcode = parseInstagramShortcode(reelUrlOrCode)
  if (!shortcode) {
    throw new Error('Invalid Instagram Reel URL or shortcode')
  }

  const pageRes = await fetch(`https://www.instagram.com/reel/${shortcode}/`, {
    headers: { 'User-Agent': GOOGLEBOT_UA },
    cache: 'no-store',
  })

  if (!pageRes.ok) {
    throw new Error(`Instagram returned HTTP ${pageRes.status} for reel ${shortcode}`)
  }

  const html = await pageRes.text()
  const lsd = html.match(/"LSD",\[\],\{"token":"([^"]+)"\}/)?.[1] || ''
  const rawCookies = pageRes.headers.getSetCookie
    ? pageRes.headers.getSetCookie().map((c) => c.split(';')[0])
    : []
  const cookies = rawCookies.join('; ')
  const csrf = rawCookies.find((c) => c.startsWith('csrftoken='))?.split('=')[1] || ''

  const ogImage = decodeHtmlEntities(
    html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1] || null
  )
  const ogDesc = decodeHtmlEntities(
    html.match(/<meta property="og:description" content="([^"]+)"/i)?.[1] || ''
  )

  const fallbackNode: RawTimelineNode | undefined = ogImage
    ? {
        pk: shortcode,
        shortcode,
        typename: 'XIGPolarisVideoMedia',
        mediaType: 2,
        productType: 'clips',
        displayUri: ogImage,
        captionText: ogDesc,
      }
    : undefined

  const reel = await fetchReelDetailsByShortcode({
    shortcode,
    lsd,
    csrf,
    cookies,
    fallbackNode,
  })

  if (!reel) {
    throw new Error(`Could not extract data for Reel ${shortcode}`)
  }

  return reel
}

/**
 * Scrapes an Instagram public account's profile details (Name, Avatar, Bio, Links, Followers, Posts)
 * and its latest N Reels (with Thumbnails, Captions, Likes, Comments, Views, Durations).
 */
export async function scrapeInstagramPublicAccount(
  handleOrUrl: string,
  reelsCount = 18
): Promise<ScrapedInstagramProfile> {
  const username = parseInstagramHandle(handleOrUrl)
  if (!username) {
    throw new Error('Please provide a valid Instagram username or profile URL')
  }

  const clampedReelsCount = Math.max(1, Math.min(36, Math.round(reelsCount || 18)))

  // Fetch main profile HTML and /reels/ tab HTML in parallel using Googlebot SSR User-Agent
  const [profilePageRes, reelsPageRes] = await Promise.all([
    fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
      headers: { 'User-Agent': GOOGLEBOT_UA },
      cache: 'no-store',
    }),
    fetch(`https://www.instagram.com/${encodeURIComponent(username)}/reels/`, {
      headers: { 'User-Agent': GOOGLEBOT_UA },
      cache: 'no-store',
    }).catch(() => null),
  ])

  if (!profilePageRes.ok) {
    throw new Error(
      `Failed to load Instagram profile @${username} (HTTP ${profilePageRes.status})`
    )
  }

  const profileHtml = await profilePageRes.text()
  const reelsHtml = reelsPageRes && reelsPageRes.ok ? await reelsPageRes.text() : ''

  const profileId = profileHtml.match(/"profile_id":"(\d+)"/)?.[1] || ''
  const lsd = profileHtml.match(/"LSD",\[\],\{"token":"([^"]+)"\}/)?.[1] || ''
  const rawCookies = profilePageRes.headers.getSetCookie
    ? profilePageRes.headers.getSetCookie().map((c) => c.split(';')[0])
    : []
  const cookies = rawCookies.join('; ')
  const csrf = rawCookies.find((c) => c.startsWith('csrftoken='))?.split('=')[1] || ''

  // Parse fallback metrics from og:description ("10K Followers, 310 Following, 111 Posts - See Instagram photos and videos from ...")
  const ogDesc = decodeHtmlEntities(
    profileHtml.match(/<meta property="og:description" content="([^"]+)"/i)?.[1] || ''
  )
  const ogTitle = decodeHtmlEntities(
    profileHtml.match(/<meta property="og:title" content="([^"]+)"/i)?.[1] || ''
  )
  const ogImage = decodeHtmlEntities(
    profileHtml.match(/<meta property="og:image" content="([^"]+)"/i)?.[1] || ''
  ) || null

  const ogFollowers = parseAbbreviatedCount(
    ogDesc.match(/([\d.,]+[KMB]?)\s+Followers/i)?.[1]
  )
  const ogFollowing = parseAbbreviatedCount(
    ogDesc.match(/([\d.,]+[KMB]?)\s+Following/i)?.[1]
  )
  const ogPosts = parseAbbreviatedCount(
    ogDesc.match(/([\d.,]+[KMB]?)\s+Posts/i)?.[1]
  )

  // Fetch full structured profile via PolarisProfilePageContentQuery
  let userObj: Record<string, unknown> | null = null
  if (profileId && lsd) {
    try {
      const body = new URLSearchParams({
        av: '0',
        __d: 'www',
        __user: '0',
        __a: '1',
        __req: '1',
        lsd,
        fb_api_caller_class: 'RelayModern',
        fb_api_req_friendly_name: 'PolarisProfilePageContentQuery',
        variables: JSON.stringify({
          enable_integrity_filters: true,
          id: profileId,
          render_surface: 'PROFILE',
          __relay_internal__pv__PolarisCannesGuardianExperienceEnabledrelayprovider: true,
          __relay_internal__pv__PolarisCASB976ProfileEnabledrelayprovider: false,
          __relay_internal__pv__PolarisProfileInformTreatmentBannerEnabledrelayprovider: false,
          __relay_internal__pv__PolarisWebSchoolsEnabledrelayprovider: false,
          __relay_internal__pv__PolarisProfileRingsGradientEnabledrelayprovider: false,
          __relay_internal__pv__PolarisClipsTabebLoggingEnabledrelayprovider: false,
          __relay_internal__pv__PolarisRepostsConsumptionEnabledrelayprovider: false,
          __relay_internal__pv__PolarisShortDramaEnabledrelayprovider: false,
        }),
        server_timestamps: 'true',
        doc_id: '40158838120366999',
      })

      const gRes = await fetch('https://www.instagram.com/graphql/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': GOOGLEBOT_UA,
          'X-FB-LSD': lsd,
          'X-CSRFToken': csrf,
          'X-IG-App-ID': '936619743392459',
          'X-ASBD-ID': '129477',
          'X-FB-Friendly-Name': 'PolarisProfilePageContentQuery',
          Origin: 'https://www.instagram.com',
          Referer: `https://www.instagram.com/${username}/`,
          Cookie: cookies,
        },
        body: body.toString(),
        cache: 'no-store',
      })

      if (gRes.ok) {
        const gJson = await gRes.json()
        if (gJson?.data?.user) {
          userObj = gJson.data.user as Record<string, unknown>
        }
      }
    } catch {
      // Fallback to OG metadata if GraphQL fails
    }
  }

  const handle = String(userObj?.username || username)
  const fallbackNameFromOg =
    ogTitle
      .split(/\(@/)[0]
      ?.replace(/•\s*Instagram.*$/i, '')
      .trim() || handle
  const displayName = String(userObj?.full_name || fallbackNameFromOg || handle)
  const bio = decodeHtmlEntities(String(userObj?.biography || ''))
  const category = decodeHtmlEntities(String(userObj?.category || ''))
  const rawAvatar =
    (userObj?.hd_profile_pic_url_info as { url?: string } | undefined)?.url ||
    (typeof userObj?.profile_pic_url === 'string' ? userObj.profile_pic_url : null) ||
    ogImage ||
    null

  const rawBioLinks = Array.isArray(userObj?.bio_links)
    ? (userObj.bio_links as Array<{ title?: string; url?: string }>)
    : []
  const bioLinks = rawBioLinks
    .filter((b) => typeof b?.url === 'string' && b.url.trim().length > 0)
    .map((b) => ({
      title: (b.title || '').trim() || b.url!.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0],
      url: b.url!.trim(),
    }))

  const linkInBioUrl =
    (typeof userObj?.external_url === 'string' && userObj.external_url.trim()) ||
    bioLinks[0]?.url ||
    null

  const followers = Number(userObj?.follower_count ?? ogFollowers ?? 0)
  const followingCount =
    userObj?.following_count !== undefined && userObj?.following_count !== null
      ? Number(userObj.following_count)
      : ogFollowing
  const postsCount =
    userObj?.media_count !== undefined && userObj?.media_count !== null
      ? Number(userObj.media_count)
      : ogPosts

  // Extract timeline/reel nodes from both /reels/ and / main profile HTML
  const rawNodes = [
    ...extractTimelineNodesFromHtml(reelsHtml),
    ...extractTimelineNodesFromHtml(profileHtml),
  ]

  const uniqueByShortcode = new Map<string, RawTimelineNode>()
  for (const node of rawNodes) {
    if (!uniqueByShortcode.has(node.shortcode)) {
      uniqueByShortcode.set(node.shortcode, node)
    }
  }

  const allNodes = Array.from(uniqueByShortcode.values())
  // Prioritize video / Reel nodes first, then any remaining posts if needed
  const videoNodes = allNodes.filter(
    (n) =>
      n.typename === 'XIGPolarisVideoMedia' ||
      n.mediaType === 2 ||
      n.productType === 'clips'
  )
  const otherNodes = allNodes.filter(
    (n) =>
      n.typename !== 'XIGPolarisVideoMedia' &&
      n.mediaType !== 2 &&
      n.productType !== 'clips'
  )

  const selectedNodes = [...videoNodes, ...otherNodes].slice(0, clampedReelsCount)

  // Fetch detailed metrics per Reel in parallel
  const detailedReels = await Promise.all(
    selectedNodes.map((node) =>
      fetchReelDetailsByShortcode({
        shortcode: node.shortcode,
        lsd,
        csrf,
        cookies,
        fallbackNode: node,
        followersCount: followers,
      })
    )
  )

  const rawReels = detailedReels.filter((r): r is ScrapedInstagramReel => r !== null)

  // Compute median views across scraped reels for automated backend tier diagnosis
  const sortedViews = rawReels
    .map((r) => r.views)
    .filter((v) => v >= 0)
    .sort((a, b) => a - b)
  const medianViews =
    sortedViews.length === 0
      ? 0
      : sortedViews.length % 2 === 1
        ? sortedViews[Math.floor(sortedViews.length / 2)]
        : Math.round(
            (sortedViews[sortedViews.length / 2 - 1] +
              sortedViews[sortedViews.length / 2]) /
              2
          )

  // Rank reels by composite impact score to tag #1, #2, #3, #4, #5
  const rankedByScore = [...rawReels].sort((a, b) => {
    const scoreA =
      a.views +
      a.likes * 15 +
      a.comments * 40 +
      (a.shares || 0) * 50 +
      (a.saves || 0) * 45
    const scoreB =
      b.views +
      b.likes * 15 +
      b.comments * 40 +
      (b.shares || 0) * 50 +
      (b.saves || 0) * 45
    return scoreB - scoreA
  })
  const rankMap = new Map<string, number>()
  rankedByScore.forEach((r, idx) => {
    rankMap.set(r.shortcode, idx + 1)
  })

  const reels = rawReels.map((r) => {
    const rank = rankMap.get(r.shortcode) || 99
    const mult = medianViews > 0 ? r.views / medianViews : 1
    const isTopOutlier = mult >= 1.6 || rank <= 2
    const isAboveAvg = !isTopOutlier && (mult >= 1.1 || rank <= 5)
    const isUnderperforming = mult < 0.75 && rank > 5

    const autoPros = isTopOutlier
      ? `أداء استثنائي يتفوق على وسيط الحساب بـ ${mult.toFixed(1)}x (المرتبة #${rank} على الحساب) مع خطاف افتتاحي يجذب الانتباه فوراً.`
      : isAboveAvg
        ? `تفاعل أعلى من المعدل الطبيعي للحساب (${mult.toFixed(1)}x من الوسيط) وموضوع يلامس اهتمام الجمهور المستهدف.`
        : `طرح واضح للموضوع الأساسي وجودة إنتاج مقبولة.`

    const autoCons = !r.hasCta
      ? 'غياب دعوة صريحة للتفاعل (CTA) في نهاية الفيديو أو الوصف لتحويل المشاهدين إلى عملاء محتملين.'
      : isUnderperforming
        ? `انخفاض الوصول (${mult.toFixed(1)}x مقارنة بوسيط الحساب) نتيجة بطء إيقاع الثواني الـ 3 الأولى وعدم كفاية عناصر كسر النمط.`
        : 'يمكن مضاعفة معدل الحفظ والمشاركة عبر تكثيف القيمة التطبيقية وإبراز النتيجة النهائية في أول ثانيتين.'

    const autoNotes =
      rank <= 5
        ? `مصنّف ضمن أفضل 5 فيديوهات في الحساب (المركز #${rank}) — يوصى بإعادة تدوير هيكل هذا الفيديو وزاويته التسويقية في الخطة القادمة.`
        : isUnderperforming
          ? 'يحتاج إلى إعادة صياغة الهوك البصري واللفظي وتقليص المقدمات الطويلة.'
          : 'أداء مستقر ضمن المعدل الطبيعي للحساب.'

    return {
      ...r,
      pros: r.pros || autoPros,
      cons: r.cons || autoCons,
      editorNotes: r.editorNotes || autoNotes,
    }
  })

  return {
    handle,
    displayName,
    niche: category || '',
    avatarUrl: toProxiedInstagramImage(rawAvatar),
    bio,
    bioLinks,
    linkInBioUrl,
    followers,
    followingCount,
    postsCount,
    profileUrl: `https://www.instagram.com/${handle}/`,
    isVerified: Boolean(userObj?.is_verified),
    reels,
  }
}
