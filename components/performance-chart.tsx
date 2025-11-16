"use client"

import React from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"

interface DataPoint {
  date: string
  emails: number
  searches?: number
}

interface PerformanceChartProps {
  data: DataPoint[]
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  // Compute tick interval so X axis labels are readable (approx 7 labels)
  const tickInterval = Math.max(0, Math.floor((data?.length || 1) / 7))

  const formatTick = (v: string) => {
    try {
      const d = new Date(v)
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    } catch {
      return v
    }
  }

  return (
    <div style={{ width: "100%", height: 340, background: 'var(--color-card)', border: '1px solid var(--color-border)' }} className="rounded-lg p-4">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 6, right: 24, left: 0, bottom: 0 }}>
          {/* Gradient fills for a futuristic feel */}
          <defs>
            <linearGradient id="gradEmails" x1="0" y1="0" x2="0" y2="1">
              {/* Use foreground so gradient follows theme (white in dark, black in light) */}
              <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0.9} />
              <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0.08} />
            </linearGradient>
            <linearGradient id="gradSearches" x1="0" y1="0" x2="0" y2="1">
              {/* Use chart color 2 (blue) so Contacts appears blue in both themes */}
                <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.85} />
                <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.06} />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <CartesianGrid strokeDasharray="6 8" stroke="var(--color-border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} interval={tickInterval} tickFormatter={formatTick} />
          <YAxis allowDecimals={false} axisLine={false} tick={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: 'var(--color-popover)', border: 'none', color: 'var(--color-popover-foreground)' }}
            labelStyle={{ color: 'var(--color-primary-foreground)' }}
          />
          <Legend wrapperStyle={{ color: 'var(--color-muted-foreground)' }} />

          <Area
            type="monotone"
            dataKey="emails"
            name="Emails"
            /* Use foreground color so Emails appear white in dark mode and dark in light mode */
            stroke="var(--color-foreground)"
            strokeWidth={2.5}
            fill="url(#gradEmails)"
            animationDuration={800}
            dot={false}
            isAnimationActive={true}
            strokeOpacity={0.95}
            filter="url(#glow)"
          />

          <Area
            type="monotone"
            dataKey="searches"
            name="Contacts"
            /* Use blue chart color for Contacts */
            stroke="var(--color-chart-2)"
            strokeWidth={2}
            fill="url(#gradSearches)"
            animationDuration={900}
            dot={false}
            isAnimationActive={true}
            strokeOpacity={0.9}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
