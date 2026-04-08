/**
 * Text Reveal Pro — Performance-Optimized
 * Reveal text with smooth scroll-driven animations, featuring character-by-character
 * or word-by-word effects with optional multi-color gradients.
 *
 * Changes from original:
 * [CHANGE 1] Added TextRevealPro.displayName = "Text Reveal Pro"
 * [CHANGE 2] Added style?: React.CSSProperties to Props interface
 * [CHANGE 3] Wrapped return fragment in a <div> with props.style spread for Framer layout control
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 200
 *
 * Originally created by DjectStudio — https://www.djectstudio.com
 * Performance rewrite: single scroll listener + batched DOM updates.
 * Translation-safe: detects browser translation tools and degrades gracefully.
 */

import { addPropertyControls, ControlType } from "framer"
import { useScroll, useMotionValueEvent } from "framer-motion"
import React, { useRef, useMemo, useEffect, useState, useCallback } from "react"

// ============================================================================
// COLOR UTILITIES
// ============================================================================

function rgbToHex(rgb: string): string {
    if (rgb.startsWith("#")) return rgb
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (!match) return "#000000"
    const r = parseInt(match[1])
    const g = parseInt(match[2])
    const b = parseInt(match[3])
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function hslToHex(h: number, s: number, l: number): string {
    l /= 100
    const a = (s * Math.min(l, 1 - l)) / 100
    const f = (n: number) => {
        const k = (n + h / 30) % 12
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
        return Math.round(255 * color)
            .toString(16)
            .padStart(2, "0")
    }
    return `#${f(0)}${f(8)}${f(4)}`
}

// Pre-parsed color for fast interpolation (avoid parsing hex every frame)
interface ParsedColor {
    r: number
    g: number
    b: number
}

function parseColor(color: string): ParsedColor {
    const hex = rgbToHex(color).replace("#", "")
    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
    }
}

function lerpColor(c1: ParsedColor, c2: ParsedColor, t: number): string {
    const r = (c1.r + (c2.r - c1.r) * t) | 0
    const g = (c1.g + (c2.g - c1.g) * t) | 0
    const b = (c1.b + (c2.b - c1.b) * t) | 0
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function lerpGradient(parsedColors: ParsedColor[], progress: number): string {
    if (progress >= 1) return lerpColor(parsedColors[parsedColors.length - 1], parsedColors[parsedColors.length - 1], 0)
    if (progress <= 0) return lerpColor(parsedColors[0], parsedColors[0], 0)
    const segmentCount = parsedColors.length - 1
    const scaledProgress = progress * segmentCount
    const segment = Math.floor(scaledProgress)
    const segmentProgress = scaledProgress - segment
    return lerpColor(parsedColors[segment], parsedColors[segment + 1], segmentProgress)
}

function generateRandomGradientColors(
    startColor: string,
    endColor: string
): string[] {
    const start = rgbToHex(startColor)
    const end = rgbToHex(endColor)
    const seed = parseInt(start.slice(1, 4), 16) + parseInt(end.slice(1, 4), 16)
    const colors = []
    const baseHue = seed % 360
    for (let i = 0; i < 3; i++) {
        const hue = (baseHue + (i + 1) * 90) % 360
        const saturation = 80 + ((seed + i) % 15)
        const lightness = 50 + ((seed * (i + 1)) % 20)
        colors.push(hslToHex(hue, saturation, lightness))
    }
    return colors
}

// ============================================================================
// TRANSLATION DETECTION HOOK
// ============================================================================

function useTranslationDetector(): boolean {
    const [isTranslated, setIsTranslated] = useState(false)

    useEffect(() => {
        const checkTranslation = () => {
            const html = document.documentElement
            const hasTranslateClass =
                html.classList.contains("translated-ltr") ||
                html.classList.contains("translated-rtl")
            const originalLang = html.getAttribute("data-original-lang")
            const langChanged = originalLang != null && originalLang !== html.lang
            const hasTranslateWidget =
                document.querySelector(".goog-te-banner-frame") != null ||
                document.querySelector("#google_translate_element") != null ||
                document.querySelector("iframe.goog-te-menu-frame") != null
            const hasTranslateAttr = html.hasAttribute("translated")
            return hasTranslateClass || langChanged || hasTranslateWidget || hasTranslateAttr
        }

        if (checkTranslation()) setIsTranslated(true)

        const observer = new MutationObserver(() => setIsTranslated(checkTranslation()))
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "lang", "translated"],
            childList: false,
            subtree: false,
        })

        const bodyObserver = new MutationObserver(() => setIsTranslated(checkTranslation()))
        if (document.body) {
            bodyObserver.observe(document.body, { childList: true, subtree: false })
        }

        return () => {
            observer.disconnect()
            bodyObserver.disconnect()
        }
    }, [])

    return isTranslated
}

