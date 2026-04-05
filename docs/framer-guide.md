# Framer Development Guide

A comprehensive reference for building production-quality Framer code components.

---

## Table of Contents

1. [How Framer Components Work](#how-framer-components-work)
2. [Component Lifecycle](#component-lifecycle)
3. [Property Controls Deep Dive](#property-controls-deep-dive)
4. [Font System](#font-system)
5. [RenderTarget & Environment](#rendertarget--environment)
6. [Animation & Motion](#animation--motion)
7. [Internationalization & Locale](#internationalization--locale)
8. [Accessibility](#accessibility)
9. [Performance](#performance)
10. [Common Pitfalls](#common-pitfalls)
11. [Component Template](#component-template)

---

## How Framer Components Work

Framer code components are **React function components** written in TSX that run inside Framer's rendering engine. They differ from standard React components in important ways:

### What Framer Provides
- A **React 18+** runtime with concurrent features
- **Framer Motion** built-in (no need to install)
- **Property controls** system for visual editing in the Framer UI
- **RenderTarget** API to detect canvas/preview/export/thumbnail context
- **Locale hooks** for internationalization
- **npm package resolution** for importing external libraries
- **ESM URL imports** for importing from CDN

### Key Constraints
- Each component is a **single file** - no relative imports to other local files
- Components must **export a default function** (not class, not named export)
- No filesystem access, no Node.js APIs
- `window`/`document` may not exist during server rendering
- Components mount/unmount frequently on the canvas during editing
- Property controls only support specific types (no arbitrary UI)

### Rendering Pipeline
1. Framer parses the TSX file and registers property controls
2. Component renders on the **canvas** (design mode) - should be lightweight
3. In **preview** mode - full interactivity, animations, effects
4. On **export/publish** - production rendering, SSR then hydration
5. For **thumbnails** - minimal render for the component panel icon

---

## Component Lifecycle

### Mount/Unmount Behavior
- Components **mount and unmount frequently** on the canvas as users scroll, zoom, and navigate
- Effects that set up listeners or timers **must clean up** to avoid memory leaks
- State is **not preserved** between canvas navigation - don't rely on state for critical data

### Effect Timing
```tsx
useEffect(() => {
    // Runs after render - safe to access DOM
    const el = ref.current
    if (!el) return

    const observer = new ResizeObserver(handleResize)
    observer.observe(el)

    return () => observer.disconnect()  // ALWAYS clean up
}, [])
```

### Ref Safety
```tsx
const ref = useRef<HTMLDivElement>(null)

// SAFE - check ref in effects
useEffect(() => {
    if (ref.current) {
        ref.current.focus()
    }
}, [])

// UNSAFE - ref may be null during render
// const width = ref.current.offsetWidth  // DON'T
```

---

## Property Controls Deep Dive

### Control Sections (Grouping)
```tsx
addPropertyControls(Component, {
    // Section: Content
    title: { type: ControlType.String, title: "Title", defaultValue: "Hello" },
    description: { type: ControlType.String, title: "Description", displayTextArea: true },

    // Divider
    _divider1: { type: ControlType.Boolean, title: " ", disabledTitle: "Style", enabledTitle: "Style", defaultValue: false },

    // Section: Style
    bgColor: { type: ControlType.Color, title: "Background", defaultValue: "#ffffff" },
})
```

### Conditional Controls (Hidden)
```tsx
addPropertyControls(Component, {
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: false,
    },
    icon: {
        type: ControlType.ComponentInstance,
        title: "Icon",
        hidden: (props) => !props.showIcon,  // Only visible when showIcon is true
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 24,
        hidden: (props) => !props.showIcon,
    },
})
```

### Object Controls with Optional
```tsx
badge: {
    type: ControlType.Object,
    title: "Badge",
    optional: true,              // Shows "Add..." button when removed
    buttonTitle: "Add Badge",    // Custom button text
    controls: {
        text: { type: ControlType.String, defaultValue: "New" },
        color: { type: ControlType.Color, defaultValue: "#ff0000" },
    },
}
```

### Array Controls
```tsx
items: {
    type: ControlType.Array,
    title: "Items",
    maxCount: 20,
    defaultValue: [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
    ],
    control: {
        type: ControlType.Object,
        controls: {
            label: { type: ControlType.String, title: "Label", defaultValue: "Link" },
            href: { type: ControlType.Link, title: "URL" },
        },
    },
}
```

### Description Text on Controls
```tsx
apiKey: {
    type: ControlType.String,
    title: "API Key",
    description: "Your public API key from the dashboard",
    placeholder: "pk_live_...",
}
```

---

## Font System

### Extended Font Controls
The extended font control gives users full access to Framer's typography panel:

```tsx
interface Props {
    font?: Record<string, any>
    text: string
}

export default function TextBlock({ font, text = "Hello World" }: Props) {
    return (
        <p style={{ ...baseStyle, ...font, margin: 0 }}>
            {text}
        </p>
    )
}

addPropertyControls(TextBlock, {
    font: {
        type: ControlType.Font,
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: true,
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hello World",
        displayTextArea: true,
    },
})
```

### Font Control Options
- `controls: "basic"` - Font family picker only
- `controls: "extended"` - Full panel: family, weight, size, line height, letter spacing, alignment
- `displayFontSize: true/false` - Show/hide font size control
- `displayTextAlignment: true/false` - Show/hide text alignment control
- `defaultFontType: "sans-serif" | "monospace"` - Default font category (makes prop required)

### How Font Props Work
Framer passes font as a **CSS style object** that you spread onto your text element:
```tsx
// The font prop looks like:
{
    fontFamily: "'Inter', sans-serif",
    fontSize: "16px",
    fontWeight: 400,
    lineHeight: "1.5",
    letterSpacing: "0px",
    textAlign: "left",
}
```

### Multiple Font Controls
```tsx
addPropertyControls(Card, {
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        displayFontSize: true,
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        displayFontSize: true,
    },
})
```

---

## RenderTarget & Environment

### When to Use Each Target

```tsx
import { RenderTarget } from "framer"

export default function Component(props) {
    const target = RenderTarget.current()

    switch (target) {
        case "canvas":
            // DESIGN MODE - Keep lightweight
            // - Disable animations
            // - Skip API calls
            // - Show placeholder for heavy content
            // - Disable event listeners
            break

        case "preview":
            // PREVIEW MODE - Full functionality
            // - Enable all animations
            // - Allow API calls
            // - Full interactivity
            break

        case "export":
            // PUBLISHED SITE - Production
            // - Full functionality
            // - SEO considerations
            // - Performance optimization
            break

        case "thumbnail":
            // COMPONENT THUMBNAIL - Minimal
            // - Render smallest possible output
            // - No animations, no effects
            break
    }
}
```

### Practical Examples

```tsx
// Show loading skeleton on canvas instead of fetching data
const isCanvas = RenderTarget.current() === "canvas"

if (isCanvas) {
    return <div style={skeletonStyle}>Preview: Data Component</div>
}

// Only fetch data in preview/export
const [data, setData] = useState(null)
useEffect(() => {
    if (isCanvas) return
    fetch(apiUrl).then(r => r.json()).then(setData)
}, [apiUrl, isCanvas])
```

---

## Animation & Motion

### Framer Motion Basics in Framer Components

```tsx
import { motion, AnimatePresence } from "framer-motion"

// Simple entrance animation (canvas-safe)
const isCanvas = RenderTarget.current() === "canvas"

<motion.div
    initial={isCanvas ? false : { opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
/>
```

### Gesture Animations
```tsx
<motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
    Click Me
</motion.button>
```

### Scroll-Triggered Animations
```tsx
import { motion, useInView } from "framer-motion"
import { useRef } from "react"

function AnimatedSection({ children }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    )
}
```

### Staggered Children
```tsx
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
}

<motion.ul variants={container} initial="hidden" animate="show">
    {items.map((i) => (
        <motion.li key={i.id} variants={item}>{i.label}</motion.li>
    ))}
</motion.ul>
```

### Reduced Motion Pattern
```tsx
import { useReducedMotion } from "framer-motion"

function Component() {
    const shouldReduceMotion = useReducedMotion()

    return (
        <motion.div
            animate={{ x: 100 }}
            transition={shouldReduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 300 }
            }
        />
    )
}
```

---

## Internationalization & Locale

### Using Framer's Locale Hooks
```tsx
import { useLocaleInfo, useLocaleCode } from "framer"

export default function LocaleAwareComponent({ price = 29.99 }: Props) {
    const localeCode = useLocaleCode()

    const formattedPrice = useMemo(
        () => new Intl.NumberFormat(localeCode, {
            style: "currency",
            currency: "USD",
        }).format(price),
        [price, localeCode]
    )

    return <span>{formattedPrice}</span>
}
```

### RTL Support
```tsx
// Use CSS logical properties
const style: CSSProperties = {
    display: "flex",
    flexDirection: "row",
    gap: 12,
    paddingInlineStart: 16,    // not paddingLeft
    paddingInlineEnd: 16,      // not paddingRight
    marginBlockStart: 8,       // not marginTop
    marginBlockEnd: 8,         // not marginBottom
    borderInlineStart: "2px solid",  // not borderLeft
    textAlign: "start",        // not "left"
}
```

### Translation-Friendly Patterns
```tsx
// DO - text as props (translatable in Framer)
<Component title="Welcome" subtitle="Get started today" />

// DON'T - text hardcoded inside the component
function BadComponent() {
    return <h1>Welcome</h1>  // Can't be translated in Framer
}
```

---

## Accessibility

### Focus Management
```tsx
// Visible focus indicator
const focusStyle: CSSProperties = {
    outline: "2px solid #005fcc",
    outlineOffset: 2,
    borderRadius: 4,
}

// Button component with proper focus
<button
    style={buttonStyle}
    onFocus={(e) => Object.assign(e.target.style, focusStyle)}
    onBlur={(e) => Object.assign(e.target.style, { outline: "none" })}
    aria-label={ariaLabel}
>
    {children}
</button>
```

### Screen Reader Announcements
```tsx
// Live region for dynamic content
<div aria-live="polite" aria-atomic="true" style={srOnly}>
    {statusMessage}
</div>

// Visually hidden but accessible
const srOnly: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: 0,
}
```

### Dialog/Modal Pattern
```tsx
function Modal({ isOpen, onClose, title, children }) {
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            modalRef.current?.focus()
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === "Escape") onClose()
            }
            document.addEventListener("keydown", handleEsc)
            return () => document.removeEventListener("keydown", handleEsc)
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div role="dialog" aria-modal="true" aria-label={title} ref={modalRef} tabIndex={-1}>
            {children}
            <button onClick={onClose} aria-label="Close dialog">X</button>
        </div>
    )
}
```

---

## Performance

### Memoization
```tsx
// Memo the component itself
export default React.memo(function ExpensiveComponent(props: Props) {
    // Memo expensive computations
    const processedData = useMemo(
        () => expensiveTransform(props.data),
        [props.data]
    )

    // Memo callbacks passed to children
    const handleClick = useCallback(() => {
        props.onTap?.()
    }, [props.onTap])

    return <div onClick={handleClick}>{processedData}</div>
})
```

### Canvas Performance
```tsx
export default function HeavyComponent(props: Props) {
    const isCanvas = RenderTarget.current() === "canvas"

    // Skip heavy work on canvas
    if (isCanvas) {
        return (
            <div style={{ ...containerStyle, background: "#f0f0f0", display: "grid", placeItems: "center" }}>
                <span style={{ color: "#999", fontSize: 14 }}>
                    {props.title || "Component Preview"}
                </span>
            </div>
        )
    }

    // Full render for preview/export
    return <FullComponent {...props} />
}
```

### Lazy Loading
```tsx
import { useState, useEffect } from "react"

export default function LazyChart({ data }: Props) {
    const [Chart, setChart] = useState<any>(null)

    useEffect(() => {
        if (RenderTarget.current() === "canvas") return
        import("https://esm.sh/lightweight-charts@4").then(setChart)
    }, [])

    if (!Chart) return <div style={placeholderStyle}>Loading chart...</div>

    return <Chart.default data={data} />
}
```

---

## Common Pitfalls

### 1. Window/Document in SSR
```tsx
// BAD - crashes during SSR
const width = window.innerWidth

// GOOD - guarded access
const width = typeof window !== "undefined" ? window.innerWidth : 1024
```

### 2. Missing Effect Cleanup
```tsx
// BAD - leaks listener
useEffect(() => {
    window.addEventListener("scroll", handler)
}, [])

// GOOD - cleans up
useEffect(() => {
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
}, [])
```

### 3. Animations on Canvas
```tsx
// BAD - janky canvas experience
<motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity }} />

// GOOD - canvas-aware
const isCanvas = RenderTarget.current() === "canvas"
<motion.div
    animate={isCanvas ? {} : { rotate: 360 }}
    transition={isCanvas ? {} : { repeat: Infinity }}
/>
```

### 4. Hardcoded Strings
```tsx
// BAD - can't be translated or customized
<button>Buy Now</button>

// GOOD - exposed as prop with default
<button>{buttonText}</button>
// With: buttonText: { type: ControlType.String, defaultValue: "Buy Now" }
```

### 5. Unhandled Undefined Props
```tsx
// BAD - crashes if items is undefined
{props.items.map(item => ...)}

// GOOD - safe default
{(props.items ?? []).map(item => ...)}
```

### 6. Non-Semantic Interactive Elements
```tsx
// BAD - not accessible
<div onClick={handleClick} style={{ cursor: "pointer" }}>Click me</div>

// GOOD - semantic and accessible
<button onClick={handleClick} style={buttonStyle}>Click me</button>
```

### 7. Inline Style Objects (Re-render Issue)
```tsx
// BAD - creates new object every render, triggers children re-renders
<div style={{ display: "flex", gap: 8 }}>{children}</div>

// GOOD - stable reference
const containerStyle: CSSProperties = { display: "flex", gap: 8 }
<div style={containerStyle}>{children}</div>

// GOOD - when dynamic values needed
const dynamicStyle = useMemo<CSSProperties>(
    () => ({ ...containerStyle, background: props.bgColor }),
    [props.bgColor]
)
```

---

## Component Template

Use this as a starting point for new components:

```tsx
// ComponentName.tsx
// Brief description
// Version: 1.0.0

import { addPropertyControls, ControlType, RenderTarget } from "framer"
import { motion, useReducedMotion } from "framer-motion"
import { useState, useMemo, useCallback, useEffect, useRef, CSSProperties } from "react"

// ---------- Types ----------

interface Props {
    /** Primary text content */
    title: string
    /** Background color */
    bgColor: string
    /** Font styles from Framer */
    font?: Record<string, any>
    /** Click handler */
    onTap?: () => void
    // Framer layout props
    style?: CSSProperties
}

// ---------- Defaults ----------

const DEFAULTS = {
    title: "Component Title",
    bgColor: "#ffffff",
} as const

// ---------- Component ----------

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ComponentName(props: Props) {
    const {
        title = DEFAULTS.title,
        bgColor = DEFAULTS.bgColor,
        font,
        onTap,
        style,
    } = props

    const isCanvas = RenderTarget.current() === "canvas"
    const shouldReduceMotion = useReducedMotion()

    // ---------- Styles ----------

    const containerStyle = useMemo<CSSProperties>(() => ({
        ...baseContainerStyle,
        background: bgColor,
        ...style,
    }), [bgColor, style])

    // ---------- Render ----------

    return (
        <motion.div
            style={containerStyle}
            initial={isCanvas ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
            onClick={onTap}
            role={onTap ? "button" : undefined}
            tabIndex={onTap ? 0 : undefined}
            aria-label={onTap ? title : undefined}
        >
            <p style={{ ...textStyle, ...font, margin: 0 }}>{title}</p>
        </motion.div>
    )
}

ComponentName.displayName = "Component Name"

// ---------- Property Controls ----------

addPropertyControls(ComponentName, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: DEFAULTS.title,
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: DEFAULTS.bgColor,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: true,
    },
    onTap: {
        type: ControlType.EventHandler,
    },
})

// ---------- Static Styles ----------

const baseContainerStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    overflow: "hidden",
}

const textStyle: CSSProperties = {
    color: "#000000",
}
```

---

## Useful Patterns

### Responsive Breakpoints (without window)
```tsx
// Use container queries or Framer's layout system instead of media queries
// Components should be layout-agnostic and fill their parent container
const containerStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
}
```

### Loading States
```tsx
function DataComponent({ url }: Props) {
    const [state, setState] = useState<"loading" | "error" | "ready">("loading")
    const [data, setData] = useState(null)

    useEffect(() => {
        if (RenderTarget.current() === "canvas") {
            setState("ready")
            return
        }

        setState("loading")
        fetch(url)
            .then(r => r.json())
            .then(d => { setData(d); setState("ready") })
            .catch(() => setState("error"))
    }, [url])

    if (state === "loading") return <Skeleton />
    if (state === "error") return <ErrorMessage />
    return <DataView data={data} />
}
```

### Event Handler Props
```tsx
// Framer event handlers are passed as functions
interface Props {
    onTap?: () => void
    onHoverStart?: () => void
    onHoverEnd?: () => void
}

<motion.div
    onTap={onTap}
    onHoverStart={onHoverStart}
    onHoverEnd={onHoverEnd}
/>

addPropertyControls(Component, {
    onTap: { type: ControlType.EventHandler },
    onHoverStart: { type: ControlType.EventHandler },
    onHoverEnd: { type: ControlType.EventHandler },
})
```
