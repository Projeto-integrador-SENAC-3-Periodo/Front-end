import { type LucideIcon, Inbox } from "lucide-react";
import { type ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon = Inbox,
  title = "Nenhum registro encontrado",
  description,
  children
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>

      <h3 className="font-display font-semibold text-lg text-foreground">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {description}
        </p>
      )}

      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
}
