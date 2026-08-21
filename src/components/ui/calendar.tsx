'use client'

import type { DayPickerProps } from 'react-day-picker'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { cn } from '@/lib/utils'

export type CalendarProps = DayPickerProps

function Chevron({ orientation }: { orientation?: string }) {
  if (orientation === 'left') {
    return <ChevronLeft className="size-4" />
  }
  return <ChevronRight className="size-4" />
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      className={cn(
        'bg-background group/calendar p-3 [--cell-size:2.25rem]',
        className,
      )}
      classNames={{
        months: 'relative flex flex-col gap-4 sm:flex-row',
        month: 'space-y-4',
        month_caption: 'flex items-center justify-center gap-2 pt-1 pb-2',
        caption_label: 'text-sm font-semibold text-gray-800',
        nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
        button_previous: cn(
          'inline-flex size-[--cell-size] items-center justify-center rounded-md',
          'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
          'transition-colors cursor-pointer',
          'disabled:pointer-events-none disabled:opacity-40',
        ),
        button_next: cn(
          'inline-flex size-[--cell-size] items-center justify-center rounded-md',
          'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
          'transition-colors cursor-pointer',
          'disabled:pointer-events-none disabled:opacity-40',
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: cn(
          'flex-1 text-center text-[0.8rem] font-medium text-gray-400 pb-1',
        ),
        week: 'flex mt-1',
        day: cn(
          'group/day relative aspect-square flex-1',
          'first:[&:has([data-range-start])]:rounded-l-md last:[&:has([data-range-end])]:rounded-r-md',
        ),
        day_button: cn(
          'inline-flex size-full items-center justify-center rounded-md text-sm',
          'transition-all cursor-pointer',
          'hover:bg-gray-100 hover:text-gray-900',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          'group-aria-selected/day:bg-primary group-aria-selected/day:text-primary-foreground',
          'group-aria-selected/day:font-medium',
        ),
        range_start: 'rounded-l-md bg-primary/10',
        range_end: 'rounded-r-md bg-primary/10',
        range_middle: cn(
          'bg-accent',
          '[&>button]:rounded-none [&>button]:bg-transparent',
          '[&>button]:hover:bg-accent/80',
        ),
        selected: cn(
          '[&>button]:bg-primary [&>button]:text-primary-foreground',
          '[&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
          '[&>button]:font-medium [&>button]:shadow-sm',
        ),
        today: cn(
          '[&>button]:bg-accent [&>button]:text-accent-foreground',
          '[&>button]:font-bold',
        ),
        outside: '[&>button]:text-gray-300 [&>button]:hover:text-gray-400',
        disabled: '[&>button]:text-gray-200 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron,
      }}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
