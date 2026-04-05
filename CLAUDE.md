# CLAUDE.md - Framer Components Development Guide

This file provides comprehensive instructions for AI assistants working on this repository.

---

## Project Overview

This is a **Framer code component library** - a storage repo of reusable `.tsx` components designed to work inside Framer's visual editor. Each component is a self-contained React file that integrates with Framer's property controls, rendering pipeline, and locale system.

**Primary project:** SheVibes (Framer)

---

## Critical Rules

### NEVER Do
- **Never hardcode user-facing text** - all strings must be property controls
- **Never hardcode colors** - use `ControlType.Color` with sensible defaults
- **Never hardcode font styles** - use `ControlType.Font` with `controls: "extended"`
- **Never hardcode spacing/sizes** - expose via `ControlType.Number` controls
- **Never use `document` or `window` without guards** - Framer SSR will break
- **Never use `localStorage`/`sessionStorage` without try-catch** - may not be available
- **Never import from relative paths** - Framer components are single-file; use URL imports or npm packages only
- **Never use `class` components** - Framer requires function components
- **Never forget cleanup** in `useEffect` - leaked listeners crash the canvas
- **Never animate on canvas** - check `RenderTarget.current()` and disable animations in canvas/thumbnail modes
- **Never use `px` for font sizes in hardcoded styles** - let Framer's font system handle it
- **Never ignore `prefers-reduced-motion`** - always provide a reduced-motion fallback
- **Never use non-semantic HTML** when semantic elements exist (use `<button>` not `<div onClick>`)
- **Never use `innerHTML` or `dangerouslySetInnerHTML`** without sanitization
- **Never create multi-file components** - each component must be a single `.tsx` file
- **Never forget to spread `style` on the root element** - Framer passes layout sizing via the `style` prop
- **Never apply font properties individually** - always spread: `...props.font`, NOT `fontFamily: props.font.fontFamily`
- **Never use `fetch` without canvas guards** - canvas re-renders cause infinite request loops
- **Never use `ResizeObserver`/`IntersectionObserver` without canvas guards** - they fire excessively during canvas interactions
- **Never import separate CSS files** - Framer doesn't support `.css` imports; use inline styles or `<style>` injection
- **Never return a non-function from `useEffect`** - returning a number/value crashes; always wrap in braces

### ALWAYS Do
- **Always export a default function component** - this is what Framer expects
- **Always call `addPropertyControls`** on the exported component
- **Always spread the `style` prop on the root element** - `<div style={{ ...containerStyle, ...props.style }}>`
- **Always provide TypeScript types** for props
- **Always add `displayName`** to components for Framer panel clarity
- **Always include a header comment** with component name, description, and version
- **Always use `ControlType.Font` with `controls: "extended"`** for any text
- **Always expose all visual properties** as property controls
- **Always provide sensible defaults** for every prop
- **Always handle undefined/null props gracefully** - Framer may not pass them initially
- **Always use `React.memo()`** for components that receive many props
- **Always clean up effects** (event listeners, timers, observers)
- **Always support keyboard navigation** for interactive elements
- **Always add ARIA attributes** for accessibility
- **Always use logical CSS properties** for RTL support (`margin-inline-start` not `margin-left`)
- **Always test in both canvas and preview modes**
- **Always add layout annotations** via JSDoc: `@framerSupportedLayoutWidth`, `@framerSupportedLayoutHeight`
- **Always guard browser APIs inside `useEffect`** - `window`, `document`, `navigator` may not exist during SSR
- **Always spread font props** with `...props.font` not individual properties

---

## Framer Component Anatomy

