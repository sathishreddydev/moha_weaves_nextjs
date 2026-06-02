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
      <div className="space-y-3">
        {/* Price labels */}
        <div className="flex justify-between text-xs text-gray-600">
          <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">
            {formatPrice(localValue[0])}
          </span>
          <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">
            {formatPrice(localValue[1])}
          </span>
        </div>

        {/* Slider */}
        <SliderPrimitive.Root
          ref={ref}
          className={cn(
            "relative flex w-full touch-none select-none items-center py-2",
            className
          )}
          min={min}
          max={max}
          step={step}
          value={localValue}
          onValueChange={handleValueChange}
          {...props}
        >
          {/* Track */}
          <SliderPrimitive.Track className="relative h-[3px] w-full grow overflow-hidden rounded-full bg-gray-300">
            <SliderPrimitive.Range className="absolute h-full bg-gray-900" />
          </SliderPrimitive.Track>

          {/* Thumb 1 — MUI style: solid circle with hover ring */}
          <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full bg-gray-900 shadow-md transition-all duration-150 focus-visible:outline-none hover:shadow-[0_0_0_8px_rgba(0,0,0,0.1)] focus-visible:shadow-[0_0_0_8px_rgba(0,0,0,0.1)] disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing active:scale-110" />

          {/* Thumb 2 */}
          <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full bg-gray-900 shadow-md transition-all duration-150 focus-visible:outline-none hover:shadow-[0_0_0_8px_rgba(0,0,0,0.1)] focus-visible:shadow-[0_0_0_8px_rgba(0,0,0,0.1)] disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing active:scale-110" />
        </SliderPrimitive.Root>
      </div>
    )
  }
)

PriceRangeSlider.displayName = "PriceRangeSlider"

export { PriceRangeSlider }
