interface Props {
  label: string;
  className?: string;
}

export default function Badge({ label, className = "bg-blue-100 text-blue-700" }: Props) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
