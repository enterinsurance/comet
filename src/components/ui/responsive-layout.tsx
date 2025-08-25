"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Hook to detect mobile/tablet breakpoints
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    
    const listener = () => setMatches(media.matches)
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [matches, query])

  return matches
}

// Breakpoint hooks
export const useIsMobile = () => useMediaQuery("(max-width: 768px)")
export const useIsTablet = () => useMediaQuery("(min-width: 769px) and (max-width: 1024px)")
export const useIsDesktop = () => useMediaQuery("(min-width: 1025px)")

interface ResponsiveLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
  className?: string
}

export function ResponsiveLayout({
  children,
  sidebar,
  header,
  className,
}: ResponsiveLayoutProps) {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {/* Mobile header */}
      {isMobile && header && (
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm">
          {sidebar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          )}
          <div className="flex-1">{header}</div>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        {sidebar && !isMobile && (
          <div className="hidden md:fixed md:inset-y-0 md:z-50 md:flex md:w-72 md:flex-col">
            <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
              {sidebar}
            </div>
          </div>
        )}

        {/* Mobile sidebar */}
        {sidebar && isMobile && (
          <>
            {/* Backdrop */}
            <div
              className={cn(
                "fixed inset-0 z-50 bg-gray-900/80 transition-opacity md:hidden",
                sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
              )}
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <div
              className={cn(
                "fixed inset-y-0 left-0 z-50 w-80 transform overflow-y-auto bg-white px-6 pb-4 transition-transform md:hidden",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              )}
            >
              <div className="flex h-16 items-center justify-between">
                <div className="text-lg font-semibold">Menu</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close sidebar</span>
                </Button>
              </div>
              {sidebar}
            </div>
          </>
        )}

        {/* Main content */}
        <main
          className={cn(
            "flex-1",
            sidebar && !isMobile && "md:pl-72",
            isMobile && header && "pt-0"
          )}
        >
          {!isMobile && header && (
            <div className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-6 lg:px-8">
              {header}
            </div>
          )}
          
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// Responsive container component
interface ResponsiveContainerProps {
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
  className?: string
}

export function ResponsiveContainer({
  children,
  size = "xl",
  className,
}: ResponsiveContainerProps) {
  const containerClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md", 
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    full: "max-w-none",
  }

  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", containerClasses[size], className)}>
      {children}
    </div>
  )
}

// Responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    default: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
  className?: string
}

export function ResponsiveGrid({
  children,
  cols = { default: 1 },
  gap = 6,
  className,
}: ResponsiveGridProps) {
  const gridClasses = [
    `grid`,
    `gap-${gap}`,
    `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(" ")

  return (
    <div className={cn(gridClasses, className)}>
      {children}
    </div>
  )
}

// Responsive stack component
interface ResponsiveStackProps {
  children: React.ReactNode
  direction?: "row" | "col"
  spacing?: number
  align?: "start" | "center" | "end" | "stretch"
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
  wrap?: boolean
  className?: string
}

export function ResponsiveStack({
  children,
  direction = "col",
  spacing = 4,
  align = "stretch",
  justify = "start",
  wrap = false,
  className,
}: ResponsiveStackProps) {
  const stackClasses = [
    "flex",
    direction === "row" ? "flex-row" : "flex-col",
    `gap-${spacing}`,
    `items-${align}`,
    `justify-${justify}`,
    wrap && "flex-wrap",
  ].filter(Boolean).join(" ")

  return (
    <div className={cn(stackClasses, className)}>
      {children}
    </div>
  )
}