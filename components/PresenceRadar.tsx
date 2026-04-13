// PresenceRadar.tsx
// Circular radar scope with the HQ country (KSA / Jeddah) at center
// and every other MENA country plotted by true great-circle bearing
// and distance. Countries are primary; cities are optional secondary.
// Version: 2.0.0

import React from "react"
import { addPropertyControls, ControlType, RenderTarget, useLocaleInfo } from "framer"
import { motion } from "framer-motion"

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
    lon: number
    lat: number
    isHQ?: boolean
    hqCityAr?: string
    hqCityEn?: string
    cities?: SubCity[]
}

const COUNTRIES: Country[] = [
    {
        code: "sa", nameAr: "السعودية", nameEn: "Saudi Arabia",
        lon: 39.17, lat: 21.54,
        isHQ: true, hqCityAr: "جدة", hqCityEn: "Jeddah",
        cities: [
            { nameAr: "الرياض", nameEn: "Riyadh", lon: 46.68, lat: 24.71 },
            { nameAr: "الدمام", nameEn: "Dammam", lon: 50.10, lat: 26.43 },
        ],
    },
    { code: "eg", nameAr: "مصر", nameEn: "Egypt", lon: 30.80, lat: 26.82,
      cities: [{ nameAr: "القاهرة", nameEn: "Cairo", lon: 31.24, lat: 30.04 }] },
    { code: "ae", nameAr: "الإمارات", nameEn: "UAE", lon: 53.85, lat: 23.42,
      cities: [
        { nameAr: "دبي", nameEn: "Dubai", lon: 55.27, lat: 25.20 },
        { nameAr: "أبوظبي", nameEn: "Abu Dhabi", lon: 54.37, lat: 24.45 },
      ] },
    { code: "kw", nameAr: "الكويت", nameEn: "Kuwait", lon: 47.48, lat: 29.31 },
    { code: "qa", nameAr: "قطر", nameEn: "Qatar", lon: 51.18, lat: 25.35 },
    { code: "bh", nameAr: "البحرين", nameEn: "Bahrain", lon: 50.64, lat: 26.07 },
    { code: "om", nameAr: "عُمان", nameEn: "Oman", lon: 56.92, lat: 21.47 },
    { code: "jo", nameAr: "الأردن", nameEn: "Jordan", lon: 36.24, lat: 31.00 },
]

// ---------- Great-circle helpers ----------

const R_KM = 6371
const toRad = (d: number) => (d * Math.PI) / 180

function greatCircleKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
    const φ1 = toRad(a.lat)
    const φ2 = toRad(b.lat)
    const dφ = toRad(b.lat - a.lat)
    const dλ = toRad(b.lon - a.lon)
    const h = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2
    return 2 * R_KM * Math.asin(Math.sqrt(h))
}