```tsx
// ComponentName.tsx
// Brief description of what this component does
// Version: 1.0.0

import { addPropertyControls, ControlType, RenderTarget } from "framer"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useMemo, useCallback, useEffect, CSSProperties } from "react"

// ---------- Types ----------

interface Props {
    title: string
    // ... all props with JSDoc comments
}

// ---------- Constants ----------

const DEFAULT_TITLE = "Title"

// ---------- Component ----------

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ComponentName(props: Props) {
    const {
        title = DEFAULT_TITLE,
        // ... destructure all props with defaults
    } = props

    const isCanvas = RenderTarget.current() === "canvas"

    return (
        <div style={containerStyle}>
            {/* component content */}
        </div>
    )
}

ComponentName.displayName = "Component Name"

// ---------- Property Controls ----------

addPropertyControls(ComponentName, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: DEFAULT_TITLE,
    },
})

// ---------- Styles ----------

const containerStyle: CSSProperties = {
    display: "flex",
    width: "100%",
    height: "100%",
}
```

---

## Framer API Reference

### Property Control Types

```tsx
import { addPropertyControls, ControlType } from "framer"

// STRING - text input
text: {
    type: ControlType.String,
    title: "Label",
    defaultValue: "Hello",
    placeholder: "Enter text...",
    displayTextArea: true,          // multiline
}

// NUMBER - numeric input with range
size: {
    type: ControlType.Number,
    title: "Size",
    defaultValue: 16,
    min: 0,
    max: 100,
    step: 1,
    unit: "px",
    displayStepper: true,
}

// BOOLEAN - toggle switch
visible: {
    type: ControlType.Boolean,
    title: "Visible",
    defaultValue: true,
    enabledTitle: "Show",
    disabledTitle: "Hide",
}

// ENUM - dropdown or segmented control
variant: {
    type: ControlType.Enum,
    title: "Variant",
    options: ["primary", "secondary", "ghost"],
    optionTitles: ["Primary", "Secondary", "Ghost"],
    defaultValue: "primary",
    displaySegmentedControl: true,  // inline buttons instead of dropdown
}

// ENUM with icons (segmented control)
alignment: {
    type: ControlType.Enum,
    title: "Align",
    options: ["left", "center", "right"],
    optionIcons: ["text-align-left", "text-align-center", "text-align-right"],
    displaySegmentedControl: true,
}

// COLOR - color picker
color: {
    type: ControlType.Color,
    title: "Color",
    defaultValue: "#000000",
}

// FONT - full typography control
font: {
    type: ControlType.Font,
    title: "Font",
    controls: "extended",           // "basic" or "extended"
    displayFontSize: true,
    displayTextAlignment: true,
}

// RESPONSIVE IMAGE - optimized image
image: {
    type: ControlType.ResponsiveImage,
    title: "Image",
}
// Usage: <img src={props.image?.src} srcSet={props.image?.srcSet} alt={props.image?.alt} />

// FILE - file upload
video: {
    type: ControlType.File,
    title: "Video",
    allowedFileTypes: ["mp4", "webm"],
}

// COMPONENT INSTANCE - child slot
icon: {
    type: ControlType.ComponentInstance,
    title: "Icon",
}

// LINK - navigation link
link: {
    type: ControlType.Link,
    title: "Link",
}

// CURSOR - CSS cursor picker
cursor: {
    type: ControlType.Cursor,
    title: "Cursor",
}

// OBJECT - grouped nested controls
shadow: {
    type: ControlType.Object,
    title: "Shadow",
    optional: true,
    buttonTitle: "Add Shadow",
    controls: {
        x: { type: ControlType.Number, defaultValue: 0 },
        y: { type: ControlType.Number, defaultValue: 4 },
        blur: { type: ControlType.Number, defaultValue: 8 },
        color: { type: ControlType.Color, defaultValue: "rgba(0,0,0,0.1)" },
    },
}

// ARRAY - repeatable items
items: {
    type: ControlType.Array,
    title: "Items",
    maxCount: 10,
    control: {
        type: ControlType.Object,
        controls: {
            label: { type: ControlType.String, defaultValue: "Item" },
        },
    },
}

// TRANSITION - animation transition config
transition: {
    type: ControlType.Transition,
    title: "Transition",
}

// EVENT HANDLER - interaction callback
onTap: {
    type: ControlType.EventHandler,
}

// BOX SHADOW - shadow config
boxShadow: {
    type: ControlType.BoxShadow,
    title: "Shadow",
}

// PADDING - padding control (replaces deprecated FusedNumber)
padding: {
    type: ControlType.Padding,
    title: "Padding",
}

// BORDER RADIUS - border radius control
radius: {
    type: ControlType.BorderRadius,
    title: "Radius",
}

// BORDER - border style control
border: {
    type: ControlType.Border,
    title: "Border",
}

// DATE - date picker
date: {
    type: ControlType.Date,
    title: "Date",
}

// RICH TEXT - formatted text editor
richText: {
    type: ControlType.RichText,
    title: "Content",
}
```

