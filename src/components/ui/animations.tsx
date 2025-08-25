"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

// Fade in animation component
interface FadeInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
  direction?: "up" | "down" | "left" | "right" | "none"
}

export function FadeIn({
  children,
  delay = 0,
  duration = 300,
  direction = "up",
  className,
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const directionClasses = {
    up: "translate-y-4",
    down: "-translate-y-4", 
    left: "translate-x-4",
    right: "-translate-x-4",
    none: "",
  }

  return (
    <div
      className={cn(
        "transition-all ease-out",
        isVisible ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${directionClasses[direction]}`,
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

// Stagger children animation
interface StaggerProps {
  children: React.ReactNode[]
  delay?: number
  staggerDelay?: number
  className?: string
}

export function Stagger({
  children,
  delay = 0,
  staggerDelay = 100,
  className,
}: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn key={index} delay={delay + (index * staggerDelay)}>
          {child}
        </FadeIn>
      ))}
    </div>
  )
}

// Scale animation component
interface ScaleProps {
  children: React.ReactNode
  scale?: number
  duration?: number
  className?: string
  trigger?: boolean
}

export function Scale({
  children,
  scale = 1.05,
  duration = 200,
  trigger = false,
  className,
}: ScaleProps) {
  return (
    <div
      className={cn(
        "transition-transform ease-out",
        trigger && `scale-${Math.round(scale * 100)}`,
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

// Bounce animation for loading states
interface BounceProps {
  size?: "sm" | "md" | "lg"
  color?: string
  className?: string
}

export function BouncingDots({ size = "md", color = "bg-blue-600", className }: BounceProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3", 
    lg: "w-4 h-4",
  }

  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            "rounded-full animate-bounce",
            sizeClasses[size],
            color
          )}
          style={{
            animationDelay: `${index * 0.1}s`,
            animationDuration: "0.6s",
          }}
        />
      ))}
    </div>
  )
}

// Pulse animation for loading
interface PulseProps {
  children: React.ReactNode
  className?: string
  intensity?: "low" | "medium" | "high"
}

export function Pulse({ children, intensity = "medium", className }: PulseProps) {
  const intensityClasses = {
    low: "animate-pulse",
    medium: "animate-pulse",
    high: "animate-ping",
  }

  return (
    <div className={cn(intensityClasses[intensity], className)}>
      {children}
    </div>
  )
}

// Slide in animation
interface SlideInProps {
  children: React.ReactNode
  direction: "left" | "right" | "up" | "down"
  duration?: number
  delay?: number
  className?: string
}

export function SlideIn({
  children,
  direction,
  duration = 300,
  delay = 0,
  className,
}: SlideInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const directionClasses = {
    left: isVisible ? "translate-x-0" : "-translate-x-full",
    right: isVisible ? "translate-x-0" : "translate-x-full",
    up: isVisible ? "translate-y-0" : "translate-y-full",
    down: isVisible ? "translate-y-0" : "-translate-y-full",
  }

  return (
    <div
      className={cn(
        "transition-transform ease-out",
        directionClasses[direction],
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

// Rotate animation for loading spinners
interface RotateProps {
  children: React.ReactNode
  speed?: "slow" | "medium" | "fast"
  className?: string
}

export function Rotate({ children, speed = "medium", className }: RotateProps) {
  const speedClasses = {
    slow: "animate-spin",
    medium: "animate-spin",
    fast: "animate-spin",
  }

  const speedStyles = {
    slow: { animationDuration: "3s" },
    medium: { animationDuration: "1s" },
    fast: { animationDuration: "0.5s" },
  }

  return (
    <div
      className={cn(speedClasses[speed], className)}
      style={speedStyles[speed]}
    >
      {children}
    </div>
  )
}

// Progress bar animation
interface ProgressBarProps {
  progress: number
  height?: number
  color?: string
  backgroundColor?: string
  animated?: boolean
  className?: string
}

export function ProgressBar({
  progress,
  height = 8,
  color = "bg-blue-600",
  backgroundColor = "bg-gray-200",
  animated = true,
  className,
}: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayProgress(progress)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setDisplayProgress(progress)
    }
  }, [progress, animated])

  return (
    <div className={cn("w-full rounded-full overflow-hidden", backgroundColor, className)}>
      <div
        className={cn(
          "rounded-full transition-all duration-500 ease-out",
          color,
          animated && "transition-[width]"
        )}
        style={{ 
          width: `${Math.max(0, Math.min(100, displayProgress))}%`,
          height: `${height}px`
        }}
      />
    </div>
  )
}

// Typewriter effect
interface TypewriterProps {
  text: string
  speed?: number
  delay?: number
  className?: string
  onComplete?: () => void
}

export function Typewriter({
  text,
  speed = 50,
  delay = 0,
  className,
  onComplete,
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (delay > 0) {
      const delayTimer = setTimeout(() => {
        setCurrentIndex(0)
      }, delay)
      return () => clearTimeout(delayTimer)
    }
  }, [delay])

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, speed)

      return () => clearTimeout(timer)
    } else if (currentIndex === text.length && onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, onComplete])

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

// Shake animation for errors
interface ShakeProps {
  children: React.ReactNode
  trigger?: boolean
  className?: string
}

export function Shake({ children, trigger = false, className }: ShakeProps) {
  const [isShaking, setIsShaking] = useState(false)

  useEffect(() => {
    if (trigger) {
      setIsShaking(true)
      const timer = setTimeout(() => setIsShaking(false), 500)
      return () => clearTimeout(timer)
    }
  }, [trigger])

  return (
    <div className={cn(isShaking && "animate-bounce", className)}>
      {children}
    </div>
  )
}