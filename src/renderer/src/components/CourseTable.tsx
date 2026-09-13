import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import type { Course, CourseStatus } from "@/types";
import { formatDate } from "@/utils";

interface CourseTableProps {
  courses: Course[];
  activeStatus?: CourseStatus | null;
  onStatusClick?: (status: CourseStatus) => void;
}

export default function CourseTable({
  courses,
  activeStatus = null,
  onStatusClick,
}: CourseTableProps): JSX.Element {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<Course>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Course",
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-foreground">{row.original.name}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{row.original.platform}</div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue<Course["status"]>();
          return (
            <StatusBadge
              status={status}
              active={activeStatus === status}
              onClick={onStatusClick}
            />
          );
        },
        sortingFn: (a, b) => {
          const order: Record<Course["status"], number> = {
            "Not Started": 0,
            "In Progress": 1,
            Completed: 2,
          };
          return order[a.original.status] - order[b.original.status];
        },
      },
      {
        accessorKey: "lastCompleted",
        header: "Last Completed",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{formatDate(getValue<string | null>())}</span>
        ),
      },
      {
        accessorKey: "timeToComplete",
        header: "Time to Complete",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: "link",
        header: "Link",
        enableSorting: false,
        cell: ({ row }) => (
          <a
            href={row.original.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View source
            <ExternalLink className="size-3.5" />
          </a>
        ),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="block max-w-[280px] text-muted-foreground">{getValue<string>()}</span>
        ),
      },
    ],
    [activeStatus, onStatusClick]
  );

  const table = useReactTable({
    data: courses,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.column.getCanSort() ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-auto p-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-transparent hover:text-foreground"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <ArrowUpDown className="size-3" />
                  </Button>
                ) : (
                  flexRender(header.column.columnDef.header, header.getContext())
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
