import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

const VISIBLE_PAGES = 5;

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

/** Window of page numbers centred on the current page. */
function visiblePages(page: number, totalPages: number): number[] {
  const start = Math.max(1, Math.min(page - Math.floor(VISIBLE_PAGES / 2), totalPages - VISIBLE_PAGES + 1));
  const end = Math.min(totalPages, start + VISIBLE_PAGES - 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3.5 text-sm"
    >
      <span className="text-muted">
        {firstItem}–{lastItem} de {total}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <PageButton label="Página anterior" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft size={16} aria-hidden />
          </PageButton>
          {visiblePages(page, totalPages).map((number) => (
            <PageButton
              key={number}
              label={`Página ${number}`}
              current={number === page}
              onClick={() => onPageChange(number)}
            >
              {number}
            </PageButton>
          ))}
          <PageButton label="Página seguinte" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            <ChevronRight size={16} aria-hidden />
          </PageButton>
        </div>
      )}
    </nav>
  );
}

interface PageButtonProps {
  label: string;
  current?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function PageButton({ label, current, disabled, onClick, children }: PageButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={current ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "flex h-8 min-w-8 items-center justify-center rounded-md px-2 transition-colors disabled:opacity-40",
        current ? "bg-green font-medium text-bg" : "text-ink hover:bg-bg-alt",
      )}
    >
      {children}
    </button>
  );
}
