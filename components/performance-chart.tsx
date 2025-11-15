"use client"

import React from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="emails" name="Emails" stroke="#4f46e5" strokeWidth={2} dot={{ r: 2 }} />
          <Line
            type="monotone"
            dataKey="searches"
            name="Contact searches"
            stroke="#059669"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
