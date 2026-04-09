// NervaMenaMap.tsx
// Interactive MENA region map for Nerva — highlights countries with city reveals on hover/tap
// Dark tech/neon glow theme, fully responsive, mobile-friendly
// Version: 1.0.0

import { addPropertyControls, ControlType, RenderTarget } from "framer"
import { motion, AnimatePresence } from "framer-motion"
import {
    useState,
    useCallback,
    useRef,
    useEffect,
    useMemo,
    CSSProperties,
} from "react"

// ---------- Types ----------

interface CityData {
    name: string
    x: number
    y: number
}

interface CountryData {
    id: string
    name: string
    d: string
    labelX: number
    labelY: number
    cities: CityData[]
}

interface ContextCountry {
    id: string
    d: string
}

interface WaterLabel {
    text: string
    x: number
    y: number
    rotate?: number
}

interface Props {
    style?: CSSProperties
    backgroundColor?: string
    countryFill?: string
    countryStroke?: string
    hoverFill?: string
    hoverStroke?: string
    hoverGlow?: string
    cityDotColor?: string
    cityLabelColor?: string
    countryLabelColor?: string
    contextFill?: string
    contextStroke?: string
    cityDotSize?: number
    borderWidth?: number
    showCountryLabels?: boolean
    showCityLabels?: boolean
    showWaterLabels?: boolean
    showGrid?: boolean
    animationSpeed?: number
    glowIntensity?: number
    labelSize?: number
    cityLabelSize?: number
}

// ---------- Defaults ----------

const DEFAULTS = {
    backgroundColor: "#080c18",
    countryFill: "rgba(15, 55, 95, 0.5)",
    countryStroke: "rgba(0, 160, 230, 0.3)",
    hoverFill: "rgba(0, 160, 230, 0.25)",
    hoverStroke: "rgba(0, 200, 255, 0.85)",
    hoverGlow: "rgba(0, 200, 255, 0.6)",
    cityDotColor: "#00e5ff",
    cityLabelColor: "rgba(255, 255, 255, 0.9)",
    countryLabelColor: "rgba(255, 255, 255, 0.4)",
    contextFill: "rgba(15, 30, 50, 0.25)",
    contextStroke: "rgba(0, 80, 120, 0.15)",
    cityDotSize: 4,
    borderWidth: 1,
    showCountryLabels: true,
    showCityLabels: true,
    showWaterLabels: true,
    showGrid: true,
    animationSpeed: 1,
    glowIntensity: 6,
    labelSize: 11,
    cityLabelSize: 9,
}

// ---------- Map Data ----------
// Projection: x = (lon + 18) / 80 * 1000, y = (40 - lat) / 30 * 600
// ViewBox: 0 0 1000 600 | Lon: -18° to 62° | Lat: 10° to 40°

