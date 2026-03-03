"use client";

interface SectionHeaderProps {
  title?: string;
  action?: { label: string; onClick: () => void };
}

export default function SectionHeader({ action }: SectionHeaderProps) {
  if (!action) return null;

  return (
    <div className="flex justify-center mb-6">
      <button
        onClick={action.onClick}
        className="text-xs tracking-[0.15em] uppercase glass rounded-lg px-4 py-2 hover:bg-gray-100 transition-all duration-300"
      >
        {action.label}
      </button>
    </div>
  );
}
