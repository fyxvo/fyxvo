import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface TableColumn<Row> {
  readonly key: string;
  readonly header: ReactNode;
  readonly cell: (row: Row) => ReactNode;
  readonly className?: string;
}

export interface TableProps<Row> {
  readonly columns: readonly TableColumn<Row>[];
  readonly rows: readonly Row[];
  readonly getRowKey: (row: Row) => string;
  readonly emptyState?: ReactNode;
  readonly className?: string;
}

export function Table<Row>({
  columns,
  rows,
  getRowKey,
  emptyState = "No records available.",
  className
}: TableProps<Row>) {
  return (
    <div className={cn("overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
          <thead className="bg-slate-900/80">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400",
                    column.className
                  )}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-slate-200">
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={getRowKey(row)} className="hover:bg-slate-900/60">
                  {columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-4 align-middle", column.className)}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={columns.length}>
                  {emptyState}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