### Conditional Property Visibility

```tsx
addPropertyControls(Component, {
    variant: {
        type: ControlType.Enum,
        options: ["text", "icon"],
    },
    label: {
        type: ControlType.String,
        hidden: (props) => props.variant !== "text",
    },
    icon: {
        type: ControlType.ComponentInstance,
        hidden: (props) => props.variant !== "icon",
    },
})
```

### Enum Option Icons (Built-in)

Available icon names for `optionIcons`:
- **Text alignment:** `text-align-left`, `text-align-center`, `text-align-right`, `text-align-justify`
- **Directions:** `direction-left`, `direction-right`, `direction-up`, `direction-down`
- **Alignment:** `align-left`, `align-center`, `align-right`, `align-top`, `align-middle`, `align-bottom`
- **Orientation:** `orientation-portrait`, `orientation-landscape`
- **Distribution:** `distribute-start`, `distribute-center`, `distribute-end`, `distribute-space-between`, `distribute-space-around`, `distribute-space-evenly`

### RenderTarget API

```tsx
import { RenderTarget } from "framer"

// Check current rendering context
const target = RenderTarget.current()
// Returns: "canvas" | "preview" | "export" | "thumbnail"

// Common pattern - disable heavy operations on canvas
const isCanvas = RenderTarget.current() === "canvas"
if (isCanvas) return <PlaceholderView />

// Hook form
import { useIsOnFramerCanvas } from "framer"
const isOnCanvas = useIsOnFramerCanvas()
```

**Render targets:**
| Target | Context |
|---|---|
| `"canvas"` | Framer design editor - optimize for performance, disable animations |
| `"preview"` | Preview mode (Play button) - full interactivity |
| `"export"` | Published/exported site - production mode |
| `"thumbnail"` | Generating component thumbnail - minimal rendering |

### Locale Hooks

```tsx
import { useLocaleInfo, useLocaleCode } from "framer"

// Get full locale info
const localeInfo = useLocaleInfo()  // { code: "en-US", ... }

// Get just the locale code
const localeCode = useLocaleCode()  // "en-US"

// Usage for date formatting
const formatted = new Intl.DateTimeFormat(localeCode).format(date)
```

### Layout Annotations

Use JSDoc annotations to tell Framer how your component handles sizing:

```tsx
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 200
 */
export default function Component(props) { ... }
```

**Layout options:**
| Value | Behavior |
|---|---|
| `auto` | Content-driven sizing |
| `fixed` | Fills container (fixed size only) |
| `any` | User can toggle between auto and fixed |
| `any-prefer-fixed` | Defaults to fixed, allows flexible |

**Intrinsic size:** `@framerIntrinsicWidth` / `@framerIntrinsicHeight` set the default size when dropped on canvas.

**Prevent unlinking:** `@framerDisableUnlink` prevents users from editing the component's internal structure.

### The `style` Prop (CRITICAL)

Framer passes a `style` prop to control the component's position and size. **You must spread it on the root element:**

```tsx
export default function Component(props: Props) {
    const { style, ...rest } = props
    return (
        <div style={{ ...containerStyle, ...style }}>
            {/* content */}
        </div>
    )
}
```

Without spreading `style`, Framer cannot control the component's layout.

---

## Styling Rules

### CSS-in-JS Pattern (Preferred)
```tsx
const style: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    overflow: "hidden",
}
```

