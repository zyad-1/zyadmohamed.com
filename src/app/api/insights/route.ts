import { NextResponse } from 'next/server'
import { getDatabase, saveDatabase } from '@/lib/storage'
import { readAuditStore } from '@/modules/audit/server/db'
import {
  getCountryByCode,
  DEFAULT_COUNTRY_CODE,
  resolveServerTelemetryGeo,
} from '@/lib/countries'

export const dynamic = 'force-dynamic'

interface CountryAgg {
  countryCode: string
  countryNameAr: string
  countryNameEn: string
  flag: string
  views: number
  uniqueSessions: Set<string>
  bookings: number
  scrollDepths: number[]
}

export interface InsightRuleEvaluation {
  id: string
  category: 'website' | 'audits' | 'overall'
  status: 'optimal' | 'warning' | 'critical'
  metricValue: string
  benchmarkLabelAr: string
  benchmarkLabelEn: string
  titleAr: string
  titleEn: string
  descriptionAr: string
  descriptionEn: string
  actionAr: string
  actionEn: string
}

export async function POST(req: Request) {
  try {
    const raw = await req.text()
    if (!raw) return NextResponse.json({ ok: false }, { status: 400 })
    const body = JSON.parse(raw)

    const resolvedGeo = await resolveServerTelemetryGeo(
      req,
      body.countryCode,
      body.countryName
    )
    const c = resolvedGeo
      ? getCountryByCode(resolvedGeo.countryCode, resolvedGeo.countryName)
      : null

    const db = await getDatabase()
    if (!Array.isArray(db.siteEvents)) {
      db.siteEvents = []
    }

    db.siteEvents.unshift({
      id: `sev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sessionId: String(body.sessionId || `anon_${Date.now()}`),
      event: String(body.event || 'PAGE_VIEW'),
      countryCode: c?.code || '',
      countryName: c?.nameAr || '',
      payload: body.payload && typeof body.payload === 'object' ? body.payload : {},
      createdAt: new Date().toISOString(),
    })

    if (db.siteEvents.length > 4000) {
      db.siteEvents = db.siteEvents.slice(0, 4000)
    }

    await saveDatabase(db)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

function resolveDateWindow(searchParams: URLSearchParams): {
  range: string
  startMs: number
  endMs: number
  prevStartMs: number
  prevEndMs: number
  daysSpan: number
} {
  const range = (searchParams.get('range') || 'all').toLowerCase()
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  if (range === 'custom' && (fromParam || toParam)) {
    const startMs = fromParam ? new Date(`${fromParam}T00:00:00`).getTime() : now - 30 * dayMs
    const endMs = toParam ? new Date(`${toParam}T23:59:59.999`).getTime() : now
    const safeStart = Number.isNaN(startMs) ? now - 30 * dayMs : startMs
    const safeEnd = Number.isNaN(endMs) ? now : Math.max(safeStart + 1000, endMs)
    const span = Math.max(1, Math.round((safeEnd - safeStart) / dayMs))
    return {
      range: 'custom',
      startMs: safeStart,
      endMs: safeEnd,
      prevStartMs: safeStart - (safeEnd - safeStart),
      prevEndMs: safeStart,
      daysSpan: Math.min(90, span),
    }
  }

  if (range === 'today') {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const startMs = startOfToday.getTime()
    return {
      range: 'today',
      startMs,
      endMs: now,
      prevStartMs: startMs - dayMs,
      prevEndMs: startMs,
      daysSpan: 1,
    }
  }

  if (range === '7d') {
    const startMs = now - 7 * dayMs
    return {
      range: '7d',
      startMs,
      endMs: now,
      prevStartMs: startMs - 7 * dayMs,
      prevEndMs: startMs,
      daysSpan: 7,
    }
  }

  if (range === '30d') {
    const startMs = now - 30 * dayMs
    return {
      range: '30d',
      startMs,
      endMs: now,
      prevStartMs: startMs - 30 * dayMs,
      prevEndMs: startMs,
      daysSpan: 14,
    }
  }

  if (range === '90d') {
    const startMs = now - 90 * dayMs
    return {
      range: '90d',
      startMs,
      endMs: now,
      prevStartMs: startMs - 90 * dayMs,
      prevEndMs: startMs,
      daysSpan: 15,
    }
  }

  // 'all' -> include all historical records, with a 14-day timeline visualization
  return {
    range: 'all',
    startMs: 0,
    endMs: now + dayMs,
    prevStartMs: now - 60 * dayMs,
    prevEndMs: now - 30 * dayMs,
    daysSpan: 14,
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const windowInfo = resolveDateWindow(url.searchParams)

    const [cmsDb, auditStore] = await Promise.all([
      getDatabase(),
      readAuditStore(),
    ])

    const allSiteEvents = Array.isArray(cmsDb.siteEvents) ? cmsDb.siteEvents : []
    const allFormSubmissions = Array.isArray(cmsDb.formSubmissions)
      ? cmsDb.formSubmissions
      : []
    const audits = Array.isArray(auditStore.audits) ? auditStore.audits : []

    const inWindow = (iso?: string | null) => {
      if (windowInfo.range === 'all') return true
      if (!iso) return false
      const t = new Date(iso).getTime()
      if (Number.isNaN(t)) return false
      return t >= windowInfo.startMs && t <= windowInfo.endMs
    }

    const inPrevWindow = (iso?: string | null) => {
      if (!iso) return false
      const t = new Date(iso).getTime()
      if (Number.isNaN(t)) return false
      return t >= windowInfo.prevStartMs && t < windowInfo.prevEndMs
    }

    const siteEvents = allSiteEvents.filter((ev) => inWindow(ev.createdAt))
    const formSubmissions = allFormSubmissions.filter((sub) => inWindow(sub.createdAt))

    // Previous period counts for growth comparison
    const prevSiteEvents = allSiteEvents.filter((ev) => inPrevWindow(ev.createdAt))
    const prevFormSubmissions = allFormSubmissions.filter((sub) =>
      inPrevWindow(sub.createdAt)
    )
    const prevSiteViews = prevSiteEvents.filter((e) => e.event === 'PAGE_VIEW').length
    const prevSiteBookings = Math.max(
      prevSiteEvents.filter((e) => e.event === 'Schedule_Call').length,
      prevFormSubmissions.filter((s) => s.qualified !== false).length
    )

    // =========================================================================
    // 1. MAIN WEBSITE INSIGHTS
    // =========================================================================
    const siteSessions = new Set<string>()
    let pageViews = 0
    let vslPlays = 0
    let formStarts = 0
    let faqViews = 0
    let siteBookings = 0
    let siteQualifiedEvents = 0
    let siteUnqualifiedEvents = 0
    const siteScrollBySession = new Map<string, number>()
    const siteCountries = new Map<string, CountryAgg>()
    const budgetCounts = new Map<string, number>()

    const ensureCountryAgg = (
      map: Map<string, CountryAgg>,
      rawCode?: string,
      rawName?: string
    ): CountryAgg | null => {
      const cleanCode = String(rawCode || '').trim().toUpperCase()
      if (!/^[A-Z]{2}$/.test(cleanCode) || cleanCode === 'XX') {
        return null
      }
      const c = getCountryByCode(cleanCode, rawName)
      const existing = map.get(c.code)
      if (existing) return existing
      const created: CountryAgg = {
        countryCode: c.code,
        countryNameAr: c.nameAr,
        countryNameEn: c.nameEn,
        flag: c.flag,
        views: 0,
        uniqueSessions: new Set<string>(),
        bookings: 0,
        scrollDepths: [],
      }
      map.set(c.code, created)
      return created
    }

    // Build session -> country map for website sessions
    const siteSessionCountry = new Map<string, { code: string; name?: string }>()
    for (const ev of siteEvents) {
      const code = String(ev.countryCode || '').trim().toUpperCase()
      if (/^[A-Z]{2}$/.test(code) && code !== 'XX') {
        siteSessionCountry.set(ev.sessionId, { code, name: ev.countryName })
      }
    }

    for (const ev of siteEvents) {
      siteSessions.add(ev.sessionId)
      const sessGeo = siteSessionCountry.get(ev.sessionId)
      const cAgg = ensureCountryAgg(
        siteCountries,
        ev.countryCode || sessGeo?.code,
        ev.countryName || sessGeo?.name
      )
      if (cAgg) {
        cAgg.uniqueSessions.add(ev.sessionId)
      }

      if (ev.event === 'PAGE_VIEW') {
        pageViews++
        if (cAgg) cAgg.views++
      } else if (ev.event === 'VSL_Play') {
        vslPlays++
      } else if (ev.event === 'Form_Start') {
        formStarts++
      } else if (ev.event === 'FAQ_VIEW') {
        faqViews++
      } else if (ev.event === 'Lead_Qualified') {
        siteQualifiedEvents++
      } else if (ev.event === 'Lead_Unqualified') {
        siteUnqualifiedEvents++
      } else if (ev.event === 'Schedule_Call') {
        siteBookings++
        if (cAgg) cAgg.bookings++
      } else if (ev.event === 'SCROLL_DEPTH') {
        const depth = Number(ev.payload?.depth || 0)
        if (depth > 0) {
          const prev = siteScrollBySession.get(ev.sessionId) || 0
          if (depth > prev) siteScrollBySession.set(ev.sessionId, depth)
          if (cAgg) cAgg.scrollDepths.push(depth)
        }
      } else if (ev.event === 'BUDGET_SELECT') {
        const b = String(ev.payload?.budget || '').trim()
        if (b) {
          budgetCounts.set(b, (budgetCounts.get(b) || 0) + 1)
        }
      }
    }

    const mainForm = cmsDb.forms.find(
      (f) => f.id === 'frm_funnel_main' || f.slug === 'funnel-qualification'
    )
    const totalFormSubmissions = formSubmissions.length
    const qualifiedSubmissions = formSubmissions.filter((s) => s.qualified !== false).length
    const unqualifiedSubmissions = formSubmissions.filter((s) => s.qualified === false).length

    for (const sub of formSubmissions) {
      const answers = sub.answers || {}
      for (const [k, v] of Object.entries(answers)) {
        if (
          k.includes('ميزانيتك') ||
          k.includes('الميزانية') ||
          k.toLowerCase().includes('budget') ||
          v.includes('$')
        ) {
          if (v && v !== '—') {
            budgetCounts.set(v, (budgetCounts.get(v) || 0) + 1)
          }
        }
      }
      if (sub.countryCode) {
        const cAgg = ensureCountryAgg(siteCountries, sub.countryCode, sub.countryName)
        if (cAgg && sub.qualified !== false) {
          cAgg.bookings++
        }
      }
    }

    const effectivePageViews =
      windowInfo.range === 'all'
        ? Math.max(pageViews, mainForm?.views || 0, totalFormSubmissions * 3)
        : Math.max(pageViews, totalFormSubmissions * 2)
    const effectiveUniqueSiteVisitors = Math.max(
      siteSessions.size,
      totalFormSubmissions
    )
    const effectiveFormStarts = Math.max(formStarts, totalFormSubmissions)
    const effectiveQualified = Math.max(siteQualifiedEvents, qualifiedSubmissions)
    const effectiveUnqualified = Math.max(siteUnqualifiedEvents, unqualifiedSubmissions)
    const effectiveSiteBookings = Math.max(siteBookings, qualifiedSubmissions)

    const siteScrollValues = Array.from(siteScrollBySession.values())
    const siteAvgRetention =
      siteScrollValues.length > 0
        ? Math.round(
            siteScrollValues.reduce((a, b) => a + b, 0) / siteScrollValues.length
          )
        : effectivePageViews > 0
          ? 64
          : 0

    const totalBudgetClicks = Array.from(budgetCounts.values()).reduce(
      (a, b) => a + b,
      0
    )
    const budgetBreakdown = Array.from(budgetCounts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percentage:
          totalBudgetClicks > 0 ? Math.round((count / totalBudgetClicks) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    const siteCountryDemographics = Array.from(siteCountries.values())
      .map((c) => {
        const avgRet =
          c.scrollDepths.length > 0
            ? Math.round(
                c.scrollDepths.reduce((a, b) => a + b, 0) / c.scrollDepths.length
              )
            : siteAvgRetention
        const viewsCount = Math.max(c.views, c.uniqueSessions.size)
        return {
          code: c.countryCode,
          countryCode: c.countryCode,
          name: c.countryNameAr,
          nameAr: c.countryNameAr,
          nameEn: c.countryNameEn,
          countryName: c.countryNameAr,
          flag: c.flag,
          views: viewsCount,
          opens: viewsCount,
          uniqueVisitors: c.uniqueSessions.size,
          bookings: c.bookings,
          retentionRate: avgRet,
          avgRetentionPct: avgRet,
        }
      })
      .sort((a, b) => b.views - a.views)

    // =========================================================================
    // 2. AUDIT INSIGHTS (AGGREGATE + PER AUDIT)
    // =========================================================================
    const auditCountries = new Map<string, CountryAgg>()
    const auditGlobalSessions = new Set<string>()
    let totalAuditOpens = 0
    let totalAuditCtaClicks = 0
    let prevAuditOpens = 0
    let prevAuditCtaClicks = 0
    const allAuditScrollDepths: number[] = []

    const perAuditStats = audits.map((audit) => {
      const rawEvs = Array.isArray(audit.events) ? audit.events : []
      for (const pe of rawEvs) {
        if (inPrevWindow(pe.createdAt)) {
          if (pe.type === 'OPEN') prevAuditOpens++
          if (pe.type === 'CTA_CLICK') prevAuditCtaClicks++
        }
      }

      const evs = rawEvs.filter((e) => inWindow(e.createdAt))
      // Deduplicate rapid duplicate OPEN events within 4s from the same sessionId (React StrictMode)
      const lastOpenBySession = new Map<string, number>()
      const openEvs = evs.filter((e) => {
        if (e.type !== 'OPEN') return false
        const t = new Date(e.createdAt).getTime()
        const prevT = lastOpenBySession.get(e.sessionId)
        if (prevT !== undefined && Math.abs(t - prevT) < 4000) {
          return false
        }
        lastOpenBySession.set(e.sessionId, t)
        return true
      })
      const ctaEvs = evs.filter((e) => e.type === 'CTA_CLICK')
      const scrollEvs = evs.filter((e) => e.type === 'SCROLL_DEPTH')
      const sectionEvs = evs.filter((e) => e.type === 'SECTION_VIEW')

      const sessions = new Set(evs.map((e) => e.sessionId))
      sessions.forEach((s) => auditGlobalSessions.add(s))

      const opensCount = openEvs.length
      const ctaCount = ctaEvs.length
      totalAuditOpens += opensCount
      totalAuditCtaClicks += ctaCount

      const sessionMaxScroll = new Map<string, number>()
      for (const sEv of scrollEvs) {
        const d = Number(sEv.payload?.depth || 0)
        if (d > 0) {
          const prev = sessionMaxScroll.get(sEv.sessionId) || 0
          if (d > prev) sessionMaxScroll.set(sEv.sessionId, d)
        }
      }

      const scrollList = Array.from(sessionMaxScroll.values())
      let retentionRate = 0
      if (scrollList.length > 0) {
        retentionRate = Math.round(
          scrollList.reduce((a, b) => a + b, 0) / scrollList.length
        )
        allAuditScrollDepths.push(...scrollList)
      } else if (sectionEvs.length > 0) {
        const uniqueSections = new Set(
          sectionEvs.map((e) => String(e.payload?.section || ''))
        ).size
        retentionRate = Math.min(100, Math.round((uniqueSections / 8) * 100))
        allAuditScrollDepths.push(retentionRate)
      } else if (opensCount > 0) {
        retentionRate = 35
        allAuditScrollDepths.push(35)
      }

      // Build session -> real country lookup so all events in a session share its resolved country
      const sessionCountryMap = new Map<string, { code: string; name?: string }>()
      for (const e of evs) {
        const rawCode = String(e.payload?.countryCode || '').trim().toUpperCase()
        const rawName = String(e.payload?.countryName || '').trim()
        if (/^[A-Z]{2}$/.test(rawCode) && rawCode !== 'XX') {
          sessionCountryMap.set(e.sessionId, { code: rawCode, name: rawName })
        }
      }

      const perAuditCountryMap = new Map<
        string,
        {
          code: string
          countryCode: string
          name: string
          nameAr: string
          nameEn: string
          countryName: string
          flag: string
          count: number
        }
      >()

      // Count OPEN events per country (never inventing 'SA' if country is unknown)
      for (const e of openEvs) {
        const sessGeo = sessionCountryMap.get(e.sessionId)
        const rawCode = String(e.payload?.countryCode || sessGeo?.code || '')
          .trim()
          .toUpperCase()
        const rawName = String(e.payload?.countryName || sessGeo?.name || '').trim()
        if (!/^[A-Z]{2}$/.test(rawCode) || rawCode === 'XX') continue

        const c = getCountryByCode(rawCode, rawName)
        const existing = perAuditCountryMap.get(c.code)
        if (existing) {
          existing.count++
        } else {
          perAuditCountryMap.set(c.code, {
            code: c.code,
            countryCode: c.code,
            name: c.nameAr,
            nameAr: c.nameAr,
            nameEn: c.nameEn,
            countryName: c.nameAr,
            flag: c.flag,
            count: 1,
          })
        }

        const gAgg = ensureCountryAgg(auditCountries, c.code, c.nameAr)
        if (gAgg) {
          gAgg.views++
          gAgg.uniqueSessions.add(e.sessionId)
        }
      }

      for (const e of evs) {
        if (e.type === 'OPEN') continue
        const sessGeo = sessionCountryMap.get(e.sessionId)
        const rawCode = String(e.payload?.countryCode || sessGeo?.code || '')
          .trim()
          .toUpperCase()
        const rawName = String(e.payload?.countryName || sessGeo?.name || '').trim()
        if (!/^[A-Z]{2}$/.test(rawCode) || rawCode === 'XX') continue

        const c = getCountryByCode(rawCode, rawName)
        if (e.type === 'CTA_CLICK') {
          const gAgg = ensureCountryAgg(auditCountries, c.code, c.nameAr)
          if (gAgg) gAgg.bookings++
        } else if (e.type === 'SCROLL_DEPTH') {
          const d = Number(e.payload?.depth || 0)
          if (d > 0) {
            const gAgg = ensureCountryAgg(auditCountries, c.code, c.nameAr)
            if (gAgg) gAgg.scrollDepths.push(d)
          }
        }
      }

      const sortedOpenTimes = openEvs
        .map((e) => e.createdAt)
        .sort((a, b) => a.localeCompare(b))

      const handle = audit.prospect?.handle || 'client'
      const displayName = audit.prospect?.displayName || handle
      const avatarUrl = audit.prospect?.avatarUrl || null

      return {
        id: audit.id,
        auditId: audit.id,
        shareToken: audit.shareToken,
        handle,
        instagramHandle: handle,
        displayName,
        clientName: displayName,
        avatarUrl,
        status: audit.status,
        isOnline: audit.status === 'PUBLISHED',
        overallScore: audit.overallScore,
        opened: opensCount > 0,
        totalOpens: opensCount,
        uniqueVisitors: sessions.size,
        retentionRate,
        retentionPct: retentionRate,
        ctaClicks: ctaCount,
        booked: ctaCount > 0,
        bookedCall: ctaCount > 0,
        firstOpenedAt: sortedOpenTimes[0] || null,
        lastOpenedAt: sortedOpenTimes[sortedOpenTimes.length - 1] || null,
        countries: Array.from(perAuditCountryMap.values()).sort(
          (a, b) => b.count - a.count
        ),
      }
    })

    const publishedAuditsCount = audits.filter(
      (a) => a.status === 'PUBLISHED'
    ).length
    const openedAuditsCount = perAuditStats.filter((a) => a.totalOpens > 0).length
    const bookedAuditsCount = perAuditStats.filter((a) => a.booked).length
    const avgOpensPerAudit =
      audits.length > 0
        ? Number((totalAuditOpens / audits.length).toFixed(1))
        : 0
    const auditBookingRate =
      openedAuditsCount > 0
        ? Math.round((bookedAuditsCount / openedAuditsCount) * 100)
        : 0
    const auditAvgRetentionRate =
      allAuditScrollDepths.length > 0
        ? Math.round(
            allAuditScrollDepths.reduce((a, b) => a + b, 0) /
              allAuditScrollDepths.length
          )
        : 0

    const auditCountryDemographics = Array.from(auditCountries.values())
      .map((c) => {
        const opensVal = Math.max(c.views, c.uniqueSessions.size)
        const retVal =
          c.scrollDepths.length > 0
            ? Math.round(
                c.scrollDepths.reduce((a, b) => a + b, 0) / c.scrollDepths.length
              )
            : auditAvgRetentionRate
        return {
          code: c.countryCode,
          countryCode: c.countryCode,
          name: c.countryNameAr,
          nameAr: c.countryNameAr,
          nameEn: c.countryNameEn,
          countryName: c.countryNameAr,
          flag: c.flag,
          views: opensVal,
          opens: opensVal,
          uniqueVisitors: c.uniqueSessions.size,
          bookings: c.bookings,
          retentionRate: retVal,
          avgRetentionPct: retVal,
        }
      })
      .sort((a, b) => b.opens - a.opens)

    // =========================================================================
    // 3. OVERALL COMBINED INSIGHTS (MAIN WEBSITE + AUDITS)
    // =========================================================================
    const combinedCountriesMap = new Map<
      string,
      {
        countryCode: string
        countryNameAr: string
        countryNameEn: string
        flag: string
        views: number
        bookings: number
        retentionRates: number[]
      }
    >()

    for (const sc of siteCountryDemographics) {
      combinedCountriesMap.set(sc.countryCode, {
        countryCode: sc.countryCode,
        countryNameAr: sc.nameAr,
        countryNameEn: sc.nameEn,
        flag: sc.flag,
        views: sc.views,
        bookings: sc.bookings,
        retentionRates: sc.retentionRate > 0 ? [sc.retentionRate] : [],
      })
    }

    for (const ac of auditCountryDemographics) {
      const existing = combinedCountriesMap.get(ac.countryCode)
      if (existing) {
        existing.views += ac.opens
        existing.bookings += ac.bookings
        if (ac.retentionRate > 0) existing.retentionRates.push(ac.retentionRate)
      } else {
        combinedCountriesMap.set(ac.countryCode, {
          countryCode: ac.countryCode,
          countryNameAr: ac.nameAr,
          countryNameEn: ac.nameEn,
          flag: ac.flag,
          views: ac.opens,
          bookings: ac.bookings,
          retentionRates: ac.retentionRate > 0 ? [ac.retentionRate] : [],
        })
      }
    }

    const combinedCountries = Array.from(combinedCountriesMap.values()).map(
      (c) => {
        const conv =
          c.views > 0 ? Math.min(100, Math.round((c.bookings / c.views) * 100)) : 0
        const ret =
          c.retentionRates.length > 0
            ? Math.round(
                c.retentionRates.reduce((a, b) => a + b, 0) /
                  c.retentionRates.length
              )
            : 60
        return {
          code: c.countryCode,
          countryCode: c.countryCode,
          name: c.countryNameAr,
          nameAr: c.countryNameAr,
          nameEn: c.countryNameEn,
          countryName: c.countryNameAr,
          flag: c.flag,
          views: c.views,
          opens: c.views,
          bookings: c.bookings,
          conversionRate: conv,
          conversionPct: conv,
          retentionRate: ret,
          avgRetentionPct: ret,
        }
      }
    )

    const overallTotalViews = effectivePageViews + totalAuditOpens
    const overallUniqueVisitors =
      effectiveUniqueSiteVisitors + auditGlobalSessions.size
    const overallTotalBookings = effectiveSiteBookings + totalAuditCtaClicks
    const overallConversionRate =
      overallTotalViews > 0
        ? Math.min(100, Number(((overallTotalBookings / overallTotalViews) * 100).toFixed(1)))
        : 0
    const overallAvgRetention =
      siteAvgRetention > 0 && auditAvgRetentionRate > 0
        ? Math.round((siteAvgRetention + auditAvgRetentionRate) / 2)
        : siteAvgRetention || auditAvgRetentionRate || 0

    const siteConversionRatePct =
      effectivePageViews > 0
        ? Math.min(100, Number(((effectiveSiteBookings / effectivePageViews) * 100).toFixed(1)))
        : 0

    // =========================================================================
    // 4. DAILY TIMELINE SERIES (DATE-BASED DYNAMIC CURVE)
    // =========================================================================
    const dayMs = 24 * 60 * 60 * 1000
    const timelinePointsCount = Math.max(
      7,
      Math.min(30, windowInfo.daysSpan === 1 ? 7 : windowInfo.daysSpan)
    )
    const timelineEndMs =
      windowInfo.range === 'custom' ? windowInfo.endMs : Date.now()
    const dailyMap = new Map<
      string,
      {
        date: string
        labelAr: string
        labelEn: string
        websiteViews: number
        auditOpens: number
        leads: number
        bookings: number
        totalViews: number
      }
    >()

    for (let i = timelinePointsCount - 1; i >= 0; i--) {
      const dObj = new Date(timelineEndMs - i * dayMs)
      const yyyy = dObj.getFullYear()
      const mm = String(dObj.getMonth() + 1).padStart(2, '0')
      const dd = String(dObj.getDate()).padStart(2, '0')
      const key = `${yyyy}-${mm}-${dd}`
      const labelAr = dObj.toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
      })
      const labelEn = dObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      dailyMap.set(key, {
        date: key,
        labelAr,
        labelEn,
        websiteViews: 0,
        auditOpens: 0,
        leads: 0,
        bookings: 0,
        totalViews: 0,
      })
    }

    const toDateKey = (iso?: string | null) => {
      if (!iso) return ''
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return ''
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`
    }

    for (const ev of siteEvents) {
      const k = toDateKey(ev.createdAt)
      const bucket = dailyMap.get(k)
      if (!bucket) continue
      if (ev.event === 'PAGE_VIEW') {
        bucket.websiteViews++
        bucket.totalViews++
      } else if (ev.event === 'Schedule_Call' || ev.event === 'Lead_Qualified') {
        bucket.bookings++
      }
    }

    for (const sub of formSubmissions) {
      const k = toDateKey(sub.createdAt)
      const bucket = dailyMap.get(k)
      if (!bucket) continue
      bucket.leads++
      if (sub.qualified !== false) {
        bucket.bookings = Math.max(bucket.bookings, 1)
      }
    }

    for (const audit of audits) {
      const evs = Array.isArray(audit.events) ? audit.events : []
      for (const e of evs) {
        if (!inWindow(e.createdAt)) continue
        const k = toDateKey(e.createdAt)
        const bucket = dailyMap.get(k)
        if (!bucket) continue
        if (e.type === 'OPEN') {
          bucket.auditOpens++
          bucket.totalViews++
        } else if (e.type === 'CTA_CLICK') {
          bucket.bookings++
        }
      }
    }

    const dailyTimeline = Array.from(dailyMap.values())

    // =========================================================================
    // 5. PERIOD-OVER-PERIOD GROWTH DELTAS
    // =========================================================================
    const prevTotalViews = prevSiteViews + prevAuditOpens
    const prevTotalBookings = prevSiteBookings + prevAuditCtaClicks
    const calcGrowthPct = (curr: number, prev: number) => {
      if (prev <= 0) return curr > 0 ? 100 : 0
      return Math.round(((curr - prev) / prev) * 100)
    }

    const periodComparison = {
      viewsGrowthPct: calcGrowthPct(overallTotalViews, prevTotalViews),
      bookingsGrowthPct: calcGrowthPct(overallTotalBookings, prevTotalBookings),
      siteViewsGrowthPct: calcGrowthPct(effectivePageViews, prevSiteViews),
      auditOpensGrowthPct: calcGrowthPct(totalAuditOpens, prevAuditOpens),
    }

    // =========================================================================
    // 6. GENERAL INSIGHTS RULES & BENCHMARKS ENGINE
    // =========================================================================
    const vslHookRate =
      effectivePageViews > 0
        ? Math.min(100, Math.round((vslPlays / effectivePageViews) * 100))
        : 0
    const formStartRate =
      effectivePageViews > 0
        ? Math.min(100, Math.round((effectiveFormStarts / effectivePageViews) * 100))
        : 0
    const formCompletionRate =
      effectiveFormStarts > 0
        ? Math.min(100, Math.round((totalFormSubmissions / effectiveFormStarts) * 100))
        : 0
    const leadQualificationRate =
      totalFormSubmissions > 0
        ? Math.min(100, Math.round((effectiveQualified / totalFormSubmissions) * 100))
        : 0

    const insightsRules: InsightRuleEvaluation[] = [
      {
        id: 'rule_vsl_hook',
        category: 'website',
        status:
          vslHookRate >= 35 ? 'optimal' : vslHookRate >= 18 ? 'warning' : 'critical',
        metricValue: `${vslHookRate}%`,
        benchmarkLabelAr: 'المعيار القياسي: ≥ 35%',
        benchmarkLabelEn: 'Benchmark: ≥ 35%',
        titleAr: 'قاعدة جذب الفيديو التقديمي (VSL Hook Rate)',
        titleEn: 'VSL Hook & Play Rate Rule',
        descriptionAr:
          vslHookRate >= 35
            ? `أداء ممتاز (${vslHookRate}%) — العنوان الرئيسي وصورة الفيديو يجذبان الزوار لتشغيل الـ VSL بمعدل أعلى من المعيار.`
            : `نسبة تشغيل الفيديو (${vslHookRate}%) أقل من المعيار المستهدف (35%). الزوار يتصفحون الصفحة دون تشغيل الفيديو الكامل.`,
        descriptionEn:
          vslHookRate >= 35
            ? `Strong hook (${vslHookRate}%) — Headline and video thumbnail convert visitors into active VSL viewers above benchmark.`
            : `VSL play rate (${vslHookRate}%) is below the 35% benchmark. Visitors scroll past without playing the video.`,
        actionAr:
          vslHookRate >= 35
            ? 'حافظ على نفس الـ Hook البصري واختبر إضافة وعود رقمية أدق في أول 5 ثوانٍ.'
            : 'جرب تغيير صورة الـ Thumbnail أو تقوية العنوان الفرعي فوق الفيديو مباشرة لرفع الفضول.',
        actionEn:
          vslHookRate >= 35
            ? 'Keep current visual hook and test stronger proof callouts in the first 5 seconds.'
            : 'Test a higher-contrast thumbnail or sharpen the sub-headline directly above the player.',
      },
      {
        id: 'rule_form_completion',
        category: 'website',
        status:
          formCompletionRate >= 65
            ? 'optimal'
            : formCompletionRate >= 40
              ? 'warning'
              : 'critical',
        metricValue: `${formCompletionRate}%`,
        benchmarkLabelAr: 'المعيار القياسي: ≥ 65%',
        benchmarkLabelEn: 'Benchmark: ≥ 65%',
        titleAr: 'قاعدة استكمال نموذج التأهيل (Form Friction Rule)',
        titleEn: 'Qualification Form Completion Rule',
        descriptionAr:
          formCompletionRate >= 65
            ? `معدل إكمال الفورم (${formCompletionRate}%) صحي جداً — الأسئلة سلسة ولا تسبب تسرباً للعملاء المحتملين.`
            : `نسبة إكمال الفورم (${formCompletionRate}%) تشير إلى وجود تسرب بعد بدء الخطوة الأولى (${formStartRate}% معدل البدء).`,
        descriptionEn:
          formCompletionRate >= 65
            ? `Form completion rate (${formCompletionRate}%) is healthy — low friction across qualification steps.`
            : `Form completion (${formCompletionRate}%) shows drop-off after starting the form (${formStartRate}% start rate).`,
        actionAr:
          formCompletionRate >= 65
            ? 'الفورم يعمل بكفاءة عالية؛ استمر في مراقبة جودة الإجابات.'
            : 'قلل عدد الحقول النصية المفتوحة واعتمد أكثر على الاختيارات السريعة (Select).',
        actionEn:
          formCompletionRate >= 65
            ? 'Form friction is optimal; continue monitoring lead answer quality.'
            : 'Reduce open-text fields and rely on quick-select options to minimize drop-off.',
      },
      {
        id: 'rule_qualification_filter',
        category: 'website',
        status:
          leadQualificationRate >= 30 && leadQualificationRate <= 80
            ? 'optimal'
            : leadQualificationRate > 80
              ? 'warning'
              : 'critical',
        metricValue: `${leadQualificationRate}%`,
        benchmarkLabelAr: 'النطاق المثالي: 30% – 80%',
        benchmarkLabelEn: 'Optimal Band: 30% – 80%',
        titleAr: 'قاعدة توازن فلتر التأهيل والميزانية (Qualification Filter Rule)',
        titleEn: 'High-Ticket Qualification Filter Rule',
        descriptionAr:
          leadQualificationRate >= 30 && leadQualificationRate <= 80
            ? `نسبة التأهيل (${leadQualificationRate}%) متوازنة؛ الفلتر يستبعد غير المناسبين ويسمح للعملاء الجادين بالحجز.`
            : leadQualificationRate > 80
              ? `نسبة التأهيل مرتفعة جداً (${leadQualificationRate}%) — قد تحتاج لتشديد شرط الميزانية لحماية وقت المبيعات.`
              : `نسبة التأهيل منخفضة (${leadQualificationRate}%) — أغلب الزوار يختارون ميزانيات غير مؤهلة ويوجهون للـ Lead Magnet.`,
        descriptionEn:
          leadQualificationRate >= 30 && leadQualificationRate <= 80
            ? `Qualification rate (${leadQualificationRate}%) is well-balanced between lead volume and budget quality.`
            : leadQualificationRate > 80
              ? `Qualification rate is very high (${leadQualificationRate}%) — consider tightening budget criteria to protect calendar time.`
              : `Qualification rate is low (${leadQualificationRate}%) — most leads select unqualified budgets and route to the Lead Magnet.`,
        actionAr:
          leadQualificationRate >= 30 && leadQualificationRate <= 80
            ? 'توازن ممتاز بين جودة العميل وحجم الحجوزات.'
            : 'راجع رسائل الاستهداف في المحتوى والـ Reels لجذب شريحة ذات ملاءة مالية أعلى.',
        actionEn:
          leadQualificationRate >= 30 && leadQualificationRate <= 80
            ? 'Great balance between lead quality and calendar volume.'
            : 'Refine top-of-funnel content positioning to attract higher-revenue founders.',
      },
      {
        id: 'rule_audit_conversion',
        category: 'audits',
        status:
          auditBookingRate >= 25
            ? 'optimal'
            : auditBookingRate >= 12
              ? 'warning'
              : 'critical',
        metricValue: `${auditBookingRate}%`,
        benchmarkLabelAr: 'المعيار القياسي: ≥ 25%',
        benchmarkLabelEn: 'Benchmark: ≥ 25%',
        titleAr: 'قاعدة تحويل تقارير الأوديت لحجز مكالمات (Audit-to-Call Rule)',
        titleEn: 'Audit Open-to-Booking Conversion Rule',
        descriptionAr:
          auditBookingRate >= 25
            ? `معدل حجز قوي (${auditBookingRate}%) من العملاء الذين فتحوا تقارير الأوديت المخصصة.`
            : `نسبة الضغط على زر الحجز داخل الأوديت (${auditBookingRate}%) أقل من المعيار المستهدف (25%).`,
        descriptionEn:
          auditBookingRate >= 25
            ? `Strong booking conversion (${auditBookingRate}%) from prospects opening their personalized audit reports.`
            : `Audit CTA conversion (${auditBookingRate}%) is below the 25% target benchmark.`,
        actionAr:
          auditBookingRate >= 25
            ? 'استمر في إرسال رسالة متابعة شخصية بعد أول فتح للرابط بـ 15 دقيقة.'
            : 'تأكد من تفعيل شريط الـ FOMO وتوضيح الفجوة مع المنافسين لتحفيز العميل على الحجز الفوري.',
        actionEn:
          auditBookingRate >= 25
            ? 'Continue following up via WhatsApp/DM within 15 minutes of first link open.'
            : 'Ensure the FOMO banner is active and highlight competitor gaps to drive immediate booking.',
      },
      {
        id: 'rule_retention_depth',
        category: 'overall',
        status:
          overallAvgRetention >= 60
            ? 'optimal'
            : overallAvgRetention >= 40
              ? 'warning'
              : 'critical',
        metricValue: `${overallAvgRetention}%`,
        benchmarkLabelAr: 'المعيار القياسي: ≥ 60%',
        benchmarkLabelEn: 'Benchmark: ≥ 60%',
        titleAr: 'قاعدة عمق القراءة والاحتفاظ بالانتباه (Scroll Retention Rule)',
        titleEn: 'Content Reading & Scroll Retention Rule',
        descriptionAr:
          overallAvgRetention >= 60
            ? `متوسط الاحتفاظ بالعميل (${overallAvgRetention}%) ممتاز — الزوار يقرأون دراسات الحالة والتفاصيل حتى نهاية الصفحة.`
            : `متوسط عمق التصفح (${overallAvgRetention}%) يحتاج لتحسين للوصول إلى قسم الحجز في أسفل الصفحة.`,
        descriptionEn:
          overallAvgRetention >= 60
            ? `Average scroll retention (${overallAvgRetention}%) is strong — visitors read through proof cards and CTA sections.`
            : `Average scroll depth (${overallAvgRetention}%) needs improvement to reach bottom booking sections.`,
        actionAr:
          overallAvgRetention >= 60
            ? 'هيكل الصفحة وتقسيم الـ Sliders يحافظان على انتباه الزائر بنجاح.'
            : 'أبرز نتائج العملاء (Proof Cards) في أعلى الصفحة لرفع معدل إكمال القراءة.',
        actionEn:
          overallAvgRetention >= 60
            ? 'Bento layout and interactive sliders are keeping visitors engaged.'
            : 'Feature top client proof metrics higher on the page to boost scroll continuation.',
      },
    ]

    const budgetSelectionsObj: Record<string, number> = {}
    for (const b of budgetBreakdown) {
      budgetSelectionsObj[b.label] = b.count
    }

    const websitePayload = {
      pageViews: effectivePageViews,
      uniqueVisitors: effectiveUniqueSiteVisitors,
      vslPlays,
      vslHookRate,
      formStarts: effectiveFormStarts,
      formStartRate,
      formCompletionRate,
      leadQualificationRate,
      totalFormSubmissions,
      formSubmissionsCount: totalFormSubmissions,
      qualifiedCount: effectiveQualified,
      qualifiedBookings: effectiveSiteBookings,
      unqualifiedCount: effectiveUnqualified,
      bookingsCount: effectiveSiteBookings,
      conversionRatePct: siteConversionRatePct,
      faqViews,
      avgRetentionRate: siteAvgRetention,
      avgRetentionPct: siteAvgRetention,
      stepCompletions: {
        step1: effectiveFormStarts,
        step2: Math.max(totalFormSubmissions, Math.round(effectiveFormStarts * 0.8)),
        step3: totalFormSubmissions,
      },
      budgetSelections: budgetSelectionsObj,
      funnelSteps: [
        { step: 'زيارات الصفحة الرئيسية', count: effectivePageViews },
        { step: 'تشغيل فيديو الـ VSL', count: vslPlays },
        { step: 'بدء خطوات التأهيل', count: effectiveFormStarts },
        { step: 'إكمال الفورم بالكامل', count: totalFormSubmissions },
        { step: 'حجز المكالمة / مؤهل', count: effectiveSiteBookings },
      ],
      budgetBreakdown,
      countryDemographics: siteCountryDemographics,
      topCountries: siteCountryDemographics,
    }

    return NextResponse.json({
      dateWindow: {
        range: windowInfo.range,
        startIso:
          windowInfo.startMs > 0 ? new Date(windowInfo.startMs).toISOString() : null,
        endIso: new Date(windowInfo.endMs).toISOString(),
      },
      periodComparison,
      dailyTimeline,
      insightsRules,
      overall: {
        totalViews: overallTotalViews,
        uniqueVisitors: overallUniqueVisitors,
        totalBookings: overallTotalBookings,
        conversionRate: overallConversionRate,
        conversionRatePct: overallConversionRate,
        avgRetentionRate: overallAvgRetention,
        avgRetentionPct: overallAvgRetention,
        topCountriesByViews: [...combinedCountries].sort(
          (a, b) => b.views - a.views
        ),
        topCountriesByBookings: [...combinedCountries].sort(
          (a, b) => b.bookings - a.bookings || b.views - a.views
        ),
        topCountriesByRetention: [...combinedCountries].sort(
          (a, b) => b.retentionRate - a.retentionRate
        ),
      },
      mainWebsite: websitePayload,
      website: websitePayload,
      audits: {
        totalAudits: audits.length,
        publishedAudits: publishedAuditsCount,
        openedAuditsCount,
        bookedAuditsCount,
        totalOpens: totalAuditOpens,
        uniqueVisitors: auditGlobalSessions.size,
        avgOpensPerAudit,
        totalBookedOrCta: totalAuditCtaClicks,
        totalBookings: totalAuditCtaClicks,
        bookingRate: auditBookingRate,
        bookingConversionPct: auditBookingRate,
        avgRetentionRate: auditAvgRetentionRate,
        avgRetentionPct: auditAvgRetentionRate,
        topCountries: auditCountryDemographics,
        topCountriesByViews: auditCountryDemographics,
        perAudit: perAuditStats.sort((a, b) => b.totalOpens - a.totalOpens),
      },
    })
  } catch (err) {
    console.error('Error computing insights:', err)
    return NextResponse.json(
      { error: 'Failed to load insights' },
      { status: 500 }
    )
  }
}
