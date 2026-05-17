"use client";

export function WorkspaceMark({ name, size = 'sm' }: { name: string | null; size?: 'xs' | 'sm' | 'md' }) {
  const initial = (name ?? '?').trim().charAt(0).toUpperCase();
  const sizes = { xs: 'w-6 h-6 text-label-sm', sm: 'w-8 h-8 text-label-md', md: 'w-10 h-10 text-body-md' };
  return (
    <span
      aria-hidden
      className={`
        flex items-center justify-center rounded-md shrink-0
        bg-gradient-to-br from-(--color-gradient-start) to-(--color-gradient-end)
        text-[#0d1322] font-semibold
        ${sizes[size]}
      `}
    >
      {initial}
    </span>
  );
}
