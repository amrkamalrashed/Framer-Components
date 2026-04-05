#!/usr/bin/env node
/**
 * Framer Component Standards Validator
 *
 * Checks all .tsx files in components/ against the repo's quality standards.
 * Run: node scripts/validate-components.mjs
 *
 * Exit code 0 = all pass, 1 = failures found
 */

import { readFileSync, readdirSync } from "fs"
import { join, basename } from "path"

const COMPONENTS_DIR = join(process.cwd(), "components")
const PASS = "\x1b[32m✓\x1b[0m"
const WARN = "\x1b[33m⚠\x1b[0m"
const FAIL = "\x1b[31m✗\x1b[0m"
const BOLD = "\x1b[1m"
const RESET = "\x1b[0m"

// ── Check definitions ──

const checks = [
    {
        id: "export-default",
        label: "Default export function",
        level: "error",
        test: (code) => /export\s+default\s+function\s+\w+/.test(code),
        message: "Must have `export default function ComponentName`",
    },
    {
        id: "add-property-controls",
        label: "addPropertyControls called",
        level: "error",
        test: (code) => /addPropertyControls\(/.test(code),
        message: "Must call addPropertyControls() on the component",
    },
    {
        id: "layout-annotation-width",
        label: "@framerSupportedLayoutWidth",
        level: "warn",
        test: (code) => /@framerSupportedLayoutWidth/.test(code),
        message: "Missing layout width annotation in JSDoc",
    },
    {
        id: "layout-annotation-height",
        label: "@framerSupportedLayoutHeight",
        level: "warn",
        test: (code) => /@framerSupportedLayoutHeight/.test(code),
        message: "Missing layout height annotation in JSDoc",
    },
    {
        id: "display-name",
        label: "displayName set",
        level: "warn",
        test: (code) => /\.displayName\s*=/.test(code),
        message: "Missing ComponentName.displayName for Framer panel",
    },
    {
        id: "font-control",
        label: "Font uses extended controls",
        level: "info",
        test: (code) => {
            // If there's a ControlType.Font, it should have controls: "extended"
            if (!code.includes("ControlType.Font")) return true // N/A
            return /controls:\s*["']extended["']/.test(code)
        },
        message: 'ControlType.Font should use controls: "extended"',
    },
    {
        id: "reduced-motion",
        label: "Reduced motion support",
        level: "warn",
        test: (code) => {
            // Check if component has animations
            const hasAnimation =
                code.includes("framer-motion") ||
                code.includes("transition") ||
                code.includes("animate") ||
                code.includes("animation")
            if (!hasAnimation) return true // N/A
            return (
                code.includes("prefers-reduced-motion") ||
                code.includes("useReducedMotion") ||
                code.includes("prefersReducedMotion")
            )
        },
        message: "Animated component should check prefers-reduced-motion",
    },
    {
        id: "canvas-safety",
        label: "Canvas render check",
        level: "warn",
        test: (code) => {
            // Check if component has side effects that should be gated
            const hasSideEffects =
                code.includes("fetch(") ||
                code.includes("addEventListener") ||
                code.includes("IntersectionObserver") ||
                code.includes("setInterval")
            if (!hasSideEffects) return true // N/A
            return (
                code.includes("RenderTarget") ||
                code.includes("useIsStaticRenderer") ||
                code.includes("useIsOnFramerCanvas") ||
                code.includes("isCanvas") ||
                code.includes("isStatic")
            )
        },
        message:
            "Components with side effects should check RenderTarget or useIsStaticRenderer",
    },
    {
        id: "effect-cleanup",
        label: "useEffect cleanup",
        level: "warn",
        test: (code) => {
            // Find useEffect calls that add listeners but don't return cleanup
            const effects = code.match(/useEffect\s*\(\s*(?:function\s*\(|(?:\([^)]*\))?\s*=>)/g)
            if (!effects || effects.length === 0) return true
            // Check if there are addEventListener calls without corresponding removeEventListener
            const addCount = (code.match(/addEventListener/g) || []).length
            const removeCount = (code.match(/removeEventListener/g) || []).length
            if (addCount > 0 && removeCount === 0) return false
            // Check for setInterval without clearInterval
            const setIntCount = (code.match(/setInterval/g) || []).length
            const clearIntCount = (code.match(/clearInterval/g) || []).length
            if (setIntCount > 0 && clearIntCount === 0) return false
            // Check for setTimeout without clearTimeout
            const setTOCount = (code.match(/setTimeout/g) || []).length
            const clearTOCount = (code.match(/clearTimeout/g) || []).length
            if (setTOCount > 0 && clearTOCount === 0) return false
            return true
        },
        message: "Event listeners, intervals, and timeouts should be cleaned up in useEffect",
    },
    {
        id: "browser-api-guard",
        label: "Browser API guards",
        level: "warn",
        test: (code) => {
            // Check for window/document access outside useEffect
            const lines = code.split("\n")
            let inUseEffect = false
            let depth = 0
            for (const line of lines) {
                if (/useEffect/.test(line)) inUseEffect = true
                if (inUseEffect) {
                    depth += (line.match(/{/g) || []).length
                    depth -= (line.match(/}/g) || []).length
                    if (depth <= 0) inUseEffect = false
                }
            }
            // Simple check: if window is used at module level (not in a function)
            // This is a heuristic - check for typeof window guards
            if (
                code.includes("window.") &&
                !code.includes('typeof window !== "undefined"') &&
                !code.includes("typeof window === \"undefined\"") &&
                !code.includes("typeof window !== 'undefined'")
            ) {
                // Check if all window access is inside useEffect/functions
                const moduleLevel = code.replace(
                    /(?:useEffect|useCallback|useMemo|function\s+\w+)\s*\([^]*?\n\}/g,
                    ""
                )
                if (/window\./.test(moduleLevel)) return false
            }
            return true
        },
        message: 'window/document access should be guarded with typeof window !== "undefined"',
    },
    {
        id: "aria-attributes",
        label: "Accessibility (ARIA)",
        level: "info",
        test: (code) => {
            return (
                code.includes("aria-") ||
                code.includes("role=") ||
                code.includes("aria-label") ||
                code.includes("aria-live")
            )
        },
        message: "Component should have ARIA attributes for accessibility",
    },
    {
        id: "semantic-html",
        label: "Semantic HTML",
        level: "info",
        test: (code) => {
            // Check for div with onClick without role="button"
            const divOnClick = /\<div[^>]*onClick/.test(code)
            if (divOnClick) {
                return (
                    /role=["']button["']/.test(code) ||
                    /<button/.test(code)
                )
            }
            return true
        },
        message: 'Interactive <div onClick> should use <button> or have role="button"',
    },
    {
        id: "no-any-props",
        label: "Typed props (no bare any)",
        level: "info",
        test: (code) => {
            // Check if the main component function has typed props
            const match = code.match(
                /export\s+default\s+function\s+\w+\s*\(\s*props\s*:\s*any\s*\)/
            )
            return !match
        },
        message: "Component props should have a proper TypeScript interface, not `any`",
    },
    {
        id: "style-prop",
        label: "Spreads style prop",
        level: "warn",
        test: (code) => {
            // Check if component destructures or uses style prop
            return (
                code.includes("props.style") ||
                code.includes("style,") ||
                code.includes("...style") ||
                // Some components use fixed layout and don't need it
                /@framerSupportedLayoutWidth\s+fixed/.test(code)
            )
        },
        message: "Root element should spread props.style for Framer layout integration",
    },
    {
        id: "no-hardcoded-font-family",
        label: "No hardcoded fontFamily",
        level: "info",
        test: (code) => {
            // Check for hardcoded font family strings that aren't in defaults/fallbacks
            const hardcoded = code.match(
                /fontFamily:\s*["'](?!inherit|sans-serif|monospace|system-ui)[^"']+["']/g
            )
            if (!hardcoded) return true
            // Allow if it's in a default/fallback context
            return hardcoded.length <= 2 // Allow a couple for fallbacks
        },
        message: "Font families should come from ControlType.Font, not hardcoded strings",
    },
]

// ── Runner ──

function validateComponent(filePath) {
    const code = readFileSync(filePath, "utf-8")
    const name = basename(filePath, ".tsx")
    const results = []

    for (const check of checks) {
        const passed = check.test(code)
        results.push({
            ...check,
            passed,
            component: name,
        })
    }

    return { name, results, lineCount: code.split("\n").length }
}

function main() {
    const files = readdirSync(COMPONENTS_DIR)
        .filter((f) => f.endsWith(".tsx") && !f.startsWith("."))
        .sort()

    if (files.length === 0) {
        console.log("No .tsx components found in components/")
        process.exit(0)
    }

    console.log(
        `\n${BOLD}Framer Component Standards Validator${RESET}\n`
    )
    console.log(`Found ${files.length} components to validate\n`)

    let totalErrors = 0
    let totalWarnings = 0
    let totalInfo = 0
    const summaryRows = []

    for (const file of files) {
        const filePath = join(COMPONENTS_DIR, file)
        const { name, results, lineCount } = validateComponent(filePath)

        const errors = results.filter((r) => !r.passed && r.level === "error")
        const warnings = results.filter((r) => !r.passed && r.level === "warn")
        const infos = results.filter((r) => !r.passed && r.level === "info")
        const passed = results.filter((r) => r.passed)

        totalErrors += errors.length
        totalWarnings += warnings.length
        totalInfo += infos.length

        // Component header
        const status =
            errors.length > 0
                ? `${FAIL} FAIL`
                : warnings.length > 0
                  ? `${WARN} WARN`
                  : `${PASS} PASS`

        console.log(
            `${BOLD}${name}${RESET} (${lineCount} lines) ${status}`
        )

        // Show failures
        for (const r of errors) {
            console.log(`  ${FAIL} ${r.label}: ${r.message}`)
        }
        for (const r of warnings) {
            console.log(`  ${WARN} ${r.label}: ${r.message}`)
        }
        for (const r of infos) {
            console.log(`  ${WARN} ${r.label}: ${r.message}`)
        }

        // Show pass count
        console.log(
            `  ${PASS} ${passed.length}/${results.length} checks passed\n`
        )

        summaryRows.push({
            name,
            errors: errors.length,
            warnings: warnings.length,
            infos: infos.length,
            passed: passed.length,
            total: results.length,
        })
    }

    // Summary
    console.log(`${BOLD}━━━ Summary ━━━${RESET}`)
    console.log(`Components: ${files.length}`)
    console.log(`${FAIL} Errors:   ${totalErrors}`)
    console.log(`${WARN} Warnings: ${totalWarnings}`)
    console.log(`${WARN} Info:     ${totalInfo}`)
    console.log()

    if (totalErrors > 0) {
        console.log(
            `${FAIL} ${totalErrors} error(s) found. These must be fixed.`
        )
        process.exit(1)
    } else if (totalWarnings > 0) {
        console.log(
            `${WARN} ${totalWarnings} warning(s) found. Review recommended.`
        )
        process.exit(0)
    } else {
        console.log(`${PASS} All components pass validation!`)
        process.exit(0)
    }
}

main()
