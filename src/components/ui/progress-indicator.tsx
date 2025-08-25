"use client"

import { Check, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "./responsive-layout"

export interface ProgressStep {
  id: string
  title: string
  description?: string
  status: "pending" | "current" | "completed"
}

interface ProgressIndicatorProps {
  steps: ProgressStep[]
  orientation?: "horizontal" | "vertical"
  showDescriptions?: boolean
  className?: string
}

export function ProgressIndicator({
  steps,
  orientation = "horizontal",
  showDescriptions = false,
  className,
}: ProgressIndicatorProps) {
  const currentStepIndex = steps.findIndex(step => step.status === "current")
  const isMobile = useIsMobile()
  // Force vertical orientation on mobile for better UX
  const isHorizontal = orientation === "horizontal" && !isMobile

  return (
    <div
      className={cn(
        "flex",
        isHorizontal ? "items-center justify-center space-x-8" : "flex-col space-y-6",
        className
      )}
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const isCompleted = step.status === "completed"
        const isCurrent = step.status === "current"
        const isPending = step.status === "pending"

        return (
          <div
            key={step.id}
            className={cn(
              "flex",
              isHorizontal ? "flex-col items-center" : "items-start space-x-3"
            )}
          >
            {/* Step Content */}
            <div className={cn("flex", isHorizontal ? "flex-col items-center" : "items-center space-x-3")}>
              {/* Step Circle */}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200",
                  {
                    "border-green-500 bg-green-500 text-white": isCompleted,
                    "border-blue-500 bg-blue-500 text-white shadow-md": isCurrent,
                    "border-gray-300 bg-white text-gray-400": isPending,
                  }
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Circle
                    className={cn("h-5 w-5", {
                      "fill-current": isCurrent,
                    })}
                  />
                )}
              </div>

              {/* Step Text */}
              <div className={cn("text-center", !isHorizontal && "flex-1")}>
                <div
                  className={cn("text-sm font-medium", {
                    "text-green-600": isCompleted,
                    "text-blue-600": isCurrent,
                    "text-gray-500": isPending,
                  })}
                >
                  {step.title}
                </div>
                {showDescriptions && step.description && (
                  <div
                    className={cn("mt-1 text-xs", {
                      "text-green-500": isCompleted,
                      "text-blue-500": isCurrent,
                      "text-gray-400": isPending,
                    })}
                  >
                    {step.description}
                  </div>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div
                className={cn(
                  "transition-all duration-200",
                  isHorizontal ? "h-0.5 w-16 mt-2" : "h-6 w-0.5 ml-5",
                  {
                    "bg-green-500": index < currentStepIndex,
                    "bg-gray-300": index >= currentStepIndex,
                  }
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Document signing flow progress
export const DocumentSigningSteps: ProgressStep[] = [
  {
    id: "upload",
    title: "Upload Document",
    description: "Select and upload your PDF document",
    status: "pending",
  },
  {
    id: "fields",
    title: "Add Signature Fields",
    description: "Mark where signatures should be placed",
    status: "pending",
  },
  {
    id: "recipients",
    title: "Add Recipients",
    description: "Invite people to sign the document",
    status: "pending",
  },
  {
    id: "send",
    title: "Send Invitations",
    description: "Distribute signing invitations via email",
    status: "pending",
  },
  {
    id: "complete",
    title: "Collect Signatures",
    description: "Wait for all parties to sign",
    status: "pending",
  },
]

// Signing process steps for recipients
export const SigningProcessSteps: ProgressStep[] = [
  {
    id: "review",
    title: "Review Document",
    description: "Read through the document carefully",
    status: "pending",
  },
  {
    id: "sign",
    title: "Add Signature",
    description: "Sign in the designated areas",
    status: "pending",
  },
  {
    id: "confirm",
    title: "Confirm Details",
    description: "Verify your information and signature",
    status: "pending",
  },
  {
    id: "complete",
    title: "Complete",
    description: "Document successfully signed",
    status: "pending",
  },
]