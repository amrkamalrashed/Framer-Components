// StepsTimeline.tsx (improved)
// Scroll-linked vertical progress steps timeline
// Version: 1.1.0
//
// Changes from original:
// [CHANGE 1] Added `style?: React.CSSProperties` to Props interface
// [CHANGE 2] Destructure `style` from component props
// [CHANGE 3] Spread `...style` on root <div> element (merged with existing inline styles)
// [CHANGE 4] Added `StepsTimeline.displayName = "Steps Timeline"`
// [CHANGE 5] Added prefers-reduced-motion support: detects user preference and
//            disables scroll-linked animations when reduce is active

import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { useRef, useEffect, useCallback, useMemo, useState } from "react"

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
            fontFamily: font?.fontFamily || "inherit",
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
        else { const p = parseFloat(String(font.fontSize)); if (!isNaN(p)) fontSize = p }
    }

    let fontWeight = defaults.weight
    if (font.fontWeight != null) {
        if (typeof font.fontWeight === "number") fontWeight = font.fontWeight
        else { const p = parseInt(String(font.fontWeight), 10); if (!isNaN(p)) fontWeight = p }
    }

    let lineHeight: string | number = defaults.lineHeight
    if (font.lineHeight != null) lineHeight = font.lineHeight

    let letterSpacing: string | number = defaults.letterSpacing
    if (font.letterSpacing != null) letterSpacing = font.letterSpacing

    const fontStyle = font.fontStyle || undefined

    return { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, fontStyle }
}

/* ━━━ constants ━━━ */

const TRAILING_FADE_MASK =
    "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)"

const TRANS = "0.3s"
const BADGE_TRANSITION = `background-color ${TRANS} ease-out`
const NUMBER_TRANSITION = `color ${TRANS} ease-out`
const TEXT_TRANSITION = `opacity ${TRANS} ease-out, transform ${TRANS} ease-out`
const LINE_TRANSITION = "transform 0.08s linear"

/* ━━━ DOM element store (no React state — zero re-renders during scroll) ━━━ */

interface ElsStore {
    badges: (HTMLDivElement | null)[]
    numbers: (HTMLSpanElement | null)[]
    texts: (HTMLDivElement | null)[]
    lineFills: (HTMLDivElement | null)[]
    prevActive: number
    stepsLength: number
}

function applyStepState(
    els: ElsStore,
    i: number,
    active: boolean,
    badgeColor: string,
    badgeTextColor: string
) {
    const badge = els.badges[i]
    const num = els.numbers[i]
    const text = els.texts[i]
    if (badge) badge.style.backgroundColor = active ? badgeColor : "rgba(0,0,0,0)"
    if (num) num.style.color = active ? badgeTextColor : badgeColor
    if (text) {
        text.style.opacity = active ? "1" : "0.3"
        text.style.transform = active ? "translateX(0)" : "translateX(-8px)"
    }
}

