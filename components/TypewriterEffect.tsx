// Dynamic Typing Animation Component with Customizable Cursor and Typography
import {
    useState,
    useEffect,
    useRef,
    useMemo,
    startTransition,
    type CSSProperties,
} from "react"
import { addPropertyControls, ControlType } from "framer"

type AnimationMode = "loop" | "once" | "sequential"
type SequentialStyle = "replace" | "append"
type LoopCount = 1 | 2 | 3 | 5 | "infinite"
type SeparatorType = "space" | "comma" | "dash" | "dot" | "custom"

interface TypewriterEffectProps {
    words: { word: string }[]
    mode: AnimationMode
    sequentialStyle: SequentialStyle
    separator: SeparatorType
    customSeparator: string
    humanizeTyping: boolean
    loopCount: LoopCount
    startOnView: boolean
    initialDelay: number
    typingSpeed: number
    deletingSpeed: number
    pauseDuration: number
    cursorBlinkSpeed: number
    cursorColor: string
    cursorWidth: number
    cursorHeight: number
    font: any
    textColor: string
    style?: CSSProperties
}

/**
 * Dynamic Typing Animation
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function TypewriterEffect(props: TypewriterEffectProps) {
    const {
        words = [{ word: "Hello" }, { word: "World" }, { word: "Framer" }],
        mode = "loop",
        sequentialStyle = "replace",
        separator = "space",
        customSeparator = " • ",
        humanizeTyping = false,
        loopCount = "infinite",
        startOnView = true,
        initialDelay = 0,
        typingSpeed,
        deletingSpeed,
        pauseDuration,
        cursorBlinkSpeed = 0.5,
        cursorColor,
        cursorWidth,
        cursorHeight,
        font,
        textColor,
        style,
    } = props

    const [displayed, setDisplayed] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)
    const [wordIndex, setWordIndex] = useState(0)
    const [charIndex, setCharIndex] = useState(0)
    const [isComplete, setIsComplete] = useState(false)
    const [isIdle, setIsIdle] = useState(false)
    const [currentLoopCount, setCurrentLoopCount] = useState(0)
    const [hasStarted, setHasStarted] = useState(false)
    const [isInView, setIsInView] = useState(false)
    const timeoutRef = useRef<number | null>(null)
    const componentRef = useRef<HTMLSpanElement>(null)

    const currentWord =
        words.length > 0 ? words[wordIndex % words.length].word : ""

    // Get separator character
    const getSeparator = () => {
        switch (separator) {
            case "space":
                return " "
            case "comma":
                return ", "
            case "dash":
                return " - "
            case "dot":
                return " • "
            case "custom":
                return customSeparator
            default:
                return " "
        }
    }

    // For append mode in sequential
    const previousWords = useMemo(() => {
        if (
            mode === "sequential" &&
            sequentialStyle === "append" &&
            wordIndex > 0
        ) {
            return (
                words
                    .slice(0, wordIndex)
                    .map((w) => w.word)
                    .join(getSeparator()) + getSeparator()
            )
        }
        return ""
    }, [mode, sequentialStyle, wordIndex, words, separator, customSeparator])

    // Humanized typing speed with variance
    const getTypingDelay = () => {
        if (humanizeTyping) {
            // Add ±20% variance to typing speed
            const variance = 0.8 + Math.random() * 0.4
            return typingSpeed * 1000 * variance
        }
        return typingSpeed * 1000
    }

    // Check for reduced motion preference
    const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // Intersection Observer - Start animation when in view
    useEffect(() => {
        if (!startOnView) {
            setIsInView(true) // Always in view if feature disabled
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasStarted) {
                    setIsInView(true)
                }
            },
            {
                threshold: 0.1, // Trigger when 10% visible
                rootMargin: "0px",
            }
        )

        if (componentRef.current) {
            observer.observe(componentRef.current)
        }

        return () => observer.disconnect()
    }, [startOnView, hasStarted])

    // Handle initial delay
    useEffect(() => {
        if (!isInView) return // Don't start until in view

        if (initialDelay === 0) {
            setHasStarted(true)
            return
        }

        const delayTimeout = window.setTimeout(() => {
            setHasStarted(true)
        }, initialDelay * 1000)

        return () => clearTimeout(delayTimeout)
    }, [initialDelay, isInView])

    // Handle reduced motion - show final text immediately
    useEffect(() => {
        if (prefersReducedMotion) {
            if (mode === "once") {
                setDisplayed(words[0]?.word || "")
            } else if (mode === "sequential") {
                if (sequentialStyle === "append") {
                    setDisplayed(words.map((w) => w.word).join(getSeparator()))
                } else {
                    setDisplayed(words[words.length - 1]?.word || "")
                }
            } else {
                setDisplayed(words[0]?.word || "")
            }
            setIsComplete(true)
        }
    }, [prefersReducedMotion, mode, words, sequentialStyle, separator])

    // Typing/Deleting Effect
    useEffect(() => {
        if (!hasStarted || prefersReducedMotion) return
        if (isComplete) return
        if (timeoutRef.current) clearTimeout(timeoutRef.current)

        let delay = typingSpeed * 1000

        // Typing forward
        if (!isDeleting && charIndex < currentWord.length) {
            setIsIdle(false)
            delay = getTypingDelay()
            timeoutRef.current = window.setTimeout(() => {
                startTransition(() => {
                    const typedPart = currentWord.slice(0, charIndex + 1)
                    setDisplayed(previousWords + typedPart)
                    setCharIndex(charIndex + 1)
                })
            }, delay)
        }
        // Finished typing current word
        else if (!isDeleting && charIndex === currentWord.length) {
            setIsIdle(true)

            // Handle different modes
            if (mode === "once") {
                setIsComplete(true)
                return
            } else if (mode === "sequential") {
                const isLastWord = wordIndex === words.length - 1
                if (isLastWord) {
                    setIsComplete(true)
                    return
                }
                // Move to next word
                timeoutRef.current = window.setTimeout(() => {
                    startTransition(() => {
                        setWordIndex(wordIndex + 1)
                        setCharIndex(0)
                        if (sequentialStyle === "replace") {
                            setDisplayed("")
                        }
                        setIsIdle(false)
                    })
                }, pauseDuration * 1000)
            } else {
                // Loop mode - start deleting
                timeoutRef.current = window.setTimeout(() => {
                    startTransition(() => {
                        setIsDeleting(true)
                        setIsIdle(false)
                    })
                }, pauseDuration * 1000)
            }
        }
        // Deleting backward
        else if (isDeleting && charIndex > 0) {
            delay = deletingSpeed * 1000
            timeoutRef.current = window.setTimeout(() => {
                startTransition(() => {
                    setDisplayed(currentWord.slice(0, charIndex - 1))
                    setCharIndex(charIndex - 1)
                })
            }, delay)
        }
        // Finished deleting
        else if (isDeleting && charIndex === 0) {
            setIsIdle(true)

            // Check if we should continue looping
            const nextWordIndex = (wordIndex + 1) % words.length
            const completedFullCycle = nextWordIndex === 0

            if (completedFullCycle && loopCount !== "infinite") {
                const nextLoopCount = currentLoopCount + 1
                if (nextLoopCount >= loopCount) {
                    setIsComplete(true)
                    return
                }
                setCurrentLoopCount(nextLoopCount)
            }

            timeoutRef.current = window.setTimeout(() => {
                startTransition(() => {
                    setIsDeleting(false)
                    setWordIndex(nextWordIndex)
                    setIsIdle(false)
                })
            }, pauseDuration * 1000)
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [
        charIndex,
        isDeleting,
        wordIndex,
        currentWord,
        typingSpeed,
        deletingSpeed,
        pauseDuration,
        words.length,
        mode,
        isComplete,
        sequentialStyle,
        previousWords,
        humanizeTyping,
        loopCount,
        currentLoopCount,
        words,
        hasStarted,
        prefersReducedMotion,
    ])

    // Blinking Cursor Effect - blink during initial delay, idle, and complete
    const [showCursor, setShowCursor] = useState(true)
    const blinkRef = useRef<number | null>(null)

    useEffect(() => {
        if (blinkRef.current) clearInterval(blinkRef.current)

        // Show and blink cursor when:
        // 1. In view but waiting for initial delay (isInView && !hasStarted)
        // 2. Idle between words (isIdle)
        // 3. Animation complete (isComplete)
        const shouldBlink = (isInView && !hasStarted) || isIdle || isComplete

        if (shouldBlink) {
            // Blink the cursor
            blinkRef.current = window.setInterval(() => {
                startTransition(() => setShowCursor((v) => !v))
            }, cursorBlinkSpeed * 1000)
        } else if (hasStarted && !isIdle && !isComplete) {
            // Solid cursor when actively typing/deleting
            setShowCursor(true)
        } else {
            // Hide cursor if not in view yet
            setShowCursor(false)
        }

        return () => {
            if (blinkRef.current) clearInterval(blinkRef.current)
        }
    }, [isInView, hasStarted, isIdle, isComplete, cursorBlinkSpeed])

    // Font size for cursor height calculation
    const fontSize = useMemo(() => {
        if (font && font.fontSize) {
            if (
                typeof font.fontSize === "string" &&
                font.fontSize.endsWith("px")
            ) {
                return parseFloat(font.fontSize)
            } else if (typeof font.fontSize === "number") {
                return font.fontSize
            }
        }
        return 32
    }, [font])

    return (
        <span
            ref={componentRef}
            style={{
                ...style,
                ...font,
                color: textColor,
                display: "inline-flex",
                alignItems: "center",
                whiteSpace: "pre",
            }}
            aria-live="polite"
        >
            {displayed}
            <span
                aria-hidden="true"
                style={{
                    display: "inline-block",
                    background: cursorColor,
                    width: cursorWidth,
                    height: fontSize * (cursorHeight / 100),
                    marginLeft: 2,
                    marginRight: 2,
                    verticalAlign: "bottom",
                    opacity: showCursor ? 1 : 0,
                    transition: "opacity 0.1s",
                    borderRadius: 2,
                }}
            />
        </span>
    )
}

addPropertyControls(TypewriterEffect, {
    words: {
        type: ControlType.Array,
        title: "Words",
        control: {
            type: ControlType.Object,
            controls: {
                word: { type: ControlType.String, defaultValue: "Hello" },
            },
        },
        defaultValue: [
            { word: "Hello" },
            { word: "World" },
            { word: "Framer" },
        ],
        maxCount: 10,
    },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["loop", "once", "sequential"],
        optionTitles: [
            "Loop (Type & Delete)",
            "Once (First Word)",
            "Sequential (All Words)",
        ],
        defaultValue: "loop",
    },
    sequentialStyle: {
        type: ControlType.Enum,
        title: "Sequential Style",
        options: ["replace", "append"],
        optionTitles: ["Replace Words", "Build Sentence"],
        defaultValue: "replace",
        hidden: (props) => props.mode !== "sequential",
    },
    separator: {
        type: ControlType.Enum,
        title: "Separator",
        options: ["space", "comma", "dash", "dot", "custom"],
        optionTitles: ["Space", "Comma", "Dash", "Dot", "Custom"],
        defaultValue: "space",
        hidden: (props) =>
            props.mode !== "sequential" || props.sequentialStyle !== "append",
    },
    customSeparator: {
        type: ControlType.String,
        title: "Custom Separator",
        defaultValue: " • ",
        hidden: (props) =>
            props.mode !== "sequential" ||
            props.sequentialStyle !== "append" ||
            props.separator !== "custom",
    },
    humanizeTyping: {
        type: ControlType.Boolean,
        title: "Humanize Typing",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    loopCount: {
        type: ControlType.Enum,
        title: "Loop Count",
        options: [1, 2, 3, 5, "infinite"],
        optionTitles: ["1x", "2x", "3x", "5x", "Infinite"],
        defaultValue: "infinite",
        hidden: (props) => props.mode !== "loop",
    },
    startOnView: {
        type: ControlType.Boolean,
        title: "Start on View",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    initialDelay: {
        type: ControlType.Number,
        title: "Initial Delay",
        defaultValue: 0,
        min: 0,
        max: 5,
        unit: "s",
        step: 0.1,
        displayStepper: true,
    },
    typingSpeed: {
        type: ControlType.Number,
        title: "Typing Speed",
        defaultValue: 0.1,
        min: 0.02,
        max: 0.5,
        unit: "s",
        step: 0.01,
        displayStepper: true,
    },
    deletingSpeed: {
        type: ControlType.Number,
        title: "Deleting Speed",
        defaultValue: 0.06,
        min: 0.01,
        max: 0.5,
        unit: "s",
        step: 0.01,
        displayStepper: true,
        hidden: (props) => props.mode !== "loop",
    },
    pauseDuration: {
        type: ControlType.Number,
        title: "Pause Duration",
        defaultValue: 1,
        min: 0.2,
        max: 10,
        unit: "s",
        step: 0.1,
        displayStepper: true,
    },
    cursorBlinkSpeed: {
        type: ControlType.Number,
        title: "Cursor Blink Speed",
        defaultValue: 0.5,
        min: 0.2,
        max: 1.5,
        unit: "s",
        step: 0.05,
        displayStepper: true,
    },
    cursorColor: {
        type: ControlType.Color,
        title: "Cursor Color",
        defaultValue: "#FFFFFF",
    },
    cursorWidth: {
        type: ControlType.Number,
        title: "Cursor Width",
        defaultValue: 2,
        min: 1,
        max: 8,
        unit: "px",
        step: 1,
    },
    cursorHeight: {
        type: ControlType.Number,
        title: "Cursor Height",
        defaultValue: 100,
        min: 50,
        max: 120,
        unit: "%",
        step: 1,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
})
