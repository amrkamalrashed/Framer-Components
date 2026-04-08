// SheVibesPreloader.tsx
// Full-screen percentage preloader with session gating for SheVibes
// Version: 1.1.0
//
// Changes from 1.0.0:
// [CHANGE 1] Added displayName for Framer panel clarity
// [CHANGE 2] Added typed Props interface replacing `props: any`
// [CHANGE 3] Added prefers-reduced-motion support (skip count-up and exit animation)
// [CHANGE 4] Added ARIA role="status" and aria-label="Loading" to overlay

import { useState, useEffect, useRef, createElement, CSSProperties } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

// ---------- Types ---------- [CHANGE 2]

interface Props {
    alwaysShow: boolean
    backgroundColor: string
    numberColor: string
    progressColor: string
    progressFillColor: string
    totalDuration: number
    exitDuration: number
    fontWeight: number
    sessionKey: string
    style: CSSProperties
}

function buildDigit(digit: number, fontSize: string, color: string, fontFamily: string, fontWeight: number, doAnimate: boolean, key: string) {
    var nums: any[] = []
    for (var i = 0; i <= 9; i++) {
        nums.push(
            createElement("div", {
                key: "n" + i,
                style: { height: "1em", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: "1" },
            }, String(i))
        )
    }
    return createElement("div", {
        key: key,
        style: {
            height: "1em",
            overflow: "hidden",
            display: "inline-block",
            fontSize: fontSize,
            color: color,
            fontFamily: fontFamily,
            fontWeight: fontWeight,
            lineHeight: "1",
        },
    },
        createElement("div", {
            style: {
                transform: "translateY(" + String(-digit * 10) + "%)",
                transition: doAnimate ? "transform 0.4s cubic-bezier(0.16,1,0.3,1)" : "none",
            },
        }, nums)
    )
}

/**
 * SheVibes Preloader
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 120
 * @framerIntrinsicHeight 40
 */