### RTL-Safe Logical Properties
```tsx
// DO - logical properties
{ paddingInlineStart: 16, paddingInlineEnd: 16, marginBlockStart: 8 }

// DON'T - physical properties
{ paddingLeft: 16, paddingRight: 16, marginTop: 8 }
```

### Font Application Pattern
```tsx
// When using ControlType.Font, apply the fontControls style object:
interface Props {
    font?: Record<string, any>  // Framer passes font as a style object
    title: string
}

export default function Component({ font, title }: Props) {
    return <p style={{ ...baseTextStyle, ...font }}>{title}</p>
}

addPropertyControls(Component, {
    font: {
        type: ControlType.Font,
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: true,
    },
    title: { type: ControlType.String, defaultValue: "Hello" },
})
```

---

## Animation Patterns

### Reduced Motion Support
```tsx
const prefersReducedMotion = 
    typeof window !== "undefined" 
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
        : false

const animationProps = prefersReducedMotion
    ? {}
    : { initial: { opacity: 0 }, animate: { opacity: 1 } }
```

### Canvas-Safe Animations
```tsx
const isCanvas = RenderTarget.current() === "canvas"

<motion.div
    initial={isCanvas ? false : { opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={isCanvas ? { duration: 0 } : { type: "spring", damping: 20 }}
>
```

### AnimatePresence Pattern
```tsx
<AnimatePresence mode="wait">
    {isVisible && (
        <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {children}
        </motion.div>
    )}
</AnimatePresence>
```

---

## Accessibility Checklist

For every component, verify:

- [ ] Interactive elements are focusable and have visible focus indicators
- [ ] Buttons use `<button>` element (not `<div onClick>`)
- [ ] Links use `<a>` element with `href`
- [ ] Images have `alt` text (exposed as a property control)
- [ ] Form inputs have associated `<label>` elements
- [ ] Color is not the only means of conveying information
- [ ] Text has sufficient contrast (4.5:1 for normal, 3:1 for large text)
- [ ] Dynamic content changes announced via `aria-live`
- [ ] Modals/dialogs trap focus and support Escape to close
- [ ] Touch targets are at least 44x44 CSS pixels
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Component has appropriate `role` attribute if non-standard element is used

---

## Browser/Window Safety

```tsx
// Always guard browser APIs
const isBrowser = typeof window !== "undefined"

// Safe window access
useEffect(() => {
    if (!isBrowser) return
    const handler = () => { /* ... */ }
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
}, [])

// Safe localStorage
function safeGetItem(key: string): string | null {
    try {
        return localStorage.getItem(key)
    } catch {
        return null
    }
}
```

---

## Shared State Across Components

Use Framer's `createStore` for sharing state between components on the same page:

```tsx
import { createStore } from "https://framer.com/m/framer/store.js@^0.3.0"

const useStore = createStore({ count: 0, isOpen: false })

export default function Counter(props: Props) {
    const [store, setStore] = useStore()
    return (
        <div style={props.style} onClick={() => setStore({ count: store.count + 1 })}>
            {store.count}
        </div>
    )
}
```

## Advanced CSS (Pseudo-elements, Media Queries)

For CSS features not possible with inline styles, inject a `<style>` tag:

```tsx
export default function Component(props: Props) {
    const css = `
        .my-component:hover { background: rgba(0,0,0,0.1); }
        .my-component::before { content: ""; position: absolute; }
        @media (max-width: 768px) { .my-component { flex-direction: column; } }
    `
    return (
        <div style={props.style}>
            <style>{css}</style>
            <div className="my-component">Content</div>
        </div>
    )
}
```

For SSR-safe style injection, use `withCSS` from the `"framer"` package (moves styles to `<head>`).

---

## NPM Packages Available in Framer

Framer supports importing npm packages directly. Recommended libraries:

| Package | Use Case |
|---|---|
| `framer-motion` | Animation and gestures (built-in) |
| `react` / `react-dom` | Core React (built-in) |
| `framer` | Framer API (built-in) |

External packages can be imported via URL:
```tsx
import confetti from "https://esm.sh/canvas-confetti@1.6.0"
```

