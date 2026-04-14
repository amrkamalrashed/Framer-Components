// RoastingStatus.tsx
// Live roastery status for the nav bar
// Time-based status + rotating product names + auto-changing icons
// Locale-aware (RTL/LTR), Framer locale handles translations
// Clock: visitor's local time | Status: Dammam roastery time (Asia/Riyadh)
// Version: 2.2.0

import {
    addPropertyControls,
    ControlType,
    useLocaleInfo,
    RenderTarget,
} from "framer"
import { useState, useEffect, useMemo, CSSProperties } from "react"

/* ━━━ Feather-style icons ━━━ */

const STROKE = {
    fill: "none" as const,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
}

function SunIcon({ color, size }: { color: string; size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            stroke={color}
            {...STROKE}
            aria-hidden="true"
            focusable="false"
        >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
    )
}

function ThermometerIcon({ color, size }: { color: string; size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            stroke={color}
            {...STROKE}
            aria-hidden="true"
            focusable="false"
        >
            <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
        </svg>
    )
}

function PackageIcon({ color, size }: { color: string; size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            stroke={color}
            {...STROKE}
            aria-hidden="true"
            focusable="false"
        >
            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    )
}

function CoffeeIcon({ color, size }: { color: string; size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            stroke={color}
            {...STROKE}
            aria-hidden="true"
            focusable="false"
        >
            <path d="M18 8h1a4 4 0 010 8h-1" />
            <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
    )
}

function MoonIcon({ color, size }: { color: string; size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            stroke={color}
            {...STROKE}
            aria-hidden="true"
            focusable="false"
        >
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
    )
}

/* ━━━ Locale ━━━ */

const RTL_LOCALES = new Set([
    "ar", "ar-SA", "ar-AE", "ar-EG", "ar-MA", "ar-DZ", "ar-TN",
    "ar-IQ", "ar-KW", "ar-BH", "ar-QA", "ar-OM", "ar-YE", "ar-JO",
    "ar-LB", "ar-SY", "ar-PS", "ar-LY", "ar-SD",
    "he", "he-IL", "fa", "fa-IR", "ur", "ur-PK",
])

// Dammam roastery timezone (same as Riyadh, AST +3)
const ROASTERY_TZ = "Asia/Riyadh"

function extractLocaleCode(info: any): string {
    return (
        info?.activeLocale?.code ||
        info?.activeLocale?.locale ||
        info?.code ||
        info?.locale ||
        info?.languageTag ||
        ""
    )
}

/* ━━━ Helpers ━━━ */

type Period = "roasting" | "cooling" | "packing" | "ready" | "sleeping"

function getPeriod(hour: number): Period {
    if (hour >= 6 && hour < 10) return "roasting"
    if (hour >= 10 && hour < 14) return "cooling"
    if (hour >= 14 && hour < 18) return "packing"
    if (hour >= 18 && hour < 22) return "ready"
    return "sleeping"
}

function getIcon(period: Period, color: string, size: number) {
    switch (period) {
        case "roasting":
            return <SunIcon color={color} size={size} />
        case "cooling":
            return <ThermometerIcon color={color} size={size} />
        case "packing":
            return <PackageIcon color={color} size={size} />
        case "ready":
            return <CoffeeIcon color={color} size={size} />
        case "sleeping":
            return <MoonIcon color={color} size={size} />
    }
}

function pickProduct(products: string[], date: Date): string {
    if (products.length === 0) return ""
    const dayOfYear = Math.floor(
        (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) /
            86400000
    )
    return products[dayOfYear % products.length]
}

// Clock formatter. tz === "auto" → visitor's local time.
// Any other value is an IANA timezone string (e.g. "Asia/Riyadh").
function formatClockTime(date: Date, locale: string, tz: string): string {
    const isAr = locale.startsWith("ar") || RTL_LOCALES.has(locale)
    const loc = isAr ? "ar-u-nu-latn" : "en-US"
    const opts: Intl.DateTimeFormatOptions = {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }
    if (tz && tz !== "auto") opts.timeZone = tz
    try {
        return date.toLocaleTimeString(loc, opts)
    } catch {
        return date.toLocaleTimeString("en-US", opts)
    }
}

