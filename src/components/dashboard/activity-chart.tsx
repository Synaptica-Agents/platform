"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
    { month: "Jan", tasks: 12, approvals: 8 },
    { month: "Feb", tasks: 19, approvals: 14 },
    { month: "Mar", tasks: 15, approvals: 11 },
    { month: "Apr", tasks: 25, approvals: 18 },
    { month: "May", tasks: 32, approvals: 22 },
    { month: "Jun", tasks: 28, approvals: 20 },
    { month: "Jul", tasks: 35, approvals: 26 },
    { month: "Aug", tasks: 42, approvals: 30 },
    { month: "Sep", tasks: 38, approvals: 28 },
    { month: "Oct", tasks: 50, approvals: 35 },
    { month: "Nov", tasks: 55, approvals: 40 },
    { month: "Dec", tasks: 60, approvals: 45 },
];

export function ActivityChart() {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorApprovals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a3a3a3" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a3a3a3" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey="month"
                    tick={{ fill: "#737373", fontSize: 12 }}
                    axisLine={{ stroke: "#e5e5e5" }}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fill: "#737373", fontSize: 12 }}
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
                <Area
                    type="monotone"
                    dataKey="tasks"
                    stroke="#1a1a1a"
                    fill="url(#colorTasks)"
                    strokeWidth={2}
                    name="Tasks"
                />
                <Area
                    type="monotone"
                    dataKey="approvals"
                    stroke="#a3a3a3"
                    fill="url(#colorApprovals)"
                    strokeWidth={2}
                    name="Approvals"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
