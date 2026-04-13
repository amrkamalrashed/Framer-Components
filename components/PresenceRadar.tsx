// PresenceRadar.tsx
// Circular radar scope with Jeddah at center and MENA cities
// positioned by true bearing + distance. A rotating sweep line
// flashes each city as it passes over it.
// Version: 1.0.0

import React from "react"
import { addPropertyControls, ControlType, RenderTarget, useLocaleInfo } from "framer"
import { motion } from "framer-motion"

// ---------- Cities (lon, lat) ----------

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

// ---------- Great-circle helpers ----------

const R_KM = 6371
const toRad = (d: number) => (d * Math.PI) / 180

function greatCircleKm(a: City, b: City): number {
    const φ1 = toRad(a.lat)
    const φ2 = toRad(b.lat)
    const dφ = toRad(b.lat - a.lat)
    const dλ = toRad(b.lon - a.lon)
    const h = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2
    return 2 * R_KM * Math.asin(Math.sqrt(h))
}

function bearingDeg(a: City, b: City): number {
    const φ1 = toRad(a.lat)
    const φ2 = toRad(b.lat)
    const dλ = toRad(b.lon - a.lon)
    const y = Math.sin(dλ) * Math.cos(φ2)
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ)
    const θ = Math.atan2(y, x)
    return (θ * 180) / Math.PI // 0° = North, clockwise
}

// ---------- Component ----------

