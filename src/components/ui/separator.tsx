'use client'

import type { ComponentPropsWithoutRef } from 'react'

import * as SeparatorPrimitive from '@radix-ui/react-separator'

import { cn } from '@/lib/utils'

function Separator({
  className,
  decorative = true,
  orientation = 'horizontal',
  ...props
}: ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className,
      )}
      decorative={decorative}
      orientation={orientation}
      {...props}
    />
  )
}

export { Separator }
