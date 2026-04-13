// PresenceCards.tsx
// MENA presence as a clean grid of country cards with AR/EN names
// and city counts. Informational, no abstraction, always readable.
// Version: 1.0.0

import React from "react"
import { addPropertyControls, ControlType, RenderTarget, useLocaleInfo } from "framer"
import { motion } from "framer-motion"

// ---------- Data ----------

interface Country {
    code: string
    nameAr: string
    nameEn: string
    flag: string        // emoji or svg path — kept as emoji for simplicity
    cities: number
    featured?: boolean  // show accent border + badge
}

const COUNTRIES: Country[] = [
    { code: "sa", nameAr: "السعودية", nameEn: "Saudi Arabia", flag: "🇸🇦", cities: 5, featured: true },
    { code: "eg", nameAr: "مصر", nameEn: "Egypt", flag: "🇪🇬", cities: 2, featured: true },
    { code: "ae", nameAr: "الإمارات", nameEn: "UAE", flag: "🇦🇪", cities: 2 },
    { code: "kw", nameAr: "الكويت", nameEn: "Kuwait", flag: "🇰🇼", cities: 1 },
    { code: "qa", nameAr: "قطر", nameEn: "Qatar", flag: "🇶🇦", cities: 1 },
    { code: "bh", nameAr: "البحرين", nameEn: "Bahrain", flag: "🇧🇭", cities: 1 },
    { code: "om", nameAr: "عُمان", nameEn: "Oman", flag: "🇴🇲", cities: 1 },
    { code: "jo", nameAr: "الأردن", nameEn: "Jordan", flag: "🇯🇴", cities: 1 },
]

// ---------- Component ----------

