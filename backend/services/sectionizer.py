from typing import List, Dict, Set, Tuple
import fitz
from .pdf_reader import extract_headings_from_pdf

HEADING_Y_TOLERANCE = 3

def split_into_sections(pdf_path: str) -> List[Dict]:
    """
    Splits a PDF into sections based on extracted headings.
    Returns a list of sections with metadata: pdf, page, header, text.
    Fully robust: works with or without headings, and merges blocks correctly.
    """
    doc = fitz.open(pdf_path)
    headings = extract_headings_from_pdf(pdf_path)

    # Map heading positions
    heading_locations: Set[Tuple[int, int]] = {
        (h["page"], round(h["bbox"][1])) for h in headings
    }

    # Gather all text blocks
    all_blocks = []
    for page_num, page in enumerate(doc, 1):
        blocks = sorted(page.get_text("blocks"), key=lambda b: (b[1], b[0]))  # sort by y, x
        for b in blocks:
            text = b[4].strip().replace('\n', ' ')
            if text:
                all_blocks.append({
                    "page": page_num,
                    "bbox": b[:4],
                    "text": text
                })

    # If no headings, return full document as one section
    if not headings:
        full_text = " ".join([b['text'] for b in all_blocks])
        return [{
            "pdf": pdf_path,
            "page": 1,
            "header": "Full Document",
            "text": full_text
        }]

    sections = []
    current_section_blocks = []
    current_section_index = None  # points to last section in `sections`

    for block in all_blocks:
        block_location = (block["page"], round(block["bbox"][1]))
        is_a_heading = any(
            block_location[0] == loc[0] and abs(block_location[1] - loc[1]) <= HEADING_Y_TOLERANCE
            for loc in heading_locations
        )

        if is_a_heading:
            # Save previous section's text
            if current_section_index is not None:
                sections[current_section_index]["text"] = " ".join(current_section_blocks)
            elif current_section_blocks:
                # Text before first heading
                header_text = "Introduction" if len(current_section_blocks) > 1 else "Preamble"
                sections.append({
                    "pdf": pdf_path,
                    "page": 1,
                    "header": header_text,
                    "text": " ".join(current_section_blocks)
                })

            # Start new section
            current_heading_obj = next(
                h for h in headings
                if h["page"] == block_location[0] and abs(round(h["bbox"][1]) - block_location[1]) <= HEADING_Y_TOLERANCE
            )
            sections.append({
                "pdf": pdf_path,
                "page": current_heading_obj["page"],
                "header": current_heading_obj["text"],
                "text": ""  # To be filled
            })
            current_section_index = len(sections) - 1
            current_section_blocks = []
        else:
            current_section_blocks.append(block["text"])

    # Fill last section
    if current_section_index is not None and current_section_blocks:
        sections[current_section_index]["text"] = " ".join(current_section_blocks)
    elif current_section_blocks:
        # Edge case: all blocks before first heading
        sections.append({
            "pdf": pdf_path,
            "page": 1,
            "header": "Introduction",
            "text": " ".join(current_section_blocks)
        })

    return sections
