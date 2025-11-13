"use client"
import React from "react"

interface Props {
  total: number
  last30Days: number
}

export function SupportStats({ total, last30Days }: Props) {
  const pct = total === 0 ? 0 : Math.round((last30Days / total) * 100)

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-lg font-semibold">Support Activity</h3>
      <p className="text-sm text-muted-foreground mb-4">Messages received from users</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-background rounded">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
        <div className="p-4 bg-background rounded">
          <div className="text-sm text-muted-foreground">Last 30 days</div>
          <div className="text-2xl font-bold">{last30Days}</div>
          <div className="text-xs text-muted-foreground">{pct}% of total</div>
        </div>
      </div>
    </div>
  )
}
