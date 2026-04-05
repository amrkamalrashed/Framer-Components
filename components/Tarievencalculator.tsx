// TarievenCalculator v5 – Specialistische GGZ Eigen Bijdrage Calculator
// Framer Code Component for eiswijzer.nl / SheVibes
// Shows eigen bijdrage with progressive disclosure breakdown
// Data: 69 Dutch health insurance policies × 2 behandelaartypes (Feb 2026)
// v5: Smooth transitions, pill hover, animated breakdown, reset button
import React, { useState, useRef, useEffect, useMemo, Component } from "react"
import { addPropertyControls, ControlType } from "framer"
// ── TARIFF DATA: 69 policies ──
// Format: { d: "name", gz: [beh, diag], ov: [beh, diag] }
// null = diagnostiek not available (only OHRA)
const P = [
    {
        d: "Aevitae \u2013 Basisverzekering Combinatie",
        gz: [133.13, 266.54],
        ov: [123.54, 224.71],
    },
    {
        d: "Aevitae \u2013 Basisverzekering Natura",
        gz: [124.81, 249.89],
        ov: [115.82, 210.67],
    },
    {
        d: "Aevitae \u2013 Basisverzekering Natura Select",
        gz: [108.17, 216.57],
        ov: [100.37, 182.58],
    },
    {
        d: "Anderzorg \u2013 Basis",
        gz: [126.0, 252.28],
        ov: [116.92, 212.68],
    },
    {
        d: "ASR \u2013 Bewuste keuze",
        gz: [109.38, 219.0],
        ov: [101.5, 184.63],
    },
    {
        d: "ASR \u2013 Eigen keuze",
        gz: [134.62, 269.54],
        ov: [124.92, 227.24],
    },
    {
        d: "ASR \u2013 Ruime keuze",
        gz: [126.21, 252.7],
        ov: [117.11, 213.03],
    },
    {
        d: "AZVZ \u2013 Basisverzekering Zorg Zeker Polis",
        gz: [142.0, 284.32],
        ov: [131.77, 239.69],
    },
    {
        d: "CZ \u2013 Czdirect",
        gz: [113.1, 226.44],
        ov: [104.95, 190.91],
    },
    {
        d: "CZ \u2013 Zorg-op-maatpolis",
        gz: [130.5, 261.28],
        ov: [121.1, 220.28],
    },
    {
        d: "CZ \u2013 Zorgbewustpolis",
        gz: [121.8, 243.86],
        ov: [113.02, 205.59],
    },
    {
        d: "CZ \u2013 Zorgvariatiepolis",
        gz: [147.9, 296.11],
        ov: [137.24, 249.65],
    },
    {
        d: "De christelijke zorgverzekeraar \u2013 Principe Polis",
        gz: [128.41, 261.1],
        ov: [129.87, 231.34],
    },
    {
        d: "De Friesland \u2013 Alles verzorgd polis",
        gz: [136.97, 278.5],
        ov: [138.53, 246.76],
    },
    {
        d: "De Friesland \u2013 Zelf Bewust Polis",
        gz: [128.41, 261.1],
        ov: [129.87, 231.34],
    },
    {
        d: "DSW \u2013 Basisverzekering",
        gz: [132.49, 269.38],
        ov: [127.17, 226.55],
    },
    {
        d: "FBTO \u2013 Basis",
        gz: [111.29, 226.28],
        ov: [112.55, 200.49],
    },
    {
        d: "FBTO \u2013 Basis Plus",
        gz: [128.41, 261.1],
        ov: [129.87, 231.34],
    },
    {
        d: "FBTO \u2013 Basis Vrij",
        gz: [128.41, 261.1],
        ov: [129.87, 231.34],
    },
    {
        d: "HollandZorg \u2013 Hollandzorg",
        gz: [139.94, 280.18],
        ov: [129.85, 236.2],
    },
    {
        d: "ik kies zelf van a.s.r. \u2013 Goede keuze",
        gz: [126.21, 252.7],
        ov: [117.11, 213.03],
    },
    {
        d: "ik kies zelf van a.s.r. \u2013 Juiste Keuze",
        gz: [109.38, 219.0],
        ov: [101.5, 184.63],
    },
    {
        d: "ik kies zelf van a.s.r. \u2013 Vrije Keuze",
        gz: [134.62, 269.54],
        ov: [124.92, 227.24],
    },
    {
        d: "Interpolis \u2013 ZorgActief",
        gz: [128.41, 261.1],
        ov: [129.87, 231.34],
    },
    {
        d: "Interpolis \u2013 ZorgCompact",
        gz: [128.41, 261.1],
        ov: [129.87, 231.34],
    },
    {
        d: "IZA \u2013 IZA Basis Keuze",
        gz: [120.58, 241.43],
        ov: [111.89, 203.53],
    },
    {
        d: "IZA \u2013 IZA Eigen Keuze",
        gz: [146.42, 293.16],
        ov: [135.87, 247.15],
    },
    {
        d: "IZA \u2013 IZA Ruime Keuze",
        gz: [137.81, 275.92],
        ov: [127.87, 232.61],
    },
    {
        d: "IZZ \u2013 IZZ Basisverzekering, Variant Basis",
        gz: [120.58, 241.43],
        ov: [111.89, 203.53],
    },
    {
        d: "IZZ \u2013 IZZ Basisverzekering, Variant Bewuzt",
        gz: [103.36, 206.94],
        ov: [95.91, 174.46],
    },
    {
        d: "IZZ \u2013 IZZ Basisverzekering, Variant Combinatie",
        gz: [137.81, 275.92],
        ov: [127.87, 232.61],
    },
    {
        d: "IZZ \u2013 IZZ Basisverzekering, Variant Natura",
        gz: [137.81, 275.92],
        ov: [127.87, 232.61],
    },
    {
        d: "Just \u2013 Just Basic",
        gz: [104.4, 209.02],
        ov: [96.88, 176.22],
    },
    {
        d: "Menzis \u2013 Menzis Basis",
        gz: [126.0, 252.28],
        ov: [116.92, 212.68],
    },
    {
        d: "Menzis \u2013 Menzis Basis Voordelig",
        gz: [126.0, 252.28],
        ov: [116.92, 212.68],
    },
    {
        d: "Menzis \u2013 Menzis Basis Vrij",
        gz: [135.0, 270.3],
        ov: [125.27, 227.88],
    },
    {
        d: "Nationale Nederlanden \u2013 Zorg Voordelig",
        gz: [121.8, 243.86],
        ov: [113.02, 205.59],
    },
    {
        d: "Nationale Nederlanden \u2013 Zorg Vrij",
        gz: [130.5, 261.28],
        ov: [121.1, 220.28],
    },
    {
        d: "OHRA \u2013 Basisverzekering",
        gz: [130.5, null],
        ov: [121.1, null],
    },
    {
        d: "ONVZ \u2013 Bewuste keuze",
        gz: [117.34, 235.37],
        ov: [108.99, 198.3],
    },
    {
        d: "ONVZ \u2013 Vrije Keuze",
        gz: [135.39, 271.58],
        ov: [125.76, 228.81],
    },
    {
        d: "Salland \u2013 Basisverzekering",
        gz: [149.26, 298.86],
        ov: [138.5, 251.94],
    },
    {
        d: "StadHolland \u2013 Basisverzekering",
        gz: [140.77, 286.21],
        ov: [135.12, 240.7],
    },
    {
        d: "UMC \u2013 UMC Eigen Keuze",
        gz: [146.42, 293.16],
        ov: [135.87, 247.15],
    },
    {
        d: "UMC \u2013 UMC Ruime Keuze",
        gz: [129.2, 258.67],
        ov: [119.88, 218.07],
    },
    {
        d: "United Consumers \u2013 UC Basis keuze",
        gz: [120.58, 241.43],
        ov: [111.89, 203.53],
    },
    {
        d: "United Consumers \u2013 UC Bewuste keuze",
        gz: [103.36, 206.94],
        ov: [95.91, 174.46],
    },
    {
        d: "United Consumers \u2013 UC Eigen keuze",
        gz: [137.81, 275.92],
        ov: [127.87, 232.61],
    },
    {
        d: "United Consumers \u2013 UC Ruime keuze",
        gz: [137.81, 275.92],
        ov: [127.87, 232.61],
    },
    {
        d: "Univ\u00E9 \u2013 Univ\u00E9 Zorg Basis",
        gz: [120.58, 241.43],
        ov: [111.89, 203.53],
    },
    {
        d: "Univ\u00E9 \u2013 Univ\u00E9 Zorg Geregeld polis",
        gz: [137.81, 275.92],
        ov: [127.87, 232.61],
    },
    {
        d: "Univ\u00E9 \u2013 Univ\u00E9 Zorg Select",
        gz: [103.36, 206.94],
        ov: [95.91, 174.46],
    },
    {
        d: "Univ\u00E9 \u2013 Univ\u00E9 Zorg Uitgebreid polis",
        gz: [146.42, 293.16],
        ov: [135.87, 247.15],
    },
    {
        d: "VGZ Bewuzt \u2013 VGZBewuzt basis",
        gz: [103.36, 206.94],
        ov: [95.91, 174.46],
    },
    {
        d: "VGZ \u2013 VGZ Basis Keuze",
        gz: [120.58, 241.43],
        ov: [111.89, 203.53],
    },
    {
        d: "VGZ \u2013 VGZ Eigen Keuze",
        gz: [137.81, 275.92],
        ov: [127.87, 232.61],
    },
    {
        d: "VGZ \u2013 VGZ Ruime Keuze",
        gz: [137.81, 275.92],
        ov: [127.87, 232.61],
    },
    {
        d: "VinkVink \u2013 VinkVink Basis",
        gz: [126.0, 252.28],
        ov: [116.92, 212.68],
    },
    {
        d: "VVAA \u2013 Zorgverzekering Basis",
        gz: [135.39, 271.58],
        ov: [125.76, 228.81],
    },
    {
        d: "ZEKUR \u2013 Gewoon Zekur Zorg Basis",
        gz: [137.81, 275.92],
        ov: [127.87, 232.61],
    },
    {
        d: "Zekur \u2013 Gewoon Zekur zorg plus",
        gz: [146.42, 293.16],
        ov: [135.87, 247.15],
    },
    {
        d: "Zilveren Kruis \u2013 Basis Exclusief",
        gz: [145.53, 295.91],
        ov: [147.19, 262.18],
    },
    {
        d: "Zilveren Kruis \u2013 Basis Start",
        gz: [119.85, 243.69],
        ov: [121.21, 215.92],
    },
    {
        d: "Zilveren Kruis \u2013 Basis Zeker",
        gz: [128.41, 261.1],
        ov: [129.87, 231.34],
    },
    {
        d: "Zilveren Kruis \u2013 ZieZo Basis",
        gz: [128.41, 261.1],
        ov: [129.87, 231.34],
    },
    {
        d: "Zorg en zekerheid \u2013 Zorg Gemak polis",
        gz: [124.25, 248.78],
        ov: [115.3, 209.73],
    },
    {
        d: "Zorg en zekerheid \u2013 Zorg Vrij Polis",
        gz: [142.0, 284.32],
        ov: [131.77, 239.69],
    },
    {
        d: "Zorg en zekerheid \u2013 Zorg Zeker Polis",
        gz: [142.0, 284.32],
        ov: [131.77, 239.69],
    },
    {
        d: "Zorgzaam \u2013 Zorgzaam Ruime Keuze",
        gz: [137.81, 275.92],
        ov: [127.87, 232.61],
    },
]
// ── NZA REFERENCE TARIFFS ──
const NZA = {
    gz: { beh: 201.71, diag: 403.86 },
    overig: { beh: 187.17, diag: 340.47 },
}
const DUR = {
    gz: { beh: "45 min", diag: "90 min" },
    overig: { beh: "60 min", diag: "90 min" },
}
const BEROEPEN = [
    { id: "gz", label: "GZ-psycholoog" },
    { id: "overig", label: "Basispsycholoog" },
]
const BEROEP_IDS = BEROEPEN.map((b) => b.id)
function fmtEur(n: number): string {
    return "\u20AC\u00A0" + n.toFixed(2).replace(".", ",")
}
function colorWithAlpha(color: string, alpha: number): string {
    // Parse hex (#RGB, #RRGGBB, #RRGGBBAA)
    const hex = color.replace("#", "")
    if (/^[0-9a-fA-F]{3,8}$/.test(hex)) {
        const r =
            hex.length <= 4
                ? parseInt(hex[0] + hex[0], 16)
                : parseInt(hex.slice(0, 2), 16)
        const g =
            hex.length <= 4
                ? parseInt(hex[1] + hex[1], 16)
                : parseInt(hex.slice(2, 4), 16)
        const b =
            hex.length <= 4
                ? parseInt(hex[2] + hex[2], 16)
                : parseInt(hex.slice(4, 6), 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    // Parse rgb/rgba
    const m = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (m) return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`
    return color
}
// ── ERROR BOUNDARY: Recover from Google Translate DOM mutations ──
class TranslateSafeBoundary extends Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    state = { hasError: false }
    private recoveryCount = 0
    static getDerivedStateFromError() {
        return { hasError: true }
    }
    componentDidCatch() {
        // Google Translate wraps text in <font> tags, breaking React's DOM.
        // Re-render after a tick to restore the component (max 3 retries).
        if (this.recoveryCount < 3) {
            this.recoveryCount++
            setTimeout(() => this.setState({ hasError: false }), 0)
        }
    }
    render() {
        if (this.state.hasError) return null
        return this.props.children
    }
}
function CheckIcon() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            style={{ marginRight: 6, flexShrink: 0 }}
        >
            <path
                d="M2.5 7.5L5.5 10.5L11.5 3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}
// ── MAIN COMPONENT ──
export default function TarievenCalculator({
    mobileBreakpoint = 640,
    sectionGap = 56,
    cardGap = 40,
    // Font — ControlType.Font returns a style object; spread it via ...font
    //@ts-ignore
    font = { fontFamily: "Google Sans", fontWeight: 400 } as Record<
        string,
        any
    >,
    // Card area background (the bottom results section)
    cardAreaBg = "transparent",
    // Typography
    labelColor = "#364153",
    labelSize = 16,
    placeholderColor = "#7b7b7b",
    // Dropdown
    dropdownBg = "#ffffff",
    dropdownBorder = "#d1d5dc",
    dropdownRadius = 10,
    dropdownHeight = 47,
    // Pills
    accentColor = "#7956F3",
    pillHeight = 40,
    pillFontSize = 14,
    // Cards
    cardRadius = 10,
    badgeRadius = 8,
    badgePadding = 16,
    badgeLabelSize = 12,
    badgeValueSize = 24,
    behColor = "#7956F3",
    diagColor = "#F27CA4",
    behEmptyBg = "#f3f0ff",
    behEmptyColor = "#7956F3",
    diagEmptyBg = "#fef0f5",
    diagEmptyColor = "#F27CA4",
    naBg = "#fce4ec",
    // Breakdown titles
    behTitleColor = "#7956F3",
    diagTitleColor = "#F27CA4",
    // Breakdown section
    breakdownBg = "#fafafa",
    breakdownGap = 8,
    breakdownColumnGap = 40,
    // Text layers — all editable from Framer
    polisLabel = "Zorgverzekeraar & polis",
    behandelaarLabel = "Type behandelaar",
    searchPlaceholder = "Zoek op verzekeraar of polisnaam (bijv. CZ Natura)",
    selectPlaceholder = "Kies je verzekeraar...",
    noResultsText = "Geen verzekeraar gevonden. Controleer de spelling.",
    behandelingTitle = "Behandeling",
    diagnostiekTitle = "Diagnostiek",
    badgeLabel = "Jouw eigen bijdrage",
    breakdownLabel = "Hoe is dit berekend?",
    // States & copy
    naText = "Niet beschikbaar",
    naOpacity = 0.5,
    // Disclaimer — updated to 2026
    disclaimerText = "Indicatie o.b.v. NZa-tarieven 2026. Vergoeding kan per polis afwijken. Eigen risico niet meegenomen.",
    // Canvas preview — pre-fill selections so designers see results in Framer
    previewPolisIdx = -1 as number,
    previewBeroep = "" as string,
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isMobile, setIsMobile] = useState(false)
    const [polisIdx, setPolisIdx] = useState<number | null>(
        previewPolisIdx >= 0 ? previewPolisIdx : null
    )
    const [beroep, setBeroep] = useState<string | null>(previewBeroep || null)
    const [searchQuery, setSearchQuery] = useState(
        previewPolisIdx >= 0 && previewPolisIdx < P.length
            ? P[previewPolisIdx].d
            : ""
    )
    const [isOpen, setIsOpen] = useState(false)
    const [highlightIdx, setHighlightIdx] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [showBreakdown, setShowBreakdown] = useState(false)
    const [hoveredPill, setHoveredPill] = useState<string | null>(null)
    const breakdownContentRef = useRef<HTMLDivElement>(null)
    const [breakdownHeight, setBreakdownHeight] = useState(0)
    // Measure breakdown content height for animated reveal
    useEffect(() => {
        if (showBreakdown && breakdownContentRef.current) {
            setBreakdownHeight(breakdownContentRef.current.scrollHeight)
        }
    }, [showBreakdown, isMobile, breakdownColumnGap, polisIdx, beroep])
    // Extract fontFamily from the ControlType.Font style object
    const fontFam =
        typeof font === "string"
            ? font
            : font?.fontFamily || "Google Sans, sans-serif"
    const allPolicies = useMemo(() => P.map((p, i) => ({ ...p, idx: i })), [])
    const filtered = useMemo(() => {
        if (
            !searchQuery.trim() ||
            (polisIdx !== null && searchQuery === P[polisIdx].d)
        )
            return allPolicies
        const q = searchQuery.toLowerCase()
        return allPolicies.filter((p) => p.d.toLowerCase().includes(q))
    }, [searchQuery, polisIdx, allPolicies])
    useEffect(() => {
        if (highlightIdx >= 0 && listRef.current) {
            const item = listRef.current.children[highlightIdx] as HTMLElement
            if (item) item.scrollIntoView({ block: "nearest" })
        }
    }, [highlightIdx])
    const isMobileRef = useRef(false)
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const BUFFER = 40
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const w = entry.contentRect.width
                const shouldMobile = isMobileRef.current
                    ? w < mobileBreakpoint + BUFFER
                    : w < mobileBreakpoint
                if (shouldMobile !== isMobileRef.current) {
                    isMobileRef.current = shouldMobile
                    setIsMobile(shouldMobile)
                }
            }
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [mobileBreakpoint])
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])
    const hasSelection = polisIdx !== null && beroep !== null
    // ── Calculation ──
    let behNza = 0,
        behVerg = 0,
        behDiff = 0
    let diagNza = 0,
        diagVerg = 0,
        diagDiff: number | null = null
    let dur = DUR.gz
    if (hasSelection) {
        const polis = P[polisIdx]
        const key = beroep === "gz" ? "gz" : "ov"
        const vals = polis[key] as [number, number | null]
        const nza = NZA[beroep]
        dur = DUR[beroep]
        behNza = nza.beh
        behVerg = vals[0]
        behDiff = nza.beh - vals[0]
        if (vals[1] !== null) {
            diagNza = nza.diag
            diagVerg = vals[1]
            diagDiff = nza.diag - vals[1]
        }
    }
    function handleKeyDown(e: React.KeyboardEvent) {
        if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
            setIsOpen(true)
            setHighlightIdx(0)
            e.preventDefault()
            return
        }
        if (!isOpen) return
        if (e.key === "ArrowDown") {
            e.preventDefault()
            setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1))
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setHighlightIdx((i) => Math.max(i - 1, 0))
        } else if (
            e.key === "Enter" &&
            highlightIdx >= 0 &&
            highlightIdx < filtered.length
        ) {
            e.preventDefault()
            selectPolis(filtered[highlightIdx].idx)
        } else if (e.key === "Escape") {
            setIsOpen(false)
        }
    }
    function selectPolis(idx: number) {
        setPolisIdx(idx)
        setSearchQuery(P[idx].d)
        setIsOpen(false)
        setHighlightIdx(-1)
    }
    function resetAll() {
        setPolisIdx(null)
        setBeroep(null)
        setSearchQuery("")
        setShowBreakdown(false)
        setBreakdownHeight(0)
    }
    const smallText: React.CSSProperties = {
        fontSize: 11,
        fontWeight: 400,
        color: "#9ca3af",
        fontFamily: fontFam,
        lineHeight: 1.4,
    }
    return (
        <TranslateSafeBoundary>
            <section
                ref={containerRef}
                lang="nl"
                className="tarCalc"
                aria-label="Eigen bijdrage calculator \u2013 Specialistische GGZ"
                itemScope
                itemType="https://schema.org/WebApplication"
                style={{
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    fontFamily: fontFam,
                    display: "flex",
                    flexDirection: "column",
                    gap: sectionGap,
                    overflow: "visible",
                }}
            >
                <style>{`
                .tarCalc button:focus-visible,
                .tarCalc input:focus-visible,
                .tarCalc select:focus-visible {
                    outline: 2px solid ${accentColor};
                    outline-offset: 2px;
                }
                .tarCalc, .tarCalc > div, .tarCalc > div > div {
                    overflow: visible !important;
                }
            `}</style>
                <meta
                    itemProp="name"
                    content="Eigen Bijdrage Calculator Specialistische GGZ"
                />
                <meta
                    itemProp="applicationCategory"
                    content="HealthApplication"
                />
                {/* ── INPUTS SECTION ── */}
                <div
                    role="form"
                    aria-label="Selecteer polis en type behandelaar"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 24,
                    }}
                >
                    <h2
                        style={{
                            position: "absolute",
                            width: 1,
                            height: 1,
                            overflow: "hidden",
                            clipPath: "inset(50%)",
                            margin: 0,
                            padding: 0,
                            border: 0,
                        }}
                    >
                        Eigen bijdrage berekenen
                    </h2>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                        }}
                    >
                        <label
                            htmlFor={isMobile ? "polis-native" : "polis-search"}
                            style={{
                                fontSize: labelSize,
                                fontWeight: 600,
                                color: labelColor,
                                lineHeight: "16px",
                                fontFamily: fontFam,
                            }}
                        >
                            {polisLabel}
                        </label>
                        {isMobile ? (
                            <div style={{ position: "relative" }}>
                                <select
                                    id="polis-native"
                                    aria-label={polisLabel}
                                    value={polisIdx ?? ""}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        setPolisIdx(
                                            val === "" ? null : Number(val)
                                        )
                                        setSearchQuery(
                                            val === "" ? "" : P[Number(val)].d
                                        )
                                    }}
                                    style={{
                                        width: "100%",
                                        height: dropdownHeight,
                                        padding: "0 44px 0 18px",
                                        borderRadius: dropdownRadius,
                                        border: `1px solid ${dropdownBorder}`,
                                        fontSize: 14,
                                        fontFamily: fontFam,
                                        fontWeight: 400,
                                        color:
                                            polisIdx === null
                                                ? placeholderColor
                                                : labelColor,
                                        backgroundColor: dropdownBg,
                                        outline: "none",
                                        boxSizing: "border-box",
                                        appearance: "none",
                                        WebkitAppearance: "none",
                                    }}
                                >
                                    <option value="">
                                        {selectPlaceholder}
                                    </option>
                                    {P.map((p, i) => (
                                        <option key={i} value={i}>
                                            {p.d}
                                        </option>
                                    ))}
                                </select>
                                <svg
                                    style={{
                                        position: "absolute",
                                        right: 16,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        pointerEvents: "none",
                                    }}
                                    width="14"
                                    height="8"
                                    viewBox="0 0 14 8"
                                    fill="none"
                                >
                                    <path
                                        d="M1 1L7 7L13 1"
                                        stroke={placeholderColor}
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        ) : (
                            <div
                                ref={dropdownRef}
                                style={{ position: "relative" }}
                            >
                                <input
                                    ref={inputRef}
                                    id="polis-search"
                                    type="text"
                                    role="combobox"
                                    aria-expanded={isOpen}
                                    aria-haspopup="listbox"
                                    aria-autocomplete="list"
                                    aria-controls="polis-listbox"
                                    placeholder={searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        setIsOpen(true)
                                        setHighlightIdx(0)
                                        if (polisIdx !== null) setPolisIdx(null)
                                    }}
                                    onFocus={() => {
                                        setIsOpen(true)
                                        setHighlightIdx(-1)
                                        if (
                                            polisIdx !== null &&
                                            inputRef.current
                                        ) {
                                            inputRef.current.select()
                                        }
                                    }}
                                    onKeyDown={handleKeyDown}
                                    style={{
                                        width: "100%",
                                        height: dropdownHeight,
                                        padding: "0 44px 0 18px",
                                        borderRadius: dropdownRadius,
                                        border: `1px solid ${dropdownBorder}`,
                                        fontSize: 14,
                                        fontFamily: fontFam,
                                        fontWeight: 400,
                                        color: searchQuery
                                            ? labelColor
                                            : placeholderColor,
                                        backgroundColor: dropdownBg,
                                        outline: "none",
                                        boxSizing: "border-box",
                                    }}
                                />
                                <svg
                                    onClick={() => {
                                        setIsOpen(!isOpen)
                                        inputRef.current?.focus()
                                    }}
                                    style={{
                                        position: "absolute",
                                        right: 16,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        cursor: "pointer",
                                    }}
                                    width="14"
                                    height="8"
                                    viewBox="0 0 14 8"
                                    fill="none"
                                >
                                    <path
                                        d="M1 1L7 7L13 1"
                                        stroke={placeholderColor}
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                {isOpen && filtered.length > 0 && (
                                    <ul
                                        ref={listRef}
                                        id="polis-listbox"
                                        role="listbox"
                                        aria-label="Beschikbare polissen"
                                        onMouseDown={(e) => e.preventDefault()}
                                        style={{
                                            position: "absolute",
                                            top: dropdownHeight + 4,
                                            left: 0,
                                            right: 0,
                                            maxHeight: 260,
                                            overflowY: "auto",
                                            WebkitOverflowScrolling: "touch",
                                            margin: 0,
                                            padding: "4px 0",
                                            listStyle: "none",
                                            backgroundColor: "#fff",
                                            border: `1px solid ${dropdownBorder}`,
                                            borderRadius: dropdownRadius,
                                            boxShadow:
                                                "0 4px 16px rgba(0,0,0,0.12)",
                                            zIndex: 100,
                                        }}
                                    >
                                        {filtered.map((p, i) => (
                                            <li
                                                key={p.idx}
                                                role="option"
                                                aria-selected={
                                                    polisIdx === p.idx
                                                }
                                                onMouseUp={() =>
                                                    selectPolis(p.idx)
                                                }
                                                onMouseEnter={() =>
                                                    setHighlightIdx(i)
                                                }
                                                style={{
                                                    padding: "10px 18px",
                                                    fontSize: 14,
                                                    fontFamily: fontFam,
                                                    cursor: "pointer",
                                                    color: labelColor,
                                                    backgroundColor:
                                                        i === highlightIdx
                                                            ? "#f3f0ff"
                                                            : polisIdx === p.idx
                                                              ? "#f0ecff"
                                                              : "transparent",
                                                    fontWeight:
                                                        polisIdx === p.idx
                                                            ? 600
                                                            : 400,
                                                }}
                                            >
                                                {p.d}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {isOpen && filtered.length === 0 && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: dropdownHeight + 4,
                                            left: 0,
                                            right: 0,
                                            padding: "14px 18px",
                                            fontSize: 14,
                                            color: placeholderColor,
                                            backgroundColor: "#fff",
                                            border: `1px solid ${dropdownBorder}`,
                                            borderRadius: dropdownRadius,
                                            boxShadow:
                                                "0 4px 16px rgba(0,0,0,0.12)",
                                            zIndex: 100,
                                            textAlign: "center",
                                            fontFamily: fontFam,
                                        }}
                                    >
                                        {noResultsText}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                fontSize: labelSize,
                                fontWeight: 600,
                                color: labelColor,
                                lineHeight: "16px",
                                fontFamily: fontFam,
                            }}
                        >
                            {behandelaarLabel}
                        </div>
                        <div
                            role="radiogroup"
                            aria-label={behandelaarLabel}
                            style={{
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            {BEROEPEN.map((b) => {
                                const isActive = beroep === b.id
                                const isHovered =
                                    hoveredPill === b.id && !isActive
                                return (
                                    <button
                                        key={b.id}
                                        role="radio"
                                        aria-checked={isActive}
                                        tabIndex={
                                            isActive ||
                                            (!beroep && b.id === BEROEPEN[0].id)
                                                ? 0
                                                : -1
                                        }
                                        onClick={() => setBeroep(b.id)}
                                        onKeyDown={(e) => {
                                            const cur = BEROEP_IDS.indexOf(b.id)
                                            let next = -1
                                            if (
                                                e.key === "ArrowRight" ||
                                                e.key === "ArrowDown"
                                            ) {
                                                next =
                                                    (cur + 1) %
                                                    BEROEP_IDS.length
                                            } else if (
                                                e.key === "ArrowLeft" ||
                                                e.key === "ArrowUp"
                                            ) {
                                                next =
                                                    (cur -
                                                        1 +
                                                        BEROEP_IDS.length) %
                                                    BEROEP_IDS.length
                                            }
                                            if (next >= 0) {
                                                e.preventDefault()
                                                setBeroep(BEROEP_IDS[next])
                                                const group =
                                                    e.currentTarget
                                                        .parentElement
                                                const btn = group?.children[
                                                    next
                                                ] as HTMLElement
                                                btn?.focus()
                                            }
                                        }}
                                        onMouseEnter={() =>
                                            setHoveredPill(b.id)
                                        }
                                        onMouseLeave={() =>
                                            setHoveredPill(null)
                                        }
                                        style={{
                                            height: pillHeight,
                                            padding: "0 20px",
                                            borderRadius: 9999,
                                            border: isActive
                                                ? `2px solid ${accentColor}`
                                                : `1px solid ${accentColor}`,
                                            fontSize: pillFontSize,
                                            fontWeight: isActive ? 600 : 500,
                                            fontFamily: fontFam,
                                            cursor: "pointer",
                                            backgroundColor: isActive
                                                ? accentColor
                                                : isHovered
                                                  ? colorWithAlpha(
                                                        accentColor,
                                                        0.12
                                                    )
                                                  : "transparent",
                                            color: isActive
                                                ? "#ffffff"
                                                : accentColor,
                                            transition:
                                                "background-color 0.2s ease, color 0.2s ease, border 0.2s ease, transform 0.15s ease",
                                            transform: isHovered
                                                ? "translateY(-1px)"
                                                : "translateY(0)",
                                            lineHeight: "20px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {isActive && <CheckIcon />}
                                        {b.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
                {/* ── RESULT CARDS ── */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        backgroundColor: cardAreaBg,
                        borderRadius: cardRadius,
                        padding: cardAreaBg !== "transparent" ? 16 : 0,
                        boxSizing: "border-box",
                    }}
                >
                    <div
                        aria-live="polite"
                        aria-atomic="true"
                        style={{
                            display: "flex",
                            flexDirection: isMobile ? "column" : "row",
                            gap: isMobile ? 20 : cardGap,
                        }}
                    >
                        {/* Behandeling Card */}
                        <article
                            aria-label={
                                hasSelection
                                    ? `${behandelingTitle}: Eigen bijdrage ${fmtEur(behDiff)}`
                                    : `${behandelingTitle}: nog niet berekend`
                            }
                            style={{
                                flex: 1,
                                minWidth: 0,
                                boxSizing: "border-box",
                            }}
                        >
                            {hasSelection ? (
                                <div
                                    style={{
                                        position: "relative",
                                        backgroundColor: behColor,
                                        borderRadius: badgeRadius,
                                        padding: badgePadding,
                                        color: "#fff",
                                        textAlign: "center",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 4,
                                        transition:
                                            "background-color 0.3s ease, opacity 0.3s ease, transform 0.3s ease",
                                        opacity: 1,
                                        transform: "scale(1)",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            textTransform: "none",
                                            lineHeight: "14px",
                                            fontFamily: fontFam,
                                            opacity: 0.85,
                                            position: "absolute",
                                            top: 10,
                                            left: 14,
                                        }}
                                    >
                                        {behandelingTitle}
                                    </div>
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: 8,
                                            right: 10,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: "2px 8px",
                                            borderRadius: 9999,
                                            fontSize: 10,
                                            fontWeight: 600,
                                            backgroundColor:
                                                "rgba(255,255,255,0.92)",
                                            color: behColor,
                                            lineHeight: "14px",
                                            fontFamily: fontFam,
                                        }}
                                    >
                                        {dur.beh}
                                    </span>
                                    <div
                                        style={{
                                            fontSize: badgeLabelSize,
                                            fontWeight: 600,
                                            textTransform: "none",
                                            lineHeight: "16px",
                                            fontFamily: fontFam,
                                            marginTop: 12,
                                        }}
                                    >
                                        {badgeLabel}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: badgeValueSize,
                                            fontWeight: 700,
                                            lineHeight: "28px",
                                            letterSpacing: "-0.44px",
                                            fontFamily: fontFam,
                                        }}
                                    >
                                        {fmtEur(behDiff)}
                                    </div>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        position: "relative",
                                        backgroundColor: behEmptyBg,
                                        borderRadius: badgeRadius,
                                        padding: badgePadding,
                                        textAlign: "center",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2,
                                        transition:
                                            "background-color 0.3s ease, opacity 0.3s ease",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            textTransform: "none",
                                            lineHeight: "14px",
                                            fontFamily: fontFam,
                                            opacity: 0.5,
                                            position: "absolute",
                                            top: 10,
                                            left: 14,
                                            color: behEmptyColor,
                                        }}
                                    >
                                        {behandelingTitle}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: badgeLabelSize,
                                            fontWeight: 600,
                                            textTransform: "none",
                                            lineHeight: "16px",
                                            color: behEmptyColor,
                                            fontFamily: fontFam,
                                            opacity: 0.7,
                                            marginTop: 12,
                                        }}
                                    >
                                        {badgeLabel}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 15,
                                            fontWeight: 600,
                                            lineHeight: "24px",
                                            color: behEmptyColor,
                                            fontFamily: fontFam,
                                            opacity: 0.55,
                                        }}
                                    >
                                        Maak een keuze
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 400,
                                            lineHeight: "16px",
                                            color: behEmptyColor,
                                            fontFamily: fontFam,
                                            opacity: 0.4,
                                            marginTop: 2,
                                        }}
                                    >
                                        Kies polis + behandelaar
                                    </div>
                                </div>
                            )}
                        </article>
                        {/* Diagnostiek Card */}
                        <article
                            aria-label={
                                hasSelection
                                    ? diagDiff !== null
                                        ? `${diagnostiekTitle}: Eigen bijdrage ${fmtEur(diagDiff)}`
                                        : `${diagnostiekTitle}: ${naText}`
                                    : `${diagnostiekTitle}: nog niet berekend`
                            }
                            style={{
                                flex: 1,
                                minWidth: 0,
                                boxSizing: "border-box",
                            }}
                        >
                            {hasSelection && diagDiff !== null ? (
                                <div
                                    style={{
                                        position: "relative",
                                        backgroundColor: diagColor,
                                        borderRadius: badgeRadius,
                                        padding: badgePadding,
                                        color: "#fff",
                                        textAlign: "center",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 4,
                                        transition:
                                            "background-color 0.3s ease, opacity 0.3s ease, transform 0.3s ease",
                                        opacity: 1,
                                        transform: "scale(1)",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            textTransform: "none",
                                            lineHeight: "14px",
                                            fontFamily: fontFam,
                                            opacity: 0.85,
                                            position: "absolute",
                                            top: 10,
                                            left: 14,
                                        }}
                                    >
                                        {diagnostiekTitle}
                                    </div>
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: 8,
                                            right: 10,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: "2px 8px",
                                            borderRadius: 9999,
                                            fontSize: 10,
                                            fontWeight: 600,
                                            backgroundColor:
                                                "rgba(255,255,255,0.92)",
                                            color: diagColor,
                                            lineHeight: "14px",
                                            fontFamily: fontFam,
                                        }}
                                    >
                                        {dur.diag}
                                    </span>
                                    <div
                                        style={{
                                            fontSize: badgeLabelSize,
                                            fontWeight: 600,
                                            textTransform: "none",
                                            lineHeight: "16px",
                                            fontFamily: fontFam,
                                            marginTop: 12,
                                        }}
                                    >
                                        {badgeLabel}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: badgeValueSize,
                                            fontWeight: 700,
                                            lineHeight: "28px",
                                            letterSpacing: "-0.44px",
                                            fontFamily: fontFam,
                                        }}
                                    >
                                        {fmtEur(diagDiff)}
                                    </div>
                                </div>
                            ) : hasSelection && diagDiff === null ? (
                                <div
                                    role="status"
                                    style={{
                                        position: "relative",
                                        backgroundColor: naBg,
                                        borderRadius: badgeRadius,
                                        padding: badgePadding,
                                        textAlign: "center",
                                        opacity: naOpacity,
                                        transition:
                                            "background-color 0.3s ease, opacity 0.3s ease",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            textTransform: "none",
                                            lineHeight: "14px",
                                            fontFamily: fontFam,
                                            opacity: 0.5,
                                            position: "absolute",
                                            top: 10,
                                            left: 14,
                                            color: diagColor,
                                        }}
                                    >
                                        {diagnostiekTitle}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: badgeLabelSize,
                                            fontWeight: 600,
                                            color: diagColor,
                                            textTransform: "none",
                                            fontFamily: fontFam,
                                            marginTop: 12,
                                        }}
                                    >
                                        {naText}
                                    </div>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        position: "relative",
                                        backgroundColor: diagEmptyBg,
                                        borderRadius: badgeRadius,
                                        padding: badgePadding,
                                        textAlign: "center",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2,
                                        transition:
                                            "background-color 0.3s ease, opacity 0.3s ease",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            textTransform: "none",
                                            lineHeight: "14px",
                                            fontFamily: fontFam,
                                            opacity: 0.5,
                                            position: "absolute",
                                            top: 10,
                                            left: 14,
                                            color: diagEmptyColor,
                                        }}
                                    >
                                        {diagnostiekTitle}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: badgeLabelSize,
                                            fontWeight: 600,
                                            textTransform: "none",
                                            lineHeight: "16px",
                                            color: diagEmptyColor,
                                            fontFamily: fontFam,
                                            opacity: 0.7,
                                            marginTop: 12,
                                        }}
                                    >
                                        {badgeLabel}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 15,
                                            fontWeight: 600,
                                            lineHeight: "24px",
                                            color: diagEmptyColor,
                                            fontFamily: fontFam,
                                            opacity: 0.55,
                                        }}
                                    >
                                        Maak een keuze
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 400,
                                            lineHeight: "16px",
                                            color: diagEmptyColor,
                                            fontFamily: fontFam,
                                            opacity: 0.4,
                                            marginTop: 2,
                                        }}
                                    >
                                        Kies polis + behandelaar
                                    </div>
                                </div>
                            )}
                        </article>
                    </div>
                    {/* ── PROGRESSIVE DISCLOSURE ── */}
                    {hasSelection && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: breakdownGap,
                            }}
                        >
                            <button
                                onClick={() => setShowBreakdown(!showBreakdown)}
                                aria-expanded={showBreakdown}
                                aria-controls="breakdown-content"
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: accentColor,
                                    fontFamily: fontFam,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    alignSelf: "flex-start",
                                }}
                            >
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    style={{
                                        transform: showBreakdown
                                            ? "rotate(90deg)"
                                            : "rotate(0deg)",
                                        transition: "transform 0.15s",
                                    }}
                                >
                                    <path
                                        d="M4.5 2.5L8 6L4.5 9.5"
                                        stroke={accentColor}
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                {breakdownLabel}
                            </button>
                            <div
                                style={{
                                    overflow: "hidden",
                                    maxHeight: showBreakdown
                                        ? breakdownHeight + 24
                                        : 0,
                                    opacity: showBreakdown ? 1 : 0,
                                    transition:
                                        "max-height 0.3s ease, opacity 0.25s ease",
                                }}
                            >
                                <div
                                    id="breakdown-content"
                                    ref={breakdownContentRef}
                                    style={{
                                        display: "flex",
                                        flexDirection: isMobile
                                            ? "column"
                                            : "row",
                                        gap: isMobile ? 12 : breakdownColumnGap,
                                        padding: "12px 16px",
                                        backgroundColor: breakdownBg,
                                        borderRadius: cardRadius,
                                        fontSize: 13,
                                        fontFamily: fontFam,
                                        color: labelColor,
                                        lineHeight: 1.6,
                                    }}
                                >
                                    <div
                                        style={{
                                            flex: 1,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 2,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                fontSize: 11,
                                                textTransform: "none",
                                                color: behTitleColor,
                                                marginBottom: 2,
                                            }}
                                        >
                                            {behandelingTitle}
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <span>NZa-tarief</span>
                                            <span>{fmtEur(behNza)}</span>
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <span>Vergoeding verzekeraar</span>
                                            <span>{fmtEur(behVerg)}</span>
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                fontWeight: 700,
                                                borderTop: "1px solid #e5e7eb",
                                                paddingTop: 4,
                                                marginTop: 2,
                                            }}
                                        >
                                            <span>Jij betaalt</span>
                                            <span>{fmtEur(behDiff)}</span>
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            flex: 1,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 2,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                fontSize: 11,
                                                textTransform: "none",
                                                color: diagTitleColor,
                                                marginBottom: 2,
                                            }}
                                        >
                                            {diagnostiekTitle}
                                        </div>
                                        {diagDiff !== null ? (
                                            <>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                    }}
                                                >
                                                    <span>NZa-tarief</span>
                                                    <span>
                                                        {fmtEur(diagNza)}
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                    }}
                                                >
                                                    <span>
                                                        Vergoeding verzekeraar
                                                    </span>
                                                    <span>
                                                        {fmtEur(diagVerg)}
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        fontWeight: 700,
                                                        borderTop:
                                                            "1px solid #e5e7eb",
                                                        paddingTop: 4,
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    <span>Jij betaalt</span>
                                                    <span>
                                                        {fmtEur(diagDiff)}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div
                                                style={{
                                                    color: placeholderColor,
                                                    fontStyle: "italic",
                                                }}
                                            >
                                                {naText}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* ── DISCLAIMER + RESET ── */}
                    {hasSelection && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 10,
                            }}
                        >
                            <p
                                style={{
                                    ...smallText,
                                    textAlign: "center",
                                    margin: 0,
                                    padding: 0,
                                }}
                            >
                                {disclaimerText}
                            </p>
                            <button
                                onClick={resetAll}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "4px 0",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: placeholderColor,
                                    fontFamily: fontFam,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    transition: "color 0.15s ease",
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.color = accentColor)
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.color =
                                        placeholderColor)
                                }
                            >
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                >
                                    <path
                                        d="M1.5 1.5V4.5H4.5"
                                        stroke="currentColor"
                                        strokeWidth="1.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M2.09 7.5A4.5 4.5 0 1 0 2.5 4L1.5 4.5"
                                        stroke="currentColor"
                                        strokeWidth="1.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                Wis keuzes
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </TranslateSafeBoundary>
    )
}
// ── FRAMER PROPERTY CONTROLS ──
addPropertyControls(TarievenCalculator, {
    // ── 1. Font ──
    //@ts-ignore
    font: { type: ControlType.Font, title: "Font", controls: "extended" },
    // ── 2. Layout & Background ──
    cardAreaBg: {
        type: ControlType.Color,
        title: "Card Area BG",
        defaultValue: "transparent",
        description: "Background of the results/cards section",
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Stack Below",
        defaultValue: 640,
        min: 320,
        max: 1024,
        step: 10,
        description: "Width (px) to stack cards vertically",
    },
    sectionGap: {
        type: ControlType.Number,
        title: "Section Gap",
        defaultValue: 56,
        min: 16,
        max: 120,
        step: 4,
    },
    cardGap: {
        type: ControlType.Number,
        title: "Card Gap",
        defaultValue: 40,
        min: 8,
        max: 80,
        step: 4,
    },
    // ── 3. Typography ──
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#364153",
    },
    labelSize: {
        type: ControlType.Number,
        title: "Label Size",
        defaultValue: 16,
        min: 10,
        max: 24,
        step: 1,
    },
    placeholderColor: {
        type: ControlType.Color,
        title: "Placeholder",
        defaultValue: "#7b7b7b",
    },
    // ── 4. Dropdown ──
    dropdownBg: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#ffffff",
    },
    dropdownBorder: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#d1d5dc",
    },
    dropdownRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 10,
        min: 0,
        max: 24,
        step: 2,
    },
    dropdownHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 47,
        min: 32,
        max: 64,
        step: 1,
    },
    // ── 5. Pills ──
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#7956F3",
        description: "Active pill fill & inactive border",
    },
    pillHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 40,
        min: 28,
        max: 56,
        step: 2,
    },
    pillFontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 14,
        min: 10,
        max: 20,
        step: 1,
    },
    // ── 6. Cards ──
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 10,
        min: 0,
        max: 24,
        step: 2,
    },
    badgeRadius: {
        type: ControlType.Number,
        title: "Badge Radius",
        defaultValue: 8,
        min: 0,
        max: 20,
        step: 2,
    },
    badgePadding: {
        type: ControlType.Number,
        title: "Badge Pad",
        defaultValue: 16,
        min: 4,
        max: 40,
        step: 4,
    },
    badgeLabelSize: {
        type: ControlType.Number,
        title: "Label Size",
        defaultValue: 12,
        min: 8,
        max: 18,
        step: 1,
    },
    badgeValueSize: {
        type: ControlType.Number,
        title: "Value Size",
        defaultValue: 24,
        min: 14,
        max: 40,
        step: 1,
    },
    behColor: {
        type: ControlType.Color,
        title: "Behandeling",
        defaultValue: "#7956F3",
        description: "Active badge color",
    },
    diagColor: {
        type: ControlType.Color,
        title: "Diagnostiek",
        defaultValue: "#F27CA4",
        description: "Active badge color",
    },
    behEmptyBg: {
        type: ControlType.Color,
        title: "Beh Empty BG",
        defaultValue: "#f3f0ff",
        description: "Empty state badge background",
    },
    behEmptyColor: {
        type: ControlType.Color,
        title: "Beh Empty Text",
        defaultValue: "#7956F3",
        description: "Empty state badge text color",
    },
    diagEmptyBg: {
        type: ControlType.Color,
        title: "Diag Empty BG",
        defaultValue: "#fef0f5",
        description: "Empty state badge background",
    },
    diagEmptyColor: {
        type: ControlType.Color,
        title: "Diag Empty Text",
        defaultValue: "#F27CA4",
        description: "Empty state badge text color",
    },
    naBg: {
        type: ControlType.Color,
        title: "N/A BG",
        defaultValue: "#fce4ec",
        description: "Niet beschikbaar badge background",
    },
    // ── Breakdown Titles ──
    behTitleColor: {
        type: ControlType.Color,
        title: "Beh. Breakdown",
        defaultValue: "#7956F3",
        description: "Behandeling title in breakdown",
    },
    diagTitleColor: {
        type: ControlType.Color,
        title: "Diag. Breakdown",
        defaultValue: "#F27CA4",
        description: "Diagnostiek title in breakdown",
    },
    // ── Breakdown ──
    breakdownBg: {
        type: ControlType.Color,
        title: "Breakdown BG",
        defaultValue: "#fafafa",
        description: "Hoe is dit berekend background",
    },
    breakdownGap: {
        type: ControlType.Number,
        title: "Breakdown Gap",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 2,
        description: "Gap between button and content",
    },
    breakdownColumnGap: {
        type: ControlType.Number,
        title: "Breakdown Columns",
        defaultValue: 40,
        min: 0,
        max: 80,
        step: 4,
        description: "Gap between Behandeling & Diagnostiek columns",
    },
    // ── 7. Text Layers ──
    polisLabel: {
        type: ControlType.String,
        title: "Polis Label",
        defaultValue: "Zorgverzekeraar & polis",
    },
    behandelaarLabel: {
        type: ControlType.String,
        title: "Behandelaar Label",
        defaultValue: "Type behandelaar",
    },
    searchPlaceholder: {
        type: ControlType.String,
        title: "Search Placeholder",
        defaultValue: "Zoek op verzekeraar of polisnaam (bijv. CZ Natura)",
    },
    selectPlaceholder: {
        type: ControlType.String,
        title: "Select Placeholder",
        defaultValue: "Kies je verzekeraar...",
    },
    noResultsText: {
        type: ControlType.String,
        title: "No Results",
        defaultValue: "Geen verzekeraar gevonden. Controleer de spelling.",
    },
    behandelingTitle: {
        type: ControlType.String,
        title: "Beh. Title",
        defaultValue: "Behandeling",
    },
    diagnostiekTitle: {
        type: ControlType.String,
        title: "Diag. Title",
        defaultValue: "Diagnostiek",
    },
    badgeLabel: {
        type: ControlType.String,
        title: "Badge Label",
        defaultValue: "Jouw eigen bijdrage",
    },
    breakdownLabel: {
        type: ControlType.String,
        title: "Breakdown Label",
        defaultValue: "Hoe is dit berekend?",
    },
    // ── 8. States & Copy ──
    naText: {
        type: ControlType.String,
        title: "N/A Text",
        defaultValue: "Niet beschikbaar",
    },
    naOpacity: {
        type: ControlType.Number,
        title: "N/A Opacity",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
    },
    disclaimerText: {
        type: ControlType.String,
        title: "Disclaimer",
        defaultValue:
            "Indicatie o.b.v. NZa-tarieven 2026. Vergoeding kan per polis afwijken. Eigen risico niet meegenomen.",
    },
    // ── Canvas Preview ──
    previewPolisIdx: {
        type: ControlType.Number,
        title: "Preview Polis",
        defaultValue: -1,
        min: -1,
        max: P.length - 1,
        step: 1,
        description: "Pre-select a policy in the Framer canvas (-1 = none)",
    },
    previewBeroep: {
        type: ControlType.Enum,
        title: "Preview Beroep",
        defaultValue: "",
        options: ["", "gz", "overig"],
        optionTitles: ["None", "GZ-psycholoog", "Basispsycholoog"],
        description: "Pre-select a profession in the Framer canvas",
    },
})
