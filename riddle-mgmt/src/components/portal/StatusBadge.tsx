"use client";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-pill status-pill-${status}`}>
      {status}
    </span>
  );
}