/**
 * Steps Timeline — Scroll-linked vertical progress steps
 * Pure CSS transitions + direct DOM mutation for scroll.
 * Zero React re-renders during scroll. Fully reversible.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function StepsTimeline({
    steps = [
        {
            title: "Kennismakingsgesprek",
            description:
                "We starten met een kort kennismakingsgesprek van 20 minuten. Zo leren we je kennen en bespreken we jouw vraag en wensen.",
        },
        {
            title: "Intakegesprek & plan",
            description:
                "Samen maken we een persoonlijk behandelplan. We kijken naar wat jij nodig hebt en stellen duidelijke doelen op.",
        },
        {
            title: "Behandeltraject",
            description:
                "We gaan aan de slag met jouw behandeling. Denk aan CGT, EMDR, systeemtherapie en lichaamsgerichte interventies binnen het behandelplan.",
        },
        {
            title: "Groei & afsluiting",
            description:
                "We evalueren regelmatig je voortgang. Wanneer je doelen zijn bereikt, sluiten we af met nazorg en handvatten voor de toekomst.",
        },
    ],
    badgeColor = "#7A55F3",
    badgeTextColor = "#FFFFFF",
    badgeSize = 48,
    badgeRadius = 16,
    badgeBorderWidth = 2,
    lineColor = "#EBEAE0",
    lineFilledColor = "#7A55F3",
    lineWidth = 2,
    showTrailingLine = false,
    trailingLineHeight = 60,
    titleFont,
    bodyFont,
    titleColor = "#222222",
    bodyColor = "#666666",
    gap = 0,
    animateOnScroll = true,
    triggerPoint = 0.7,
    numberFormat = "zero-padded",
    style, // [CHANGE 2] Destructure `style` from props
}: Props) {
    const isStatic = useIsStaticRenderer()

    // [CHANGE 5] Detect prefers-reduced-motion
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return
        const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
        setPrefersReducedMotion(mql.matches)
        const handler = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches)
        }
        mql.addEventListener("change", handler)
        return () => mql.removeEventListener("change", handler)
    }, [])

    // [CHANGE 5] When reduced motion is preferred, disable scroll animations
    const shouldAnimate = animateOnScroll && !isStatic && !prefersReducedMotion

    // Mutable store for all DOM element refs — never causes re-renders
    const els = useRef<ElsStore>({
        badges: [],
        numbers: [],
        texts: [],
        lineFills: [],
        prevActive: -1,
        stepsLength: steps.length,
    })

    // Reset refs arrays when steps length changes to prevent memory leaks
    useEffect(() => {
        if (els.current.stepsLength !== steps.length) {
            els.current.badges = []
            els.current.numbers = []
            els.current.texts = []
            els.current.lineFills = []
            els.current.prevActive = -1
            els.current.stepsLength = steps.length
        }
    }, [steps.length])

    // Scroll handler — reads layout once, mutates DOM directly
    const updateScroll = useCallback(() => {
        if (!shouldAnimate) return

        const vh = window.innerHeight
        const trigger = vh * triggerPoint
        let newActive = -1

        // ── Batch-read all badge positions (single layout read) ──
        const rects: (DOMRect | null)[] = []
        for (let i = 0; i < steps.length; i++) {
            const badge = els.current.badges[i]
            rects[i] = badge ? badge.getBoundingClientRect() : null
        }

        // ── Determine active step ──
        for (let i = 0; i < steps.length; i++) {
            const r = rects[i]
            if (!r) continue
            if (r.top + r.height / 2 <= trigger) newActive = i
        }

        // ── Toggle step states (only changed steps) ──
        const prev = els.current.prevActive
        if (newActive !== prev) {
            // Steps that became active (scrolling down)
            for (let i = Math.max(0, prev + 1); i <= newActive; i++) {
                applyStepState(els.current, i, true, badgeColor, badgeTextColor)
            }
            // Steps that became inactive (scrolling up)
            for (let i = prev; i > newActive && i >= 0; i--) {
                applyStepState(els.current, i, false, badgeColor, badgeTextColor)
            }
            els.current.prevActive = newActive
        }

        // ── Update connector line fills (direct transform) ──
        for (let i = 0; i < steps.length - 1; i++) {
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
                        progress = Math.max(0, Math.min(1, (trigger - curCenter) / dist))
                    }
                }
            }
            fill.style.transform = `scaleY(${progress})`
        }

        // Trailing line
        if (showTrailingLine) {
            const lastFill = els.current.lineFills[steps.length - 1]
            if (lastFill) {
                lastFill.style.transform =
                    newActive >= steps.length - 1 ? "scaleY(1)" : "scaleY(0)"
            }
        }
    }, [shouldAnimate, steps.length, triggerPoint, showTrailingLine, badgeColor, badgeTextColor])

    // Scroll + resize listener with rAF throttle
    useEffect(() => {
        if (!shouldAnimate) {
            // Static / canvas / reduced-motion: force all active
            for (let i = 0; i < steps.length; i++) {
                applyStepState(els.current, i, true, badgeColor, badgeTextColor)
                const fill = els.current.lineFills[i]
                if (fill) fill.style.transform = "scaleY(1)"
            }
            els.current.prevActive = steps.length - 1
            return
        }

        // Reset tracking so updateScroll applies the correct initial state
        els.current.prevActive = -1

        let rafId: number = 0
        const onScroll = () => {
            cancelAnimationFrame(rafId)
            rafId = requestAnimationFrame(updateScroll)
        }

        // Initial computation (after mount / prop change)
        requestAnimationFrame(updateScroll)

        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll, { passive: true })

        return () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
        }
    }, [shouldAnimate, updateScroll, steps.length, badgeColor, badgeTextColor])

    // Memoize resolved fonts
    const titleF = useMemo(
        () =>
            resolveFont(titleFont, {
                size: 24,
                weight: 600,
                lineHeight: "1.3em",
                letterSpacing: "-0.02em",
            }),
        [titleFont]
    )

    const bodyF = useMemo(
        () =>
            resolveFont(bodyFont, {
                size: 14,
                weight: 400,
                lineHeight: "1.5em",
                letterSpacing: "0em",
            }),
        [bodyFont]
    )

    const formatNumber = (i: number): string => {
        if (numberFormat === "zero-padded")
            return String(i + 1).padStart(2, "0")
        return String(i + 1)
    }

    // Track active step for aria-current
    const [activeStep, setActiveStep] = useState(-1)

    // Update activeStep when scroll changes
    useEffect(() => {
        if (!shouldAnimate) {
            setActiveStep(steps.length - 1)
            return
        }

        const checkActive = () => {
            const current = els.current.prevActive
            if (current !== activeStep) {
                setActiveStep(current)
            }
        }

        const intervalId = setInterval(checkActive, 100)
        return () => clearInterval(intervalId)
    }, [shouldAnimate, steps.length, activeStep])

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: `${gap}px`,
                position: "relative",
                ...style, // [CHANGE 3] Spread `style` on root element
            }}
            role="list"
            aria-label="Progress steps timeline"
        >
            {steps.map((step, i) => {
                const isLast = i === steps.length - 1
                const showLine = !isLast || showTrailingLine
                const isTrailing = isLast && showTrailingLine
                const initActive = !shouldAnimate
                const isActive = shouldAnimate ? i <= activeStep : initActive

                // Error handling for missing step data
                const stepTitle = step?.title || `Step ${i + 1}`
                const stepDescription = step?.description || ""

                return (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "stretch",
                            gap: 24,
                            position: "relative",
                        }}
                        role="listitem"
                        aria-label={`Step ${i + 1}: ${stepTitle}`}
                        aria-current={isActive ? "step" : undefined}
                    >
                        {/* Left column: badge + connector */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                width: badgeSize,
                                flexShrink: 0,
                            }}
                        >
                            {/* Number badge — CSS transition, no framer-motion */}
                            <div
                                ref={(el) => {
                                    els.current.badges[i] = el
                                }}
                                style={{
                                    width: badgeSize,
                                    height: badgeSize,
                                    borderRadius: badgeRadius,
                                    borderWidth: badgeBorderWidth,
                                    borderStyle: "solid",
                                    borderColor: badgeColor,
                                    backgroundColor: initActive
                                        ? badgeColor
                                        : "rgba(0,0,0,0)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    boxSizing: "border-box" as const,
                                    transition: BADGE_TRANSITION,
                                }}
                            >
                                <span
                                    ref={(el) => {
                                        els.current.numbers[i] = el
                                    }}
                                    style={{
                                        fontFamily: titleF.fontFamily,
                                        fontSize: Math.round(badgeSize * 0.36),
                                        fontWeight: 600,
                                        lineHeight: 1,
                                        letterSpacing: "-0.02em",
                                        userSelect: "none" as const,
                                        color: initActive
                                            ? badgeTextColor
                                            : badgeColor,
                                        transition: NUMBER_TRANSITION,
                                    }}
                                    aria-hidden="true"
                                >
                                    {formatNumber(i)}
                                </span>
                            </div>

                            {/* Connector line — scaleY driven by direct DOM mutation */}
                            {showLine && (
                                <div
                                    style={{
                                        ...(isLast
                                            ? { height: trailingLineHeight }
                                            : { flex: 1 }),
                                        width: lineWidth,
                                        backgroundColor: lineColor,
                                        borderRadius: isTrailing
                                            ? 0
                                            : lineWidth,
                                        position: "relative" as const,
                                        overflow: "hidden" as const,
                                        marginTop: 8,
                                        marginBottom: isLast ? 0 : 8,
                                        minHeight: 24,
                                        ...(isTrailing
                                            ? {
                                                  WebkitMaskImage:
                                                      TRAILING_FADE_MASK,
                                                  maskImage:
                                                      TRAILING_FADE_MASK,
                                              }
                                            : {}),
                                    }}
                                >
                                    <div
                                        ref={(el) => {
                                            els.current.lineFills[i] = el
                                        }}
                                        style={{
                                            position: "absolute" as const,
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                            backgroundColor: lineFilledColor,
                                            borderRadius: isTrailing
                                                ? 0
                                                : lineWidth,
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

                        {/* Right column: text — CSS transition, no framer-motion */}
                        <div
                            ref={(el) => {
                                els.current.texts[i] = el
                            }}
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column" as const,
                                gap: 8,
                                paddingBottom: isLast ? 0 : 40,
                                paddingTop: 4,
                                opacity: initActive ? 1 : 0.3,
                                transform: initActive
                                    ? "translateX(0)"
                                    : "translateX(-8px)",
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
                                    WebkitFontSmoothing: "antialiased",
                                    MozOsxFontSmoothing: "grayscale",
                                }}
                            >
                                {stepTitle}
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
                                    WebkitFontSmoothing: "antialiased",
                                    MozOsxFontSmoothing: "grayscale",
                                }}
                            >
                                {stepDescription}
                            </span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// [CHANGE 4] Add displayName for Framer panel clarity
