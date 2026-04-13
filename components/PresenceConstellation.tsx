// PresenceConstellation.tsx
// MENA presence visualized as a constellation of city nodes
// connected to a central HQ. No country polygons — pure network.
// Version: 1.0.0

import React from "react"
import { addPropertyControls, ControlType, RenderTarget, useLocaleInfo } from "framer"
import { motion } from "framer-motion"

// ---------- Projection ----------

const VP_LON_MIN = 28
const VP_LON_MAX = 60
const VP_LAT_MIN = 14
const VP_LAT_MAX = 36
const W = 1000
const H = Math.round(W * ((VP_LAT_MAX - VP_LAT_MIN) / (VP_LON_MAX - VP_LON_MIN)))

const toX = (lon: number) => ((lon - VP_LON_MIN) / (VP_LON_MAX - VP_LON_MIN)) * W
const toY = (lat: number) => ((VP_LAT_MAX - lat) / (VP_LAT_MAX - VP_LAT_MIN)) * H

// ---------- Cities ----------

interface City {
    nameAr: string
    nameEn: string
    lon: number
    lat: number
    isHQ?: boolean
}

const CITIES: City[] = [
    { nameAr: "جدة", nameEn: "Jeddah", lon: 39.17, lat: 21.54, isHQ: true },
    { nameAr: "الرياض", nameEn: "Riyadh", lon: 46.68, lat: 24.71 },
    { nameAr: "الدمام", nameEn: "Dammam", lon: 50.10, lat: 26.43 },
    { nameAr: "القاهرة", nameEn: "Cairo", lon: 31.24, lat: 30.04 },
    { nameAr: "دبي", nameEn: "Dubai", lon: 55.27, lat: 25.20 },
    { nameAr: "أبوظبي", nameEn: "Abu Dhabi", lon: 54.37, lat: 24.45 },
    { nameAr: "الكويت", nameEn: "Kuwait", lon: 47.98, lat: 29.37 },
    { nameAr: "الدوحة", nameEn: "Doha", lon: 51.53, lat: 25.29 },
    { nameAr: "المنامة", nameEn: "Manama", lon: 50.58, lat: 26.23 },
    { nameAr: "مسقط", nameEn: "Muscat", lon: 58.39, lat: 23.59 },
    { nameAr: "عمّان", nameEn: "Amman", lon: 35.93, lat: 31.95 },
]

// ---------- Component ----------

