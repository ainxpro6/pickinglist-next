from http.server import BaseHTTPRequestHandler
import json
import cgi
import io
import sys
import os

# Ensure sibling modules (ubah1, ubah2) are importable on Vercel
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import requests as http_requests
from ubah1 import main as process_pdf
from ubah2 import main as process_excel

ALLOWED_EXTENSIONS = {"pdf", "xlsx", "xls"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_extension_from_content_type(content_type):
    content_type = content_type.lower()
    if "pdf" in content_type:
        return "pdf"
    elif "excel" in content_type or "spreadsheet" in content_type:
        return "xlsx"
    return None


def process_file(file_obj, file_extension):
    """Process file based on extension and return data records."""
    if file_extension == "pdf":
        return process_pdf(file_obj)
    elif file_extension in ["xlsx", "xls"]:
        return process_excel(file_obj)
    return None


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_type_header = self.headers.get("Content-Type", "")

            file_obj = None
            file_extension = "pdf"

            if "multipart/form-data" in content_type_header:
                # Parse multipart form data
                form = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={
                        "REQUEST_METHOD": "POST",
                        "CONTENT_TYPE": content_type_header,
                    },
                )

                # Check for file upload
                if "file" in form and form["file"].filename:
                    file_item = form["file"]
                    filename = file_item.filename

                    if not allowed_file(filename):
                        self._send_json(400, {
                            "success": False,
                            "message": "Format file tidak diizinkan! Hanya PDF (.pdf) dan Excel (.xlsx/.xls) yang diperbolehkan."
                        })
                        return

                    file_extension = filename.rsplit(".", 1)[1].lower()
                    file_obj = io.BytesIO(file_item.file.read())

                # Check for URL
                elif "pdf_url" in form:
                    url = form["pdf_url"].value.strip()
                    if url:
                        file_obj, file_extension = self._fetch_from_url(url)
                        if file_obj is None:
                            return  # Error already sent

            if file_obj is None:
                self._send_json(400, {
                    "success": False,
                    "message": "Mohon pilih file atau masukkan link terlebih dahulu!"
                })
                return

            # Process the file
            data_records = process_file(file_obj, file_extension)

            if not data_records:
                self._send_json(400, {
                    "success": False,
                    "message": "Data tidak ditemukan atau file kosong."
                })
                return

            # Normalize keys for consistency
            normalized = []
            for record in data_records:
                normalized.append({
                    "Nama Produk": record.get("Nama Produk", record.get("Nama produk", "")),
                    "Varian": record.get("Varian", record.get("Nama varian", "")),
                    "SKU": record.get("SKU", ""),
                    "Qty": record.get("Qty", record.get("Total Kuantitas", 0)),
                })

            self._send_json(200, {
                "success": True,
                "data": normalized,
            })

        except Exception as e:
            print(f"System Error: {repr(e)}")
            self._send_json(500, {
                "success": False,
                "message": f"Terjadi kesalahan sistem: {str(e)}"
            })

    def do_GET(self):
        """Handle GET requests with pdf_url query parameter."""
        from urllib.parse import urlparse, parse_qs

        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        pdf_url = params.get("pdf_url", [""])[0].strip()

        if not pdf_url:
            self._send_json(400, {
                "success": False,
                "message": "Parameter pdf_url diperlukan."
            })
            return

        try:
            file_obj, file_extension = self._fetch_from_url(pdf_url)
            if file_obj is None:
                return

            data_records = process_file(file_obj, file_extension)

            if not data_records:
                self._send_json(400, {
                    "success": False,
                    "message": "Data tidak ditemukan atau file kosong."
                })
                return

            normalized = []
            for record in data_records:
                normalized.append({
                    "Nama Produk": record.get("Nama Produk", record.get("Nama produk", "")),
                    "Varian": record.get("Varian", record.get("Nama varian", "")),
                    "SKU": record.get("SKU", ""),
                    "Qty": record.get("Qty", record.get("Total Kuantitas", 0)),
                })

            self._send_json(200, {
                "success": True,
                "data": normalized,
            })

        except Exception as e:
            self._send_json(500, {
                "success": False,
                "message": f"Terjadi kesalahan: {str(e)}"
            })

    def _fetch_from_url(self, url):
        """Fetch file from URL and return (BytesIO, extension) tuple."""
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            response = http_requests.get(url, headers=headers, timeout=15)

            if response.status_code == 404:
                self._send_json(400, {
                    "success": False,
                    "message": "Link tidak ditemukan (404). Periksa kembali URL Anda."
                })
                return None, None

            if response.status_code != 200:
                self._send_json(400, {
                    "success": False,
                    "message": f"Gagal mengakses link. Status Code: {response.status_code}"
                })
                return None, None

            file_obj = io.BytesIO(response.content)
            content_type = response.headers.get("Content-Type", "").lower()

            ext = get_extension_from_content_type(content_type)
            if ext is None:
                if url.endswith(".xlsx"):
                    ext = "xlsx"
                elif url.endswith(".xls"):
                    ext = "xls"
                else:
                    ext = "pdf"

            return file_obj, ext

        except http_requests.exceptions.ConnectionError:
            self._send_json(400, {
                "success": False,
                "message": "Gagal koneksi server. Pastikan link benar dan aktif."
            })
            return None, None
        except Exception as e:
            self._send_json(500, {
                "success": False,
                "message": f"Terjadi kesalahan pada link: {str(e)}"
            })
            return None, None

    def _send_json(self, status_code, data):
        """Send a JSON response."""
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))
