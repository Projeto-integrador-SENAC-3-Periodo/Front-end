import { type LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "accent";
}

export function MetricCard({ title, value, icon: Icon, trend, variant = "default" }: MetricCardProps) {
  return (
    <div className="card-metric animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-display font-bold mt-1">{value}</p>
          {trend && <p className="text-xs text-success mt-1">{trend}</p>}
        </div>
        <div className={`p-3 rounded-md ${variant === "accent" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
