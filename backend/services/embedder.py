from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict, Tuple, Iterator

# --- Model Loading ---
_model = SentenceTransformer("all-MiniLM-L6-v2")

# --- Helper for Batching ---
def _batch_iterator(data: list, batch_size: int) -> Iterator[list]:
    for i in range(0, len(data), batch_size):
        yield data[i : i + batch_size]

def embed_sections(
    sections: List[Dict], 
    batch_size: int = 64,
    max_preview_len: int = 2000   # ✅ configurable content preview length
) -> Tuple[List[List[float]], List[Dict]]:

    valid_texts = []
    valid_metadata = []

    for i, sec in enumerate(sections):
        header = sec.get("header", "").strip()
        text = sec.get("text", "").strip()

        # ✅ Combine header + text into one string for embeddings
        combined = f"{header}\n{text}" if header else text

        if isinstance(combined, str) and combined.strip():
            if len(combined) > 1500:
                print(f"Warning: Section {i} has long text ({len(combined)} chars) and will be truncated for embedding.")

            valid_texts.append(combined)

            # ✅ Keep metadata: pdf, page, header, and truncated content
            metadata = {k: v for k, v in sec.items() if k not in ["header", "text"]}
            metadata["header"] = header
            metadata["text"] = text[:max_preview_len] + ("..." if len(text) > max_preview_len else "")
            valid_metadata.append(metadata)
        else:
            print(f"Warning: Skipping section {i}, no valid content.")

    if not valid_texts:
        return [], []

    # ✅ Encode in batches
    all_vectors = []
    for text_batch in _batch_iterator(valid_texts, batch_size):
        vectors = _model.encode(text_batch, show_progress_bar=False).tolist()
        all_vectors.extend(vectors)

    return all_vectors, valid_metadata



def embed_query(query: str) -> list[float]:
    """Embed a single query string into a vector."""
    if not isinstance(query, str) or not query.strip():
        raise ValueError("Query must be a non-empty string.")
    
    return _model.encode([query], show_progress_bar=False)[0].tolist()
