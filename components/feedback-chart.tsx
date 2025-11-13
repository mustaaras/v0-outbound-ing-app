"use client"
import React from "react"

interface Props {
  counts: Record<string, number>
}

export function FeedbackChart({ counts }: Props) {
  const entries = Object.entries(counts)
  const max = Math.max(...entries.map(([, v]) => v), 1)

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-lg font-semibold">Feedback Summary</h3>
      <p className="text-sm text-muted-foreground mb-4">Aggregated ratings from users</p>
      <div className="space-y-3">
        {entries.map(([label, value]) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-48 text-sm text-muted-foreground">{label}</div>
            <div className="flex-1 bg-muted h-6 rounded overflow-hidden">
              <div
                className="h-6 bg-primary"
                style={{ width: `${Math.round((value / max) * 100)}%` }}
              />
            </div>
            <div className="w-12 text-right text-sm">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