// Roasting status uses Dammam roastery time
function getDammamHour(now: Date): number {
    try {
        const parts = new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            hour12: false,
            timeZone: ROASTERY_TZ,
        }).formatToParts(now)
        const h = parts.find((p) => p.type === "hour")
        return h ? parseInt(h.value, 10) : now.getHours()
    } catch {
        return now.getHours()
    }
}

/* ━━━ types ━━━ */

interface Props {
    style?: CSSProperties
    products?: string[]
    roastingText?: string
    coolingText?: string
    packingText?: string
    readyText?: string
    sleepingText?: string
    showTime?: boolean
    showProduct?: boolean
    clockTimezone?: string
    iconColor?: string
    iconSize?: number
    gap?: number
    lineGap?: number
    statusFont?: Record<string, any>
    textColor?: string
    timeFont?: Record<string, any>
    timeColor?: string
}

/* ━━━ Component ━━━ */

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 40
 */
export default function RoastingStatus({
    style,
    products = [
        "أرسيلا",
        "روفيرا",
        "فيردي",
        "أورفن",
        "سيرينا",
        "توبا",
        "فيتي",
        "لابراديرا",
    ],
    roastingText = "يتم تحميص",
    coolingText = "تبريد حبوب",
    packingText = "تجهيز طلبات",
    readyText = "جاهزة للتذوق",
    sleepingText = "نحمّص لك بكرة الصبح",
    showTime = true,
    showProduct = true,
    clockTimezone = "Asia/Riyadh",
    iconColor = "rgb(15, 145, 79)",
    iconSize = 20,
    gap = 8,
    lineGap = 2,
    statusFont,
    textColor = "rgb(15, 145, 79)",
    timeFont,
    timeColor = "rgba(60, 56, 43, 0.5)",
}: Props) {
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const localeInfo = useLocaleInfo() as any
    const localeCode = extractLocaleCode(localeInfo) || "ar"
    const isRTL = useMemo(() => {
        if (!localeCode) return true
        return (
            RTL_LOCALES.has(localeCode) || localeCode.startsWith("ar")
        )
    }, [localeCode])

    const activeProducts = useMemo(() => {
        if (!Array.isArray(products)) return []
        return products.filter(Boolean)
    }, [products])

    const statusMap = useMemo(
        (): Record<Period, string> => ({
            roasting: roastingText,
            cooling: coolingText,
            packing: packingText,
            ready: readyText,
            sleeping: sleepingText,
        }),
        [
            roastingText,
            coolingText,
            packingText,
            readyText,
            sleepingText,
        ]
    )

    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        if (isCanvas) return
        const interval = setInterval(() => setNow(new Date()), 60_000)
        return () => clearInterval(interval)
    }, [isCanvas])

    // Status/icon based on Dammam roastery time. Memoized so the Intl
    // DateTimeFormat instance only runs when the minute changes (setNow).
    const hour = useMemo(
        () => (isCanvas ? 8 : getDammamHour(now)),
        [isCanvas, now]
    )
    const period = getPeriod(hour)

    const product = pickProduct(activeProducts, now)
    const needsProduct = period !== "ready" && period !== "sleeping"
    const statusLine =
        needsProduct && showProduct && product
            ? `${statusMap[period]} ${product}`
            : statusMap[period]

    // Flip left/right inline positioning for LTR layouts. Keeps nav-bar
    // placement working in both directions.
    const flippedStyle = useMemo(() => {
        if (!style || isRTL) return style
        const { right, left, ...rest } = style
        const s: any = { ...rest }
        if (right != null && right !== "auto") {
            s.left = right
            s.right = "auto"
        }
        return s
    }, [style, isRTL])

    // Spread Framer's Font control output wholesale so every property it
    // emits reaches the DOM (family, size, weight, line height, letter
    // spacing, fontFeatureSettings, etc.). Defaults sit underneath and
    // only fill gaps Framer doesn't provide.
    const statusTextStyle: CSSProperties = {
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 1.3,
        letterSpacing: "-0.01em",
        ...(statusFont || {}),
        color: textColor,
    }
    const timeTextStyle: CSSProperties = {
        fontSize: 10,
        fontWeight: 400,
        lineHeight: 1.2,
        ...(timeFont || {}),
        color: timeColor,
        fontVariantNumeric: "tabular-nums",
    }

    return (
        <div
            style={{
                ...flippedStyle,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap,
                direction: isRTL ? "rtl" : "ltr",
                whiteSpace: "nowrap",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
                role="img"
                aria-label={statusMap[period]}
            >
                {getIcon(period, iconColor, iconSize)}
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: lineGap,
                }}
                role="status"
                aria-live="polite"
            >
                <span style={statusTextStyle}>{statusLine}</span>
                {showTime && (
                    <span style={timeTextStyle}>
                        {formatClockTime(now, localeCode, clockTimezone)}
                    </span>
                )}
            </div>
        </div>
    )
}

