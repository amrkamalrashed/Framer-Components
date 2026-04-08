// PodcastCarousel.tsx (improved)
// Changes applied:
// [CHANGE 1] Added style?: React.CSSProperties to Props interface
// [CHANGE 2] Destructured style from props
// [CHANGE 3] Spread ...style on root <div> (role="region")
// [CHANGE 4] Added PodcastCarousel.displayName after component definition

import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { useState, useRef, useEffect, useCallback, useMemo, memo, CSSProperties } from "react"

/* ━━━ helpers ━━━ */

function detectPlatform(url: string): "spotify" | "youtube" | "other" {
    if (url.includes("spotify.com")) return "spotify"
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube"
    return "other"
}

function extractYouTubeId(url: string): string | null {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    return m ? m[1] : null
}

/* ━━━ reduced motion hook ━━━ */

function useReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        setReduced(mq.matches)
        const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
    }, [])
    return reduced
}

/* ━━━ icons ━━━ */

const SpotifyIcon = memo(({ size = 22 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1DB954" aria-hidden="true">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
))

const YouTubeIcon = memo(({ size = 22 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF0000" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
))

/* ━━━ types ━━━ */

interface MediaItem {
    url: string
    title: string
    imageUrl: string
    duration: string
}

interface FetchedMeta {
    title: string
    thumbnail: string
}

/* ━━━ defaults ━━━ */

const defaultItems: MediaItem[] = [
    { url: "https://open.spotify.com/episode/57AEOUpEQWKr5n5fLtgO6v?si=44e357dd54ab45b8", title: "", imageUrl: "", duration: "" },
    { url: "https://open.spotify.com/episode/4HqetuuiKVH2Mp0NLTl1kg?si=a7847bbd1acf45d3", title: "", imageUrl: "", duration: "" },
    { url: "https://open.spotify.com/episode/6pZiusUBcTnuGQFmQZ8NCd?si=15fa2b997b3f468a", title: "", imageUrl: "", duration: "" },
    { url: "https://open.spotify.com/episode/3TRdNqp2C2DWp5FLjZkcfd?si=caf3954903fa46e5", title: "", imageUrl: "", duration: "" },
    { url: "https://open.spotify.com/episode/4cpVBAFmsXcPjfPfjQEUy9?si=fd26cd71bd764c64", title: "", imageUrl: "", duration: "" },
    { url: "https://open.spotify.com/episode/3ZYKckPZxeQTSYDIfRw9FJ?si=p5goVowBRUC0KLH8A_Gtlg", title: "", imageUrl: "", duration: "" },
    { url: "https://open.spotify.com/episode/03l6Al3FG1y3tCearCpukt?si=f25c030768d14a7e", title: "", imageUrl: "", duration: "" },
    { url: "https://www.youtube.com/watch?v=ynur80Xk9vw", title: "Veiligheid in je lichaam Visualisatie", imageUrl: "", duration: "" },
    { url: "https://www.youtube.com/watch?v=nZE0GSeg2Rg&t=6s", title: "Terug naar de basis \u2013 Jouw innerlijke kind", imageUrl: "", duration: "" },
]

const PLACEHOLDER_COLORS = ["#7956F3", "#F27CA4", "#24B0E5", "#FFD232", "#7956F3", "#F27CA4", "#24B0E5", "#FFD232", "#7956F3"]

/* ━━━ lerp / clamp helpers ━━━ */

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
}
function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v))
}

