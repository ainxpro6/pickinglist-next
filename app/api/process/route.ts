import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js API Route Handler for /api/process
 *
 * On Vercel: The Python serverless function (api/process.py) handles this route.
 * Locally: This Next.js route handler provides a fallback that spawns a Python subprocess.
 *
 * This route accepts:
 * - multipart/form-data with a "file" field (PDF/Excel upload)
 * - multipart/form-data with a "pdf_url" field (URL to fetch)
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const pdfUrl = formData.get("pdf_url") as string | null;

    if (!file && !pdfUrl) {
      return NextResponse.json(
        { success: false, message: "Mohon pilih file atau masukkan link terlebih dahulu!" },
        { status: 400 }
      );
    }

    // Try to spawn Python subprocess for local dev
    const { spawn } = await import("child_process");
    const path = await import("path");

    // Build the Python script inline to avoid file path issues
    const pythonScript = `
import sys, json, io
sys.path.insert(0, r"${path.resolve(process.cwd(), "api").replace(/\\/g, "\\\\")}")

from ubah1 import main as process_pdf
from ubah2 import main as process_excel

def process():
    import base64
    input_data = json.loads(sys.stdin.read())

    file_bytes = None
    file_extension = "pdf"

    if input_data.get("file_base64"):
        file_bytes = io.BytesIO(base64.b64decode(input_data["file_base64"]))
        file_extension = input_data.get("file_extension", "pdf")
    elif input_data.get("pdf_url"):
        import requests
        url = input_data["pdf_url"]
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 404:
            print(json.dumps({"success": False, "message": "Link tidak ditemukan (404)."}))
            return
        if response.status_code != 200:
            print(json.dumps({"success": False, "message": f"Gagal mengakses link. Status: {response.status_code}"}))
            return
        file_bytes = io.BytesIO(response.content)
        ct = response.headers.get("Content-Type", "").lower()
        if "pdf" in ct:
            file_extension = "pdf"
        elif "excel" in ct or "spreadsheet" in ct:
            file_extension = "xlsx"
        elif url.endswith(".xlsx"):
            file_extension = "xlsx"
        elif url.endswith(".xls"):
            file_extension = "xls"

    if file_bytes is None:
        print(json.dumps({"success": False, "message": "No file data."}))
        return

    if file_extension == "pdf":
        data = process_pdf(file_bytes)
    elif file_extension in ["xlsx", "xls"]:
        data = process_excel(file_bytes)
    else:
        print(json.dumps({"success": False, "message": "Unsupported file type."}))
        return

    if not data:
        print(json.dumps({"success": False, "message": "Data tidak ditemukan atau file kosong."}))
        return

    normalized = []
    for r in data:
        normalized.append({
            "Nama Produk": r.get("Nama Produk", r.get("Nama produk", "")),
            "Varian": r.get("Varian", r.get("Nama varian", "")),
            "SKU": r.get("SKU", ""),
            "Qty": r.get("Qty", r.get("Total Kuantitas", 0)),
        })

    print(json.dumps({"success": True, "data": normalized}, ensure_ascii=False))

process()
`;

    // Prepare input data for the Python script
    const inputData: Record<string, string> = {};

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      inputData.file_base64 = buffer.toString("base64");
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      inputData.file_extension = ext;
    } else if (pdfUrl) {
      inputData.pdf_url = pdfUrl.trim();
    }

    // Spawn Python process
    const result = await new Promise<string>((resolve, reject) => {
      const proc = spawn("python", ["-c", pythonScript], {
        cwd: process.cwd(),
        env: { ...process.env },
      });

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on("close", (code: number | null) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Python exited with code ${code}: ${stderr}`));
        }
      });

      proc.on("error", (err: Error) => {
        reject(new Error(`Failed to spawn Python: ${err.message}. Make sure Python is installed and in PATH.`));
      });

      // Send input data via stdin
      proc.stdin.write(JSON.stringify(inputData));
      proc.stdin.end();
    });

    const parsed = JSON.parse(result);
    return NextResponse.json(parsed, { status: parsed.success ? 200 : 400 });

  } catch (error) {
    console.error("API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("Failed to spawn Python") || message.includes("ENOENT")) {
      return NextResponse.json(
        {
          success: false,
          message: "Python tidak ditemukan. Pastikan Python terinstall untuk local development, atau deploy ke Vercel.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: `Terjadi kesalahan: ${message}` },
      { status: 500 }
    );
  }
}
