export interface PickingListRow {
  "Nama Produk": string;
  "Nama produk"?: string;
  Varian?: string;
  "Nama varian"?: string;
  SKU: string;
  Qty: number;
}

export interface ProcessResponse {
  success: boolean;
  data?: PickingListRow[];
  message?: string;
}