interface Props {
    accentColor: string
    gridColor: string
    sweepColor: string
    nodeColor: string
    hqColor: string
    labelColor: string
    animations: boolean
    sweepSpeed: number
    ringCount: number
    showLabels: boolean
    showCardinals: boolean
    nodeSize: number
    hqNodeSize: number
    labelSize: number
    ariaLabel: string
    style: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 */
export default function PresenceRadar(props: Props) {
    const {
        accentColor = "#D73B55",
        gridColor = "rgba(255,255,255,0.12)",
        sweepColor = "#D73B55",
        nodeColor = "#FF6B8A",
        hqColor = "#FFFFFF",
        labelColor = "rgba(255,255,255,0.72)",
        animations = true,
        sweepSpeed = 6,
        ringCount = 4,
        showLabels = true,
        showCardinals = false,
        nodeSize = 5,
        hqNodeSize = 8,
        labelSize = 12,
        ariaLabel = "Regional presence radar",
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

    // ---- Geometry ----
    const VB = 1000
    const CX = VB / 2
    const CY = VB / 2
    const MAX_R = VB * 0.46

    const hq = CITIES.find((c) => c.isHQ) as City
    const others = CITIES.filter((c) => !c.isHQ)

    // Scale distances: use sqrt to compress outliers, normalize to [0, MAX_R]
    const distances = others.map((c) => greatCircleKm(hq, c))
    const maxDist = Math.max(...distances)
    const scale = (km: number) => (Math.sqrt(km / maxDist)) * MAX_R

    // ---- Sweep bearing (each city fires when sweep crosses its bearing) ----
    const [sweep, setSweep] = React.useState(0)
    React.useEffect(() => {
        if (isStatic) return
        let raf = 0
        const t0 = performance.now()
        const tick = (t: number) => {
            const elapsed = (t - t0) / 1000
            const deg = (elapsed / sweepSpeed) * 360
            setSweep(deg % 360)
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [isStatic, sweepSpeed])

    // City polar positions
    const plotted = others.map((c) => {
        const km = greatCircleKm(hq, c)
        const r = scale(km)
        const brg = bearingDeg(hq, c) // 0 = N, 90 = E
        // SVG: 0° at +X axis (east). Convert bearing to SVG angle: svgAngle = brg - 90 (rotates so 0°=up)
        const svgAngle = toRad(brg - 90)
        const x = CX + r * Math.cos(svgAngle)
        const y = CY + r * Math.sin(svgAngle)
        return { ...c, r, brg, x, y }
    })

    // Detect "fire" when sweep passes within a narrow window of each city's bearing
    const fireWindow = 12 // degrees of lag visible
    const litness = (brg: number) => {
        if (isStatic) return 1
        let d = ((sweep - brg) % 360 + 360) % 360
        if (d > 180) d -= 360
        // d is signed distance; we want fresh hits only when sweep just passed city (small positive d)
        if (d >= 0 && d < fireWindow) {
            return 1 - d / fireWindow
        }
        return 0.25 // idle brightness
    }

    return (
        <div
            role="img"
            aria-label={ariaLabel}
            dir={dir}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...style,
            }}
        >
            <svg
                viewBox={`0 0 ${VB} ${VB}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ width: "100%", height: "100%", overflow: "visible" }}
            >
                <defs>
                    <radialGradient id={`pr-sweep-${uid}`} cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0%" stopColor={sweepColor} stopOpacity="0.4" />
                        <stop offset="70%" stopColor={sweepColor} stopOpacity="0.05" />
                        <stop offset="100%" stopColor={sweepColor} stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id={`pr-sweepline-${uid}`} x1="0.5" y1="0.5" x2="1" y2="0.5">
                        <stop offset="0%" stopColor={sweepColor} stopOpacity="0" />
                        <stop offset="70%" stopColor={sweepColor} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={sweepColor} stopOpacity="1" />
                    </linearGradient>
                    <filter id={`pr-glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" />
                    </filter>
                </defs>

                {/* Distance rings */}
                <g>
                    {Array.from({ length: ringCount }).map((_, i) => {
                        const r = ((i + 1) / ringCount) * MAX_R
                        return (
                            <circle
                                key={`ring-${i}`}
                                cx={CX}
                                cy={CY}
                                r={r}
                                fill="none"
                                stroke={gridColor}
                                strokeWidth="1"
                                strokeDasharray="3 4"
                            />
                        )
                    })}
                </g>

                {/* Cardinal cross */}
                {showCardinals && (
                    <g stroke={gridColor} strokeWidth="1">
                        <line x1={CX - MAX_R} y1={CY} x2={CX + MAX_R} y2={CY} />
                        <line x1={CX} y1={CY - MAX_R} x2={CX} y2={CY + MAX_R} />
                    </g>
                )}

                {/* Rotating sweep trail (conic-ish via a rotating wedge mask) */}
                {!isStatic && (
                    <g
                        style={{
                            transformOrigin: `${CX}px ${CY}px`,
                            transform: `rotate(${sweep}deg)`,
                        }}
                    >
                        <path
                            d={`M${CX},${CY} L${CX + MAX_R},${CY} A${MAX_R},${MAX_R} 0 0 0 ${
                                CX + MAX_R * Math.cos(toRad(-60))
                            },${CY + MAX_R * Math.sin(toRad(-60))} Z`}
                            fill={`url(#pr-sweep-${uid})`}
                            opacity="0.9"
                        />
                        <line
                            x1={CX}
                            y1={CY}
                            x2={CX + MAX_R}
                            y2={CY}
                            stroke={sweepColor}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            opacity="0.85"
                        />
                    </g>
                )}

                {/* City nodes */}
                {plotted.map((city, i) => {
                    const lit = litness(city.brg)
                    const baseOp = 0.35
                    const op = Math.max(baseOp, lit)
                    const label = isEn ? city.nameEn : city.nameAr
                    return (
                        <motion.g
                            key={`city-${i}`}
                            initial={isStatic ? false : { opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + i * 0.04, duration: 0.4 }}
                        >
                            {/* Halo (scales with lit) */}
                            <circle
                                cx={city.x}
                                cy={city.y}
                                r={nodeSize * (1.8 + lit * 3)}
                                fill={nodeColor}
                                opacity={0.25 * op}
                                filter={`url(#pr-glow-${uid})`}
                            />
                            <circle cx={city.x} cy={city.y} r={nodeSize} fill={nodeColor} opacity={op} />
                            <circle cx={city.x} cy={city.y} r={nodeSize * 0.4} fill="white" opacity={Math.min(1, 0.7 + lit)} />
                            {showLabels && (
                                <text
                                    x={city.x}
                                    y={city.y + nodeSize + labelSize + 3}
                                    textAnchor="middle"
                                    dominantBaseline="hanging"
                                    fill={labelColor}
                                    fontSize={labelSize}
                                    fontWeight="500"
                                    fontFamily={fontFamily}
                                    opacity={Math.max(0.5, op)}
                                    direction={dir}
                                    style={{ letterSpacing: isEn ? "0.2px" : "0", pointerEvents: "none" }}
                                >
                                    {label}
                                </text>
                            )}
                        </motion.g>
                    )
                })}

                {/* HQ node (center) */}
                <g>
                    {!isStatic && (
                        <circle cx={CX} cy={CY} r={hqNodeSize} fill="none" stroke={accentColor} strokeWidth="1.5">
                            <animate
                                attributeName="r"
                                values={`${hqNodeSize};${hqNodeSize * 5};${hqNodeSize}`}
                                dur={`${sweepSpeed / 2}s`}
                                repeatCount="indefinite"
                            />
                            <animate
                                attributeName="opacity"
                                values="0.9;0;0.9"
                                dur={`${sweepSpeed / 2}s`}
                                repeatCount="indefinite"
                            />
                        </circle>
                    )}
                    <circle
                        cx={CX}
                        cy={CY}
                        r={hqNodeSize * 2.5}
                        fill={accentColor}
                        opacity="0.25"
                        filter={`url(#pr-glow-${uid})`}
                    />
                    <circle cx={CX} cy={CY} r={hqNodeSize} fill={accentColor} />
                    <circle cx={CX} cy={CY} r={hqNodeSize * 0.45} fill={hqColor} />
                    {showLabels && (
                        <text
                            x={CX}
                            y={CY + hqNodeSize + labelSize + 6}
                            textAnchor="middle"
                            dominantBaseline="hanging"
                            fill={hqColor}
                            fontSize={labelSize + 2}
                            fontWeight="700"
                            fontFamily={fontFamily}
                            direction={dir}
                            style={{ letterSpacing: isEn ? "0.3px" : "0", pointerEvents: "none" }}
                        >
                            {isEn ? hq.nameEn : hq.nameAr}
                        </text>
                    )}
                </g>
            </svg>
        </div>
    )
}

PresenceRadar.displayName = "Presence Radar"

// ---------- Property Controls ----------

addPropertyControls(PresenceRadar, {
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#D73B55" },
    sweepColor: { type: ControlType.Color, title: "Sweep", defaultValue: "#D73B55" },
    nodeColor: { type: ControlType.Color, title: "Node", defaultValue: "#FF6B8A" },
    hqColor: { type: ControlType.Color, title: "HQ", defaultValue: "#FFFFFF" },
    gridColor: { type: ControlType.Color, title: "Grid", defaultValue: "rgba(255,255,255,0.12)" },
    labelColor: { type: ControlType.Color, title: "Label", defaultValue: "rgba(255,255,255,0.72)" },

    animations: { type: ControlType.Boolean, title: "Animations", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    sweepSpeed: { type: ControlType.Number, title: "Sweep Speed", min: 2, max: 20, step: 0.5, defaultValue: 6, unit: "s", hidden: (p: any) => !p.animations },

    showLabels: { type: ControlType.Boolean, title: "Labels", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    showCardinals: { type: ControlType.Boolean, title: "Cardinals", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
    ringCount: { type: ControlType.Number, title: "Rings", min: 1, max: 8, step: 1, defaultValue: 4 },

    nodeSize: { type: ControlType.Number, title: "Node Size", min: 2, max: 12, step: 0.5, defaultValue: 5 },
    hqNodeSize: { type: ControlType.Number, title: "HQ Size", min: 4, max: 16, step: 0.5, defaultValue: 8 },
    labelSize: { type: ControlType.Number, title: "Label Size", min: 8, max: 24, step: 1, defaultValue: 12 },

    ariaLabel: { type: ControlType.String, title: "ARIA Label", defaultValue: "Regional presence radar" },
})