// ============================================================================
// STATIC UNIT COMPONENTS (no animation hooks — styled by parent)
// ============================================================================

interface StaticUnitProps {
    content: string
    isWord?: boolean
}

const StaticUnit = React.memo(({ content, isWord }: StaticUnitProps) => (
    <span
        style={{
            display: "inline",
            willChange: "opacity, color",
            transition: "none",
        }}
    >
        {content === " " ? "\u00A0" : content}
    </span>
))

const StaticWordChars = React.memo(({ word }: { word: string }) => (
    <span style={{ whiteSpace: "nowrap", display: "inline-block" }}>
        {word.split("").map((char, i) => (
            <span
                key={i}
                style={{
                    display: "inline",
                    willChange: "opacity, color",
                    transition: "none",
                }}
            >
                {char === " " ? "\u00A0" : char}
            </span>
        ))}
    </span>
))

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// [CHANGE 2] Added style?: React.CSSProperties to Props interface
interface Props {
    useList: boolean
    text: string
    items: string[]
    tag: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "div"
    font: any
    animateBy: "character" | "word"
    animateByOpacity: boolean
    color1: string
    color2: string
    useGradient: boolean
    color: string
    initialOpacity: number
    preColoredPercent: number
    scrollRange: "tight" | "balanced" | "extended" | "custom"
    scrollEnter: number
    scrollComplete: number
    rtl: boolean
    style?: React.CSSProperties
}

