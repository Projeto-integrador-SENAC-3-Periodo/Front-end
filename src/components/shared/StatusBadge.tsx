interface StatusBadgeProps {
  status: "pending" | "approved" | "rejected" | "active" | "inactive";
}

const labels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  active: "Ativo",
  inactive: "Inativo",
};

const classes: Record<string, string> = {
  pending: "badge-pending",
  approved: "badge-approved",
  rejected: "badge-rejected",
  active: "badge-approved",
  inactive: "badge-status bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={classes[status]}>{labels[status]}</span>;
}