Or via bare specifier (Framer resolves from npm):
```tsx
import dayjs from "dayjs"
```

---

## Component File Naming

- **PascalCase** for component files: `HeroSection.tsx`, `PricingCard.tsx`
- **Descriptive names** that match Framer panel display
- Place all components in `components/` directory
- One component per file

---

## GSAP in Framer Components

GSAP (GreenSock Animation Platform) provides timeline-based animations, ScrollTrigger, and advanced easing beyond what Framer Motion offers. Import via ESM:

```tsx
import gsap from "https://esm.sh/gsap@3.12.5"
import { ScrollTrigger } from "https://esm.sh/gsap@3.12.5/ScrollTrigger"
```

### GSAP Setup Pattern
```tsx
import { useRef, useEffect } from "react"
import { RenderTarget } from "framer"

export default function GSAPComponent(props: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const isCanvas = RenderTarget.current() === "canvas"

    useEffect(() => {
        if (isCanvas || !containerRef.current) return
        if (typeof window === "undefined") return

        // Register plugins
        gsap.registerPlugin(ScrollTrigger)

        const ctx = gsap.context(() => {
            // All GSAP animations scoped to this container
            gsap.from(".animate-item", {
                y: 50,
                opacity: 0,
                stagger: 0.1,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 80%",
                    end: "bottom 20%",
                    toggleActions: "play none none reverse",
                },
            })
        }, containerRef)

        // CRITICAL: cleanup kills all GSAP animations in this scope
        return () => ctx.revert()
    }, [isCanvas])

    if (isCanvas) {
        return <div style={props.style}>GSAP Component Preview</div>
    }

    return (
        <div ref={containerRef} style={props.style}>
            <div className="animate-item">Content</div>
        </div>
    )
}
```