const MENA_COUNTRIES: CountryData[] = [
    {
        id: "morocco",
        name: "Morocco",
        d: "M12,380 L63,380 L63,246 L116,246 L165,200 L198,158 L204,104 L198,98 L159,82 L151,86 L146,110 L130,134 L103,150 L60,230 L12,224 Z",
        labelX: 95,
        labelY: 270,
        cities: [
            { name: "Casablanca", x: 130, y: 129 },
            { name: "Rabat", x: 140, y: 120 },
            { name: "Marrakech", x: 125, y: 167 },
        ],
    },
    {
        id: "algeria",
        name: "Algeria",
        d: "M116,410 L116,246 L165,200 L198,158 L204,104 L225,90 L253,64 L275,64 L300,60 L329,62 L329,120 L344,200 L375,330 L375,410 Z",
        labelX: 255,
        labelY: 250,
        cities: [
            { name: "Algiers", x: 263, y: 65 },
            { name: "Oran", x: 217, y: 86 },
        ],
    },
    {
        id: "tunisia",
        name: "Tunisia",
        d: "M329,62 L340,54 L356,60 L369,58 L363,86 L356,100 L353,114 L344,130 L333,124 L329,120 Z",
        labelX: 349,
        labelY: 95,
        cities: [{ name: "Tunis", x: 352, y: 64 }],
    },
    {
        id: "libya",
        name: "Libya",
        d: "M344,200 L344,130 L353,114 L356,100 L363,86 L369,58 L388,142 L413,146 L431,176 L456,190 L475,158 L500,148 L519,160 L538,170 L538,360 L525,410 L375,410 L375,330 Z",
        labelX: 455,
        labelY: 260,
        cities: [
            { name: "Tripoli", x: 390, y: 142 },
            { name: "Benghazi", x: 476, y: 158 },
        ],
    },
    {
        id: "egypt",
        name: "Egypt",
        d: "M538,170 L563,176 L594,176 L606,170 L629,174 L653,174 L660,210 L654,240 L640,250 L648,280 L656,310 L673,330 L681,360 L538,360 Z",
        labelX: 590,
        labelY: 270,
        cities: [
            { name: "Cairo", x: 615, y: 199 },
            { name: "Alexandria", x: 599, y: 176 },
            { name: "Luxor", x: 633, y: 286 },
        ],
    },
    {
        id: "sudan",
        name: "Sudan",
        d: "M500,360 L538,360 L681,360 L694,380 L700,430 L694,490 L675,550 L638,600 L588,600 L563,560 L525,560 L500,500 Z",
        labelX: 605,
        labelY: 475,
        cities: [{ name: "Khartoum", x: 632, y: 488 }],
    },
    {
        id: "saudi",
        name: "Saudi Arabia",
        d: "M663,220 L688,210 L713,160 L763,170 L806,210 L825,230 L844,260 L850,280 L856,300 L865,310 L863,320 L869,350 L913,360 L875,420 L850,440 L813,460 L781,460 L763,460 L750,450 L738,420 L719,380 L700,340 L688,300 L675,250 L669,230 Z",
        labelX: 775,
        labelY: 330,
        cities: [
            { name: "Riyadh", x: 809, y: 306 },
            { name: "Jeddah", x: 714, y: 370 },
            { name: "Mecca", x: 723, y: 372 },
            { name: "Medina", x: 720, y: 311 },
            { name: "Dammam", x: 851, y: 271 },
        ],
    },
    {
        id: "yemen",
        name: "Yemen",
        d: "M763,460 L756,540 L763,550 L788,550 L825,540 L875,480 L875,420 L850,440 L813,460 L781,460 Z",
        labelX: 810,
        labelY: 500,
        cities: [{ name: "Sana'a", x: 778, y: 493 }],
    },
    {
        id: "oman",
        name: "Oman",
        d: "M925,310 L938,300 L956,330 L969,350 L963,380 L950,400 L938,460 L875,480 L875,420 L913,360 L925,350 Z",
        labelX: 930,
        labelY: 395,
        cities: [{ name: "Muscat", x: 955, y: 328 }],
    },
    {
        id: "uae",
        name: "UAE",
        d: "M863,320 L875,304 L900,300 L919,294 L925,310 L925,350 L913,360 L869,350 Z",
        labelX: 895,
        labelY: 332,
        cities: [
            { name: "Dubai", x: 916, y: 296 },
            { name: "Abu Dhabi", x: 905, y: 311 },
            { name: "Sharjah", x: 917, y: 293 },
        ],
    },
    {
        id: "qatar",
        name: "Qatar",
        d: "M855,314 L851,300 L854,282 L861,278 L866,290 L864,312 Z",
        labelX: 833,
        labelY: 298,
        cities: [{ name: "Doha", x: 869, y: 294 }],
    },
    {
        id: "bahrain",
        name: "Bahrain",
        d: "M851,272 L849,279 L853,284 L859,280 L859,273 L855,269 Z",
        labelX: 828,
        labelY: 272,
        cities: [{ name: "Manama", x: 857, y: 275 }],
    },
    {
        id: "kuwait",
        name: "Kuwait",
        d: "M806,200 L819,195 L831,190 L829,210 L825,224 L806,224 Z",
        labelX: 786,
        labelY: 207,
        cities: [{ name: "Kuwait City", x: 824, y: 213 }],
    },
    {
        id: "jordan",
        name: "Jordan",
        d: "M663,220 L663,150 L675,146 L688,140 L700,150 L713,160 L688,210 Z",
        labelX: 682,
        labelY: 185,
        cities: [{ name: "Amman", x: 674, y: 161 }],
    },
    {
        id: "lebanon",
        name: "Lebanon",
        d: "M664,138 L673,134 L683,108 L678,106 L664,122 Z",
        labelX: 642,
        labelY: 118,
        cities: [{ name: "Beirut", x: 669, y: 122 }],
    },
    {
        id: "syria",
        name: "Syria",
        d: "M671,88 L675,106 L678,106 L683,108 L688,140 L700,150 L713,160 L725,130 L750,60 L725,58 L700,64 L681,70 L675,76 Z",
        labelX: 718,
        labelY: 105,
        cities: [{ name: "Damascus", x: 679, y: 130 }],
    },
    {
        id: "iraq",
        name: "Iraq",
        d: "M713,160 L763,170 L806,210 L831,190 L825,170 L813,140 L800,110 L794,90 L781,60 L750,60 L725,130 L700,150 Z",
        labelX: 770,
        labelY: 145,
        cities: [
            { name: "Baghdad", x: 780, y: 134 },
            { name: "Basra", x: 822, y: 190 },
            { name: "Erbil", x: 775, y: 76 },
        ],
    },
]

