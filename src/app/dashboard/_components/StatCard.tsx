type StatCardProps = {
  label: string;
  value: string | number;
  sublabel?: string;
};

export default function StatCard({ label, value, sublabel }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sublabel ? (
        <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>
      ) : null}
    </div>
  );
}