RoastingStatus.displayName = "Roasting Status"

/* ━━━ Property controls ━━━ */

addPropertyControls(RoastingStatus, {
    products: {
        type: ControlType.Array,
        title: "Products",
        control: { type: ControlType.String },
        defaultValue: [
            "أرسيلا",
            "روفيرا",
            "فيردي",
            "أورفن",
            "سيرينا",
            "توبا",
            "فيتي",
            "لابراديرا",
        ],
    },
    showProduct: {
        type: ControlType.Boolean,
        title: "Show Product",
        defaultValue: true,
    },
    showTime: {
        type: ControlType.Boolean,
        title: "Show Time",
        defaultValue: true,
    },
    clockTimezone: {
        type: ControlType.Enum,
        title: "Clock",
        defaultValue: "Asia/Riyadh",
        options: [
            "Asia/Riyadh",
            "Asia/Dubai",
            "Asia/Kuwait",
            "Asia/Qatar",
            "Asia/Bahrain",
            "Asia/Muscat",
            "Africa/Cairo",
            "Europe/London",
            "America/New_York",
            "auto",
        ],
        optionTitles: [
            "Dammam / Riyadh",
            "Dubai",
            "Kuwait",
            "Doha",
            "Manama",
            "Muscat",
            "Cairo",
            "London",
            "New York",
            "Visitor's Local",
        ],
        hidden: (p: Props) => !p.showTime,
    },

    roastingText: {
        type: ControlType.String,
        title: "Roasting",
        defaultValue: "يتم تحميص",
    },
    coolingText: {
        type: ControlType.String,
        title: "Cooling",
        defaultValue: "تبريد حبوب",
    },
    packingText: {
        type: ControlType.String,
        title: "Packing",
        defaultValue: "تجهيز طلبات",
    },
    readyText: {
        type: ControlType.String,
        title: "Ready",
        defaultValue: "جاهزة للتذوق",
    },
    sleepingText: {
        type: ControlType.String,
        title: "Sleeping",
        defaultValue: "نحمّص لك بكرة الصبح",
    },

    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "rgb(15, 145, 79)",
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 20,
        min: 10,
        max: 32,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 2,
        max: 24,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    lineGap: {
        type: ControlType.Number,
        title: "Line Gap",
        defaultValue: 2,
        min: 0,
        max: 16,
        step: 1,
        unit: "px",
        displayStepper: true,
    },

    statusFont: {
        type: ControlType.Font,
        title: "Status Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 12,
            variant: "Medium",
            lineHeight: "1.3em",
            letterSpacing: "-0.01em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "rgb(15, 145, 79)",
    },
    timeFont: {
        type: ControlType.Font,
        title: "Time Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 10,
            variant: "Regular",
            lineHeight: "1.2em",
        },
        hidden: (p: Props) => !p.showTime,
    },
    timeColor: {
        type: ControlType.Color,
        title: "Time Color",
        defaultValue: "rgba(60, 56, 43, 0.5)",
        hidden: (p: Props) => !p.showTime,
    },
})
