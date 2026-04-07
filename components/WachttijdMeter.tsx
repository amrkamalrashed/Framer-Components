
import { addPropertyControls, ControlType } from "framer"
import { useRef, useState, useEffect, useMemo } from "react"

interface Props {
    weeksFont?: Record<string, any>
    weeksColor?: string
    titleFont?: Record<string, any>
    titleColor?: string
    descFont?: Record<string, any>
    descColor?: string
    textGap?: number
    tickSpacing?: number
    accentEvery?: number
    barHeight?: number
    tickHeight?: number
    barWidth?: number
    tickWidth?: number
    barColor?: string
    accentColor?: string
    tickColor?: string
    verticalBreakpoint?: number
    weeks1?: string
    title1?: string
    desc1?: string
    weeks2?: string
    title2?: string
    desc2?: string
    weeks3?: string
    title3?: string
    desc3?: string
    style?: React.CSSProperties
}

const fallbackFont = {
    fontFamily: "Inter, system-ui, sans-serif",
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function WachttijdMeter({
    weeksFont,
    weeksColor = "rgba(56,56,56,0.55)",
    titleFont,
    titleColor = "#383838",
    descFont,
    descColor = "rgba(56,56,56,0.35)",
    textGap = 4,
    tickSpacing = 5,
    accentEvery = 5,
    barHeight = 80,
    tickHeight = 16,
    barWidth = 2,
    tickWidth = 1,
    barColor = "#383838",
    accentColor = "#222222",
    tickColor = "#D4D4D4",
    verticalBreakpoint = 500,
    weeks1 = "2 weken",
    title1 = "Aanmeldwachttijd",
    desc1 = "Van aanmelding tot intake",
    weeks2 = "2 weken",
    title2 = "Behandelwachttijd",
    desc2 = "Van intake tot behandeling",
    weeks3 = "4-6 weken",
    title3 = "Totale wachttijd",
    desc3 = "Gehele traject",
    style,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(0)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width)
            }
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const isVertical =
        containerWidth > 0 && containerWidth < verticalBreakpoint

    const milestones = [
        { weeks: weeks1, title: title1, description: desc1 },
        { weeks: weeks2, title: title2, description: desc2 },
        { weeks: weeks3, title: title3, description: desc3 },
    ]

    const numMilestones = milestones.length
    const numSegments = numMilestones - 1

    // Resolve font props
    const weeksStyle = {
        ...fallbackFont,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        lineHeight: 1.3,
        ...(weeksFont || {}),
    }
    const titleStyle = {
        ...fallbackFont,
        fontSize: 18,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        lineHeight: 1.3,
        ...(titleFont || {}),
    }
    const descStyle = {
        ...fallbackFont,
        fontSize: 13,
        fontWeight: 400,
        lineHeight: 1.4,
        ...(descFont || {}),
    }

    // --- HORIZONTAL CALCULATIONS ---
    const hTicksPerSegment = useMemo(() => {
        if (containerWidth === 0 || isVertical) return 0
        const perSegment =
            (containerWidth - numMilestones * barWidth) / numSegments
        const count = Math.floor(perSegment / (tickWidth + tickSpacing))
        return Math.max(2, count)
    }, [containerWidth, isVertical, numMilestones, numSegments, barWidth, tickWidth, tickSpacing])

    const hComputedGap = useMemo(() => {
        if (hTicksPerSegment === 0 || containerWidth === 0) return 0
        const totalItems =
            numMilestones + numSegments * hTicksPerSegment
        const totalItemWidth =
            numMilestones * barWidth +
            numSegments * hTicksPerSegment * tickWidth
        return (containerWidth - totalItemWidth) / (totalItems - 1)
    }, [containerWidth, hTicksPerSegment, numMilestones, numSegments, barWidth, tickWidth])

    // --- VERTICAL CALCULATIONS ---
    const vTicksPerSegment = useMemo(() => {
        if (!isVertical) return 0
        return Math.max(
            2,
            Math.floor(80 / (tickWidth + tickSpacing))
        )
    }, [isVertical, tickWidth, tickSpacing])

    const vComputedGap = useMemo(() => {
        if (vTicksPerSegment === 0) return 0
        const totalItemHeight = vTicksPerSegment * tickWidth
        return (80 - totalItemHeight) / Math.max(1, vTicksPerSegment - 1)
    }, [vTicksPerSegment])

    // --- SHARED HELPERS ---
    const getTickColor = (posInSegment: number) => {
        if (accentEvery > 0 && (posInSegment + 1) % accentEvery === 0)
            return accentColor
        return tickColor
    }

    const hMilestoneIndices = useMemo(
        () =>
            new Set(
                milestones.map((_, i) => i * (hTicksPerSegment + 1))
            ),
        [hTicksPerSegment]
    )

    const hTotalLines =
        numMilestones + numSegments * hTicksPerSegment

    const getHTickColor = (index: number) => {
        if (hMilestoneIndices.has(index)) return barColor
        const arr = Array.from(hMilestoneIndices).sort(
            (a, b) => a - b
        )
        let pos = index
        for (const mi of arr) {
            if (index > mi) pos = index - mi - 1
        }
        return getTickColor(pos)
    }

    // Text block inner content
    const renderTextContent = (m: (typeof milestones)[0]) => (
        <>
            <div style={{ ...weeksStyle, color: weeksColor }}>
                {m.weeks}
            </div>
            <div style={{ ...titleStyle, color: titleColor }}>
                {m.title}
            </div>
            <div style={{ ...descStyle, color: descColor }}>
                {m.description}
            </div>
        </>
    )

    // ===================== VERTICAL LAYOUT =====================
    if (isVertical) {
        return (
            <div
                ref={containerRef}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    ...style,
                }}
            >
                {milestones.map((m, i) => (
                    <div key={i}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                            }}
                        >
                            <div
                                style={{
                                    width: barHeight * 0.5,
                                    height: barWidth,
                                    backgroundColor: barColor,
                                    flexShrink: 0,
                                }}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: textGap,
                                }}
                            >
                                {renderTextContent(m)}
                            </div>
                        </div>

                        {i < numSegments && (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    paddingLeft:
                                        (barHeight * 0.5) / 2 -
                                        tickHeight / 2,
                                    gap: vComputedGap,
                                    paddingTop: 8,
                                    paddingBottom: 8,
                                }}
                            >
                                {Array.from({
                                    length: vTicksPerSegment,
                                }).map((_, j) => (
                                    <div
                                        key={j}
                                        style={{
                                            width: tickHeight,
                                            height: tickWidth,
                                            backgroundColor:
                                                getTickColor(j),
                                            flexShrink: 0,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )
    }

    // ===================== HORIZONTAL LAYOUT =====================
    return (
        <div
            ref={containerRef}
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                width: "100%",
                ...style,
            }}
        >
            {containerWidth > 0 && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        height: barHeight,
                        gap: hComputedGap,
                    }}
                >
                    {Array.from({ length: hTotalLines }).map(
                        (_, i) => {
                            const isMilestone =
                                hMilestoneIndices.has(i)
                            return (
                                <div
                                    key={i}
                                    style={{
                                        width: isMilestone
                                            ? barWidth
                                            : tickWidth,
                                        height: isMilestone
                                            ? barHeight
                                            : tickHeight,
                                        backgroundColor:
                                            getHTickColor(i),
                                        flexShrink: 0,
                                    }}
                                />
                            )
                        }
                    )}
                </div>
            )}

            {containerWidth > 0 && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                    }}
                >
                    {/* Left — align left */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: textGap,
                            textAlign: "left",
                            flex: "1 1 0",
                            minWidth: 0,
                        }}
                    >
                        {renderTextContent(milestones[0])}
                    </div>

                    {/* Center — align center */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: textGap,
                            textAlign: "center",
                            flex: "1 1 0",
                            minWidth: 0,
                            alignItems: "center",
                        }}
                    >
                        {renderTextContent(milestones[1])}
                    </div>

                    {/* Right — align right */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: textGap,
                            textAlign: "right",
                            flex: "1 1 0",
                            minWidth: 0,
                            alignItems: "flex-end",
                        }}
                    >
                        {renderTextContent(milestones[2])}
                    </div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(WachttijdMeter, {
    weeksFont: {
        // @ts-ignore — Framer extended font control
        type: "font",
        title: "Weeks Font",
        controls: "extended",
    },
    weeksColor: {
        type: ControlType.Color,
        title: "Weeks Color",
        defaultValue: "rgba(56,56,56,0.55)",
    },
    titleFont: {
        // @ts-ignore — Framer extended font control
        type: "font",
        title: "Title Font",
        controls: "extended",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#383838",
    },
    descFont: {
        // @ts-ignore — Framer extended font control
        type: "font",
        title: "Desc Font",
        controls: "extended",
    },
    descColor: {
        type: ControlType.Color,
        title: "Desc Color",
        defaultValue: "rgba(56,56,56,0.35)",
    },
    textGap: {
        type: ControlType.Number,
        title: "Text Gap",
        defaultValue: 4,
        min: 0,
        max: 16,
        step: 1,
    },
    tickSpacing: {
        type: ControlType.Number,
        title: "Tick Spacing",
        defaultValue: 5,
        min: 2,
        max: 20,
        step: 1,
    },
    accentEvery: {
        type: ControlType.Number,
        title: "Accent Every",
        defaultValue: 5,
        min: 2,
        max: 20,
        step: 1,
    },
    barHeight: {
        type: ControlType.Number,
        title: "Bar Height",
        defaultValue: 80,
        min: 40,
        max: 120,
    },
    tickHeight: {
        type: ControlType.Number,
        title: "Tick Height",
        defaultValue: 16,
        min: 4,
        max: 40,
    },
    barWidth: {
        type: ControlType.Number,
        title: "Bar Width",
        defaultValue: 2,
        min: 1,
        max: 6,
    },
    tickWidth: {
        type: ControlType.Number,
        title: "Tick Width",
        defaultValue: 1,
        min: 1,
        max: 4,
    },
    barColor: {
        type: ControlType.Color,
        title: "Bar Color",
        defaultValue: "#383838",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#222222",
    },
    tickColor: {
        type: ControlType.Color,
        title: "Tick Color",
        defaultValue: "#D4D4D4",
    },
    verticalBreakpoint: {
        type: ControlType.Number,
        title: "Vertical Below",
        defaultValue: 500,
        min: 300,
        max: 800,
        step: 10,
    },
    weeks1: {
        type: ControlType.String,
        title: "Weeks 1",
        defaultValue: "2 weken",
    },
    title1: {
        type: ControlType.String,
        title: "Title 1",
        defaultValue: "Aanmeldwachttijd",
    },
    desc1: {
        type: ControlType.String,
        title: "Desc 1",
        defaultValue: "Van aanmelding tot intake",
    },
    weeks2: {
        type: ControlType.String,
        title: "Weeks 2",
        defaultValue: "2 weken",
    },
    title2: {
        type: ControlType.String,
        title: "Title 2",
        defaultValue: "Behandelwachttijd",
    },
    desc2: {
        type: ControlType.String,
        title: "Desc 2",
        defaultValue: "Van intake tot behandeling",
    },
    weeks3: {
        type: ControlType.String,
        title: "Weeks 3",
        defaultValue: "4-6 weken",
    },
    title3: {
        type: ControlType.String,
        title: "Title 3",
        defaultValue: "Totale wachttijd",
    },
    desc3: {
        type: ControlType.String,
        title: "Desc 3",
        defaultValue: "Gehele traject",
    },
})
