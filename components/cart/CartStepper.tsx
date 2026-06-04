"use client";

import { Check } from "lucide-react";

export type CartStep = "bag" | "checkout";

interface CartStepperProps {
  currentStep: CartStep;
  onStepChange: (step: CartStep) => void;
  canProceedToCheckout: boolean;
}

export default function CartStepper({
  currentStep,
  onStepChange,
  canProceedToCheckout,
}: CartStepperProps) {
  const steps: { id: CartStep; label: string; number: number }[] = [
    { id: "bag", label: "Bag", number: 1 },
    { id: "checkout", label: "Checkout", number: 2 },
  ];

  const currentIndex = currentStep === "bag" ? 0 : 1;

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentIndex > index;
        const disabled = step.id === "checkout" && !canProceedToCheckout;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle + label */}
            <button
              onClick={() => {
                if (step.id === "bag") onStepChange("bag");
                if (step.id === "checkout" && canProceedToCheckout) onStepChange("checkout");
              }}
              disabled={disabled}
              className={`flex items-center gap-2.5 group ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              {/* Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  isCompleted
                    ? "bg-gray-900 text-white"
                    : isActive
                      ? "bg-gray-900 text-white ring-4 ring-gray-900/10"
                      : disabled
                        ? "bg-gray-100 text-gray-300 border border-gray-200"
                        : "bg-gray-100 text-gray-500 border border-gray-300 group-hover:border-gray-400"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step.number}
              </div>

              {/* Label */}
              <span
                className={`text-sm font-medium transition-colors ${
                  isActive || isCompleted
                    ? "text-gray-900"
                    : disabled
                      ? "text-gray-300"
                      : "text-gray-500 group-hover:text-gray-700"
                }`}
              >
                {step.label}
              </span>
            </button>

            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div className="w-16 sm:w-24 mx-3">
                <div className="h-[2px] w-full rounded-full overflow-hidden bg-gray-200">
                  <div
                    className={`h-full bg-gray-900 transition-all duration-300 ${
                      isCompleted ? "w-full" : "w-0"
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
