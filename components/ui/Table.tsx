import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  striped?: boolean;
  hover?: boolean;
  compact?: boolean;
}

export default function Table<T>({ 
  data, 
  columns, 
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
  striped = false,
  hover = true,
  compact = false
}: TableProps<T>) {
  const alignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className="w-full overflow-x-auto border border-neutral-200 rounded-lg">
      <table className="w-full">
        <thead className="bg-neutral-50 border-b border-neutral-200">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  ${compact ? 'px-4 py-2' : 'px-6 py-3'}
                  text-xs font-semibold text-neutral-700 uppercase tracking-wider
                  ${alignmentClass[column.align || 'left']}
                `}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-200">
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length} 
                className="px-6 py-12 text-center text-neutral-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={keyExtractor(item, index)}
                onClick={() => onRowClick?.(item)}
                className={`
                  ${striped && index % 2 === 1 ? 'bg-neutral-50' : ''}
                  ${hover ? 'hover:bg-neutral-100 transition-colors' : ''}
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      ${compact ? 'px-4 py-2' : 'px-6 py-4'}
                      text-sm text-neutral-900
                      ${alignmentClass[column.align || 'left']}
                    `}
                  >
                    {column.render 
                      ? column.render(item, index) 
                      : String((item as any)[column.key] || '-')
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
