interface Props {
  message?: string;
}

export default function LoadingSpinner({ message }: Props) {
  return (
    <div className="flex items-center gap-3 text-gray-500">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      {message && <span className="text-sm">{message}</span>}
    </div>
  );
}
