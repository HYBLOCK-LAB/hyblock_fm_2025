import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean
}

export default function Card({ bordered = false, className, children, ...rest }: CardProps) {
  const cls = `glass-card${bordered ? ' neon-border' : ''}${className ? ' ' + className : ''}`
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  )
}
