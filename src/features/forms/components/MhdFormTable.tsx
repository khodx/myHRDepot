interface MhdFormTableProps {
  label: string;
  columns: Array<{ id: string; label: string; type: string }>;
  rows: Array<Record<string, unknown>>;
  onChange: (rows: Array<Record<string, unknown>>) => void;
  minRows?: number;
  maxRows?: number;
}

export function MhdFormTable({
  label,
  columns,
  rows,
  onChange,
  minRows = 0,
  maxRows = Infinity,
}: MhdFormTableProps) {
  const safeRows = rows.length > 0 ? rows : [{}];

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">{label}</h4>
        <button
          type="button"
          onClick={() => {
            if (safeRows.length >= maxRows) return;
            onChange([...safeRows, {}]);
          }}
          className="text-xs font-semibold text-accent hover:text-accent-hover"
        >
          Add Row
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className="border-b border-border px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {column.label}
                </th>
              ))}
              <th className="border-b border-border px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {safeRows.map((row, rowIndex) => (
              <tr key={`${label}-${rowIndex}`}>
                {columns.map((column) => (
                  <td key={column.id} className="border-b border-border px-2 py-2">
                    <input
                      type={column.type === 'number' ? 'number' : 'text'}
                      value={String(row[column.id] ?? '')}
                      onChange={(event) => {
                        const updatedRows = [...safeRows];
                        updatedRows[rowIndex] = {
                          ...updatedRows[rowIndex],
                          [column.id]: event.target.value,
                        };
                        onChange(updatedRows);
                      }}
                      className="w-full rounded-md border border-border px-2 py-1 text-sm"
                    />
                  </td>
                ))}
                <td className="border-b border-border px-2 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (safeRows.length <= Math.max(minRows, 1)) return;
                      onChange(safeRows.filter((_, index) => index !== rowIndex));
                    }}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
