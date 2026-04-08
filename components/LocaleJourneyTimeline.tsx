// LocaleJourneyTimeline.tsx
// Locale-aware year-by-year journey timeline with scroll-linked progress line
// Automatically switches between RTL and LTR based on Framer locale
// Version: 1.0.0

import {
    addPropertyControls,
    ControlType,
    useLocaleCode,
    useIsStaticRenderer,
} from "framer"
import {
    useRef,
    useEffect,
    useCallback,
    useMemo,
    useState,
    CSSProperties,
} from "react"

/* ━━━ font resolver ━━━ */

function resolveFont(
    font: any,
    defaults: {
        size: number
        weight: number
        lineHeight: string
        letterSpacing: string
    }
) {
    if (!font || typeof font !== "object") {
        return {
            fontFamily: "inherit",
            fontSize: defaults.size,
            fontWeight: defaults.weight,
            lineHeight: defaults.lineHeight,
            letterSpacing: defaults.letterSpacing,
            fontStyle: undefined,
        }
    }

    const fontFamily = font.fontFamily || "inherit"

    let fontSize = defaults.size
    if (font.fontSize != null) {
        if (typeof font.fontSize === "number") fontSize = font.fontSize
        else {
            const p = parseFloat(String(font.fontSize))
            if (!isNaN(p)) fontSize = p
        }
    }

    let fontWeight = defaults.weight
    if (font.fontWeight != null) {
        if (typeof font.fontWeight === "number") fontWeight = font.fontWeight
        else {
            const p = parseInt(String(font.fontWeight), 10)
            if (!isNaN(p)) fontWeight = p
        }
    }

    let lineHeight: string | number = defaults.lineHeight
    if (font.lineHeight != null) lineHeight = font.lineHeight

    let letterSpacing: string | number = defaults.letterSpacing
    if (font.letterSpacing != null) letterSpacing = font.letterSpacing

    const fontStyle = font.fontStyle || undefined

    return {
        fontFamily,
        fontSize,
        fontWeight,
        lineHeight,
        letterSpacing,
        fontStyle,
    }
}

/* ━━━ RTL detection ━━━ */

const RTL_LANGS = new Set(["ar", "he", "fa", "ur"])

function isRTLLocale(code: string): boolean {
    if (!code) return false
    return RTL_LANGS.has(code.split("-")[0].toLowerCase())
}

/* ━━━ Arabic-Indic numeral converter ━━━ */

const ARABIC_DIGITS = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"]

function toArabicNumerals(str: string): string {
    return str.replace(/[0-9]/g, (d) => ARABIC_DIGITS[parseInt(d, 10)])
}

/* ━━━ transition constants ━━━ */

const TRANS = "0.35s"
const MARKER_TRANSITION = `background-color ${TRANS} ease-out`
const YEAR_TRANSITION = `opacity ${TRANS} ease-out`
const TEXT_TRANSITION = `opacity ${TRANS} ease-out, transform ${TRANS} ease-out`
const LINE_TRANSITION = "transform 0.08s linear"

/* ━━━ DOM element store (zero re-renders during scroll) ━━━ */

interface ElsStore {
    markers: (HTMLDivElement | null)[]
    years: (HTMLDivElement | null)[]
    texts: (HTMLDivElement | null)[]
    lineFills: (HTMLDivElement | null)[]
    prevActive: number
    count: number
}

function applyState(
    els: ElsStore,
    i: number,
    active: boolean,
    fillColor: string,
    rtl: boolean
) {
    const m = els.markers[i]
    const y = els.years[i]
    const t = els.texts[i]

    if (m) m.style.backgroundColor = active ? fillColor : "transparent"
    if (y) y.style.opacity = active ? "1" : "0.25"
    if (t) {
        t.style.opacity = active ? "1" : "0.3"
        t.style.transform = active
            ? "translateX(0)"
            : `translateX(${rtl ? "8px" : "-8px"})`
    }
}

/* ━━━ types ━━━ */

interface MilestoneItem {
    year: string
    title: string
    description: string
}

