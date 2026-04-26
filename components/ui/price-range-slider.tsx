"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const PriceRangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    min?: number
    max?: number
    step?: number
    value?: [number, number]
    onValueChange?: (value: [number, number]) => void
    formatPrice?: (value: number) => string
  }
>(
  (
    {
      className,
      min = 100,
      max = 50000,
      step = 100,
      value = [min, max],
      onValueChange,
      formatPrice = (val) => `₹${val.toLocaleString()}`,
      ...props
    },
    ref
  ) => {
    const [localValue, setLocalValue] = React.useState<[number, number]>(value)

    React.useEffect(() => {
      setLocalValue(value)
    }, [value[0], value[1]])

    const handleValueChange = (newValue: [number, number]) => {
      setLocalValue(newValue)
      onValueChange?.(newValue)
    }

    return (
      <div className="space-y-4">
        <SliderPrimitive.Root
          ref={ref}
          className={cn(
            "relative flex w-full touch-none select-none items-center",
            className
          )}
          min={min}
          max={max}
          step={step}
          value={localValue}
          onValueChange={handleValueChange}
          {...props}
        >
          <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200">
            <SliderPrimitive.Range className="absolute h-full bg-gray-900" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-gray-900 bg-white shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-50" />
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-gray-900 bg-white shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-50" />
        </SliderPrimitive.Root>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span className="font-medium">{formatPrice(localValue[0])}</span>
          <span className="font-medium">{formatPrice(localValue[1])}</span>
        </div>
      </div>
    )
  }
)

PriceRangeSlider.displayName = SliderPrimitive.Root.displayName

export { PriceRangeSlider }
