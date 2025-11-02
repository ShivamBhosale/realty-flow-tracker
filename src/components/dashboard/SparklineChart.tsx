import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SparklineChartProps {
  data: number[];
  className?: string;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({ data, className = '' }) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const trend = data[data.length - 1] - data[0];
  const trendPercent = data[0] !== 0 ? ((trend / data[0]) * 100).toFixed(0) : '0';

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-success' : trend < 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-8 w-16"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className={trendColor}
        />
      </svg>
      <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
        <TrendIcon className="h-3 w-3" />
        <span>{Math.abs(Number(trendPercent))}%</span>
      </div>
    </div>
  );
};