interface Props {
    style?: CSSProperties
    milestones?: MilestoneItem[]
    yearFont?: Record<string, any>
    titleFont?: Record<string, any>
    bodyFont?: Record<string, any>
    yearColor?: string
    titleColor?: string
    bodyColor?: string
    lineColor?: string
    lineFilledColor?: string
    lineWidth?: number
    markerSize?: number
    markerRadius?: number
    markerBorderWidth?: number
    markerBorderColor?: string
    markerActiveColor?: string
    columnGap?: number
    gap?: number
    animateOnScroll?: boolean
    triggerPoint?: number
}

/* ━━━ default data ━━━ */

const DEFAULT_MILESTONES: MilestoneItem[] = [
    {
        year: "2018",
        title: "\u0627\u0644\u062A\u0623\u0633\u064A\u0633",
        description:
            "\u0628\u062F\u0623\u062A \u0645\u062D\u0645\u0635\u0629 \u0633\u0648\u064A\u0644 \u0643\u0645\u062D\u0645\u0635\u0629 \u0645\u062D\u0644\u064A\u0629 \u0641\u064A \u0627\u0644\u062F\u0645\u0627\u0645\u060C \u0648\u0627\u0643\u062A\u0633\u0628\u062A \u062B\u0642\u0629 \u0645\u062C\u062A\u0645\u0639 \u0627\u0644\u0642\u0647\u0648\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0634\u0631\u0642\u064A\u0629.",
    },
    {
        year: "2019",
        title: "\u0628\u0646\u0627\u0621 \u0627\u0644\u0623\u0633\u0627\u0633",
        description:
            "\u062A\u0648\u0633\u064A\u0639 \u0634\u0628\u0643\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621\u060C \u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u0628\u0631\u0648\u0641\u0627\u064A\u0644\u0627\u062A\u060C \u0648\u062A\u0631\u0633\u064A\u062E \u0647\u0648\u064A\u0629 \u0627\u0644\u062A\u062D\u0645\u064A\u0635.",
    },
    {
        year: "2020",
        title: "\u0627\u0644\u062A\u062D\u0648\u0644",
        description:
            "\u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0627\u0644\u0643\u0627\u0645\u0644 \u0639\u0644\u0649 \u0627\u0644\u062A\u062D\u0645\u064A\u0635 \u0648\u0627\u0637\u0644\u0627\u0642 \u0627\u0644\u0645\u062A\u062C\u0631 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0644\u062A\u063A\u064A\u0631 \u0627\u0644\u0633\u0648\u0642.",
    },
    {
        year: "2021",
        title: "\u0627\u0644\u0627\u0633\u062A\u0645\u0631\u0627\u0631 \u0648\u0627\u0644\u0646\u0645\u0648",
        description:
            "\u062A\u0648\u0633\u064A\u0639 \u0627\u0644\u0634\u0631\u0627\u0643\u0627\u062A \u0648\u0632\u064A\u0627\u062F\u0629 \u0646\u0642\u0627\u0637 \u0627\u0644\u0628\u064A\u0639 \u0645\u0639 \u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0627\u0644\u062B\u0628\u0627\u062A \u0648\u0627\u0644\u062C\u0648\u062F\u0629.",
    },
    {
        year: "2022",
        title: "\u0627\u0644\u0627\u0646\u062A\u0634\u0627\u0631 \u0627\u0644\u0648\u0637\u0646\u064A",
        description:
            "\u0627\u0631\u062A\u0641\u0627\u0639 \u0627\u0644\u0637\u0644\u0628 \u0639\u0644\u0649 \u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0645\u0645\u0644\u0643\u0629\u060C \u0648\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u0642\u062F\u0631\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C\u064A\u0629.",
    },
    {
        year: "2023",
        title: "\u0627\u0644\u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629",
        description:
            "\u0627\u0641\u062A\u062A\u0627\u062D \u0645\u0642\u0647\u0649 \u0633\u0648\u064A\u0644 \u0641\u064A \u0627\u0644\u062E\u0628\u0631. \u0631\u0628\u0637 \u0627\u0644\u0645\u062D\u0645\u0635\u0629 \u0628\u0627\u0644\u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629.",
    },
    {
        year: "2024",
        title: "\u0627\u0644\u062A\u0648\u0633\u0639 \u0627\u0644\u0625\u0642\u0644\u064A\u0645\u064A",
        description:
            "\u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0623\u0633\u0648\u0627\u0642 \u0627\u0644\u062E\u0644\u064A\u062C\u060C \u0648\u062A\u0643\u0628\u064A\u0631 \u0627\u0644\u0641\u0631\u064A\u0642 \u0648\u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A.",
    },
    {
        year: "2025",
        title: "\u062E\u0637\u0648\u0629 \u0644\u0644\u0623\u0645\u0627\u0645",
        description:
            "\u0627\u0644\u0627\u0646\u062A\u0642\u0627\u0644 \u0625\u0644\u0649 \u0645\u0635\u0646\u0639 \u0645\u062A\u0637\u0648\u0631 \u0641\u064A \u0627\u0644\u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629 \u0627\u0644\u062B\u0627\u0646\u064A\u0629 \u0628\u0627\u0644\u062F\u0645\u0627\u0645. \u0645\u062C\u0647\u0632 \u0628\u0623\u062D\u062F\u062B \u062A\u0642\u0646\u064A\u0627\u062A \u0627\u0644\u062A\u062D\u0645\u064A\u0635.",
    },
    {
        year: "2026",
        title: "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0642\u0627\u062F\u0645\u0629",
        description:
            "\u0646\u0633\u062A\u0645\u0631 \u0641\u064A \u0627\u0644\u062A\u0648\u0633\u0639 \u0645\u0639 \u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0627\u0644\u0647\u0648\u064A\u0629: \u062A\u062D\u0645\u064A\u0635 \u062F\u0642\u064A\u0642\u060C \u0645\u0635\u062F\u0631 \u0634\u0641\u0627\u0641\u060C \u0648\u0623\u062B\u0631 \u0645\u0633\u062A\u062F\u0627\u0645.",
    },
]