StepsTimeline.displayName = "Steps Timeline"

/* ━━━ types ━━━ */

interface StepItem {
    title: string
    description: string
}

interface Props {
    steps?: StepItem[]
    badgeColor?: string
    badgeTextColor?: string
    badgeSize?: number
    badgeRadius?: number
    badgeBorderWidth?: number
    lineColor?: string
    lineFilledColor?: string
    lineWidth?: number
    showTrailingLine?: boolean
    trailingLineHeight?: number
    titleFont?: {
        fontFamily?: string
        fontSize?: number | string
        fontWeight?: number | string
        fontStyle?: string
        lineHeight?: number | string
        letterSpacing?: number | string
    }
    bodyFont?: {
        fontFamily?: string
        fontSize?: number | string
        fontWeight?: number | string
        fontStyle?: string
        lineHeight?: number | string
        letterSpacing?: number | string
    }
    titleColor?: string
    bodyColor?: string
    gap?: number
    animateOnScroll?: boolean
    triggerPoint?: number
    numberFormat?: "zero-padded" | "plain"
    style?: React.CSSProperties // [CHANGE 1] Added style prop for Framer layout sizing
}

/* ━━━ property controls ━━━ */

addPropertyControls(StepsTimeline, {
    steps: {
        type: ControlType.Array,
        title: "Steps",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Step title",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Step description text.",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                title: "Kennismakingsgesprek",
                description:
                    "We starten met een kort kennismakingsgesprek van 20 minuten. Zo leren we je kennen en bespreken we jouw vraag en wensen.",
            },
            {
                title: "Intakegesprek & plan",
                description:
                    "Samen maken we een persoonlijk behandelplan. We kijken naar wat jij nodig hebt en stellen duidelijke doelen op.",
            },
            {
                title: "Behandeltraject",
                description:
                    "We gaan aan de slag met jouw behandeling. Denk aan CGT, EMDR, systeemtherapie en lichaamsgerichte interventies binnen het behandelplan.",
            },
            {
                title: "Groei & afsluiting",
                description:
                    "We evalueren regelmatig je voortgang. Wanneer je doelen zijn bereikt, sluiten we af met nazorg en handvatten voor de toekomst.",
            },
        ],
    },
    badgeColor: {
        type: ControlType.Color,
        title: "Badge Color",
        defaultValue: "#7A55F3",
    },
    badgeTextColor: {
        type: ControlType.Color,
        title: "Badge Text",
        defaultValue: "#FFFFFF",
    },
    badgeSize: {
        type: ControlType.Number,
        title: "Badge Size",
        defaultValue: 48,
        min: 28,
        max: 80,
        step: 2,
        unit: "px",
        displayStepper: true,
    },
    badgeRadius: {
        type: ControlType.Number,
        title: "Badge Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 2,
        unit: "px",
        displayStepper: true,
    },
    badgeBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 2,
        min: 1,
        max: 4,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line BG",
        defaultValue: "#EBEAE0",
    },
    lineFilledColor: {
        type: ControlType.Color,
        title: "Line Fill",
        defaultValue: "#7A55F3",
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
    showTrailingLine: {
        type: ControlType.Boolean,
        title: "Trailing Line",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    trailingLineHeight: {
        type: ControlType.Number,
        title: "Trail Height",
        defaultValue: 60,
        min: 20,
        max: 200,
        step: 10,
        unit: "px",
        displayStepper: true,
        hidden: (props: Props) => !props.showTrailingLine,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 24,
            variant: "Semibold",
            lineHeight: "1.3em",
            letterSpacing: "-0.02em",
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
            lineHeight: "1.5em",
            letterSpacing: "0em",
        },
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#222222",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Body Color",
        defaultValue: "#666666",
    },
    gap: {
        type: ControlType.Number,
        title: "Step Gap",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 4,
        unit: "px",
        displayStepper: true,
    },
    numberFormat: {
        type: ControlType.Enum,
        title: "Numbers",
        options: ["zero-padded", "plain"],
        optionTitles: ["01, 02...", "1, 2..."],
        defaultValue: "zero-padded",
        displaySegmentedControl: true,
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
