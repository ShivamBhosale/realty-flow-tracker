import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  onChange: (value: number) => void;
  target?: number;
  isVolume?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  color,
  onChange,
  target,
  isVolume = false
}) => {
  const progress = target ? Math.min((value / target) * 100, 100) : 0;
  const isOnTrack = progress >= 80;

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
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
          
          <Input
            type="number"
            min="0"
            step={isVolume ? '0.01' : '1'}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="text-sm"
            placeholder={isVolume ? "0.00" : "0"}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;