/**
 * Locale Journey Timeline — Scroll-linked year-by-year journey.
 * Detects Framer locale and switches between RTL (Arabic) and LTR (English).
 * CSS transitions + direct DOM mutation — zero React re-renders during scroll.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 1200
 */
export default function LocaleJourneyTimeline({
    style,
    milestones = DEFAULT_MILESTONES,
    yearFont,
    titleFont,
    bodyFont,
    yearColor = "#1A1A1A",
    titleColor = "#1A1A1A",
    bodyColor = "#666666",
    lineColor = "#E0DDD5",
    lineFilledColor = "#2A7D6E",
    lineWidth = 2,
    markerSize = 14,
    markerRadius = 2,
    markerBorderWidth = 2,
    markerBorderColor = "#2A7D6E",
    markerActiveColor = "#2A7D6E",
    columnGap = 20,
    gap = 0,
    animateOnScroll = true,
    triggerPoint = 0.7,
}: Props) {
    const isStatic = useIsStaticRenderer()
    const prefersReducedMotion =
        typeof window !== "undefined"
            ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
            : false
    const shouldAnimate = animateOnScroll && !isStatic && !prefersReducedMotion

    // Locale-aware direction
    const localeCode = useLocaleCode()
    const isRTL = isRTLLocale(localeCode || "")

    // Mutable DOM refs — never triggers re-render
    const els = useRef<ElsStore>({
        markers: [],
        years: [],
        texts: [],
        lineFills: [],
        prevActive: -1,
        count: milestones.length,
    })

    // Reset ref arrays when milestones length changes
    useEffect(() => {
        if (els.current.count !== milestones.length) {
            els.current.markers = []
            els.current.years = []
            els.current.texts = []
            els.current.lineFills = []
            els.current.prevActive = -1
            els.current.count = milestones.length
        }
    }, [milestones.length])

    // Scroll handler — batch-read positions, then mutate DOM
    const updateScroll = useCallback(() => {
        if (!shouldAnimate) return

        const vh = window.innerHeight
        const trigger = vh * triggerPoint
        let newActive = -1

        // Single layout read pass
        const rects: (DOMRect | null)[] = []
        for (let i = 0; i < milestones.length; i++) {
            const mk = els.current.markers[i]
            rects[i] = mk ? mk.getBoundingClientRect() : null
        }

        // Determine which milestone is active
        for (let i = 0; i < milestones.length; i++) {
            const r = rects[i]
            if (r && r.top + r.height / 2 <= trigger) newActive = i
        }

        // Toggle only changed milestones
        const prev = els.current.prevActive
        if (newActive !== prev) {
            for (let i = Math.max(0, prev + 1); i <= newActive; i++) {
                applyState(els.current, i, true, markerActiveColor, isRTL)
            }
            for (let i = prev; i > newActive && i >= 0; i--) {
                applyState(els.current, i, false, markerActiveColor, isRTL)
            }
            els.current.prevActive = newActive
        }

        // Progress fill on connector lines
        for (let i = 0; i < milestones.length - 1; i++) {
            const fill = els.current.lineFills[i]
            if (!fill) continue

            let progress = 0
            if (i < newActive) {
                progress = 1
            } else if (i === newActive) {
                const curR = rects[i]
                const nxtR = rects[i + 1]
                if (curR && nxtR) {
                    const curCenter = curR.top + curR.height / 2
                    const nxtCenter = nxtR.top + nxtR.height / 2
                    const dist = nxtCenter - curCenter
                    if (dist > 0) {
                        progress = Math.max(
                            0,
                            Math.min(1, (trigger - curCenter) / dist)
                        )
                    }
                }
            }
            fill.style.transform = `scaleY(${progress})`
        }
    }, [
        shouldAnimate,
        milestones.length,
        triggerPoint,
        markerActiveColor,
        isRTL,
    ])

    // Scroll + resize listener with rAF throttle
    useEffect(() => {
        if (!shouldAnimate) {
            // Static / canvas: show all milestones as active
            for (let i = 0; i < milestones.length; i++) {
                applyState(
                    els.current,
                    i,
                    true,
                    markerActiveColor,
                    isRTL
                )
                const f = els.current.lineFills[i]
                if (f) f.style.transform = "scaleY(1)"
            }
            els.current.prevActive = milestones.length - 1
            return
        }

        els.current.prevActive = -1

        let rafId: number = 0
        const onScroll = () => {
            cancelAnimationFrame(rafId)
            rafId = requestAnimationFrame(updateScroll)
        }

        // Initial computation after mount
        requestAnimationFrame(updateScroll)

        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll, { passive: true })

        return () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
        }
    }, [
        shouldAnimate,
        updateScroll,
        milestones.length,
        markerActiveColor,
        isRTL,
    ])

    // Memoize resolved fonts
    const yearF = useMemo(
        () =>
            resolveFont(yearFont, {
                size: 72,
                weight: 700,
                lineHeight: "1em",
                letterSpacing: "-0.02em",
            }),
        [yearFont]
    )

    const titleF = useMemo(
        () =>
            resolveFont(titleFont, {
                size: 20,
                weight: 700,
                lineHeight: "1.3em",
                letterSpacing: "-0.01em",
            }),
        [titleFont]
    )

    const bodyF = useMemo(
        () =>
            resolveFont(bodyFont, {
                size: 14,
                weight: 400,
                lineHeight: "1.6em",
                letterSpacing: "0em",
            }),
        [bodyFont]
    )

    // Track active milestone for aria-current
    const [activeStep, setActiveStep] = useState(-1)
    useEffect(() => {
        if (!shouldAnimate) {
            setActiveStep(milestones.length - 1)
            return
        }
        const id = setInterval(() => {
            const current = els.current.prevActive
            if (current !== activeStep) setActiveStep(current)
        }, 100)
        return () => clearInterval(id)
    }, [shouldAnimate, milestones.length, activeStep])

    const initActive = !shouldAnimate

    // Content top offset to align title with upper portion of year
    const yearSize =
        typeof yearF.fontSize === "number" ? yearF.fontSize : 72
    const contentOffset = Math.max(0, Math.round(yearSize * 0.15))

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: `${gap}px`,
                position: "relative",
                direction: isRTL ? "rtl" : "ltr",
                ...style,
            }}
            role="list"
            aria-label={
                isRTL ? "\u0645\u062D\u0637\u0627\u062A \u0627\u0644\u0631\u062D\u0644\u0629" : "Journey timeline"
            }
        >
            {milestones.map((ms, i) => {
                const isLast = i === milestones.length - 1
                const isActive = shouldAnimate
                    ? i <= activeStep
                    : initActive
                const title = ms?.title || `Milestone ${i + 1}`
                const desc = ms?.description || ""
                const year = ms?.year || ""

                return (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "stretch",
                            columnGap,
                            position: "relative",
                        }}
                        role="listitem"
                        aria-label={`${year}: ${title}`}
                        aria-current={isActive ? "step" : undefined}
                    >
                        {/* Timeline column: square marker + connector line */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                width: markerSize,
                                flexShrink: 0,
                            }}
                        >
                            {/* Square marker — fills on activation */}
                            <div
                                ref={(el) => {
                                    els.current.markers[i] = el
                                }}
                                style={{
                                    width: markerSize,
                                    height: markerSize,
                                    borderRadius: markerRadius,
                                    borderWidth: markerBorderWidth,
                                    borderStyle: "solid",
                                    borderColor: markerBorderColor,
                                    backgroundColor: initActive
                                        ? markerActiveColor
                                        : "transparent",
                                    flexShrink: 0,
                                    boxSizing: "border-box" as const,
                                    transition: MARKER_TRANSITION,
                                }}
                                aria-hidden="true"
                            />

                            {/* Connector line — scaleY driven by scroll */}
                            {!isLast && (
                                <div
                                    style={{
                                        flex: 1,
                                        width: lineWidth,
                                        backgroundColor: lineColor,
                                        borderRadius: lineWidth,
                                        position: "relative" as const,
                                        overflow: "hidden" as const,
                                        marginBlockStart: 8,
                                        marginBlockEnd: isLast ? 0 : 8,
                                        minHeight: 24,
                                    }}
                                >
                                    <div
                                        ref={(el) => {
                                            els.current.lineFills[i] = el
                                        }}
                                        style={{
                                            position: "absolute" as const,
                                            top: 0,
                                            insetInlineStart: 0,
                                            width: "100%",
                                            height: "100%",
                                            backgroundColor:
                                                lineFilledColor,
                                            borderRadius: lineWidth,
                                            transformOrigin: "top center",
                                            transform: initActive
                                                ? "scaleY(1)"
                                                : "scaleY(0)",
                                            transition: LINE_TRANSITION,
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Year column — large display number */}
                        <div
                            ref={(el) => {
                                els.current.years[i] = el
                            }}
                            style={{
                                flexShrink: 0,
                                opacity: initActive ? 1 : 0.25,
                                transition: YEAR_TRANSITION,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: yearF.fontFamily,
                                    fontSize: yearF.fontSize,
                                    fontWeight: yearF.fontWeight,
                                    lineHeight: yearF.lineHeight,
                                    letterSpacing: yearF.letterSpacing,
                                    fontStyle: yearF.fontStyle,
                                    color: yearColor,
                                    whiteSpace: "nowrap" as const,
                                    userSelect: "none" as const,
                                    WebkitFontSmoothing:
                                        "antialiased" as any,
                                    MozOsxFontSmoothing:
                                        "grayscale" as any,
                                }}
                            >
                                {isRTL ? toArabicNumerals(year) : year}
                            </span>
                        </div>

                        {/* Content column — title + description */}
                        <div
                            ref={(el) => {
                                els.current.texts[i] = el
                            }}
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column" as const,
                                gap: 6,
                                paddingBlockEnd: isLast ? 0 : 48,
                                paddingBlockStart: contentOffset,
                                opacity: initActive ? 1 : 0.3,
                                transform: initActive
                                    ? "translateX(0)"
                                    : `translateX(${isRTL ? "8px" : "-8px"})`,
                                transition: TEXT_TRANSITION,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: titleF.fontFamily,
                                    fontSize: titleF.fontSize,
                                    fontWeight: titleF.fontWeight,
                                    lineHeight: titleF.lineHeight,
                                    letterSpacing: titleF.letterSpacing,
                                    fontStyle: titleF.fontStyle,
                                    color: titleColor,
                                    WebkitFontSmoothing:
                                        "antialiased" as any,
                                    MozOsxFontSmoothing:
                                        "grayscale" as any,
                                }}
                            >
                                {title}
                            </span>
                            <span
                                style={{
                                    fontFamily: bodyF.fontFamily,
                                    fontSize: bodyF.fontSize,
                                    fontWeight: bodyF.fontWeight,
                                    lineHeight: bodyF.lineHeight,
                                    letterSpacing: bodyF.letterSpacing,
                                    fontStyle: bodyF.fontStyle,
                                    color: bodyColor,
                                    WebkitFontSmoothing:
                                        "antialiased" as any,
                                    MozOsxFontSmoothing:
                                        "grayscale" as any,
                                }}
                            >
                                {desc}
                            </span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

LocaleJourneyTimeline.displayName = "Locale Journey Timeline"

/* ━━━ property controls ━━━ */

addPropertyControls(LocaleJourneyTimeline, {
    milestones: {
        type: ControlType.Array,
        title: "Milestones",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                year: {
                    type: ControlType.String,
                    title: "Year",
                    defaultValue: "2024",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Milestone",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Description text.",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: DEFAULT_MILESTONES,
    },
    yearFont: {
        type: ControlType.Font,
        title: "Year Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 72,
            variant: "Bold",
            lineHeight: "1em",
            letterSpacing: "-0.02em",
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 20,
            variant: "Bold",
            lineHeight: "1.3em",
            letterSpacing: "-0.01em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 14,
            variant: "Regular",
            lineHeight: "1.6em",
            letterSpacing: "0em",
        },
    },
    yearColor: {
        type: ControlType.Color,
        title: "Year Color",
        defaultValue: "#1A1A1A",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#1A1A1A",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Body Color",
        defaultValue: "#666666",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line BG",
        defaultValue: "#E0DDD5",
    },
    lineFilledColor: {
        type: ControlType.Color,
        title: "Line Fill",
        defaultValue: "#2A7D6E",
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 2,
        min: 1,
        max: 6,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    markerSize: {
        type: ControlType.Number,
        title: "Marker Size",
        defaultValue: 14,
        min: 8,
        max: 32,
        step: 2,
        unit: "px",
        displayStepper: true,
    },
    markerRadius: {
        type: ControlType.Number,
        title: "Marker Radius",
        defaultValue: 2,
        min: 0,
        max: 16,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    markerBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 2,
        min: 1,
        max: 4,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    markerBorderColor: {
        type: ControlType.Color,
        title: "Marker Stroke",
        defaultValue: "#2A7D6E",
    },
    markerActiveColor: {
        type: ControlType.Color,
        title: "Marker Fill",
        defaultValue: "#2A7D6E",
    },
    columnGap: {
        type: ControlType.Number,
        title: "Column Gap",
        defaultValue: 20,
        min: 8,
        max: 48,
        step: 4,
        unit: "px",
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Row Gap",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 4,
        unit: "px",
        displayStepper: true,
    },
    animateOnScroll: {
        type: ControlType.Boolean,
        title: "Scroll Link",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    triggerPoint: {
        type: ControlType.Number,
        title: "Trigger Point",
        defaultValue: 0.7,
        min: 0.2,
        max: 0.9,
        step: 0.05,
        hidden: (props: Props) => !props.animateOnScroll,
    },
})
