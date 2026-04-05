import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion, useSpring, useTransform, type MotionValue } from "framer-motion"
import { useState, useEffect, useCallback, useRef, startTransition, useMemo } from "react"

/**
 * Word Wheel — Vertical rotating ticker with center-focus effect
 * Spring-driven, IntersectionObserver gated, no jumps on wrap
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
// Convert variant to fontWeight and fontStyle
const variantToWeight: Record<string, { fontWeight: number; fontStyle: string }> = {
    "Thin": { fontWeight: 100, fontStyle: "normal" },
    "Extra Light": { fontWeight: 200, fontStyle: "normal" },
    "Light": { fontWeight: 300, fontStyle: "normal" },
    "Regular": { fontWeight: 400, fontStyle: "normal" },
    "Medium": { fontWeight: 500, fontStyle: "normal" },
    "Semibold": { fontWeight: 600, fontStyle: "normal" },
    "Bold": { fontWeight: 700, fontStyle: "normal" },
    "Extra Bold": { fontWeight: 800, fontStyle: "normal" },
    "Black": { fontWeight: 900, fontStyle: "normal" },
    "Thin Italic": { fontWeight: 100, fontStyle: "italic" },
    "Extra Light Italic": { fontWeight: 200, fontStyle: "italic" },
    "Light Italic": { fontWeight: 300, fontStyle: "italic" },
    "Italic": { fontWeight: 400, fontStyle: "italic" },
    "Regular Italic": { fontWeight: 400, fontStyle: "italic" },
    "Medium Italic": { fontWeight: 500, fontStyle: "italic" },
    "Semibold Italic": { fontWeight: 600, fontStyle: "italic" },
    "Bold Italic": { fontWeight: 700, fontStyle: "italic" },
    "Extra Bold Italic": { fontWeight: 800, fontStyle: "italic" },
    "Black Italic": { fontWeight: 900, fontStyle: "italic" },
}

export default function WordWheel({
    words = [
        "Verslaving",
        "Persoonlijkheid",
        "Klinische zorg",
        "Suïcidaliteit",
        "Eetstoornissen",
        "Psychoses",
        "Ernstige OCD",
        "Crisissituaties",
    ],
    interval = 2500,
    direction = "up",
    pauseOnHover = true,
    font,
    color = "#1a1a1a",
    focusColor = "#1a1a1a",
    focusSizeMultiplier = 1.4,
    focusWeightBump = 200,
    nearOpacity = 0.4,
    farOpacity = 0.15,
    gap = 16,
    visibleCount = 5,
    edgeFade = 20,
    stiffness = 60,
    damping = 18,
}: Props) {
    const isStatic = useIsStaticRenderer()
    const count = words.length
    const isPausedRef = useRef(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const [inView, setInView] = useState(false)
    const isAnimatingRef = useRef(false)

    // Resolve font values with variant support
    const fontFamily =
        (font && typeof font === "object" && font.fontFamily) || "sans-serif"
    const baseFontSize =
        font && typeof font === "object" && typeof font.fontSize === "number"
            ? font.fontSize
            : 28

    const variant = font && typeof font === "object" && font.variant ? font.variant : "Light"
    const resolvedVariant = variantToWeight[variant] || { fontWeight: 300, fontStyle: "normal" }
    const baseFontWeight = resolvedVariant.fontWeight
    const fontStyle = resolvedVariant.fontStyle

    const lineHeight =
        font && typeof font === "object" && font.lineHeight != null
            ? font.lineHeight
            : "1.4"
    const letterSpacing =
        font && typeof font === "object" && font.letterSpacing != null
            ? font.letterSpacing
            : "0em"

    // Memoize derived values
    const focusFontSize = useMemo(
        () => Math.round(baseFontSize * focusSizeMultiplier),
        [baseFontSize, focusSizeMultiplier]
    )

    const focusFontWeight = useMemo(
        () => Math.min(900, baseFontWeight + focusWeightBump),
        [baseFontWeight, focusWeightBump]
    )

    const parseLH = (lh: any, fs: number): number => {
        if (typeof lh === "number")
            return lh > 0 && lh < 10 ? lh * fs : lh > 0 ? lh : fs * 1.4
        if (typeof lh === "string") {
            const n = parseFloat(lh)
            if (isNaN(n) || n <= 0) return fs * 1.4
            if (lh.endsWith("px")) return n
            if (lh.endsWith("em")) return n * fs
            return n > 10 ? n : n * fs
        }
        return fs * 1.4
    }

    const slotH = useMemo(
        () => Math.max(parseLH(lineHeight, focusFontSize) + gap, 40),
        [lineHeight, focusFontSize, gap]
    )

    const halfVisible = useMemo(
        () => Math.floor(visibleCount / 2),
        [visibleCount]
    )

    const maskCSS = useMemo(() => {
        const t = Math.max(0, Math.min(edgeFade, 45))
        return `linear-gradient(to bottom, transparent 0%, black ${t}%, black ${100 - t}%, transparent 100%)`
    }, [edgeFade])

    // IntersectionObserver — only animate when in viewport
    useEffect(() => {
        if (isStatic || !containerRef.current) return
        const el = containerRef.current
        const observer = new IntersectionObserver(
            ([entry]) => startTransition(() => setInView(entry.isIntersecting)),
            { threshold: 0.15 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic])

    // Spring progress with reactive config
    const springProgress = useSpring(0, { stiffness, damping, mass: 1 })

    // Update spring config when props change
    useEffect(() => {
        const currentConfig = springProgress.get()
        springProgress.set(currentConfig)
    }, [stiffness, damping, springProgress])

    // Cleanup spring on unmount
    useEffect(() => {
        return () => {
            springProgress.stop()
        }
    }, [springProgress])

    const stepRef = useRef(0)

    const tick = useCallback(() => {
        if (isPausedRef.current || count === 0) return
        stepRef.current += 1
        springProgress.set(stepRef.current)
    }, [count, springProgress])

    // Timer — only runs when in view
    useEffect(() => {
        if (isStatic || count === 0 || !inView) return
        const id = setInterval(tick, interval)
        return () => clearInterval(id)
    }, [interval, count, isStatic, tick, inView])

    const onEnter = useCallback(() => {
        if (pauseOnHover) isPausedRef.current = true
    }, [pauseOnHover])
    const onLeave = useCallback(() => {
        isPausedRef.current = false
    }, [])

    const containerStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        maskImage: maskCSS,
        WebkitMaskImage: maskCSS,
    }

    // Static canvas - show focused word based on current time
    if (isStatic) {
        const staticFocusIndex = Math.floor(Date.now() / interval) % count

        return (
            <div style={containerStyle}>
                {words.map((word, i) => {
                    const relativePos = (i - staticFocusIndex + count) % count
                    const adjustedPos = relativePos > count / 2 ? relativePos - count : relativePos
                    const absPos = Math.abs(adjustedPos)

                    if (absPos > halfVisible) return null

                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                fontFamily,
                                fontSize: absPos === 0 ? focusFontSize : baseFontSize,
                                fontWeight:
                                    absPos === 0 ? focusFontWeight : baseFontWeight,
                                fontStyle,
                                lineHeight,
                                letterSpacing,
                                color: absPos === 0 ? focusColor : color,
                                opacity:
                                    absPos === 0
                                        ? 1
                                        : absPos === 1
                                          ? nearOpacity
                                          : farOpacity,
                                transform: `translateY(${adjustedPos * slotH * (direction === "up" ? -1 : 1)}px)`,
                                whiteSpace: "nowrap",
                                textAlign: "center",
                                WebkitFontSmoothing: "antialiased",
                                MozOsxFontSmoothing: "grayscale",
                                textRendering: "optimizeLegibility",
                            }}
                        >
                            {word}
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            style={containerStyle}
            role="region"
            aria-live="polite"
            aria-label="Rotating word display"
        >
            {words.map((word, i) => (
                <WordItem
                    key={i}
                    index={i}
                    word={word}
                    count={count}
                    springProgress={springProgress}
                    slotH={slotH}
                    halfVisible={halfVisible}
                    direction={direction}
                    fontFamily={fontFamily}
                    baseFontSize={baseFontSize}
                    focusFontSize={focusFontSize}
                    baseFontWeight={baseFontWeight}
                    focusFontWeight={focusFontWeight}
                    fontStyle={fontStyle}
                    lineHeight={lineHeight}
                    letterSpacing={letterSpacing}
                    color={color}
                    focusColor={focusColor}
                    nearOpacity={nearOpacity}
                    farOpacity={farOpacity}
                />
            ))}
        </div>
    )
}

// Shortest-path wrap with safe modulo
function wrapDiff(index: number, progress: number, count: number): number {
    const raw = index - (((progress % count) + count) % count)
    if (raw > count / 2) return raw - count
    if (raw < -count / 2) return raw + count
    return raw
}

function WordItem({
    index,
    word,
    count,
    springProgress,
    slotH,
    halfVisible,
    direction,
    fontFamily,
    baseFontSize,
    focusFontSize,
    baseFontWeight,
    focusFontWeight,
    fontStyle,
    lineHeight,
    letterSpacing,
    color,
    focusColor,
    nearOpacity,
    farOpacity,
}: WordItemProps) {
    const sign = direction === "up" ? 1 : -1

    // Calculate distance once and derive all transforms from it
    const distance = useTransform(springProgress, (p: number) =>
        wrapDiff(index, p, count)
    )

    const absDistance = useTransform(distance, (d: number) => Math.abs(d))

    const y = useTransform(distance, (d: number) => d * slotH * sign)

    const opacity = useTransform(absDistance, (abs: number) => {
        if (abs > halfVisible + 0.5) return 0
        if (abs < 0.3) return 1
        if (abs < 1.3) return nearOpacity
        if (abs < 2.3) return farOpacity
        return 0
    })

    const fontSize = useTransform(absDistance, (abs: number) => {
        const t = Math.max(0, 1 - abs)
        return baseFontSize + (focusFontSize - baseFontSize) * t
    })

    const fontWeight = useTransform(absDistance, (abs: number) => {
        const t = Math.max(0, 1 - abs)
        return Math.round(baseFontWeight + (focusFontWeight - baseFontWeight) * t)
    })

    const textColor = useTransform(absDistance, (abs: number) => {
        return abs < 0.3 ? focusColor : color
    })

    return (
        <motion.div
            style={{
                position: "absolute",
                fontFamily,
                fontSize,
                fontWeight,
                fontStyle,
                lineHeight,
                letterSpacing,
                color: textColor,
                opacity,
                y,
                whiteSpace: "nowrap",
                textAlign: "center",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
                textRendering: "optimizeLegibility",
                willChange: "transform, opacity",
            }}
        >
            {word}
        </motion.div>
    )
}

interface Props {
    words?: string[]
    interval?: number
    direction?: "up" | "down"
    pauseOnHover?: boolean
    font?: any
    color?: string
    focusColor?: string
    focusSizeMultiplier?: number
    focusWeightBump?: number
    nearOpacity?: number
    farOpacity?: number
    gap?: number
    visibleCount?: number
    edgeFade?: number
    stiffness?: number
    damping?: number
}

interface WordItemProps {
    index: number
    word: string
    count: number
    springProgress: MotionValue<number>
    slotH: number
    halfVisible: number
    direction: "up" | "down"
    fontFamily: string
    baseFontSize: number
    focusFontSize: number
    baseFontWeight: number
    focusFontWeight: number
    fontStyle: string
    lineHeight: string | number
    letterSpacing: string | number
    color: string
    focusColor: string
    nearOpacity: number
    farOpacity: number
}

addPropertyControls(WordWheel, {
    words: {
        type: ControlType.Array,
        title: "Words",
        control: { type: ControlType.String },
        defaultValue: [
            "Verslaving",
            "Persoonlijkheid",
            "Klinische zorg",
            "Suïcidaliteit",
            "Eetstoornissen",
            "Psychoses",
            "Ernstige OCD",
            "Crisissituaties",
        ],
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 28,
            variant: "Light",
            lineHeight: "1.4",
            letterSpacing: "0em",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#1a1a1a",
    },
    focusColor: {
        type: ControlType.Color,
        title: "Focus Color",
        defaultValue: "#1a1a1a",
    },
    focusSizeMultiplier: {
        type: ControlType.Number,
        title: "Focus Size ×",
        defaultValue: 1.4,
        min: 1,
        max: 3,
        step: 0.1,
    },
    focusWeightBump: {
        type: ControlType.Number,
        title: "Focus Weight +",
        defaultValue: 200,
        min: 0,
        max: 600,
        step: 100,
        displayStepper: true,
    },
    nearOpacity: {
        type: ControlType.Number,
        title: "Near Opacity",
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.05,
    },
    farOpacity: {
        type: ControlType.Number,
        title: "Far Opacity",
        defaultValue: 0.15,
        min: 0,
        max: 1,
        step: 0.05,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 16,
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
        displayStepper: true,
    },
    visibleCount: {
        type: ControlType.Number,
        title: "Visible Words",
        defaultValue: 5,
        min: 3,
        max: 9,
        step: 2,
        displayStepper: true,
    },
    edgeFade: {
        type: ControlType.Number,
        title: "Edge Fade",
        defaultValue: 20,
        min: 0,
        max: 45,
        step: 5,
        unit: "%",
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 2500,
        min: 500,
        max: 10000,
        step: 100,
        unit: "ms",
        displayStepper: true,
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 60,
        min: 10,
        max: 300,
        step: 10,
        displayStepper: true,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 18,
        min: 5,
        max: 50,
        step: 1,
        displayStepper: true,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["up", "down"],
        optionTitles: ["Up", "Down"],
        defaultValue: "up",
        displaySegmentedControl: true,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})