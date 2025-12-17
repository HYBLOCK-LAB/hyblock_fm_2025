import React from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  fullWidth,
  className,
  children,
  ...rest
}: ButtonProps) {
  const base = variant === 'primary'
    ? 'btn-primary'
    : variant === 'secondary'
    ? 'btn-secondary'
    : 'btn-danger'

  const width = fullWidth ? ' w-full' : ''
  const cls = `${base}${width}${className ? ' ' + className : ''}`

  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}