function bearingDeg(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
    const φ1 = toRad(a.lat)
    const φ2 = toRad(b.lat)
    const dλ = toRad(b.lon - a.lon)
    const y = Math.sin(dλ) * Math.cos(φ2)
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ)
    const θ = Math.atan2(y, x)
    return (θ * 180) / Math.PI
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
    showCities: boolean
    showHQSubtitle: boolean
    nodeSize: number
    hqNodeSize: number
    citySize: number
    labelSize: number
    hqSubtitleSize: number
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
        labelColor = "rgba(255,255,255,0.78)",
        animations = true,
        sweepSpeed = 6,
        ringCount = 4,
        showLabels = true,
        showCardinals = false,
        showCities = false,
        showHQSubtitle = true,
        nodeSize = 7,
        hqNodeSize = 10,
        citySize = 3,
        labelSize = 13,
        hqSubtitleSize = 10,
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

    const hq = COUNTRIES.find((c) => c.isHQ) as Country
    const others = COUNTRIES.filter((c) => !c.isHQ)

    const countryDistances = others.map((c) => greatCircleKm(hq, c))
    const allDistances = [...countryDistances]
    const cityList: Array<{ country: Country; city: SubCity; km: number; brg: number }> = []
    if (showCities) {
        for (const country of COUNTRIES) {
            for (const city of country.cities || []) {
                const km = greatCircleKm(hq, city)
                if (km < 1) continue // skip if HQ city
                const brg = bearingDeg(hq, city)
                cityList.push({ country, city, km, brg })
                allDistances.push(km)
            }
        }
    }
    const maxDist = Math.max(...allDistances, 1)
    const scale = (km: number) => Math.sqrt(km / maxDist) * MAX_R

    // ---- Sweep ----
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

    const plottedCountries = others.map((c) => {
        const km = greatCircleKm(hq, c)
        const r = scale(km)
        const brg = bearingDeg(hq, c)
        const svgAngle = toRad(brg - 90)
        const x = CX + r * Math.cos(svgAngle)
        const y = CY + r * Math.sin(svgAngle)
        return { ...c, km, r, brg, x, y }
    })

    const plottedCities = cityList.map(({ country, city, km, brg }) => {
        const r = scale(km)
        const svgAngle = toRad(brg - 90)
        const x = CX + r * Math.cos(svgAngle)
        const y = CY + r * Math.sin(svgAngle)
        return { country, city, km, brg, r, x, y }
    })

    const fireWindow = 12
    const litness = (brg: number) => {
        if (isStatic) return 1
        let d = ((sweep - brg) % 360 + 360) % 360
        if (d > 180) d -= 360
        if (d >= 0 && d < fireWindow) return 1 - d / fireWindow
        return 0.28
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
                    <filter id={`pr-glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" />
                    </filter>
                </defs>

                {/* Distance rings */}
                <g>
                    {Array.from({ length: ringCount }).map((_, i) => {
                        const r = ((i + 1) / ringCount) * MAX_R
                        return (
                            <circle key={`ring-${i}`} cx={CX} cy={CY} r={r}
                                fill="none" stroke={gridColor} strokeWidth="1" strokeDasharray="3 4" />
                        )
                    })}
                </g>

                {showCardinals && (
                    <g stroke={gridColor} strokeWidth="1">
                        <line x1={CX - MAX_R} y1={CY} x2={CX + MAX_R} y2={CY} />
                        <line x1={CX} y1={CY - MAX_R} x2={CX} y2={CY + MAX_R} />
                    </g>
                )}

                {/* Rotating sweep trail */}
                {!isStatic && (
                    <g style={{ transformOrigin: `${CX}px ${CY}px`, transform: `rotate(${sweep}deg)` }}>
                        <path
                            d={`M${CX},${CY} L${CX + MAX_R},${CY} A${MAX_R},${MAX_R} 0 0 0 ${
                                CX + MAX_R * Math.cos(toRad(-60))
                            },${CY + MAX_R * Math.sin(toRad(-60))} Z`}
                            fill={`url(#pr-sweep-${uid})`}
                            opacity="0.9"
                        />
                        <line x1={CX} y1={CY} x2={CX + MAX_R} y2={CY}
                            stroke={sweepColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
                    </g>
                )}

                {/* City secondary dots (optional) */}
                {showCities && plottedCities.map((p, i) => {
                    const lit = litness(p.brg)
                    const op = Math.max(0.3, lit)
                    return (
                        <g key={`sub-${p.country.code}-${i}`}>
                            <circle cx={p.x} cy={p.y} r={citySize} fill={nodeColor} opacity={op * 0.7} />
                        </g>
                    )
                })}

                {/* Country nodes */}
                {plottedCountries.map((country, i) => {
                    const lit = litness(country.brg)
                    const baseOp = 0.4
                    const op = Math.max(baseOp, lit)
                    const label = isEn ? country.nameEn : country.nameAr
                    return (
                        <motion.g
                            key={`country-${country.code}`}
                            initial={isStatic ? false : { opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
                        >
                            <circle cx={country.x} cy={country.y}
                                r={nodeSize * (1.8 + lit * 3)}
                                fill={nodeColor} opacity={0.3 * op}
                                filter={`url(#pr-glow-${uid})`} />
                            <circle cx={country.x} cy={country.y} r={nodeSize}
                                fill={nodeColor} opacity={op} />
                            <circle cx={country.x} cy={country.y} r={nodeSize * 0.4}
                                fill="white" opacity={Math.min(1, 0.7 + lit)} />
                            {showLabels && (
                                <text x={country.x}
                                    y={country.y + nodeSize + labelSize + 3}
                                    textAnchor="middle" dominantBaseline="hanging"
                                    fill={labelColor}
                                    fontSize={labelSize} fontWeight="600"
                                    fontFamily={fontFamily}
                                    opacity={Math.max(0.6, op)}
                                    direction={dir}
                                    style={{ letterSpacing: isEn ? "0.2px" : "0", pointerEvents: "none" }}>
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
                            <animate attributeName="r"
                                values={`${hqNodeSize};${hqNodeSize * 4.5};${hqNodeSize}`}
                                dur={`${sweepSpeed / 2}s`} repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.9;0;0.9"
                                dur={`${sweepSpeed / 2}s`} repeatCount="indefinite" />
                        </circle>
                    )}
                    <circle cx={CX} cy={CY} r={hqNodeSize * 2.5}
                        fill={accentColor} opacity="0.3"
                        filter={`url(#pr-glow-${uid})`} />
                    <circle cx={CX} cy={CY} r={hqNodeSize} fill={accentColor} />
                    <circle cx={CX} cy={CY} r={hqNodeSize * 0.45} fill={hqColor} />
                    {showLabels && (
                        <>
                            <text x={CX}
                                y={CY + hqNodeSize + labelSize + 6}
                                textAnchor="middle" dominantBaseline="hanging"
                                fill={hqColor} fontSize={labelSize + 2} fontWeight="700"
                                fontFamily={fontFamily}
                                direction={dir}
                                style={{ letterSpacing: isEn ? "0.3px" : "0", pointerEvents: "none" }}>
                                {isEn ? hq.nameEn : hq.nameAr}
                            </text>
                            {showHQSubtitle && (
                                <text x={CX}
                                    y={CY + hqNodeSize + labelSize + 6 + (labelSize + 2) + 4}
                                    textAnchor="middle" dominantBaseline="hanging"
                                    fill={accentColor} fontSize={hqSubtitleSize} fontWeight="600"
                                    fontFamily={fontFamily}
                                    direction={dir}
                                    style={{ letterSpacing: "0.1em", textTransform: "uppercase", pointerEvents: "none" }}>
                                    HQ · {isEn ? hq.hqCityEn : hq.hqCityAr}
                                </text>
                            )}
                        </>
                    )}
                </g>
            </svg>
        </div>
    )
}

PresenceRadar.displayName = "Presence Radar"

// ---------- Property Controls ----------

addPropertyControls(PresenceRadar, {
    // Colors
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#D73B55" },
    sweepColor: { type: ControlType.Color, title: "Sweep", defaultValue: "#D73B55" },
    nodeColor: { type: ControlType.Color, title: "Node", defaultValue: "#FF6B8A" },
    hqColor: { type: ControlType.Color, title: "HQ", defaultValue: "#FFFFFF" },
    gridColor: { type: ControlType.Color, title: "Grid", defaultValue: "rgba(255,255,255,0.12)" },
    labelColor: { type: ControlType.Color, title: "Label", defaultValue: "rgba(255,255,255,0.78)" },

    // Visibility
    showLabels: { type: ControlType.Boolean, title: "Labels", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    showHQSubtitle: { type: ControlType.Boolean, title: "HQ City Sub", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    showCities: { type: ControlType.Boolean, title: "Cities Layer", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
    showCardinals: { type: ControlType.Boolean, title: "Cardinals", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
    ringCount: { type: ControlType.Number, title: "Rings", min: 1, max: 8, step: 1, defaultValue: 4 },

    // Animation
    animations: { type: ControlType.Boolean, title: "Animations", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    sweepSpeed: { type: ControlType.Number, title: "Sweep Speed", min: 2, max: 20, step: 0.5, defaultValue: 6, unit: "s", hidden: (p: any) => !p.animations },

    // Sizing
    nodeSize: { type: ControlType.Number, title: "Node Size", min: 3, max: 14, step: 0.5, defaultValue: 7 },
    hqNodeSize: { type: ControlType.Number, title: "HQ Size", min: 5, max: 18, step: 0.5, defaultValue: 10 },
    citySize: { type: ControlType.Number, title: "City Size", min: 1, max: 8, step: 0.5, defaultValue: 3, hidden: (p: any) => !p.showCities },
    labelSize: { type: ControlType.Number, title: "Label Size", min: 8, max: 24, step: 1, defaultValue: 13, hidden: (p: any) => !p.showLabels },
    hqSubtitleSize: { type: ControlType.Number, title: "HQ Sub Size", min: 8, max: 20, step: 1, defaultValue: 10, hidden: (p: any) => !p.showLabels || !p.showHQSubtitle },

    ariaLabel: { type: ControlType.String, title: "ARIA Label", defaultValue: "Regional presence radar" },
})
