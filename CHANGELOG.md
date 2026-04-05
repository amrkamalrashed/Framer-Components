# Changelog

All notable changes to this component library are documented here.

Format: [Component Name] - Action - Brief description

---

## 2026-04-05 - Initial Setup

### Repository
- Created repository structure (`components/`, `docs/`)
- Added `README.md` with component standards and usage guide
- Added `CLAUDE.md` with comprehensive Framer development guidelines and API reference
- Added `docs/framer-guide.md` with deep-dive development guide
- Added `CHANGELOG.md` for tracking changes

### Components Imported from SheVibes
- **TypewriterEffect** - Dynamic typing animation with customizable cursor, multiple modes (loop/once/sequential), humanized typing, IntersectionObserver trigger, reduced motion support
- **TextRevealPro** - Scroll-driven text reveal with character/word animation, multi-color gradients, translation detection, performance-optimized single scroll listener
- **Tarievencalculator** - Dutch health insurance eigen bijdrage calculator with 69 policies, progressive disclosure, smooth transitions
- **SheVibesPreloader** - Full-screen preloader with animated counter, session gating, canvas placeholder, exit animation
- **CircularFlow** - SVG circular flow diagram with scroll-driven animation, step labels, annotations, font controls
- **WordWheel** - Vertical rotating word ticker with spring physics, center-focus scaling, IntersectionObserver gating
- **StepsTimeline** - Scroll-linked vertical progress steps with zero re-renders during scroll (direct DOM mutation), CSS transitions
- **PodcastCarousel** - 3D card carousel for Spotify/YouTube content with flip animation, drag navigation, oEmbed auto-fetch, auto-play

---

## Component Status Tracker

| Component | Version | Status | Needs Cleanup | Notes |
|---|---|---|---|---|
| TypewriterEffect | 1.0 | Imported | Low | Good a11y, extended font, reduced motion |
| TextRevealPro | 1.0 | Imported | Low | Performance-optimized, translation-safe |
| Tarievencalculator | 5.0 | Imported | Medium | Project-specific data, large file |
| SheVibesPreloader | 1.0 | Imported | Medium | Uses `var` syntax, project-specific branding |
| CircularFlow | 1.0 | Imported | Low | Good structure, font controls |
| WordWheel | 1.0 | Imported | Low | Spring physics, static renderer support |
| StepsTimeline | 1.0 | Imported | Low | Zero re-render scroll, good a11y |
| PodcastCarousel | 1.0 | Imported | Medium | Large file, project-specific defaults |