/**
 * PodcastCarousel - Spotify-style side-by-side carousel
 * Center card auto-flips to reveal info. Side cards show cover art
 * with subtle 3D rotation. Click-and-drag to navigate with real-time
 * card tracking, auto-play with hover pause.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function PodcastCarousel({
    items = defaultItems,
    cardSize = 420,
    cardRadius = 16,
    cardGap = 24,
    sideRotation = 12,
    sideScale = 0.88,
    sideDepth = 60,
    transitionSpeed = 700,
    flipSpeed = 600,
    showArrows = true,
    arrowColor = "#7956F3",
    arrowSize = 48,
    titleFont,
    titleColor = "#FFFFFF",
    gradientStrength = 0.75,
    showPlatformBadge = true,
    perspective = 1200,
    autoPlay = true,
    autoPlayInterval = 4,
    backColor = "#7956F3",
    backAccentColor = "#F27CA4",
    dotActiveColor = "#7956F3",
    dotInactiveColor = "rgba(255,255,255,0.35)",
    visibleSideCards = 1,
    style, // [CHANGE 2] Destructure style from props
}: Props) {
    const [activeIndex, setActiveIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const isStatic = useIsStaticRenderer()
    const [meta, setMeta] = useState<Record<string, FetchedMeta>>({})
    const prefersReducedMotion = useReducedMotion()
    const [isDragging, setIsDragging] = useState(false)

    const total = items.length

    /* ── refs ── */
    const stageRef = useRef<HTMLDivElement>(null)
    const cardElsRef = useRef<(HTMLDivElement | null)[]>([])
    const rafRef = useRef<number>(0)

    /* ── drag state (all in ref for zero-lag) ── */
    const drag = useRef({
        startX: 0,
        active: false,
        didDrag: false,
        startTime: 0,
        currentX: 0,
        fractionalOffset: 0,
        lastX: 0,
        lastTime: 0,
        velocityX: 0,
        pointerId: -1,
    })

    /* ── active index as ref (for use inside RAF without stale closures) ── */
    const activeRef = useRef(activeIndex)
    activeRef.current = activeIndex

    /* ── wrap index for loop ── */
    const wrapIdx = useCallback((i: number) => ((i % total) + total) % total, [total])

    /* ── circular distance ── */
    const circularOffset = useCallback(
        (from: number, to: number): number => {
            let d = to - from
            if (d > total / 2) d -= total
            if (d < -total / 2) d += total
            return d
        },
        [total]
    )

    /* ── card spacing: card width + gap ── */
    const cardSpacing = cardSize + cardGap

    /* ── compute card transforms for a given fractional active position ── */
    const computeCardTransform = useCallback(
        (cardIndex: number, fractionalActive: number) => {
            let offset = cardIndex - fractionalActive
            while (offset > total / 2) offset -= total
            while (offset < -total / 2) offset += total

            const absOffset = Math.abs(offset)
            const centerWeight = clamp(1 - absOffset, 0, 1)

            const tx = offset * cardSpacing
            const ry = offset === 0
                ? 0
                : offset > 0
                    ? lerp(-sideRotation, 0, centerWeight)
                    : lerp(sideRotation, 0, centerWeight)
            const tz = lerp(-sideDepth, 0, centerWeight)
            const scale = lerp(sideScale, 1, centerWeight)
            const opacity = absOffset > visibleSideCards + 0.5
                ? 0
                : clamp(1 - (absOffset - visibleSideCards) * 2, 0, 1) * (centerWeight > 0.15 ? 1 : 0.85)
            const zIndex = Math.round(10 + centerWeight * 10)
            const flipProgress = clamp((centerWeight - 0.6) / 0.4, 0, 1)
            const flipDeg = flipProgress * 180

            return { tx, ry, tz, scale, opacity, zIndex, flipDeg, absOffset, centerWeight }
        },
        [total, cardSpacing, sideRotation, sideDepth, sideScale, visibleSideCards]
    )

    /* ── apply transforms directly to DOM (zero-lag for drag) ── */
    const applyTransforms = useCallback(
        (fractionalActive: number, withTransition: boolean) => {
            const speed = prefersReducedMotion ? 0 : transitionSpeed
            const fSpeed = prefersReducedMotion ? 0 : flipSpeed
            const transStr = withTransition
                ? `transform ${speed}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${speed * 0.6}ms ease`
                : "none"
            const flipTransStr = withTransition
                ? `transform ${fSpeed}ms cubic-bezier(0.22, 1, 0.36, 1)`
                : "none"

            for (let i = 0; i < total; i++) {
                const el = cardElsRef.current[i]
                if (!el) continue

                const { tx, ry, tz, scale, opacity, zIndex, flipDeg, absOffset } = computeCardTransform(i, fractionalActive)

                el.style.transform = `translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${scale})`
                el.style.opacity = String(opacity)
                el.style.zIndex = String(zIndex)
                el.style.transition = transStr
                el.style.pointerEvents = absOffset <= visibleSideCards + 0.5 ? "auto" : "none"

                const flipEl = el.firstElementChild as HTMLElement | null
                if (flipEl) {
                    flipEl.style.transform = `rotateY(${flipDeg}deg)`
                    flipEl.style.transition = flipTransStr
                }
            }
        },
        [total, computeCardTransform, prefersReducedMotion, transitionSpeed, flipSpeed, visibleSideCards]
    )

    /* ── clean up drag state ── */
    const resetDrag = useCallback(() => {
        const d = drag.current
        d.active = false
        d.didDrag = false
        d.fractionalOffset = 0
        d.velocityX = 0
        d.pointerId = -1
        setIsDragging(false)
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = 0
        }
    }, [])

    /* ── navigate ── */
    const goTo = useCallback(
        (idx: number, animated = true) => {
            const wrapped = wrapIdx(idx)
            setActiveIndex(wrapped)
            activeRef.current = wrapped
            applyTransforms(wrapped, animated && !prefersReducedMotion)
        },
        [wrapIdx, applyTransforms, prefersReducedMotion]
    )
    const next = useCallback(() => goTo(activeRef.current + 1), [goTo])
    const prev = useCallback(() => goTo(activeRef.current - 1), [goTo])

    /* ── sync DOM when activeIndex changes from non-drag sources ── */
    useEffect(() => {
        if (!drag.current.active) {
            applyTransforms(activeIndex, true)
        }
    }, [activeIndex, applyTransforms])

    /* ── pointer drag handlers ── */
    const onPointerDown = useCallback(
        (e: React.PointerEvent) => {
            // Only left mouse button or touch
            if (e.button !== 0) return

            const d = drag.current
            d.startX = e.clientX
            d.currentX = e.clientX
            d.active = true
            d.didDrag = false
            d.startTime = Date.now()
            d.fractionalOffset = 0
            d.velocityX = 0
            d.lastX = e.clientX
            d.lastTime = Date.now()
            d.pointerId = e.pointerId

            setIsDragging(true)
            stageRef.current?.setPointerCapture(e.pointerId)
        },
        []
    )

    const onPointerMove = useCallback(
        (e: React.PointerEvent) => {
            const d = drag.current

            // Guard: must be active AND a button must be pressed
            // e.buttons === 0 means no buttons held (pure hover)
            if (!d.active || e.buttons === 0) {
                // If active but no button, the pointerup was missed - clean up
                if (d.active) {
                    resetDrag()
                    applyTransforms(activeRef.current, true)
                }
                return
            }

            const dx = e.clientX - d.startX
            if (Math.abs(dx) > 5) d.didDrag = true

            // Track velocity (exponential moving average)
            const now = Date.now()
            const dt = Math.max(1, now - d.lastTime)
            const instantVelocity = (e.clientX - d.lastX) / dt
            d.velocityX = d.velocityX * 0.6 + instantVelocity * 0.4
            d.lastX = e.clientX
            d.lastTime = now

            // Convert pixel drag to fractional card offset
            d.fractionalOffset = -dx / cardSpacing
            d.currentX = e.clientX

            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = requestAnimationFrame(() => {
                const fractionalActive = activeRef.current + d.fractionalOffset
                applyTransforms(fractionalActive, false)
            })
        },
        [cardSpacing, applyTransforms, resetDrag]
    )

    const onPointerUp = useCallback(
        (e: React.PointerEvent) => {
            const d = drag.current
            if (!d.active) return

            // Release pointer capture
            try {
                stageRef.current?.releasePointerCapture(e.pointerId)
            } catch {}

            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = 0
            }

            const wasDrag = d.didDrag
            const offset = d.fractionalOffset
            const velocity = d.velocityX

            // Reset drag state FIRST
            resetDrag()

            if (!wasDrag) {
                // No drag happened, snap back
                applyTransforms(activeRef.current, true)
                return
            }

            // Determine target based on offset + velocity
            const velocityBoost = -velocity * 0.5
            const rawTarget = activeRef.current + offset + velocityBoost
            const snappedTarget = Math.round(rawTarget)

            // Clamp to at most 1 card jump per drag
            const clampedTarget = clamp(
                snappedTarget,
                activeRef.current - 1,
                activeRef.current + 1
            )

            goTo(clampedTarget, true)
        },
        [applyTransforms, goTo, resetDrag]
    )

    /* ── safety: cancel drag on pointer cancel or lost capture ── */
    const onPointerCancel = useCallback(
        (e: React.PointerEvent) => {
            if (!drag.current.active) return
            resetDrag()
            applyTransforms(activeRef.current, true)
        },
        [resetDrag, applyTransforms]
    )

    const onLostPointerCapture = useCallback(
        (e: React.PointerEvent) => {
            // If we lost capture unexpectedly while dragging, clean up
            if (!drag.current.active) return
            resetDrag()
            applyTransforms(activeRef.current, true)
        },
        [resetDrag, applyTransforms]
    )

    /* ── auto-play ── */
    useEffect(() => {
        if (!autoPlay || isStatic || isHovered || prefersReducedMotion || isDragging) return
        const t = setInterval(next, autoPlayInterval * 1000)
        return () => clearInterval(t)
    }, [autoPlay, autoPlayInterval, next, isStatic, isHovered, prefersReducedMotion, isDragging])

    /* ── keyboard (scoped to component) ── */
    const onKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "ArrowLeft") { e.preventDefault(); prev() }
            else if (e.key === "ArrowRight") { e.preventDefault(); next() }
        },
        [prev, next]
    )

    /* ── fetch oEmbed ── */
    const itemsRef = useRef(items)
    itemsRef.current = items

    useEffect(() => {
        if (isStatic) return
        const currentItems = itemsRef.current
        const ac = new AbortController()
        ;(async () => {
            const results: Record<string, FetchedMeta> = {}
            await Promise.allSettled(
                currentItems.map(async (item) => {
                    const p = detectPlatform(item.url)
                    if (p === "spotify") {
                        try {
                            const r = await fetch(
                                `https://open.spotify.com/oembed?url=${encodeURIComponent(item.url)}`,
                                { signal: ac.signal }
                            )
                            const d = await r.json()
                            results[item.url] = { title: d.title || "", thumbnail: d.thumbnail_url || "" }
                        } catch {}
                    } else if (p === "youtube") {
                        const vid = extractYouTubeId(item.url)
                        if (vid) results[item.url] = { title: "", thumbnail: `https://img.youtube.com/vi/${vid}/hqdefault.jpg` }
                    }
                })
            )
            if (!ac.signal.aborted) setMeta(results)
        })()
        return () => ac.abort()
    }, [isStatic, items])

    /* ── font helpers ── */
    const ff = useMemo(() =>
        titleFont && typeof titleFont === "object" && titleFont.fontFamily ? titleFont.fontFamily : "inherit",
        [titleFont]
    )
    const fs = useMemo(() =>
        titleFont && typeof titleFont === "object"
            ? typeof titleFont.fontSize === "number" ? titleFont.fontSize : parseFloat(titleFont.fontSize) || 18
            : 18,
        [titleFont]
    )
    const fw = useMemo(() =>
        titleFont && typeof titleFont === "object"
            ? typeof titleFont.fontWeight === "number" ? titleFont.fontWeight : parseInt(titleFont.fontWeight, 10) || 600
            : 600,
        [titleFont]
    )

    /* ── which cards to render ── */
    const visibleCards = useMemo(() => {
        const cards: number[] = []
        for (let i = 0; i < total; i++) {
            const offset = Math.abs(circularOffset(activeIndex, i))
            if (offset <= visibleSideCards + 1) cards.push(i)
        }
        return cards
    }, [activeIndex, total, circularOffset, visibleSideCards])

    const bottomGradient = useMemo(
        () => `linear-gradient(to top, rgba(0,0,0,${gradientStrength}) 0%, rgba(0,0,0,${gradientStrength * 0.3}) 50%, rgba(0,0,0,0) 100%)`,
        [gradientStrength]
    )

    /* ── active title for screen reader ── */
    const activeTitle = useMemo(() => {
        const item = items[activeIndex]
        if (!item) return ""
        const fm = meta[item.url]
        return item.title || fm?.title || `Aflevering ${activeIndex + 1}`
    }, [activeIndex, items, meta])

    /* ── initial DOM sync on mount ── */
    useEffect(() => {
        const t = requestAnimationFrame(() => {
            applyTransforms(activeIndex, false)
        })
        return () => cancelAnimationFrame(t)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div
            role="region"
            aria-roledescription="carousel"
            aria-label="Podcast en video carousel"
            tabIndex={0}
            onKeyDown={onKeyDown}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                outline: "none",
                ...style, // [CHANGE 3] Spread Framer's style prop on root element
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Screen reader live region */}
            <div aria-live="polite" aria-atomic="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
                {`Item ${activeIndex + 1} van ${total}: ${activeTitle}`}
            </div>

            {/* 3D Stage */}
            <div
                ref={stageRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
                onLostPointerCapture={onLostPointerCapture}
                style={{
                    position: "relative",
                    width: "100%",
                    height: cardSize,
                    perspective: `${perspective}px`,
                    perspectiveOrigin: "50% 50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isDragging ? "grabbing" : "grab",
                    touchAction: "pan-y",
                    userSelect: "none",
                    overflow: "visible",
                }}
            >
                {visibleCards.map((i) => {
                    const item = items[i]
                    const platform = detectPlatform(item.url)
                    const fm = meta[item.url]
                    const title = item.title || fm?.title || ""
                    const image = item.imageUrl || fm?.thumbnail || ""
                    const offset = circularOffset(activeIndex, i)
                    const absOffset = Math.abs(offset)
                    const isCenter = offset === 0

                    // Initial inline styles (applyTransforms overrides via refs)
                    const tx = offset * cardSpacing
                    const ry = isCenter ? 0 : (offset > 0 ? -sideRotation : sideRotation)
                    const tz = isCenter ? 0 : -sideDepth
                    const scale = isCenter ? 1 : sideScale
                    const opacity = absOffset > visibleSideCards ? 0 : (isCenter ? 1 : 0.85)
                    const zIndex = isCenter ? 10 : 10 - absOffset
                    const showBack = isCenter

                    return (
                        <div
                            key={i}
                            ref={(el) => { cardElsRef.current[i] = el }}
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`${title || `Aflevering ${i + 1}`}, ${i + 1} van ${total}`}
                            style={{
                                position: "absolute",
                                width: cardSize,
                                height: cardSize,
                                transform: `translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${scale})`,
                                opacity,
                                zIndex,
                                transition: prefersReducedMotion
                                    ? "none"
                                    : `transform ${transitionSpeed}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${transitionSpeed * 0.6}ms ease`,
                                pointerEvents: absOffset <= visibleSideCards ? "auto" : "none",
                                cursor: isCenter ? "default" : "pointer",
                                transformStyle: "preserve-3d",
                            }}
                            onClick={() => {
                                if (drag.current.didDrag) {
                                    drag.current.didDrag = false
                                    return
                                }
                                if (!isCenter) goTo(i)
                            }}
                        >
                            {/* Flip wrapper */}
                            <div
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    height: "100%",
                                    transformStyle: "preserve-3d",
                                    transition: prefersReducedMotion
                                        ? "none"
                                        : `transform ${flipSpeed}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                                    transform: showBack ? "rotateY(180deg)" : "rotateY(0deg)",
                                }}
                            >
                                {/* ════ FRONT FACE (cover art) ════ */}
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: cardRadius,
                                        overflow: "hidden",
                                        backfaceVisibility: "hidden",
                                        WebkitBackfaceVisibility: "hidden",
                                    }}
                                >
                                    <div style={{ position: "absolute", inset: 0, backgroundColor: PLACEHOLDER_COLORS[i % 9] }} />

                                    {image && (
                                        <img
                                            src={image}
                                            alt={title}
                                            loading="lazy"
                                            decoding="async"
                                            draggable={false}
                                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                    )}

                                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: bottomGradient, pointerEvents: "none" }} />

                                    {showPlatformBadge && (
                                        <div style={{ position: "absolute", top: 16, left: 16, zIndex: 3 }}>
                                            {platform === "spotify" ? <SpotifyIcon size={24} /> : platform === "youtube" ? <YouTubeIcon size={24} /> : null}
                                        </div>
                                    )}

                                    {showPlatformBadge && (
                                        <span style={{
                                            position: "absolute", top: 17, right: 16,
                                            fontFamily: "Bricolage Grotesque, sans-serif", fontSize: 14, fontWeight: 700,
                                            color: "#FFF", letterSpacing: "-0.01em", textShadow: "0 1px 3px rgba(0,0,0,0.25)", zIndex: 3,
                                        }}>
                                            SheVibes
                                        </span>
                                    )}

                                    {title && (
                                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 20px 18px", zIndex: 3 }}>
                                            <span style={{
                                                fontFamily: ff, fontSize: fs, fontWeight: fw, lineHeight: "1.3em", color: titleColor,
                                                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
                                                overflow: "hidden", textShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                            }}>
                                                {title}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* ════ BACK FACE (info + CTA) ════ */}
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (drag.current.didDrag) e.preventDefault()
                                    }}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: cardRadius,
                                        overflow: "hidden",
                                        backfaceVisibility: "hidden",
                                        WebkitBackfaceVisibility: "hidden",
                                        transform: "rotateY(180deg)",
                                        backgroundColor: backColor,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        padding: "28px 24px",
                                        textDecoration: "none",
                                        color: "#FFFFFF",
                                        cursor: "pointer",
                                    }}
                                >
                                    <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", backgroundColor: backAccentColor, opacity: 0.15, pointerEvents: "none" }} />
                                    <div style={{ position: "absolute", bottom: -40, left: -40, width: 140, height: 140, borderRadius: "50%", backgroundColor: backAccentColor, opacity: 0.1, pointerEvents: "none" }} />

                                    <div style={{ position: "relative", zIndex: 2 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                            <span style={{ fontFamily: ff, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as any, color: "rgba(255,255,255,0.6)" }}>
                                                {platform === "spotify" ? "Podcast" : platform === "youtube" ? "Video" : "Media"}
                                            </span>
                                            <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.3)" }} />
                                            <span style={{ fontFamily: ff, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as any, color: "rgba(255,255,255,0.6)" }}>
                                                Aflevering {String(i + 1).padStart(2, "0")}
                                            </span>
                                        </div>

                                        <h3 style={{ fontFamily: ff, fontSize: Math.round(fs * 1.4), fontWeight: 700, lineHeight: "1.2em", color: "#FFFFFF", margin: 0, letterSpacing: "-0.02em" }}>
                                            {title || `Aflevering ${i + 1}`}
                                        </h3>

                                        {item.duration && (
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, color: "rgba(255,255,255,0.7)" }}>
                                                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                                </svg>
                                                <span style={{ fontFamily: ff, fontSize: 13, fontWeight: 500 }}>{item.duration}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: 16 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            {platform === "spotify" ? <SpotifyIcon size={20} /> : platform === "youtube" ? <YouTubeIcon size={20} /> : null}
                                            <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>SheVibes</span>
                                        </div>

                                        <div style={{
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                            padding: "14px 20px", borderRadius: 50, backgroundColor: "#FFFFFF", color: backColor,
                                            fontFamily: ff, fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em",
                                        }}>
                                            {platform === "spotify" ? "Luister op Spotify" : platform === "youtube" ? "Bekijk op YouTube" : "Bekijk"}
                                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={backColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                                            </svg>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Arrows */}
            {showArrows && (
                <>
                    <button
                        onClick={prev}
                        aria-label="Vorige aflevering"
                        style={{
                            position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)",
                            width: arrowSize, height: arrowSize, borderRadius: "50%", backgroundColor: arrowColor,
                            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            zIndex: 200, padding: 0,
                            transition: prefersReducedMotion ? "none" : "transform 0.2s ease",
                        }}
                    >
                        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <button
                        onClick={next}
                        aria-label="Volgende aflevering"
                        style={{
                            position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)",
                            width: arrowSize, height: arrowSize, borderRadius: "50%", backgroundColor: arrowColor,
                            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            zIndex: 200, padding: 0,
                            transition: prefersReducedMotion ? "none" : "transform 0.2s ease",
                        }}
                    >
                        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </>
            )}

            {/* Dots */}
            <div role="tablist" aria-label="Kies aflevering" style={{ display: "flex", gap: 6, marginTop: 24, zIndex: 200 }}>
                {items.map((_, i) => {
                    const item = items[i]
                    const fm = meta[item.url]
                    const dotTitle = item.title || fm?.title || `Aflevering ${i + 1}`
                    return (
                        <button
                            key={i}
                            role="tab"
                            aria-selected={i === activeIndex}
                            aria-label={`${dotTitle}, ${i + 1} van ${total}`}
                            onClick={() => goTo(i)}
                            style={{
                                width: i === activeIndex ? 24 : 8, height: 8, borderRadius: 4,
                                backgroundColor: i === activeIndex ? dotActiveColor : dotInactiveColor,
                                border: "none", padding: 0, cursor: "pointer",
                                transition: prefersReducedMotion ? "none" : "all 0.3s ease",
                            }}
                        />
                    )
                })}
            </div>
        </div>
    )
}

// [CHANGE 4] Add displayName for Framer panel clarity
PodcastCarousel.displayName = "Podcast Carousel"

/* ━━━ types ━━━ */

interface Props {
    style?: CSSProperties // [CHANGE 1] Accept Framer's style prop for layout sizing
    items?: MediaItem[]
    cardSize?: number
    cardRadius?: number
    cardGap?: number
    sideRotation?: number
    sideScale?: number
    sideDepth?: number
    transitionSpeed?: number
    flipSpeed?: number
    showArrows?: boolean
    arrowColor?: string
    arrowSize?: number
    titleFont?: any
    titleColor?: string
    gradientStrength?: number
    showPlatformBadge?: boolean
    perspective?: number
    autoPlay?: boolean
    autoPlayInterval?: number
    backColor?: string
    backAccentColor?: string
    dotActiveColor?: string
    dotInactiveColor?: string
    visibleSideCards?: number
}

/* ━━━ property controls ━━━ */

addPropertyControls(PodcastCarousel, {
    items: {
        type: ControlType.Array,
        title: "Items",
        description: "Add Spotify or YouTube URLs. Title and artwork are fetched automatically via oEmbed.",
        maxCount: 20,
        control: {
            type: ControlType.Object,
            controls: {
                url: { type: ControlType.String, title: "URL", description: "Spotify episode or YouTube video URL", defaultValue: "https://open.spotify.com/episode/" },
                title: { type: ControlType.String, title: "Title (auto if empty)", description: "Leave empty to auto-fetch from oEmbed", defaultValue: "" },
                imageUrl: { type: ControlType.String, title: "Image (auto if empty)", description: "Leave empty to use the episode/video thumbnail", defaultValue: "" },
                duration: { type: ControlType.String, title: "Duration (e.g. 24:35)", description: "Shown on the back of the card", defaultValue: "" },
            },
        },
        defaultValue: defaultItems,
    },
    cardSize: {
        type: ControlType.Number, title: "Card Size", description: "Width and height of each card",
        defaultValue: 420, min: 200, max: 600, step: 10, unit: "px", displayStepper: true,
    },
    cardRadius: {
        type: ControlType.Number, title: "Radius", description: "Border radius for card corners",
        defaultValue: 16, min: 0, max: 40, step: 2, unit: "px", displayStepper: true,
    },
    cardGap: {
        type: ControlType.Number, title: "Card Gap", description: "Horizontal spacing between cards",
        defaultValue: 24, min: 0, max: 80, step: 4, unit: "px", displayStepper: true,
    },
    sideRotation: {
        type: ControlType.Number, title: "Side Rotation", description: "Y-axis rotation of side cards toward center",
        defaultValue: 12, min: 0, max: 30, step: 1, unit: "\u00B0", displayStepper: true,
    },
    sideScale: {
        type: ControlType.Number, title: "Side Scale", description: "Scale factor for side cards (1 = same size as center)",
        defaultValue: 0.88, min: 0.6, max: 1, step: 0.02,
    },
    sideDepth: {
        type: ControlType.Number, title: "Side Depth", description: "Z-axis depth offset for side cards",
        defaultValue: 60, min: 0, max: 200, step: 10, unit: "px", displayStepper: true,
    },
    transitionSpeed: {
        type: ControlType.Number, title: "Slide Speed", description: "Duration of the slide transition",
        defaultValue: 700, min: 300, max: 1500, step: 50, unit: "ms", displayStepper: true,
    },
    flipSpeed: {
        type: ControlType.Number, title: "Flip Speed", description: "Duration of the center card flip animation",
        defaultValue: 600, min: 200, max: 1200, step: 50, unit: "ms", displayStepper: true,
    },
    perspective: {
        type: ControlType.Number, title: "Perspective", description: "3D perspective distance. Lower = more dramatic",
        defaultValue: 1200, min: 400, max: 2400, step: 100, unit: "px", displayStepper: true,
    },
    visibleSideCards: {
        type: ControlType.Number, title: "Side Cards", description: "Number of cards visible on each side of center",
        defaultValue: 1, min: 1, max: 3, step: 1, displayStepper: true,
    },
    backColor: {
        type: ControlType.Color, title: "Back Color", description: "Background color of the flipped center card",
        defaultValue: "#7956F3",
    },
    backAccentColor: {
        type: ControlType.Color, title: "Back Accent", description: "Decorative circle color on the back face",
        defaultValue: "#F27CA4",
    },
    showArrows: {
        type: ControlType.Boolean, title: "Arrows", description: "Show left/right navigation arrows",
        defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide",
    },
    arrowColor: {
        type: ControlType.Color, title: "Arrow Color", description: "Background color of the arrow buttons",
        defaultValue: "#7956F3", hidden: (p: any) => !p.showArrows,
    },
    arrowSize: {
        type: ControlType.Number, title: "Arrow Size", description: "Diameter of the arrow buttons",
        defaultValue: 48, min: 32, max: 64, step: 4, unit: "px", displayStepper: true, hidden: (p: any) => !p.showArrows,
    },
    titleFont: {
        type: "font" as any, title: "Title Font", controls: "extended", defaultFontType: "sans-serif",
        defaultValue: { fontSize: 18, fontWeight: 600, lineHeight: "1.3em" },
    },
    titleColor: {
        type: ControlType.Color, title: "Title Color", description: "Text color for the episode title overlay",
        defaultValue: "#FFFFFF",
    },
    gradientStrength: {
        type: ControlType.Number, title: "Gradient", description: "Opacity of the bottom gradient overlay",
        defaultValue: 0.75, min: 0, max: 1, step: 0.05,
    },
    showPlatformBadge: {
        type: ControlType.Boolean, title: "Badges", description: "Show Spotify/YouTube icon and SheVibes wordmark",
        defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide",
    },
    dotActiveColor: {
        type: ControlType.Color, title: "Dot Active", description: "Color of the active pagination dot",
        defaultValue: "#7956F3",
    },
    dotInactiveColor: {
        type: ControlType.Color, title: "Dot Inactive", description: "Color of inactive pagination dots",
        defaultValue: "rgba(255,255,255,0.35)",
    },
    autoPlay: {
        type: ControlType.Boolean, title: "Auto Play", description: "Auto-advance slides. Pauses on hover. Disabled with reduced motion.",
        defaultValue: true, enabledTitle: "On", disabledTitle: "Off",
    },
    autoPlayInterval: {
        type: ControlType.Number, title: "Interval", description: "Seconds between auto-advances",
        defaultValue: 4, min: 2, max: 10, step: 0.5, unit: "s", displayStepper: true, hidden: (p: any) => !p.autoPlay,
    },
})