### GSAP Rules
- **Always use `gsap.context()`** and call `ctx.revert()` in cleanup - prevents memory leaks
- **Always skip on canvas** - GSAP animations thrash the Framer editor
- **Always guard with `typeof window`** - GSAP needs the DOM
- **Register plugins once** in the effect, not at module level
- **Use ScrollTrigger** for scroll-linked animations (more control than Framer Motion's `useScroll`)
- **Expose animation values** as property controls: duration, delay, ease, stagger
- **Respect reduced motion**: check `prefers-reduced-motion` and set `duration: 0`

### GSAP + Framer Motion Coexistence
- Use **Framer Motion** for: simple enter/exit, hover/tap, layout animations, spring physics
- Use **GSAP** for: complex timelines, ScrollTrigger with pinning, morphing, text splitting, stagger sequences
- Don't animate the same element with both - pick one per element

### Available GSAP Plugins (free)
```tsx
import { ScrollTrigger } from "https://esm.sh/gsap@3.12.5/ScrollTrigger"
import { TextPlugin } from "https://esm.sh/gsap@3.12.5/TextPlugin"
import { Draggable } from "https://esm.sh/gsap@3.12.5/Draggable"
import { Flip } from "https://esm.sh/gsap@3.12.5/Flip"
import { Observer } from "https://esm.sh/gsap@3.12.5/Observer"
```

---

## WebGL in Framer Components

For advanced 3D graphics, particle systems, and shader effects. Use **Three.js** or raw WebGL.

### Three.js Setup Pattern
```tsx
import { useRef, useEffect, useState } from "react"
import { RenderTarget } from "framer"

// Import Three.js via ESM
import * as THREE from "https://esm.sh/three@0.162.0"

export default function WebGLComponent(props: Props) {
    const mountRef = useRef<HTMLDivElement>(null)
    const isCanvas = RenderTarget.current() === "canvas"

    useEffect(() => {
        if (isCanvas || !mountRef.current) return
        if (typeof window === "undefined") return

        const container = mountRef.current
        const width = container.clientWidth
        const height = container.clientHeight

        // Setup
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
        const renderer = new THREE.WebGLRenderer({
            alpha: true,           // transparent background
            antialias: true,
            powerPreference: "high-performance",
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // cap for performance
        container.appendChild(renderer.domElement)

        // Your 3D scene here
        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshStandardMaterial({ color: props.color })
        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        const light = new THREE.DirectionalLight(0xffffff, 1)
        light.position.set(5, 5, 5)
        scene.add(light)
        scene.add(new THREE.AmbientLight(0xffffff, 0.5))

        camera.position.z = 3

        // Animation loop
        let animationId: number
        const animate = () => {
            animationId = requestAnimationFrame(animate)
            mesh.rotation.x += 0.01
            mesh.rotation.y += 0.01
            renderer.render(scene, camera)
        }
        animate()

        // Resize handler
        const onResize = () => {
            const w = container.clientWidth
            const h = container.clientHeight
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
        }
        window.addEventListener("resize", onResize)

        // CRITICAL: Full cleanup
        return () => {
            cancelAnimationFrame(animationId)
            window.removeEventListener("resize", onResize)
            renderer.dispose()
            geometry.dispose()
            material.dispose()
            container.removeChild(renderer.domElement)
        }
    }, [isCanvas, props.color])

    if (isCanvas) {
        return (
            <div style={{
                ...props.style,
                display: "grid",
                placeItems: "center",
                background: "#1a1a2e",
                color: "#fff",
                fontSize: 14,
            }}>
                WebGL Component
            </div>
        )
    }

    return (
        <div
            ref={mountRef}
            style={{ ...props.style, width: "100%", height: "100%", overflow: "hidden" }}
        />
    )
}
```

### WebGL Rules
- **Always show canvas placeholder** - WebGL won't render in the Framer editor
- **Always dispose resources** - `renderer.dispose()`, `geometry.dispose()`, `material.dispose()`, `texture.dispose()`
- **Cap pixel ratio** at 2 - `Math.min(window.devicePixelRatio, 2)` prevents performance issues on high-DPI screens
- **Use `alpha: true`** for transparent backgrounds that blend with Framer's design
- **Limit draw calls** - merge geometries, use instancing for repeated objects
- **Use `requestAnimationFrame`** and cancel it in cleanup
- **Expose visual properties** as controls: colors, speed, intensity, particle count
- **Lazy load Three.js** - it's large (~600KB), only load when component mounts outside canvas

### WebGL Libraries for Framer
```tsx
// Three.js - Full 3D engine
import * as THREE from "https://esm.sh/three@0.162.0"

// OGL - Lightweight WebGL (smaller than Three.js)
import { Renderer, Camera, Program, Mesh } from "https://esm.sh/ogl@1.0.3"

// PIXI.js - 2D WebGL rendering (particles, filters)
import * as PIXI from "https://esm.sh/pixi.js@7.3.3"
```

### Shader Pattern (Custom GLSL)
```tsx
// For custom visual effects, write GLSL shaders:
const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const fragmentShader = `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
        float wave = sin(vUv.x * 10.0 + uTime) * 0.5 + 0.5;
        gl_FragColor = vec4(uColor * wave, 1.0);
    }
`

// Use with Three.js ShaderMaterial:
const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(props.color) },
    },
})

// Update in animation loop:
material.uniforms.uTime.value = clock.getElapsedTime()
```

---

## Testing & Validation

### Automated Checks (run before committing)
```bash
npm run test        # Full: validate + typecheck + lint
npm run test:quick  # Fast: standards validator only
npm run validate    # Framer standards checker
npm run typecheck   # TypeScript compilation
npm run lint        # ESLint
```

### Testing Checklist Before Committing

1. Run `npm run validate` - all checks pass
2. Component renders without errors on Framer canvas
3. All property controls appear and function correctly
4. Default values produce a sensible visual output
5. Component responds to property changes in real-time
6. Preview mode shows full interactivity and animations
7. Keyboard navigation works for interactive elements
8. No console errors or warnings
9. Component handles missing/undefined props gracefully
10. RTL layout is visually correct (if applicable)
11. Reduced motion preference is respected
