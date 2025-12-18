'use client'

import { useState } from 'react'

interface AccordionItem {
  id: string | number
  title: React.ReactNode
  content: React.ReactNode
  disabled?: boolean
}

interface AccordionProps {
  items: AccordionItem[]
  singleOpen?: boolean
  defaultOpenId?: string | number | null
  onToggle?: (id: string | number, isOpen: boolean) => void
}

export default function Accordion({ items, singleOpen = true, defaultOpenId = null, onToggle }: AccordionProps) {
  const [openId, setOpenId] = useState<string | number | null>(defaultOpenId)
  const [openMap, setOpenMap] = useState<Record<string | number, boolean>>({})

  const toggle = (id: string | number) => {
    if (singleOpen) {
      setOpenId((prev) => {
        const next = prev === id ? null : id
        onToggle?.(id, next === id)
        return next
      })
    } else {
      setOpenMap((prev) => {
        const nextVal = !prev[id]
        onToggle?.(id, nextVal)
        return { ...prev, [id]: nextVal }
      })
    }
  }

  const isOpen = (id: string | number) => {
    return singleOpen ? openId === id : !!openMap[id]
  }

  return (
    <div className="accordion">
      {items.map((item) => {
        const disabled = !!item.disabled
        const itemCls = `accordion-item${disabled ? ' is-disabled' : ''}`
        const headerCls = `accordion-header${disabled ? ' is-disabled' : ''}`

        return (
          <div key={item.id} className={itemCls}>
            <button
              className={headerCls}
          onClick={() => !disabled && toggle(item.id)}
              disabled={disabled}
              aria-disabled={disabled}
            >
              <div>{item.title}</div>
              <span aria-hidden className="accordion-icon">{isOpen(item.id) ? '−' : '+'}</span>
            </button>
            {isOpen(item.id) && (
              <div className="accordion-content">
                {item.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
