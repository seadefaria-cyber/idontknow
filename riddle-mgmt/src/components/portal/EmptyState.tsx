"use client";

interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16">
      <p className="text-sm text-gray-300 font-light">{title}</p>
      <p className="text-xs text-gray-200 mt-3">{description}</p>
    </div>
  );
}