// Context countries rendered faintly for geographic orientation
const CONTEXT_COUNTRIES: ContextCountry[] = [
    {
        id: "turkey",
        d: "M550,80 L575,70 L600,64 L625,60 L650,70 L675,76 L671,88 L675,76 L681,70 L700,64 L725,58 L750,60 L781,60 L775,0 L550,0 Z",
    },
    {
        id: "iran",
        d: "M781,60 L794,90 L800,110 L813,140 L825,170 L831,190 L838,210 L863,250 L900,270 L925,260 L944,290 L988,290 L988,180 L963,80 L888,60 L825,10 L775,10 Z",
    },
]

const WATER_LABELS: WaterLabel[] = [
    { text: "MEDITERRANEAN SEA", x: 410, y: 38, rotate: 0 },
    { text: "RED SEA", x: 705, y: 310, rotate: -70 },
    { text: "ARABIAN GULF", x: 878, y: 238, rotate: -55 },
    { text: "ARABIAN SEA", x: 950, y: 440, rotate: 0 },
    { text: "ATLANTIC", x: 28, y: 145, rotate: -90 },
]

// ---------- Component ----------

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 550
 */
export default function NervaMenaMap(props: Props) {
    const {
        style,
        backgroundColor = DEFAULTS.backgroundColor,
        countryFill = DEFAULTS.countryFill,
        countryStroke = DEFAULTS.countryStroke,
        hoverFill = DEFAULTS.hoverFill,
        hoverStroke = DEFAULTS.hoverStroke,
        hoverGlow = DEFAULTS.hoverGlow,
        cityDotColor = DEFAULTS.cityDotColor,
        cityLabelColor = DEFAULTS.cityLabelColor,
        countryLabelColor = DEFAULTS.countryLabelColor,
        contextFill = DEFAULTS.contextFill,
        contextStroke = DEFAULTS.contextStroke,
        cityDotSize = DEFAULTS.cityDotSize,
        borderWidth = DEFAULTS.borderWidth,
        showCountryLabels = DEFAULTS.showCountryLabels,
        showCityLabels = DEFAULTS.showCityLabels,
        showWaterLabels = DEFAULTS.showWaterLabels,
        showGrid = DEFAULTS.showGrid,
        animationSpeed = DEFAULTS.animationSpeed,
        glowIntensity = DEFAULTS.glowIntensity,
        labelSize = DEFAULTS.labelSize,
        cityLabelSize = DEFAULTS.cityLabelSize,
    } = props

    const isCanvas = RenderTarget.current() === "canvas"
    const componentId = useRef(
        `mena-${Math.random().toString(36).substr(2, 9)}`
    ).current

    // --- State ---
    const [activeCountry, setActiveCountry] = useState<string | null>(null)
    const [isTouchDevice, setIsTouchDevice] = useState(false)
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    // --- Effects ---
    useEffect(() => {
        if (typeof window === "undefined") return
        setIsTouchDevice(
            "ontouchstart" in window || navigator.maxTouchPoints > 0
        )
        setPrefersReducedMotion(
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
    }, [])

    // --- Handlers ---
    const handleCountryEnter = useCallback(
        (id: string) => {
            if (!isTouchDevice && !isCanvas) setActiveCountry(id)
        },
        [isTouchDevice, isCanvas]
    )

    const handleCountryLeave = useCallback(() => {
        if (!isTouchDevice && !isCanvas) setActiveCountry(null)
    }, [isTouchDevice, isCanvas])

    const handleCountryTap = useCallback(
        (id: string) => {
            if (isCanvas) return
            setActiveCountry((prev) => (prev === id ? null : id))
        },
        [isCanvas]
    )

    const handleBackgroundTap = useCallback(() => {
        if (isTouchDevice) setActiveCountry(null)
    }, [isTouchDevice])

    // --- Active country data ---
    const activeCountryData = useMemo(
        () => MENA_COUNTRIES.find((c) => c.id === activeCountry) ?? null,
        [activeCountry]
    )

    // --- Animation values ---
    const transitionDuration = prefersReducedMotion ? 0 : 0.3 / animationSpeed
    const staggerDelay = prefersReducedMotion ? 0 : 0.08 / animationSpeed

    // --- Canvas placeholder ---
    if (isCanvas) {
        return (
            <div
                style={{
                    ...canvasPlaceholderStyle,
                    backgroundColor,
                    ...style,
                }}
            >
                <svg
                    viewBox="0 0 1000 600"
                    style={{
                        width: "100%",
                        height: "100%",
                    }}
                    aria-hidden="true"
                >
                    {CONTEXT_COUNTRIES.map((c) => (
                        <path
                            key={c.id}
                            d={c.d}
                            fill={contextFill}
                            stroke={contextStroke}
                            strokeWidth={borderWidth}
                        />
                    ))}
                    {MENA_COUNTRIES.map((c) => (
                        <path
                            key={c.id}
                            d={c.d}
                            fill={countryFill}
                            stroke={countryStroke}
                            strokeWidth={borderWidth}
                        />
                    ))}
                </svg>
                <div style={canvasLabelStyle}>MENA Region Map</div>
            </div>
        )
    }

    // --- Live render ---
    return (
        <div
            style={{
                ...containerStyle,
                backgroundColor,
                ...style,
            }}
            onClick={handleBackgroundTap}
            role="img"
            aria-label="Interactive map of the Middle East and North Africa region"
        >
            <svg
                viewBox="0 0 1000 600"
                style={svgStyle}
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* --- Background grid --- */}
                {showGrid && (
                    <g opacity={0.04} aria-hidden="true">
                        {Array.from({ length: 21 }, (_, i) => (
                            <line
                                key={`h${i}`}
                                x1={0}
                                y1={i * 30}
                                x2={1000}
                                y2={i * 30}
                                stroke="white"
                                strokeWidth={0.5}
                            />
                        ))}
                        {Array.from({ length: 34 }, (_, i) => (
                            <line
                                key={`v${i}`}
                                x1={i * 30}
                                y1={0}
                                x2={i * 30}
                                y2={600}
                                stroke="white"
                                strokeWidth={0.5}
                            />
                        ))}
                    </g>
                )}

                {/* --- Context countries (faint) --- */}
                <g aria-hidden="true">
                    {CONTEXT_COUNTRIES.map((c) => (
                        <path
                            key={c.id}
                            d={c.d}
                            fill={contextFill}
                            stroke={contextStroke}
                            strokeWidth={borderWidth * 0.7}
                        />
                    ))}
                </g>

                {/* --- MENA country shapes --- */}
                <g>
                    {MENA_COUNTRIES.map((country) => {
                        const isActive = activeCountry === country.id
                        return (
                            <path
                                key={country.id}
                                d={country.d}
                                fill={isActive ? hoverFill : countryFill}
                                stroke={
                                    isActive ? hoverStroke : countryStroke
                                }
                                strokeWidth={
                                    isActive
                                        ? borderWidth * 1.5
                                        : borderWidth
                                }
                                strokeLinejoin="round"
                                style={{
                                    cursor: "pointer",
                                    transition: `fill ${transitionDuration}s ease, stroke ${transitionDuration}s ease, stroke-width ${transitionDuration}s ease, filter ${transitionDuration}s ease`,
                                    filter: isActive
                                        ? `drop-shadow(0 0 ${glowIntensity}px ${hoverGlow}) drop-shadow(0 0 ${glowIntensity * 2}px ${hoverGlow})`
                                        : `drop-shadow(0 0 0px transparent)`,
                                }}
                                onMouseEnter={() =>
                                    handleCountryEnter(country.id)
                                }
                                onMouseLeave={handleCountryLeave}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleCountryTap(country.id)
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={country.name}
                                onKeyDown={(e) => {
                                    if (
                                        e.key === "Enter" ||
                                        e.key === " "
                                    ) {
                                        e.preventDefault()
                                        handleCountryTap(country.id)
                                    }
                                }}
                                onFocus={() =>
                                    handleCountryEnter(country.id)
                                }
                                onBlur={handleCountryLeave}
                            />
                        )
                    })}
                </g>

                {/* --- Water body labels --- */}
                {showWaterLabels && (
                    <g aria-hidden="true">
                        {WATER_LABELS.map((w) => (
                            <text
                                key={w.text}
                                x={w.x}
                                y={w.y}
                                fill="rgba(0, 140, 200, 0.12)"
                                fontSize={8}
                                fontFamily="system-ui, -apple-system, sans-serif"
                                letterSpacing={3}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                transform={
                                    w.rotate
                                        ? `rotate(${w.rotate}, ${w.x}, ${w.y})`
                                        : undefined
                                }
                            >
                                {w.text}
                            </text>
                        ))}
                    </g>
                )}

                {/* --- Country labels --- */}
                {showCountryLabels && (
                    <g aria-hidden="true" style={{ pointerEvents: "none" }}>
                        {MENA_COUNTRIES.map((country) => {
                            const isActive = activeCountry === country.id
                            return (
                                <text
                                    key={`label-${country.id}`}
                                    x={country.labelX}
                                    y={country.labelY}
                                    fill={
                                        isActive
                                            ? "rgba(255,255,255,0.85)"
                                            : countryLabelColor
                                    }
                                    fontSize={labelSize}
                                    fontFamily="system-ui, -apple-system, sans-serif"
                                    fontWeight={isActive ? 600 : 400}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    letterSpacing={1.2}
                                    paintOrder="stroke"
                                    stroke="rgba(0,0,0,0.6)"
                                    strokeWidth={isActive ? 3 : 2.5}
                                    style={{
                                        transition: `fill ${transitionDuration}s ease, font-weight ${transitionDuration}s ease`,
                                        textTransform: "uppercase" as const,
                                    }}
                                >
                                    {country.name}
                                </text>
                            )
                        })}
                    </g>
                )}

                {/* --- Cities (animated on hover) --- */}
                <AnimatePresence>
                    {activeCountryData && (
                        <g
                            key={`cities-${activeCountryData.id}`}
                            style={{ pointerEvents: "none" }}
                        >
                            {activeCountryData.cities.map((city, i) => (
                                <g key={city.name}>
                                    {/* Pulse ring */}
                                    <motion.circle
                                        cx={city.x}
                                        cy={city.y}
                                        r={cityDotSize}
                                        fill="transparent"
                                        stroke={cityDotColor}
                                        strokeWidth={1}
                                        initial={{ scale: 1, opacity: 0 }}
                                        animate={{
                                            scale: [1, 3, 1],
                                            opacity: [0.5, 0, 0.5],
                                        }}
                                        exit={{ opacity: 0 }}
                                        transition={{
                                            delay:
                                                staggerDelay * i +
                                                transitionDuration,
                                            duration: prefersReducedMotion
                                                ? 0
                                                : 2 / animationSpeed,
                                            repeat: Infinity,
                                            ease: "easeOut",
                                        }}
                                    />
                                    {/* City dot */}
                                    <motion.circle
                                        cx={city.x}
                                        cy={city.y}
                                        r={cityDotSize}
                                        fill={cityDotColor}
                                        initial={{
                                            scale: 0,
                                            opacity: 0,
                                        }}
                                        animate={{
                                            scale: 1,
                                            opacity: 1,
                                        }}
                                        exit={{
                                            scale: 0,
                                            opacity: 0,
                                        }}
                                        transition={{
                                            delay: staggerDelay * i,
                                            duration: transitionDuration,
                                            ease: "easeOut",
                                        }}
                                        style={{
                                            filter: `drop-shadow(0 0 ${cityDotSize}px ${cityDotColor})`,
                                        }}
                                    />
                                    {/* City label */}
                                    {showCityLabels && (
                                        <motion.text
                                            x={city.x}
                                            y={
                                                city.y -
                                                cityDotSize * 2 -
                                                4
                                            }
                                            fill={cityLabelColor}
                                            fontSize={cityLabelSize}
                                            fontFamily="system-ui, -apple-system, sans-serif"
                                            fontWeight={500}
                                            textAnchor="middle"
                                            dominantBaseline="auto"
                                            paintOrder="stroke"
                                            stroke="rgba(0,0,0,0.7)"
                                            strokeWidth={2.5}
                                            initial={{ opacity: 0, y: city.y }}
                                            animate={{
                                                opacity: 1,
                                                y:
                                                    city.y -
                                                    cityDotSize * 2 -
                                                    4,
                                            }}
                                            exit={{ opacity: 0 }}
                                            transition={{
                                                delay: staggerDelay * i,
                                                duration: transitionDuration,
                                            }}
                                        >
                                            {city.name}
                                        </motion.text>
                                    )}
                                </g>
                            ))}
                        </g>
                    )}
                </AnimatePresence>
            </svg>
        </div>
    )
}

