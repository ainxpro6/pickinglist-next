import pdfplumber
import pandas as pd
import re

def get_column_boundaries(page, fallback_boundaries=None):
    """
    Dynamically detect column boundaries based on header coordinates.
    Mekari Desty picking list has headers: 'Nama Produk', 'SKU', 'Location' (or 'Slot'), 'Qty'.
    Columns are left-aligned with their header labels.
    """
    words = page.extract_words()
    # Find table header word 'SKU' (typically top < 150)
    sku_headers = [w for w in words if w['text'].upper() == 'SKU' and w['top'] < 150]

    if sku_headers:
        sku_h = sku_headers[0]
        # Match other headers on the same horizontal line (within 5 points of SKU header top)
        line_words = [w for w in words if abs(w['top'] - sku_h['top']) < 5]

        loc_words = [w for w in line_words if w['text'].lower() in ['location', 'slot']]
        qty_words = [w for w in line_words if w['text'].lower() in ['qty', 'kuantitas', 'jumlah']]

        if loc_words and qty_words:
            sku_x0 = sku_h['x0']
            loc_x0 = loc_words[0]['x0']
            qty_x0 = qty_words[0]['x0']

            # Place boundaries slightly before each header x0 (2px margin)
            b0 = (0, sku_x0 - 2)
            b1 = (sku_x0 - 2, loc_x0 - 2)
            b2 = (loc_x0 - 2, qty_x0 - 2)
            b3 = (qty_x0 - 2, page.width)
            return [b0, b1, b2, b3]

    if fallback_boundaries:
        return fallback_boundaries

    # Fallback heuristic if headers not found on this page
    top_words = [w['text'].lower() for w in words if w['top'] < 150]
    if 'location' in top_words:
        return [(0, 339), (339, 425), (425, 545), (545, page.width)]
    elif 'slot' in top_words:
        return [(0, 360), (360, 451), (451, 542), (542, page.width)]

    return [(0, 339), (339, 425), (425, 545), (545, page.width)]


def extract_and_process_pdf(pdf_path):
    all_rows_structured = []
    last_boundaries = None

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            boundaries = get_column_boundaries(page, fallback_boundaries=last_boundaries)
            last_boundaries = boundaries

            words = page.extract_words()
            h_lines = sorted(set([edge["top"] for edge in page.horizontal_edges] + [0, page.height]))

            for top, bottom in zip(h_lines[:-1], h_lines[1:]):
                # Detect buyer notes within this row to prevent full-width notes
                # from spilling across columns (SKU, Location, Qty)
                row_words = [w for w in words if top <= w['top'] < bottom]
                bn_tops = [
                    w['top'] for i, w in enumerate(row_words)
                    if (w['text'].lower() == 'buyer' and i + 1 < len(row_words) and 'note' in row_words[i+1]['text'].lower())
                    or (w['text'].lower() == 'catatan' and i + 1 < len(row_words) and 'pembeli' in row_words[i+1]['text'].lower())
                ]

                effective_bottom = min(bn_tops) - 1 if bn_tops else bottom

                row_data = []
                for x0, x1 in boundaries:
                    cell_crop = page.crop((x0, top, x1, effective_bottom))
                    text = cell_crop.extract_text(x_tolerance=2, y_tolerance=2)
                    row_data.append(text.strip() if text else "")
                if any(row_data):
                    all_rows_structured.append(row_data)

    if not all_rows_structured:
        raise Exception("Tidak ada data yang bisa diekstrak.")

    df_raw = pd.DataFrame(all_rows_structured, columns=["Nama Produk", "SKU", "Slot", "Qty"])
    df_raw = df_raw[~df_raw["Nama Produk"].str.match(r"(?i)^nama produk$")].reset_index(drop=True)

    return df_raw


def clean_data(df_raw):
    junk_rows_strict = [
        "Jumlah Pesanan", "Jumlah produk", "Picking List",
        "Halaman:", "Dicetak Oleh", "Tanggal Cetak", 
        "Daftar Pengambilan"
    ]

    records = []
    current = {"Nama Produk": "", "Varian": "", "SKU": "", "Qty": 0}

    for _, row in df_raw.iterrows():
        nama = str(row.get("Nama Produk", "")).strip()
        sku = str(row.get("SKU", "")).strip()
        qty = str(row.get("Qty", "")).strip()

        nama = re.sub(r"\d{2}[-/]\d{2}[-/]\d{4}\s+\d{2}:\d{2}:\d{2}", "", nama).strip()

        if re.search(r"(?i)buyer notes|catatan pembeli", nama):
            split_nama = re.split(r"(?i)(?:buyer notes|catatan pembeli)[:\s]*", nama)
            nama = split_nama[0].strip() 
            if not nama: 
                continue

        if any(kw.lower() in nama.lower() for kw in junk_rows_strict):
            continue

        match_varian_line = re.match(r"(?i)^(variant|varian|variation)[:\s]+(.+)", nama)
        if match_varian_line:
            current["Varian"] = match_varian_line.group(2).strip()
            continue
        
        qty_match = re.search(r"\d+", qty)
        if sku and qty_match:

            if nama and "nama produk" not in nama.lower():
                if current["Nama Produk"]:
                    current["Nama Produk"] += " " + nama
                else:
                    current["Nama Produk"] = nama

            regex_varian = r"(?i)(?:variant|varian|variation)\s*[:]\s*(.+)"
            match_embedded = re.search(regex_varian, current["Nama Produk"])
            
            if match_embedded:
                extracted_varian = match_embedded.group(1).strip()
                if not current["Varian"]:
                    current["Varian"] = extracted_varian
                current["Nama Produk"] = re.sub(regex_varian, "", current["Nama Produk"]).strip()

            # Clean any buyer notes if somehow leaked into SKU
            if re.search(r"(?i)buyer notes|catatan pembeli", sku):
                sku = re.split(r"(?i)(?:buyer notes|catatan pembeli)[:\s]*", sku)[0].strip()

            # Clean any spillover Location/Slot words if present
            sku_cleaned = re.sub(r"(?i)\b(default\s*slot|unassigned\s*stock|default|unassigned|slot|stock)\b", "", sku)
            sku_cleaned = sku_cleaned.replace("\n", "").strip()
            # Remove leading bullet points or symbols
            sku_cleaned = re.sub(r"^[^\w\s]\s*", "", sku_cleaned)
            # Remove stray commas and periods
            sku_cleaned = sku_cleaned.replace(",", "").replace(".", "").strip()

            qty_clean = int(qty_match.group(0))

            current["SKU"] = sku_cleaned
            current["Qty"] = qty_clean

            final_nama = " ".join(current["Nama Produk"].split())
            current["Nama Produk"] = final_nama[:90]

            if current["SKU"]:
                records.append(current.copy())

            current = {"Nama Produk": "", "Varian": "", "SKU": "", "Qty": 0}
            continue

        if nama:
            if "nama produk" in nama.lower() or "sku" in nama.lower():
                continue
            if current["Nama Produk"]:
                current["Nama Produk"] += " " + nama
            else:
                current["Nama Produk"] = nama

    return records


def main(file_path):
    raw_data_df = extract_and_process_pdf(file_path)
    cleaned_data = clean_data(raw_data_df)
    return cleaned_data
