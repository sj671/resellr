import React from "react";

export type Column<T> = {
  key?: keyof T;
  header: string;
  align?: "left" | "right" | "center";
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
};

export default function DataTable<T extends { id?: string | number }>({
  columns,
  rows,
  emptyMessage = "No data",
  tableClassName = "w-full text-sm",
  headerClassName = "bg-muted",
  bodyClassName,
}: DataTableProps<T>) {
  return (
    <div className="border rounded-lg overflow-x-auto">
      <table className={tableClassName}>
        <thead className={headerClassName}>
          <tr>
            {columns.map((c) => (
              <th
                key={String(c.header)}
                className={
                  (c.align === "right" ? "text-right " : c.align === "center" ? "text-center " : "text-left ") +
                  "px-3 py-2" + (c.className ? ` ${c.className}` : "")
                }
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={bodyClassName}>
          {rows.map((r, idx) => {
            const key = (r as unknown as { id?: string | number }).id ?? idx;
            return (
              <tr key={String(key)} className="border-t">
                {columns.map((c) => (
                  <td
                    key={String(c.header)}
                    className={
                      (c.align === "right" ? "text-right " : c.align === "center" ? "text-center " : "") +
                      "px-3 py-2"
                    }
                  >
                    {c.render
                      ? c.render(r)
                      : c.key
                      ? ((r as Record<string, unknown>)[c.key as string] as React.ReactNode) ?? "—"
                      : null}
                  </td>
                ))}
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td className="px-3 py-8 text-center text-muted-foreground" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}