export default function SheVibesPreloader(props: Props) { // [CHANGE 2]
    var bg = props.backgroundColor || "rgb(122, 85, 243)"
    var nc = props.numberColor || "#FFFEF7"
    var pc = props.progressColor || "rgba(255, 254, 247, 0.15)"
    var pf = props.progressFillColor || "#FFFEF7"
    var dur = props.totalDuration || 2.8
    var ed = props.exitDuration || 0.8
    var sk = props.sessionKey || "sv-pre-v2"
    var fw = props.fontWeight || 600
    var ff = "Google Sans, system-ui, sans-serif"
    var alwaysShow = props.alwaysShow === true

    var raf = useRef(0)

    var phaseArr = useState("idle")
    var phase = phaseArr[0]
    var setPhase = phaseArr[1]

    var countArr = useState(0)
    var count = countArr[0]
    var setCount = countArr[1]

    var animArr = useState(false)
    var doAnim = animArr[0]
    var setDoAnim = animArr[1]

    var isCanvas = RenderTarget.current() === RenderTarget.canvas

    // [CHANGE 3] Detect prefers-reduced-motion
    var prefersReducedMotion =
        typeof window !== "undefined"
            ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
            : false

    // Counter animation
    useEffect(function () {
        if (phase !== "rev") return

        // [CHANGE 3] Skip count-up animation when reduced motion is preferred
        if (prefersReducedMotion) {
            setCount(100)
            setDoAnim(false)
            return
        }

        var timer = window.setTimeout(function () { setDoAnim(true) }, 50)
        var startT = 0
        var ms = dur * 1000

        function tick(ts: number) {
            if (!startT) startT = ts
            var p = Math.min((ts - startT) / ms, 1)
            var eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
            setCount(Math.round(eased * 100))
            if (p < 1) raf.current = requestAnimationFrame(tick)
        }

        raf.current = requestAnimationFrame(tick)
        return function () {
            cancelAnimationFrame(raf.current)
            clearTimeout(timer)
        }
    }, [phase, dur, prefersReducedMotion])

    // Session gate
    useEffect(function () {
        if (isCanvas) return
        if (typeof window === "undefined") return

        var shouldShow = false

        if (alwaysShow) {
            shouldShow = true
        } else {
            try {
                if (!sessionStorage.getItem(sk)) {
                    sessionStorage.setItem(sk, "true")
                    shouldShow = true
                }
            } catch (err) {
                shouldShow = false
            }
        }

        if (shouldShow) {
            document.body.style.overflow = "hidden"
            setPhase("rev")
            setCount(0)
            setDoAnim(false)

            // [CHANGE 3] When reduced motion is preferred, skip directly to done after duration
            if (prefersReducedMotion) {
                var t0 = window.setTimeout(function () {
                    document.body.style.overflow = ""
                    setPhase("done")
                }, dur * 1000 + 500)

                return function () {
                    clearTimeout(t0)
                    document.body.style.overflow = ""
                }
            }

            var t1 = window.setTimeout(function () {
                setPhase("exit")
            }, dur * 1000 + 500)

            var t2 = window.setTimeout(function () {
                document.body.style.overflow = ""
                setPhase("done")
            }, dur * 1000 + 500 + ed * 1000)

            return function () {
                clearTimeout(t1)
                clearTimeout(t2)
                cancelAnimationFrame(raf.current)
                document.body.style.overflow = ""
            }
        } else {
            setPhase("done")
        }

        return undefined
    }, [isCanvas, dur, ed, sk, alwaysShow, prefersReducedMotion])

    // Canvas placeholder
    if (isCanvas) {
        return (
            <div style={{
                width: 120, height: 40, display: "flex",
                alignItems: "center", justifyContent: "center", gap: 6,
                background: bg, borderRadius: 8,
                border: "1.5px dashed rgba(255,255,255,0.5)",
            }}>
                <span style={{ fontSize: 18, fontFamily: ff, color: nc, fontWeight: fw }}>100</span>
                <span style={{ fontSize: 9, fontFamily: ff, color: nc, opacity: 0.7 }}>Preloader</span>
            </div>
        )
    }

    // Hidden when done
    if (phase === "done" || phase === "idle") {
        return <div style={{ display: "none" }} />
    }

    var isExiting = phase === "exit"
    var progress = count / 100
    var tens = count >= 10 ? Math.floor((count % 100) / 10) : 0
    var ones = count % 10
    var showHundreds = count >= 100
    var numSize = "calc(10vw + 8vh)"
    var barH = String(progress * 100) + "%"

    return (
        <div style={{ position: "relative" as const, width: 0, height: 0 }}>
            {/* [CHANGE 4] Added role="status" and aria-label="Loading" */}
            <div
                role="status"
                aria-label="Loading"
                style={{
                position: "fixed" as const, top: 0, left: 0,
                width: "100vw", height: "100vh", zIndex: 999999,
                backgroundColor: bg, display: "flex",
                alignItems: "center", justifyContent: "center",
                overflow: "hidden" as const,
                transform: isExiting ? "translateY(-100%)" : "translateY(0)",
                transition: isExiting ? "transform " + ed + "s cubic-bezier(0.76, 0, 0.24, 1)" : "none",
                willChange: "transform",
            }}>
                {/* Progress bar */}
                <div style={{
                    position: "absolute" as const, left: 40, bottom: 40,
                    width: 2, height: "calc(100vh - 80px)",
                    backgroundColor: pc, borderRadius: 1,
                }}>
                    <div style={{
                        position: "absolute" as const, bottom: 0, left: 0,
                        width: "100%", height: barH,
                        backgroundColor: pf, borderRadius: 1,
                        transition: "height 0.3s ease-out",
                    }} />
                </div>

                {/* Giant numbers */}
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center" }}>
                    {showHundreds ? buildDigit(1, numSize, nc, ff, fw, doAnim, "hd") : null}
                    {buildDigit(tens, numSize, nc, ff, fw, doAnim, "td")}
                    {buildDigit(ones, numSize, nc, ff, fw, doAnim, "od")}
                    <span style={{
                        fontSize: "calc(2vw + 1.5vh)", color: nc,
                        fontFamily: ff, fontWeight: 400, opacity: 0.4,
                        marginLeft: "0.15em", alignSelf: "flex-start",
                        marginTop: "0.2em",
                    }}>%</span>
                </div>

                {/* Bottom label */}
                <div style={{
                    position: "absolute" as const, bottom: 40, right: 40,
                    textAlign: "right" as const,
                }}>
                    <div style={{
                        fontSize: 12, fontFamily: ff, fontWeight: 400,
                        color: nc, opacity: 0.5, letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                    }}>SheVibes</div>
                    <div style={{
                        fontSize: 11, fontFamily: ff, fontWeight: 400,
                        color: nc, opacity: 0.3, letterSpacing: "0.04em",
                        marginTop: 4,
                    }}>GGZ Praktijk voor Vrouwen</div>
                </div>
            </div>
        </div>
    )
}

// [CHANGE 1] Added displayName
SheVibesPreloader.displayName = "SheVibes Preloader"

// ---------- Property Controls ----------

addPropertyControls(SheVibesPreloader, {
    alwaysShow: {
        type: ControlType.Boolean,
        title: "Always Show",
        defaultValue: false,
        description: "ON = show every refresh (testing). OFF = once per session (live).",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgb(122, 85, 243)",
    },
    numberColor: {
        type: ControlType.Color,
        title: "Numbers",
        defaultValue: "#FFFEF7",
    },
    progressColor: {
        type: ControlType.Color,
        title: "Track",
        defaultValue: "rgba(255, 254, 247, 0.15)",
    },
    progressFillColor: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#FFFEF7",
    },
    totalDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2.8,
        min: 1.5, max: 5, step: 0.1, unit: "s",
        displayStepper: true,
    },
    exitDuration: {
        type: ControlType.Number,
        title: "Exit",
        defaultValue: 0.8,
        min: 0.3, max: 2, step: 0.1, unit: "s",
        displayStepper: true,
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Weight",
        defaultValue: 600,
        min: 400, max: 900, step: 100,
        displayStepper: true,
    },
    sessionKey: {
        type: ControlType.String,
        title: "Session Key",
        defaultValue: "sv-pre-v2",
        description: "Change to re-trigger in session mode",
    },
})
