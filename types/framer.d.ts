// Type stubs for Framer's runtime API
// These allow TypeScript checking outside Framer's editor

declare module "framer" {
    import { ComponentType, CSSProperties } from "react"

    // Property Control Types
    export const ControlType: {
        String: "string"
        Number: "number"
        Boolean: "boolean"
        Enum: "enum"
        Color: "color"
        Image: "image"
        ResponsiveImage: "responsiveimage"
        File: "file"
        ComponentInstance: "componentinstance"
        Array: "array"
        Object: "object"
        Link: "link"
        Font: "font"
        Date: "date"
        Transition: "transition"
        EventHandler: "eventhandler"
        BoxShadow: "boxshadow"
        Cursor: "cursor"
        Padding: "padding"
        BorderRadius: "borderradius"
        Border: "border"
        RichText: "richtext"
    }

    export interface PropertyControlDefinition {
        type: string
        title?: string
        description?: string
        defaultValue?: any
        hidden?: (props: any) => boolean
        optional?: boolean
        [key: string]: any
    }

    export function addPropertyControls(
        component: ComponentType<any>,
        controls: Record<string, PropertyControlDefinition>
    ): void

    // RenderTarget
    export const RenderTarget: {
        current(): "canvas" | "preview" | "export" | "thumbnail"
        canvas: "canvas"
        preview: "preview"
        export: "export"
        thumbnail: "thumbnail"
    }

    // Hooks
    export function useIsOnFramerCanvas(): boolean
    export function useIsStaticRenderer(): boolean
    export function useLocaleInfo(): {
        activeLocale: { code: string; name: string }
        locales: Array<{ code: string; name: string }>
        setLocale: (locale: { code: string; name: string }) => void
    }
    export function useLocaleCode(): string

    // CSS utility
    export function withCSS(
        component: ComponentType<any>,
        css: string
    ): ComponentType<any>
}
