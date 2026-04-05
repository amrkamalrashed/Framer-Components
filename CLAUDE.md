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

### ALWAYS Do
- **Always export a default function component** - this is what Framer expects
- **Always call `addPropertyControls`** on the exported component
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
 */
export default function Component(props) { ... }

// Options: "any" (flexible), "fixed" (fixed size only)
// @framerSupportedLayoutWidth any-prefer-fixed  -- prefers fixed but allows flexible
```

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

## Testing Checklist Before Committing

1. Component renders without errors on Framer canvas
2. All property controls appear and function correctly
3. Default values produce a sensible visual output
4. Component responds to property changes in real-time
5. Preview mode shows full interactivity and animations
6. Keyboard navigation works for interactive elements
7. No console errors or warnings
8. Component handles missing/undefined props gracefully
9. RTL layout is visually correct (if applicable)
10. Reduced motion preference is respected
