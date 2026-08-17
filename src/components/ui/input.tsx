import type { InputHTMLAttributes } from 'react'

import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement>

function Input({ ref, className, type, ...props }: InputProps & { ref?: React.RefObject<HTMLInputElement | null> }) {
  return (
    <input
      className={cn(
        'flex min-h-[44px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  )
}
Input.displayName = 'Input'

export { Input }