interface Props {
    accentColor: string
    nodeColor: string
    labelColor: string
    hqColor: string
    showArcs: boolean
    showLabels: boolean
    animations: boolean
    pulseSpeed: number
    nodeSize: number
    hqNodeSize: number
    labelSize: number
    arcDash: string
    arcOpacity: number
    entranceStagger: number
    ariaLabel: string
    style: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 618
 */
export default function PresenceConstellation(props: Props) {
    const {
        accentColor = "#D73B55",
        nodeColor = "#FF6B8A",
        labelColor = "rgba(255,255,255,0.72)",
        hqColor = "#FFFFFF",
        showArcs = true,
        showLabels = true,
        animations = true,
        pulseSpeed = 3,
        nodeSize = 5,
        hqNodeSize = 9,
        labelSize = 13,
        arcDash = "2 6",
        arcOpacity = 0.35,
        entranceStagger = 0.08,
        ariaLabel = "Regional presence constellation",
        style,
    } = props

    const uid = React.useId().replace(/:/g, "")
    const isCanvas = RenderTarget.current() === "canvas"
    const isStatic = !animations || isCanvas

    const locale = useLocaleInfo() as any
    const code: string = locale?.activeLocale?.code || locale?.code || ""
    const isEn = code.toLowerCase().startsWith("en")
    const fontFamily = isEn ? "Cairo, sans-serif" : "IBM Plex Sans Arabic, sans-serif"
    const dir: "ltr" | "rtl" = isEn ? "ltr" : "rtl"

    const hq = CITIES.find((c) => c.isHQ) as City
    const hqX = toX(hq.lon)
    const hqY = toY(hq.lat)

    return (
        <div
            role="img"
            aria-label={ariaLabel}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...style,
            }}
        >
            <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ width: "100%", height: "100%", overflow: "visible" }}
            >
                <defs>
                    <radialGradient id={`pc-node-${uid}`} cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0%" stopColor={nodeColor} stopOpacity="1" />
                        <stop offset="60%" stopColor={nodeColor} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={nodeColor} stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id={`pc-hq-${uid}`} cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0%" stopColor={hqColor} stopOpacity="1" />
                        <stop offset="50%" stopColor={accentColor} stopOpacity="0.7" />
                        <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
                    </radialGradient>
                    <filter id={`pc-glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" />
                    </filter>
                </defs>

                {/* Arcs HQ → each city */}
                {showArcs && CITIES.filter((c) => !c.isHQ).map((city, i) => {
                    const x = toX(city.lon)
                    const y = toY(city.lat)
                    // Gentle curve: control point offset perpendicular to the line
                    const mx = (hqX + x) / 2
                    const my = (hqY + y) / 2
                    const dx = x - hqX
                    const dy = y - hqY
                    const len = Math.hypot(dx, dy)
                    const nx = -dy / len
                    const ny = dx / len
                    const curveAmt = len * 0.18
                    const cpx = mx + nx * curveAmt
                    const cpy = my + ny * curveAmt
                    const d = `M${hqX},${hqY} Q${cpx},${cpy} ${x},${y}`

                    return (
                        <motion.path
                            key={`arc-${i}`}
                            d={d}
                            fill="none"
                            stroke={accentColor}
                            strokeWidth="1.2"
                            strokeDasharray={arcDash}
                            strokeOpacity={arcOpacity}
                            initial={isStatic ? false : { pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: arcOpacity }}
                            transition={{
                                delay: 0.4 + i * entranceStagger,
                                duration: 0.9,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        />
                    )
                })}

                {/* City nodes */}
                {CITIES.map((city, i) => {
                    const x = toX(city.lon)
                    const y = toY(city.lat)
                    const isHQ = !!city.isHQ
                    const r = isHQ ? hqNodeSize : nodeSize
                    const label = isEn ? city.nameEn : city.nameAr
                    const delay = i * entranceStagger

                    return (
                        <motion.g
                            key={`city-${i}`}
                            initial={isStatic ? false : { opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            style={{ transformOrigin: `${x}px ${y}px` }}
                        >
                            {/* Outer halo */}
                            <circle
                                cx={x}
                                cy={y}
                                r={r * 3.5}
                                fill={`url(#${isHQ ? `pc-hq-${uid}` : `pc-node-${uid}`})`}
                                opacity={isHQ ? 0.9 : 0.55}
                                filter={`url(#pc-glow-${uid})`}
                            />
                            {/* Pulse ring (only when animated) */}
                            {!isStatic && (
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={r}
                                    fill="none"
                                    stroke={isHQ ? accentColor : nodeColor}
                                    strokeWidth="1.5"
                                >
                                    <animate
                                        attributeName="r"
                                        values={`${r};${r * 4};${r}`}
                                        dur={`${pulseSpeed}s`}
                                        begin={`${i * 0.25}s`}
                                        repeatCount="indefinite"
                                    />
                                    <animate
                                        attributeName="opacity"
                                        values="0.8;0;0.8"
                                        dur={`${pulseSpeed}s`}
                                        begin={`${i * 0.25}s`}
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            )}
                            {/* Solid core */}
                            <circle cx={x} cy={y} r={r} fill={isHQ ? accentColor : nodeColor} />
                            <circle cx={x} cy={y} r={r * 0.4} fill="white" opacity="0.95" />

                            {/* Label */}
                            {showLabels && (
                                <text
                                    x={x}
                                    y={y + r + labelSize + 4}
                                    textAnchor="middle"
                                    dominantBaseline="hanging"
                                    fill={isHQ ? hqColor : labelColor}
                                    fontSize={isHQ ? labelSize + 2 : labelSize}
                                    fontWeight={isHQ ? 600 : 500}
                                    fontFamily={fontFamily}
                                    direction={dir}
                                    style={{ letterSpacing: isEn ? "0.3px" : "0", pointerEvents: "none" }}
                                >
                                    {label}
                                </text>
                            )}
                        </motion.g>
                    )
                })}
            </svg>
        </div>
    )
}

PresenceConstellation.displayName = "Presence Constellation"

// ---------- Property Controls ----------

addPropertyControls(PresenceConstellation, {
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#D73B55" },
    nodeColor: { type: ControlType.Color, title: "Node", defaultValue: "#FF6B8A" },
    hqColor: { type: ControlType.Color, title: "HQ", defaultValue: "#FFFFFF" },
    labelColor: { type: ControlType.Color, title: "Label", defaultValue: "rgba(255,255,255,0.72)" },

    showArcs: { type: ControlType.Boolean, title: "Arcs", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    showLabels: { type: ControlType.Boolean, title: "Labels", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    animations: { type: ControlType.Boolean, title: "Animations", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },

    pulseSpeed: { type: ControlType.Number, title: "Pulse", min: 1, max: 8, step: 0.5, defaultValue: 3, unit: "s", hidden: (p: any) => !p.animations },
    entranceStagger: { type: ControlType.Number, title: "Stagger", min: 0, max: 0.3, step: 0.01, defaultValue: 0.08, unit: "s", hidden: (p: any) => !p.animations },

    nodeSize: { type: ControlType.Number, title: "Node Size", min: 2, max: 12, step: 0.5, defaultValue: 5 },
    hqNodeSize: { type: ControlType.Number, title: "HQ Size", min: 4, max: 18, step: 0.5, defaultValue: 9 },
    labelSize: { type: ControlType.Number, title: "Label Size", min: 8, max: 28, step: 1, defaultValue: 13 },

    arcDash: { type: ControlType.String, title: "Arc Dash", defaultValue: "2 6", hidden: (p: any) => !p.showArcs },
    arcOpacity: { type: ControlType.Number, title: "Arc Opacity", min: 0, max: 1, step: 0.05, defaultValue: 0.35, hidden: (p: any) => !p.showArcs },

    ariaLabel: { type: ControlType.String, title: "ARIA Label", defaultValue: "Regional presence constellation" },
})
