'use client'

import type { DayPickerProps } from 'react-day-picker'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { cn } from '@/lib/utils'

export type CalendarProps = DayPickerProps

function Chevron({ orientation }: { orientation?: string }) {
  if (orientation === 'left') {
    return <ChevronLeft className="h-4 w-4" />
  }
  return <ChevronRight className="h-4 w-4" />
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      className={cn('p-5', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-6',
        month: 'space-y-4',
        month_caption: 'flex items-center justify-center py-2',
        caption_label: 'text-sm font-semibold text-gray-800',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          'absolute left-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full',
          'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
          'transition-colors duration-150 cursor-pointer',
        ),
        button_next: cn(
          'absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full',
          'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
          'transition-colors duration-150 cursor-pointer',
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex mb-1',
        weekday: cn(
          'flex-1 text-center text-xs font-medium text-gray-400 pb-2',
        ),
        week: 'flex mt-0.5',
        day: cn(
          'flex-1 text-center p-0.5 relative',
          'first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg',
        ),
        day_button: cn(
          'inline-flex h-10 w-full items-center justify-center rounded-lg text-sm',
          'transition-all duration-150 cursor-pointer',
          'hover:bg-teal-50 hover:text-teal-700',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1',
          'aria-selected:font-medium',
        ),
        selected: cn(
          '[&>button]:bg-teal-600 [&>button]:text-white [&>button]:hover:bg-teal-700',
          '[&>button]:shadow-sm',
        ),
        range_start: '[&>button]:rounded-r-none [&>button]:bg-teal-600 [&>button]:text-white',
        range_end: '[&>button]:rounded-l-none [&>button]:bg-teal-600 [&>button]:text-white',
        range_middle: cn(
          '[&>button]:rounded-none [&>button]:bg-teal-50 [&>button]:text-teal-700',
          '[&>button]:hover:bg-teal-100',
        ),
        today: '[&>button]:font-bold [&>button]:text-teal-600',
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
