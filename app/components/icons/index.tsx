import React from 'react'

type IconProps = {
  size?: number
  className?: string
  strokeWidth?: number
}

const svgProps = (size?: number, className?: string) => ({
  width: size ?? 20,
  height: size ?? 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  className,
})

export function WalletIcon({ size, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...svgProps(size, className)} stroke="currentColor">
      <path d="M3 7a3 3 0 0 1 3-3h11a2 2 0 1 1 0 4H6a3 3 0 0 1-3-3Z" strokeWidth={strokeWidth}/>
      <rect x="3" y="7" width="18" height="12" rx="3" strokeWidth={strokeWidth}/>
      <circle cx="17" cy="13" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function TrophyIcon({ size, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...svgProps(size, className)} stroke="currentColor">
      <path d="M8 21h8" strokeWidth={strokeWidth} />
      <path d="M9 17h6" strokeWidth={strokeWidth} />
      <path d="M7 4h10v4a5 5 0 1 1-10 0V4Z" strokeWidth={strokeWidth} />
      <path d="M5 6H3a2 2 0 0 0 2 2" strokeWidth={strokeWidth} />
      <path d="M19 6h2a2 2 0 0 1-2 2" strokeWidth={strokeWidth} />
    </svg>
  )
}

export function BrainIcon({ size, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...svgProps(size, className)} stroke="currentColor">
      <path d="M9 4a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3" strokeWidth={strokeWidth} />
      <path d="M9 4a3 3 0 0 1 3-2 3 3 0 0 1 3 3v10a3 3 0 0 1-3 3" strokeWidth={strokeWidth} />
      <path d="M6 9h4M6 13h4M14 9h4M14 13h4" strokeWidth={strokeWidth} />
    </svg>
  )
}

export function ChainIcon({ size, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...svgProps(size, className)} stroke="currentColor">
      <path d="M7 7l3-3a4 4 0 0 1 6 6l-3 3" strokeWidth={strokeWidth} />
      <path d="M17 17l-3 3a4 4 0 0 1-6-6l3-3" strokeWidth={strokeWidth} />
    </svg>
  )
}

export function AwardIcon({ size, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...svgProps(size, className)} stroke="currentColor">
      <circle cx="12" cy="8" r="4" strokeWidth={strokeWidth} />
      <path d="M8 14l-2 6 6-2 6 2-2-6" strokeWidth={strokeWidth} />
    </svg>
  )
}

export function ArrowRightIcon({ size, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...svgProps(size, className)} stroke="currentColor">
      <path d="M5 12h12" strokeWidth={strokeWidth} />
      <path d="M13 6l6 6-6 6" strokeWidth={strokeWidth} />
    </svg>
  )
}

export function InfoIcon({ size, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...svgProps(size, className)} stroke="currentColor">
      <circle cx="12" cy="12" r="9" strokeWidth={strokeWidth} />
      <path d="M12 8v.01M11 11h2v5h-2z" strokeWidth={strokeWidth} />
    </svg>
  )
}

export type { IconProps }