NervaMenaMap.displayName = "Nerva MENA Map"

// ---------- Property Controls ----------

addPropertyControls(NervaMenaMap, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: DEFAULTS.backgroundColor,
    },
    countryFill: {
        type: ControlType.Color,
        title: "Country Fill",
        defaultValue: DEFAULTS.countryFill,
    },
    countryStroke: {
        type: ControlType.Color,
        title: "Country Border",
        defaultValue: DEFAULTS.countryStroke,
    },
    hoverFill: {
        type: ControlType.Color,
        title: "Hover Fill",
        defaultValue: DEFAULTS.hoverFill,
    },
    hoverStroke: {
        type: ControlType.Color,
        title: "Hover Border",
        defaultValue: DEFAULTS.hoverStroke,
    },
    hoverGlow: {
        type: ControlType.Color,
        title: "Hover Glow",
        defaultValue: DEFAULTS.hoverGlow,
    },
    cityDotColor: {
        type: ControlType.Color,
        title: "City Dot",
        defaultValue: DEFAULTS.cityDotColor,
    },
    cityLabelColor: {
        type: ControlType.Color,
        title: "City Label",
        defaultValue: DEFAULTS.cityLabelColor,
    },
    countryLabelColor: {
        type: ControlType.Color,
        title: "Country Label",
        defaultValue: DEFAULTS.countryLabelColor,
    },
    contextFill: {
        type: ControlType.Color,
        title: "Context Fill",
        defaultValue: DEFAULTS.contextFill,
    },
    contextStroke: {
        type: ControlType.Color,
        title: "Context Border",
        defaultValue: DEFAULTS.contextStroke,
    },
    cityDotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: DEFAULTS.cityDotSize,
        min: 1,
        max: 12,
        step: 0.5,
        unit: "px",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: DEFAULTS.borderWidth,
        min: 0.5,
        max: 4,
        step: 0.25,
        unit: "px",
    },
    labelSize: {
        type: ControlType.Number,
        title: "Label Size",
        defaultValue: DEFAULTS.labelSize,
        min: 6,
        max: 20,
        step: 1,
        unit: "px",
    },
    cityLabelSize: {
        type: ControlType.Number,
        title: "City Label Size",
        defaultValue: DEFAULTS.cityLabelSize,
        min: 6,
        max: 16,
        step: 1,
        unit: "px",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        defaultValue: DEFAULTS.glowIntensity,
        min: 0,
        max: 20,
        step: 1,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Anim Speed",
        defaultValue: DEFAULTS.animationSpeed,
        min: 0.2,
        max: 3,
        step: 0.1,
        unit: "×",
    },
    showCountryLabels: {
        type: ControlType.Boolean,
        title: "Country Labels",
        defaultValue: DEFAULTS.showCountryLabels,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showCityLabels: {
        type: ControlType.Boolean,
        title: "City Labels",
        defaultValue: DEFAULTS.showCityLabels,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showWaterLabels: {
        type: ControlType.Boolean,
        title: "Water Labels",
        defaultValue: DEFAULTS.showWaterLabels,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showGrid: {
        type: ControlType.Boolean,
        title: "Grid",
        defaultValue: DEFAULTS.showGrid,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})

// ---------- Styles ----------

const containerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
}

const svgStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    maxHeight: "100%",
}

const canvasPlaceholderStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
}

const canvasLabelStyle: CSSProperties = {
    position: "absolute",
    insetBlockEnd: 12,
    insetInlineEnd: 12,
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    fontFamily: "system-ui, -apple-system, sans-serif",
}
