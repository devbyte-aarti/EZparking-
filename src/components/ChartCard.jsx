import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import Loader from './Loader';

const CHART_COLORS = {
  active: '#10b981',    // Green 🟢
  completed: '#3b82f6', // Blue 🔵
  cancelled: '#ef4444', // Red 🔴
  trend: '#6366f1',     // Line color
  spending: '#10b981',  // Bar color
  neutral: ['#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4']
};

const ChartCard = ({ type, data, title, loading = false }) => {
  if (loading) {
    return (
      <div className="glass-dark p-8 rounded-2xl border-2 border-white/10 shadow-2xl backdrop-blur-xl h-[320px] flex items-center justify-center">
        <Loader message="Loading chart data..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass-dark p-8 rounded-2xl border-2 border-white/10 shadow-2xl backdrop-blur-xl text-center text-gray-400 h-[320px] flex items-center justify-center">
        No data available
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderChart = () => {
    switch (type) {

      // ================= LINE =================
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#37415120" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                formatter={(value) => [`${value} bookings`, 'Bookings']}
                contentStyle={{
                  background: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)'
                }}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke={CHART_COLORS.trend}
                strokeWidth={4}
                dot={{ fill: CHART_COLORS.trend }}
                activeDot={{ r: 8 }}
                isAnimationActive={true}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      // ================= BAR =================
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <defs>
                <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.spending} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={CHART_COLORS.spending} stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#37415120" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                formatter={(value) => [`₹${value.toLocaleString()}`, 'Spent']}
                contentStyle={{
                  background: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)'
                }}
              />
              <Bar
                dataKey="spent"
                fill="url(#spendingGradient)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      // ================= PIE =================
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={85}
                innerRadius={30}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.name === 'Active'
                        ? CHART_COLORS.active
                        : entry.name === 'Completed'
                        ? CHART_COLORS.completed
                        : entry.name === 'Cancelled'
                        ? CHART_COLORS.cancelled
                        : CHART_COLORS.neutral[index % CHART_COLORS.neutral.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      // ================= DONUT =================
      case 'donut':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                dataKey="value"
                nameKey="name"
                cornerRadius={8}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.color ||
                      CHART_COLORS.neutral[index % CHART_COLORS.neutral.length]
                    }
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(value, name) => [value, name]}
                contentStyle={{
                  background: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)'
                }}
              />

              {/* CENTER TEXT */}
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
              >
                <tspan x="50%" dy="-5" fontSize="14" fill="#9ca3af">
                  Total
                </tspan>
                <tspan x="50%" dy="20" fontSize="22" fontWeight="bold">
                  {total}
                </tspan>
              </text>
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.6 }}
      className="glass-dark p-6 rounded-2xl border-2 border-white/20 shadow-2xl backdrop-blur-xl h-[320px] md:h-[350px]"
      whileHover={{ scale: 1.02, y: -4 }}
    >
      <h3 className="font-bold text-white/90 mb-6 text-xl">
        {title}
      </h3>

      <div className="w-full h-[260px] md:h-[290px]">
        {renderChart()}
      </div>
    </motion.div>
  );
};

export { CHART_COLORS };
export default ChartCard;