export default function TextRevealPro(props: Props) {
    const {
        useList,
        text,
        items,
        tag,
        font,
        animateBy,
        animateByOpacity,
        color1,
        color2,
        useGradient,
        color,
        initialOpacity,
        preColoredPercent,
        scrollRange,
        scrollEnter,
        scrollComplete,
        rtl,
        style, // [CHANGE 3] Destructure style from props
    } = props

    const containerRef = useRef<HTMLElement>(null)
    const spanRefsCache = useRef<HTMLSpanElement[]>([])

    // Translation & reduced motion detection
    const isTranslated = useTranslationDetector()
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        setPrefersReducedMotion(mq.matches)
        const handler = () => setPrefersReducedMotion(mq.matches)
        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
    }, [])

    // Guard: empty text
    const isEmpty = !useList
        ? !text || text.trim() === ""
        : !items || items.length === 0 || items.every((item) => !item || item.trim() === "")

    // Animation parameters
    const startColor = animateByOpacity ? color : color1
    const endColor = animateByOpacity ? color : color2
    const startOpacity = animateByOpacity ? initialOpacity : 1
    const endOpacity = 1

    // Pre-parse colors once (not every frame)
    const parsedStartColor = useMemo(() => parseColor(startColor), [startColor])
    const parsedEndColor = useMemo(() => parseColor(endColor), [endColor])

    const parsedGradientColors = useMemo(() => {
        if (animateByOpacity || !useGradient) return []
        const randomColors = generateRandomGradientColors(color1, color2)
        return [color1, randomColors[0], randomColors[1], randomColors[2], color2].map(parseColor)
    }, [animateByOpacity, useGradient, color1, color2])

    // Parse text into units
    const { units, totalUnits, plainText } = useMemo(() => {
        if (useList) {
            const validItems = items.filter((item) => item && item.trim() !== "")
            return {
                units: validItems,
                totalUnits: validItems.length,
                plainText: validItems.join(" "),
            }
        }
        if (animateBy === "word") {
            const wordArray = text.split(" ")
            return {
                units: wordArray,
                totalUnits: wordArray.length,
                plainText: text,
            }
        }
        // Character mode: flatten into characters but track word boundaries
        const wordArray = text.split(" ")
        const chars: string[] = []
        wordArray.forEach((word, idx) => {
            for (const c of word) chars.push(c)
            if (idx < wordArray.length - 1) chars.push(" ")
        })
        return {
            units: chars,
            totalUnits: chars.length,
            plainText: text,
        }
    }, [useList, text, items, animateBy])

    // Word boundaries for character mode (for nowrap spans)
    const wordBoundaries = useMemo(() => {
        if (useList || animateBy === "word") return null
        const boundaries: { start: number; end: number }[] = []
        const wordArray = text.split(" ")
        let idx = 0
        wordArray.forEach((word) => {
            boundaries.push({ start: idx, end: idx + word.length })
            idx += word.length + 1 // +1 for space
        })
        return boundaries
    }, [useList, text, animateBy])

    const preColoredThreshold = Math.floor((totalUnits * preColoredPercent) / 100)

    // Scroll offset
    const scrollOffset = useMemo(() => {
        switch (scrollRange) {
            case "tight":
                return ["start 0.9", "start 0.6"] as const
            case "balanced":
                return ["start 0.8", "start 0.4"] as const
            case "extended":
                return ["start 1", "start 0.2"] as const
            case "custom":
            default:
                return [`start ${scrollEnter}`, `start ${scrollComplete}`] as const
        }
    }, [scrollRange, scrollEnter, scrollComplete])

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: scrollOffset,
    })

    // ========================================================================
    // SINGLE SCROLL LISTENER — batched DOM updates (the core optimization)
    // ========================================================================
    const updateSpans = useCallback(
        (progress: number) => {
            const container = containerRef.current
            if (!container) return

            // Collect all animated spans (cache for performance)
            if (spanRefsCache.current.length === 0) {
                const spans = container.querySelectorAll<HTMLSpanElement>("[data-idx]")
                spanRefsCache.current = Array.from(spans)
            }

            const spans = spanRefsCache.current
            const total = spans.length
            if (total === 0) return

            for (let i = 0; i < total; i++) {
                const span = spans[i]
                const isPreColored = i < preColoredThreshold

                if (isPreColored) {
                    if (!span.dataset.done) {
                        span.style.opacity = String(endOpacity)
                        if (!animateByOpacity) {
                            span.style.color = lerpColor(parsedEndColor, parsedEndColor, 0)
                        }
                        span.dataset.done = "1"
                    }
                    continue
                }

                const unitStart = i / total
                const unitEnd = (i + 1) / total

                let p: number
                if (progress <= unitStart) {
                    p = 0
                } else if (progress >= unitEnd) {
                    p = 1
                } else {
                    p = (progress - unitStart) / (unitEnd - unitStart)
                }

                // Opacity
                const opacity = startOpacity + (endOpacity - startOpacity) * p
                span.style.opacity = String(opacity)

                // Color (only in color mode)
                if (!animateByOpacity) {
                    if (useGradient && parsedGradientColors.length > 0) {
                        span.style.color = lerpGradient(parsedGradientColors, p)
                    } else {
                        span.style.color = lerpColor(parsedStartColor, parsedEndColor, p)
                    }
                }
            }
        },
        [
            preColoredThreshold,
            startOpacity,
            endOpacity,
            animateByOpacity,
            useGradient,
            parsedStartColor,
            parsedEndColor,
            parsedGradientColors,
        ]
    )

    // Invalidate span cache when content changes
    useEffect(() => {
        spanRefsCache.current = []
    }, [units, totalUnits])

    // Single scroll event listener — replaces all useTransform hooks
    useMotionValueEvent(scrollYProgress, "change", updateSpans)

    // Also run once on mount to set initial state
    useEffect(() => {
        if (!isTranslated && !prefersReducedMotion && !isEmpty) {
            // Small delay to ensure DOM is rendered
            const raf = requestAnimationFrame(() => {
                updateSpans(scrollYProgress.get())
            })
            return () => cancelAnimationFrame(raf)
        }
    }, [isTranslated, prefersReducedMotion, isEmpty, updateSpans])

    // ========================================================================
    // RENDER
    // ========================================================================

    const Tag = tag as any
    const baseFontStyle = font || {
        fontFamily: "Inter, sans-serif",
        fontSize: 48,
        fontWeight: 400,
        lineHeight: "1.2em",
        letterSpacing: "0em",
    }
    const { color: fontColor, ...fontStyleWithoutColor } = baseFontStyle

    if (isEmpty) {
        return (
            <p style={{ color: "#999", fontStyle: "italic", fontSize: "14px" }}>
                {!useList
                    ? "Add text to see the reveal effect..."
                    : "Add items to see the reveal effect..."}
            </p>
        )
    }

    // Translation fallback
    if (isTranslated) {
        return (
            <Tag
                ref={containerRef}
                style={{
                    ...fontStyleWithoutColor,
                    color: animateByOpacity ? color : color2,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "normal",
                    overflowWrap: "break-word",
                    direction: rtl ? "rtl" : "ltr",
                }}
            >
                {plainText}
            </Tag>
        )
    }

    // Reduced motion fallback
    if (prefersReducedMotion) {
        return (
            <Tag
                ref={containerRef}
                style={{
                    ...fontStyleWithoutColor,
                    color: animateByOpacity ? color : color2,
                    opacity: endOpacity,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "normal",
                    overflowWrap: "break-word",
                    direction: rtl ? "rtl" : "ltr",
                }}
            >
                {plainText}
            </Tag>
        )
    }

    // Performance warnings
    const characterLimit = 500
    const wordLimit = 1000
    const listLimit = 100
    const showCharacterWarning = !useList && animateBy === "character" && totalUnits > characterLimit
    const showWordWarning = !useList && animateBy === "word" && totalUnits > wordLimit
    const showListWarning = useList && totalUnits > listLimit

    // Build initial styles for spans
    const initialSpanStyle: React.CSSProperties = {
        display: "inline",
        opacity: startOpacity,
        willChange: "opacity",
        ...(animateByOpacity
            ? { color: color }
            : { color: startColor, willChange: "opacity, color" }),
    }

    // Render character mode with word-wrap boundaries
    const renderCharacterMode = () => {
        if (!wordBoundaries) return null
        return wordBoundaries.map((wb, wIdx) => {
            const wordChars = units.slice(wb.start, wb.end)
            return (
                <React.Fragment key={wIdx}>
                    <span style={{ whiteSpace: "nowrap", display: "inline-block" }}>
                        {wordChars.map((char, cIdx) => (
                            <span
                                key={wb.start + cIdx}
                                data-idx={wb.start + cIdx}
                                style={initialSpanStyle}
                            >
                                {char}
                            </span>
                        ))}
                    </span>
                    {wIdx < wordBoundaries.length - 1 && "\u00A0"}
                </React.Fragment>
            )
        })
    }

    // Render word mode
    const renderWordMode = () => {
        return units.map((word, idx) => (
            <React.Fragment key={idx}>
                <span
                    style={{ whiteSpace: "nowrap", display: "inline-block" }}
                >
                    <span data-idx={idx} style={initialSpanStyle}>
                        {word}
                    </span>
                </span>
                {idx < units.length - 1 && "\u00A0"}
            </React.Fragment>
        ))
    }

    // Render list mode
    const renderListMode = () => {
        return units.map((item, idx) => (
            <React.Fragment key={idx}>
                <span data-idx={idx} style={initialSpanStyle}>
                    {item}
                </span>
                {idx < units.length - 1 && " "}
            </React.Fragment>
        ))
    }

    // [CHANGE 3] Wrapped return in a <div> with props.style spread for Framer layout control
    return (
        <div style={style}>
            {showCharacterWarning && (
                <div
                    style={{
                        padding: "10px 14px",
                        background: "#E8F4FD",
                        border: "1px solid #90CAF9",
                        color: "#1565C0",
                        fontSize: "13px",
                        borderRadius: "6px",
                        marginBottom: "12px",
                        lineHeight: "1.4",
                    }}
                    role="alert"
                >
                    {"\uD83D\uDCA1"} <strong>{totalUnits} characters</strong> — Switch to{" "}
                    <strong>Word</strong> mode for better performance
                </div>
            )}

            {showWordWarning && (
                <div
                    style={{
                        padding: "10px 14px",
                        background: "#FFF3CD",
                        border: "1px solid #FFB74D",
                        color: "#E65100",
                        fontSize: "13px",
                        borderRadius: "6px",
                        marginBottom: "12px",
                        lineHeight: "1.4",
                    }}
                    role="alert"
                >
                    {"\u26A0\uFE0F"} <strong>{units.length} words</strong> — Large text may
                    impact performance on older devices
                </div>
            )}

            {showListWarning && (
                <div
                    style={{
                        padding: "10px 14px",
                        background: "#FFF3CD",
                        border: "1px solid #FFB74D",
                        color: "#E65100",
                        fontSize: "13px",
                        borderRadius: "6px",
                        marginBottom: "12px",
                        lineHeight: "1.4",
                    }}
                    role="alert"
                >
                    {"\u26A0\uFE0F"} <strong>{units.length} items</strong> — Large lists
                    may impact performance on older devices
                </div>
            )}

            {/* Single container ref — all animation driven from one scroll listener */}
            <Tag
                ref={containerRef}
                className="notranslate"
                translate="no"
                style={{
                    ...fontStyleWithoutColor,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "normal",
                    overflowWrap: "break-word",
                    direction: rtl ? "rtl" : "ltr",
                }}
            >
                {useList
                    ? renderListMode()
                    : animateBy === "word"
                      ? renderWordMode()
                      : renderCharacterMode()}
            </Tag>

            {/* Hidden translatable copy for translation tools */}
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    width: "1px",
                    height: "1px",
                    padding: 0,
                    margin: "-1px",
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                    borderWidth: 0,
                }}
                translate="yes"
            >
                {plainText}
            </span>
        </div>
    )
}

