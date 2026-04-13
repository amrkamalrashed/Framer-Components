// PresenceConstellation.tsx
// MENA presence as a constellation of COUNTRY nodes connected to the
// HQ. Countries are primary; cities are an optional secondary layer.
// Version: 2.0.0

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

// ---------- Data ----------

interface SubCity {
    nameAr: string
    nameEn: string
    lon: number
    lat: number
}

interface Country {
    code: string
    nameAr: string
    nameEn: string
    lon: number       // label/node centroid (approx.)
    lat: number
    isHQ?: boolean
    hqCityAr?: string // shown as subtitle under the HQ country
    hqCityEn?: string
    cities?: SubCity[]
}

// Ordered: HQ first, then primary markets, then gulf, then levant.
const COUNTRIES: Country[] = [
    {
        code: "sa", nameAr: "السعودية", nameEn: "Saudi Arabia",
        lon: 39.17, lat: 21.54, // HQ positioned at Jeddah, not geographic centroid
        isHQ: true, hqCityAr: "جدة", hqCityEn: "Jeddah",
        cities: [
            { nameAr: "الرياض", nameEn: "Riyadh", lon: 46.68, lat: 24.71 },
            { nameAr: "الدمام", nameEn: "Dammam", lon: 50.10, lat: 26.43 },
        ],
    },
    {
        code: "eg", nameAr: "مصر", nameEn: "Egypt",
        lon: 30.80, lat: 26.82,
        cities: [{ nameAr: "القاهرة", nameEn: "Cairo", lon: 31.24, lat: 30.04 }],
    },
    {
        code: "ae", nameAr: "الإمارات", nameEn: "UAE",
        lon: 53.85, lat: 23.42,
        cities: [
            { nameAr: "دبي", nameEn: "Dubai", lon: 55.27, lat: 25.20 },
            { nameAr: "أبوظبي", nameEn: "Abu Dhabi", lon: 54.37, lat: 24.45 },
        ],
    },
    {
        code: "kw", nameAr: "الكويت", nameEn: "Kuwait",
        lon: 47.48, lat: 29.31,
    },
    {
        code: "qa", nameAr: "قطر", nameEn: "Qatar",
        lon: 51.18, lat: 25.35,
    },
    {
        code: "bh", nameAr: "البحرين", nameEn: "Bahrain",
        lon: 50.64, lat: 26.07,
    },
    {
        code: "om", nameAr: "عُمان", nameEn: "Oman",
        lon: 56.92, lat: 21.47,
    },
    {
        code: "jo", nameAr: "الأردن", nameEn: "Jordan",
        lon: 36.24, lat: 31.00,
    },
]

// ---------- Component ----------

interface Props {
    accentColor: string
    nodeColor: string
    labelColor: string
    hqColor: string
    showArcs: boolean
    showLabels: boolean
    showCities: boolean
    showHQSubtitle: boolean
    animations: boolean
    pulseSpeed: number
    nodeSize: number
    hqNodeSize: number
    citySize: number
    labelSize: number
    hqSubtitleSize: number
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
        labelColor = "rgba(255,255,255,0.78)",
        hqColor = "#FFFFFF",
        showArcs = true,
        showLabels = true,
        showCities = false,
        showHQSubtitle = true,
        animations = true,
        pulseSpeed = 3,
        nodeSize = 7,
        hqNodeSize = 11,
        citySize = 3,
        labelSize = 14,
        hqSubtitleSize = 11,
        arcDash = "2 6",
        arcOpacity = 0.35,
        entranceStagger = 0.1,
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

    const hq = COUNTRIES.find((c) => c.isHQ) as Country
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

                {/* ----- City sub-dots (optional, drawn first so they sit under country nodes) ----- */}
                {showCities && (
                    <g>
                        {COUNTRIES.flatMap((c) =>
                            (c.cities || []).map((city, ci) => {
                                const x = toX(city.lon)
                                const y = toY(city.lat)
                                return (
                                    <motion.circle
                                        key={`city-${c.code}-${ci}`}
                                        cx={x}
                                        cy={y}
                                        r={citySize}
                                        fill={nodeColor}
                                        opacity="0.55"
                                        initial={isStatic ? false : { opacity: 0, scale: 0 }}
                                        animate={{ opacity: 0.55, scale: 1 }}
                                        transition={{
                                            delay: 0.5 + ci * 0.05,
                                            duration: 0.4,
                                            ease: [0.16, 1, 0.3, 1],
                                        }}
                                        style={{ transformOrigin: `${x}px ${y}px` }}
                                    />
                                )
                            })
                        )}
                    </g>
                )}

