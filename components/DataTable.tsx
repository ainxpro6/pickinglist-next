import type { PickingListRow } from "@/lib/types";

interface DataTableProps {
  rows: PickingListRow[];
}

export default function DataTable({ rows }: DataTableProps) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th style={{ width: "50%" }}>Nama Produk</th>
          <th style={{ width: "20%" }}>Varian</th>
          <th style={{ width: "20%" }}>SKU</th>
          <th style={{ width: "8%" }}>Qty</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => {
          const nama = row["Nama Produk"] || row["Nama produk"] || "";
          const varian = row["Varian"] || row["Nama varian"] || "-";
          return (
            <tr key={idx}>
              <td>{nama}</td>
              <td>{varian}</td>
              <td>{row.SKU}</td>
              <td style={{ textAlign: "center" }}>{row.Qty}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
