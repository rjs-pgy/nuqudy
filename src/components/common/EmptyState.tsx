import React from 'react';
import { PlusCircle, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  id?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  id = 'empty-state'
}) => {
  return (
    <div
      id={id}
      className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50"
    >
      <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 mb-4 ring-8 ring-teal-50/50 dark:ring-teal-950/20">
        {icon || <Inbox className="w-8 h-8" />}
      </div>
      <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white text-sm font-semibold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
