"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
    { time: "12AM", executed: 2, failed: 0 },
    { time: "4AM", executed: 5, failed: 1 },
    { time: "8AM", executed: 12, failed: 2 },
    { time: "12PM", executed: 18, failed: 1 },
    { time: "4PM", executed: 15, failed: 3 },
    { time: "8PM", executed: 8, failed: 1 },
    { time: "11PM", executed: 4, failed: 0 },
];

export function JobsChart() {
    return (
        <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey="time"
                    tick={{ fill: "#737373", fontSize: 11 }}
                    axisLine={{ stroke: "#e5e5e5" }}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fill: "#737373", fontSize: 11 }}
                    axisLine={{ stroke: "#e5e5e5" }}
                    tickLine={false}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e5e5",
                        borderRadius: "8px",
                        color: "#1a1a1a",
                    }}
                />
                <Bar dataKey="executed" fill="#1a1a1a" radius={[3, 3, 0, 0]} name="Executed" />
                <Bar dataKey="failed" fill="#a3a3a3" radius={[3, 3, 0, 0]} name="Failed" />
            </BarChart>
        </ResponsiveContainer>
    );
}
