import fitz
import re
from collections import defaultdict
from statistics import median, stdev, StatisticsError

CAPTION_KEYWORDS = [
    "figure", "fig", "table", "chart", "graph", "diagram", "image", "exhibit"
]
CAPTION_REGEX = re.compile(
    r"^\s*(" + "|".join(CAPTION_KEYWORDS) + r")\s*[\d\w\.]+", re.IGNORECASE
)
HEADER_FOOTER_MARGIN = 0.10
REPETITION_THRESHOLD_RATIO = 0.5

def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower().strip())

def is_bold(span) -> bool:
    if span["flags"] & 16:
        return True
    return any(p in span.get("font", "").lower() for p in ["bold", "heavy", "black", "demi"])

def starts_with_numbering(text: str) -> bool:
    return bool(re.match(r"^((\d{1,2}(\.\d{1,2})*)|([A-Z])|([ivx]+))[\.\)]?\s", text.strip()))

def is_toc_entry(text: str) -> bool:
    return bool(re.search(r"([\.\-\_]{2,})\s*\d+\s*$", text))

def is_caption(text: str) -> bool:
    return bool(CAPTION_REGEX.match(text))

def extract_text(pdf_path):
    doc = fitz.open(str(pdf_path))
    return [page.get_text() for page in doc]

def extract_headings_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    lines_data, all_font_sizes = [], []
    header_footer_counts = defaultdict(int)

    # 1. Gather spans + detect header/footer
    for page_num, page in enumerate(doc):
        page_height = page.rect.height
        blocks = page.get_text("dict", flags=fitz.TEXTFLAGS_DICT)["blocks"]

        for block in blocks:
            if block["type"] != 0:  # not text
                continue
            for line in block["lines"]:
                text = " ".join(s["text"].strip() for s in line["spans"]).strip()
                if not text or len(text) < 3:
                    continue

                lines_data.append({
                    "text": text,
                    "size": line["spans"][0]["size"],
                    "spans": line["spans"],
                    "bbox": line["bbox"],
                    "page": page_num + 1,
                })
                all_font_sizes.extend(s["size"] for s in line["spans"])

                # header/footer candidates
                if line["bbox"][1] < page_height * HEADER_FOOTER_MARGIN or \
                   line["bbox"][3] > page_height * (1 - HEADER_FOOTER_MARGIN):
                    header_footer_counts[normalize_text(text)] += 1

    if not all_font_sizes:
        return []

    # 2. Compute adaptive thresholds
    try:
        body_font = median(all_font_sizes)
        font_dev = stdev(all_font_sizes) if len(all_font_sizes) > 1 else 0
    except StatisticsError:
        body_font, font_dev = (sum(all_font_sizes) / len(all_font_sizes)), 0

    font_size_threshold = body_font * (1.1 + (font_dev / body_font if body_font > 0 else 0))
    rep_threshold = doc.page_count * REPETITION_THRESHOLD_RATIO
    suppression_list = {
        t for t, c in header_footer_counts.items() if c >= rep_threshold and len(t.split()) < 10
    }

    # 3. Score lines
    scored = []
    for line in lines_data:
        text = line["text"]
        norm = normalize_text(text)

        if norm in suppression_list or is_toc_entry(text) or is_caption(text):
            continue

        score = 0
        if line["size"] > font_size_threshold: score += 2
        if any(is_bold(s) for s in line["spans"]): score += 1
        if text.isupper(): score += 1
        elif text.istitle(): score += 0.5
        if starts_with_numbering(text): score += 1
        if len(text.split()) < 10: score += 0.5
        if text.endswith(('.', '?', '!')): score -= 1
        elif text.endswith(':'): score += 0.5

        if score > 0:
            line["score"] = score
            scored.append(line)

    if not scored:
        return []

    # 4. Filter & remove TOC-like pages
    potential = [l for l in scored if l["score"] >= 1.5]
    if not potential:
        return []

    avg_per_page = len(potential) / doc.page_count
    toc_threshold = max(8, avg_per_page * 4)
    page_counts = defaultdict(int)
    for l in potential:
        page_counts[l["page"]] += 1
    toc_pages = {p for p, c in page_counts.items() if c > toc_threshold}

    headings = [l for l in potential if l["page"] not in toc_pages and len(l["text"]) < 200]

    # 5. Merge multi-line headings
    merged, used = [], set()
    headings.sort(key=lambda x: (x["page"], x["bbox"][1]))
    for i, h in enumerate(headings):
        if i in used:
            continue
        text, current = h["text"], h
        bbox = list(h["bbox"]) 
        for j in range(i + 1, len(headings)):
            nxt = headings[j]
            if nxt["page"] == current["page"] and abs(nxt["bbox"][1] - current["bbox"][3]) < 10:
                text += " " + nxt["text"]
                used.add(j)
                current = nxt
            else:
                break
        merged.append({"text": text, "page": current["page"],"bbox": tuple(bbox)})

    return merged
