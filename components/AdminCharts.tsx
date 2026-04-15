"use client";

import {
  ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Box, Paper, Typography } from "@mui/material";
import { brandColors } from "@/theme/colors";

const STATUS_COLORS: Record<string, string> = {
  pending: "#FFA726",
  payment_pending: "#FFB74D",
  payment_verified: "#42A5F5",
  scheduled: "#7E57C2",
  completed: "#66BB6A",
  cancelled: "#EF5350",
  rescheduled: "#26C6DA",
  paid: "#66BB6A",
};
const FALLBACK = ["#E65100", "#C99A2E", "#7B1E1E", "#2E7D32", "#0277BD", "#C62828", "#8884d8", "#FF8A65", "#4DB6AC", "#BA68C8"];

function getColor(status: string, index: number) {
  return STATUS_COLORS[status] || FALLBACK[index % FALLBACK.length];
}

export function StatusPieChart({ data, title }: { data: { status: string; count: number }[]; title: string }) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: `1px solid ${brandColors.sand}` }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 2 }}>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={95}
            innerRadius={40}
            paddingAngle={2}
            label={({ status, count }) => `${status} (${count})`}
          >
            {data.map((entry, i) => (
              <Cell key={entry.status} fill={getColor(entry.status, i)} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
}

export function MonthlyBarChart({ data, title }: { data: { month: string; count: number }[]; title: string }) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: `1px solid ${brandColors.sand}` }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 2 }}>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={brandColors.sand} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill={brandColors.saffron} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}

export function MonthlyLineChart({ data, title }: { data: { month: string; count: number }[]; title: string }) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: `1px solid ${brandColors.sand}` }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 2 }}>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={brandColors.sand} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            stroke={brandColors.maroon}
            strokeWidth={3}
            dot={{ fill: brandColors.maroon, r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}
