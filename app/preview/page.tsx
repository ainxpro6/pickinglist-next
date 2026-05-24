"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ControlBar from "@/components/ControlBar";
import DataTable from "@/components/DataTable";
import { usePickingListStore } from "@/lib/store";

export default function PreviewPage() {
  const rows = usePickingListStore((s) => s.rows);
  const router = useRouter();

  useEffect(() => {
    // Redirect to home if no data
    if (rows.length === 0) {
      router.replace("/");
    }
  }, [rows, router]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div style={{
      minHeight: "100vh",
      padding: "40px 20px",
    }}>
      <ControlBar />
      <div className="paper">
        <DataTable rows={rows} />
      </div>
    </div>
  );
}