// [CHANGE 1] Added displayName for Framer panel clarity
TextRevealPro.displayName = "Text Reveal Pro"

// ============================================================================
// PROPERTY CONTROLS
// ============================================================================

addPropertyControls(TextRevealPro, {
    useList: {
        type: ControlType.Boolean,
        title: "Text Mode",
        defaultValue: false,
        enabledTitle: "List",
        disabledTitle: "Block",
    },
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue:
            "Reveal your message beautifully as visitors scroll through your page.",
        hidden: (props) => props.useList,
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.String,
        },
        defaultValue: [
            "Transform your website with beautiful scroll-driven animations that captivate your audience.",
            "Each element reveals smoothly as visitors explore your content, creating an engaging experience.",
            "Built with performance in mind, ensuring fast load times across all devices.",
        ],
        hidden: (props) => !props.useList,
    },
    tag: {
        type: ControlType.Enum,
        title: "Tag",
        options: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "div"],
        optionTitles: ["P", "H1", "H2", "H3", "H4", "H5", "H6", "Span", "Div"],
        defaultValue: "p",
    },
    animateBy: {
        type: ControlType.Enum,
        title: "Animate",
        options: ["character", "word"],
        optionTitles: ["Character", "Word"],
        defaultValue: "character",
        hidden: (props) => props.useList,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },
    animateByOpacity: {
        type: ControlType.Boolean,
        title: "Animate By",
        defaultValue: false,
        enabledTitle: "Opacity",
        disabledTitle: "Color",
    },
    color1: {
        type: ControlType.Color,
        title: "From",
        defaultValue: "#CCCCCC",
        hidden: (props) => props.animateByOpacity,
    },
    color2: {
        type: ControlType.Color,
        title: "To",
        defaultValue: "#0066FF",
        hidden: (props) => props.animateByOpacity,
    },
    useGradient: {
        type: ControlType.Boolean,
        title: "Multi-Color",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => props.animateByOpacity,
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
        hidden: (props) => !props.animateByOpacity,
    },
    initialOpacity: {
        type: ControlType.Number,
        title: "Initial Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.15,
        displayStepper: true,
        hidden: (props) => !props.animateByOpacity,
    },
    preColoredPercent: {
        type: ControlType.Number,
        title: "Pre-revealed",
        min: 0,
        max: 100,
        unit: "%",
        defaultValue: 0,
        step: 5,
        displayStepper: true,
    },
    scrollRange: {
        type: ControlType.Enum,
        title: "Scroll Range",
        options: ["tight", "balanced", "extended", "custom"],
        optionTitles: ["Tight", "Balanced", "Extended", "Custom"],
        defaultValue: "balanced",
    },
    scrollEnter: {
        type: ControlType.Number,
        title: "Enter",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.8,
        displayStepper: true,
        hidden: (props) => props.scrollRange !== "custom",
    },
    scrollComplete: {
        type: ControlType.Number,
        title: "Complete",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.4,
        displayStepper: true,
        hidden: (props) => props.scrollRange !== "custom",
    },
    rtl: {
        type: ControlType.Boolean,
        title: "RTL",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "[Built by DjectStudio](https://djectstudio.com)",
    },
})
