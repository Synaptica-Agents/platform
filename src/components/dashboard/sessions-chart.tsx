"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
    { time: "12AM", sessions: 5 },
    { time: "3AM", sessions: 2 },
    { time: "6AM", sessions: 8 },
    { time: "9AM", sessions: 25 },
    { time: "12PM", sessions: 42 },
    { time: "3PM", sessions: 38 },
    { time: "6PM", sessions: 20 },
    { time: "9PM", sessions: 15 },
    { time: "11PM", sessions: 8 },
];

export function SessionsChart() {
    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
                <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#1a1a1a"
                    strokeWidth={2}
                    dot={{ fill: "#1a1a1a", r: 3 }}
                    name="Sessions"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
