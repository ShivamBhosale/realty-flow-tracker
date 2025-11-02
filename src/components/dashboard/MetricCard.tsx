import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { LucideIcon, Plus, Minus } from 'lucide-react';
import { SparklineChart } from './SparklineChart';

interface MetricCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  onChange: (value: number) => void;
  target?: number;
  isVolume?: boolean;
  trend?: number[];
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  color,
  onChange,
  target,
  isVolume = false,
  trend
}) => {
  const progress = target ? Math.min((value / target) * 100, 100) : 0;
  const isOnTrack = progress >= 80;

  const increment = () => onChange(value + (isVolume ? 1000 : 1));
  const decrement = () => onChange(Math.max(0, value - (isVolume ? 1000 : 1)));

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <div className="flex items-center gap-2">
          {trend && <SparklineChart data={trend} />}
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold">
            {isVolume ? `$${value.toLocaleString()}` : value}
          </div>
          
          {target && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{progress.toFixed(0)}% of target</span>
              </div>
              <Progress 
                value={progress} 
                className={`h-2 ${isOnTrack ? 'bg-success/20' : 'bg-warning/20'}`}
              />
              <div className="text-xs text-muted-foreground">
                Target: {isVolume ? `$${target.toLocaleString()}` : target}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={decrement}
              type="button"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min="0"
              step={isVolume ? '0.01' : '1'}
              value={value}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              className="text-sm"
              placeholder={isVolume ? "0.00" : "0"}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={increment}
              type="button"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;