interface Props {
    accentColor: string
    cardBg: string
    cardBorder: string
    titleColor: string
    subtitleColor: string
    badgeBg: string
    badgeText: string
    showFlags: boolean
    showCityCount: boolean
    showFeaturedBadge: boolean
    animations: boolean
    entranceStagger: number
    columnsDesktop: number
    columnsMobile: number
    gap: number
    padding: number
    borderRadius: number
    titleSize: number
    subtitleSize: number
    flagSize: number
    featuredBadgeText: string
    ariaLabel: string
    style: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 300
 */
export default function PresenceCards(props: Props) {
    const {
        accentColor = "#D73B55",
        cardBg = "rgba(255,255,255,0.04)",
        cardBorder = "rgba(255,255,255,0.08)",
        titleColor = "#FFFFFF",
        subtitleColor = "rgba(255,255,255,0.5)",
        badgeBg = "#D73B55",
        badgeText = "#FFFFFF",
        showFlags = true,
        showCityCount = true,
        showFeaturedBadge = true,
        animations = true,
        entranceStagger = 0.06,
        columnsDesktop = 4,
        columnsMobile = 2,
        gap = 12,
        padding = 20,
        borderRadius = 16,
        titleSize = 18,
        subtitleSize = 13,
        flagSize = 32,
        featuredBadgeText = "HQ",
        ariaLabel = "Countries we serve",
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

    const css = `
        .pc-grid-${uid} {
            display: grid;
            grid-template-columns: repeat(${columnsDesktop}, minmax(0, 1fr));
            gap: ${gap}px;
            width: 100%;
        }
        @media (max-width: 768px) {
            .pc-grid-${uid} {
                grid-template-columns: repeat(${columnsMobile}, minmax(0, 1fr));
            }
        }
        .pc-card-${uid} {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: ${padding}px;
            background: ${cardBg};
            border: 1px solid ${cardBorder};
            border-radius: ${borderRadius}px;
            transition: transform 0.28s ease, border-color 0.28s ease, background 0.28s ease;
            will-change: transform;
        }
        .pc-card-${uid}:hover {
            transform: translateY(-3px);
            border-color: ${accentColor};
            background: rgba(255,255,255,0.06);
        }
        .pc-card-${uid}[data-featured="true"] {
            border-color: color-mix(in srgb, ${accentColor} 40%, transparent);
        }
        .pc-badge-${uid} {
            position: absolute;
            inset-inline-end: 12px;
            inset-block-start: 12px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            padding: 3px 8px;
            border-radius: 999px;
            background: ${badgeBg};
            color: ${badgeText};
            font-family: ${fontFamily};
        }
    `

    return (
        <div
            role="region"
            aria-label={ariaLabel}
            dir={dir}
            style={{
                width: "100%",
                height: "100%",
                fontFamily,
                ...style,
            }}
        >
            <style dangerouslySetInnerHTML={{ __html: css }} />
            <div className={`pc-grid-${uid}`}>
                {COUNTRIES.map((country, i) => (
                    <motion.div
                        key={country.code}
                        className={`pc-card-${uid}`}
                        data-featured={country.featured ? "true" : "false"}
                        initial={isStatic ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: i * entranceStagger,
                            duration: 0.5,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    >
                        {showFeaturedBadge && country.featured && (
                            <span className={`pc-badge-${uid}`}>{featuredBadgeText}</span>
                        )}
                        {showFlags && (
                            <span style={{ fontSize: flagSize, lineHeight: 1 }} aria-hidden="true">
                                {country.flag}
                            </span>
                        )}
                        <div
                            style={{
                                color: titleColor,
                                fontSize: titleSize,
                                fontWeight: 600,
                                lineHeight: 1.2,
                                letterSpacing: isEn ? "0.2px" : "0",
                            }}
                        >
                            {isEn ? country.nameEn : country.nameAr}
                        </div>
                        {showCityCount && (
                            <div
                                style={{
                                    color: subtitleColor,
                                    fontSize: subtitleSize,
                                    fontWeight: 500,
                                    letterSpacing: isEn ? "0.2px" : "0",
                                }}
                            >
                                {country.cities}{" "}
                                {isEn
                                    ? country.cities === 1 ? "City" : "Cities"
                                    : country.cities === 1 ? "مدينة" : "مدن"}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

PresenceCards.displayName = "Presence Cards"

// ---------- Property Controls ----------

addPropertyControls(PresenceCards, {
    // Colors
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#D73B55" },
    cardBg: { type: ControlType.Color, title: "Card BG", defaultValue: "rgba(255,255,255,0.04)" },
    cardBorder: { type: ControlType.Color, title: "Card Border", defaultValue: "rgba(255,255,255,0.08)" },
    titleColor: { type: ControlType.Color, title: "Title", defaultValue: "#FFFFFF" },
    subtitleColor: { type: ControlType.Color, title: "Subtitle", defaultValue: "rgba(255,255,255,0.5)" },
    badgeBg: { type: ControlType.Color, title: "Badge BG", defaultValue: "#D73B55", hidden: (p: any) => !p.showFeaturedBadge },
    badgeText: { type: ControlType.Color, title: "Badge Text", defaultValue: "#FFFFFF", hidden: (p: any) => !p.showFeaturedBadge },

    // Visibility
    showFlags: { type: ControlType.Boolean, title: "Flags", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    showCityCount: { type: ControlType.Boolean, title: "City Count", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    showFeaturedBadge: { type: ControlType.Boolean, title: "HQ Badge", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    featuredBadgeText: { type: ControlType.String, title: "Badge Text", defaultValue: "HQ", hidden: (p: any) => !p.showFeaturedBadge },

    // Layout
    columnsDesktop: { type: ControlType.Number, title: "Cols (≥769)", min: 2, max: 6, step: 1, defaultValue: 4 },
    columnsMobile: { type: ControlType.Number, title: "Cols (<769)", min: 1, max: 3, step: 1, defaultValue: 2 },
    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 40, step: 2, defaultValue: 12, unit: "px" },
    padding: { type: ControlType.Number, title: "Padding", min: 8, max: 48, step: 2, defaultValue: 20, unit: "px" },
    borderRadius: { type: ControlType.Number, title: "Radius", min: 0, max: 40, step: 2, defaultValue: 16, unit: "px" },

    // Sizing
    flagSize: { type: ControlType.Number, title: "Flag Size", min: 16, max: 64, step: 2, defaultValue: 32, unit: "px", hidden: (p: any) => !p.showFlags },
    titleSize: { type: ControlType.Number, title: "Title Size", min: 12, max: 32, step: 1, defaultValue: 18, unit: "px" },
    subtitleSize: { type: ControlType.Number, title: "Subtitle Size", min: 10, max: 20, step: 1, defaultValue: 13, unit: "px", hidden: (p: any) => !p.showCityCount },

    // Animation
    animations: { type: ControlType.Boolean, title: "Animations", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    entranceStagger: { type: ControlType.Number, title: "Stagger", min: 0, max: 0.3, step: 0.01, defaultValue: 0.06, unit: "s", hidden: (p: any) => !p.animations },

    ariaLabel: { type: ControlType.String, title: "ARIA Label", defaultValue: "Countries we serve" },
})