                {/* ----- Arcs HQ → each other country ----- */}
                {showArcs && COUNTRIES.filter((c) => !c.isHQ).map((country, i) => {
                    const x = toX(country.lon)
                    const y = toY(country.lat)
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
                            key={`arc-${country.code}`}
                            d={d}
                            fill="none"
                            stroke={accentColor}
                            strokeWidth="1.4"
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

                {/* ----- Country nodes ----- */}
                {COUNTRIES.map((country, i) => {
                    const x = toX(country.lon)
                    const y = toY(country.lat)
                    const isHQ = !!country.isHQ
                    const r = isHQ ? hqNodeSize : nodeSize
                    const label = isEn ? country.nameEn : country.nameAr
                    const hqSub = isEn ? country.hqCityEn : country.hqCityAr
                    const delay = i * entranceStagger

                    return (
                        <motion.g
                            key={`country-${country.code}`}
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
                                opacity={isHQ ? 0.9 : 0.5}
                                filter={`url(#pc-glow-${uid})`}
                            />
                            {/* Idle pulse ring */}
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
                                        values={`${r};${r * 3.5};${r}`}
                                        dur={`${pulseSpeed}s`}
                                        begin={`${i * 0.3}s`}
                                        repeatCount="indefinite"
                                    />
                                    <animate
                                        attributeName="opacity"
                                        values="0.8;0;0.8"
                                        dur={`${pulseSpeed}s`}
                                        begin={`${i * 0.3}s`}
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            )}
                            {/* Solid node */}
                            <circle cx={x} cy={y} r={r} fill={isHQ ? accentColor : nodeColor} />
                            <circle cx={x} cy={y} r={r * 0.4} fill="white" opacity="0.95" />

                            {/* Country label */}
                            {showLabels && (
                                <text
                                    x={x}
                                    y={y + r + labelSize + 4}
                                    textAnchor="middle"
                                    dominantBaseline="hanging"
                                    fill={isHQ ? hqColor : labelColor}
                                    fontSize={isHQ ? labelSize + 2 : labelSize}
                                    fontWeight={isHQ ? 700 : 500}
                                    fontFamily={fontFamily}
                                    direction={dir}
                                    style={{ letterSpacing: isEn ? "0.3px" : "0", pointerEvents: "none" }}
                                >
                                    {label}
                                </text>
                            )}
                            {/* HQ city subtitle */}
                            {showLabels && isHQ && showHQSubtitle && hqSub && (
                                <text
                                    x={x}
                                    y={y + r + labelSize + 6 + (labelSize + 2) + 2}
                                    textAnchor="middle"
                                    dominantBaseline="hanging"
                                    fill={accentColor}
                                    fontSize={hqSubtitleSize}
                                    fontWeight="600"
                                    fontFamily={fontFamily}
                                    direction={dir}
                                    style={{ letterSpacing: "0.08em", textTransform: "uppercase", pointerEvents: "none" }}
                                >
                                    HQ · {hqSub}
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
    // Colors
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#D73B55" },
    nodeColor: { type: ControlType.Color, title: "Node", defaultValue: "#FF6B8A" },
    hqColor: { type: ControlType.Color, title: "HQ", defaultValue: "#FFFFFF" },
    labelColor: { type: ControlType.Color, title: "Label", defaultValue: "rgba(255,255,255,0.78)" },

    // Visibility
    showArcs: { type: ControlType.Boolean, title: "Arcs", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    showLabels: { type: ControlType.Boolean, title: "Labels", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    showHQSubtitle: { type: ControlType.Boolean, title: "HQ City Sub", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    showCities: { type: ControlType.Boolean, title: "Cities Layer", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },

    // Animation
    animations: { type: ControlType.Boolean, title: "Animations", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    pulseSpeed: { type: ControlType.Number, title: "Pulse", min: 1, max: 8, step: 0.5, defaultValue: 3, unit: "s", hidden: (p: any) => !p.animations },
    entranceStagger: { type: ControlType.Number, title: "Stagger", min: 0, max: 0.3, step: 0.01, defaultValue: 0.1, unit: "s", hidden: (p: any) => !p.animations },

    // Sizing
    nodeSize: { type: ControlType.Number, title: "Node Size", min: 3, max: 14, step: 0.5, defaultValue: 7 },
    hqNodeSize: { type: ControlType.Number, title: "HQ Size", min: 5, max: 20, step: 0.5, defaultValue: 11 },
    citySize: { type: ControlType.Number, title: "City Size", min: 1, max: 8, step: 0.5, defaultValue: 3, hidden: (p: any) => !p.showCities },
    labelSize: { type: ControlType.Number, title: "Label Size", min: 8, max: 28, step: 1, defaultValue: 14, hidden: (p: any) => !p.showLabels },
    hqSubtitleSize: { type: ControlType.Number, title: "HQ Sub Size", min: 8, max: 20, step: 1, defaultValue: 11, hidden: (p: any) => !p.showLabels || !p.showHQSubtitle },

    // Arc styling
    arcDash: { type: ControlType.String, title: "Arc Dash", defaultValue: "2 6", hidden: (p: any) => !p.showArcs },
    arcOpacity: { type: ControlType.Number, title: "Arc Opacity", min: 0, max: 1, step: 0.05, defaultValue: 0.35, hidden: (p: any) => !p.showArcs },

    ariaLabel: { type: ControlType.String, title: "ARIA Label", defaultValue: "Regional presence constellation" },
})
