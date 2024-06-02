import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconName } from "../ui/iconName";

export type Order = {
  id: string;
  name: string;
  subName: string;
  level: number;
  qty: number;
  price: string;
  status: "inOrders" | "completed";
};

interface OrderTableProps {
  data: Order[];
  tab: "orders" | "myOrders";
}

export function OrderTable({ data, tab = "orders" }: OrderTableProps) {
  const columns: ColumnDef<Order>[] = React.useMemo(() => {
    return [
      {
        accessorKey: "name" || "subName",
        header: "Name",
        cell: ({ row }) => {
          return (
            <div className="flex space-x-1 items-center">
              <IconName name={row.getValue("name")} />
              <div>
                <div className="font-semibold text-sm">
                  {row.getValue("name")}
                </div>
                <div className="text-tertiary text-xs">
                  {row.original.subName}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "level",
        header: "Level",
        cell: ({ row }) => <div>{row.getValue("level")}</div>,
      },
      {
        accessorKey: "qty",
        header: "Qty",
        cell: ({ row }) => <div>{row.getValue("qty")}</div>,
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => <div>{row.getValue("price")}</div>,
      },
      {
        accessorKey: "status",
        header: `${tab === "orders" ? "Action" : "Status"}`,
        cell: ({ row }) => (
          <div className="capitalize">{tab === "orders" ? "Buy" : row.getValue('status')}</div>
        ),
      },
    ];
  }, [tab]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="text-secondary text-xs">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
