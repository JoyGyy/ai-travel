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
      className={cn('p-3', className)}
      classNames={classNames}
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
