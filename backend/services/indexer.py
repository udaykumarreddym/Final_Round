import faiss
import numpy as np
import pickle
from pathlib import Path
import threading
import math

class FaissIndexer:
    def __init__(self, store_path="store"):
        self.store_path = Path(store_path)
        self.index_path = self.store_path / "faiss.index"
        self.meta_path = self.store_path / "metadata.db"
        
        self.embedding_dim = 384  # MiniLM embedding size
        self.lock = threading.Lock()

        self.upgrade_threshold = 1000  # auto-upgrade cutoff
        self.index_type = "flat"

        self.store_path.mkdir(exist_ok=True)
        self.load()

    def load(self):
        """Loads the index and metadata from disk."""
        with self.lock:
            if self.index_path.exists() and self.meta_path.exists():
                self.index = faiss.read_index(str(self.index_path))
                with open(self.meta_path, "rb") as f:
                    self.metadata = pickle.load(f)
                
                if hasattr(self.index, "nlist"):
                    self.index_type = "ivf"
                else:
                    self.index_type = "flat"
                print(f"Loaded '{self.index_type}' index with {self.index.ntotal} vectors.")
            else:
                print("No existing index found. Initializing a new IndexFlatL2.")
                self.index = faiss.IndexFlatL2(self.embedding_dim)
                self.metadata = []

    def _reconstruct_all_vectors(self):
        """Safely reconstruct all vectors from the index (works across FAISS versions)."""
        vectors = [self.index.reconstruct(i) for i in range(self.index.ntotal)]
        return np.vstack(vectors).astype("float32") if vectors else np.empty((0, self.embedding_dim), dtype="float32")

    def _check_and_upgrade_index(self, new_vectors_count: int):
        """Checks if the index should be upgraded from Flat to IVFPQ."""
        total_vectors = self.index.ntotal + new_vectors_count
        if self.index_type == "flat" and total_vectors >= self.upgrade_threshold:
            print(f"Threshold of {self.upgrade_threshold} vectors reached. Upgrading to IndexIVFPQ...")
            
            nlist = int(4 * math.sqrt(total_vectors))
            quantizer = faiss.IndexFlatL2(self.embedding_dim)
            upgraded_index = faiss.IndexIVFPQ(quantizer, self.embedding_dim, nlist, 32, 8) 

            print(f"Training new index with nlist={nlist} on {self.index.ntotal} existing vectors...")
            existing_vectors = self._reconstruct_all_vectors()
            if existing_vectors.shape[0] > 0:
                upgraded_index.train(existing_vectors)
                upgraded_index.add(existing_vectors)
            
            self.index = upgraded_index
            self.index_type = "ivf"
            print("Index upgrade complete.")

    def add(self, vectors: np.ndarray, meta: list):
        """Adds vectors to the index, handling automatic index upgrades."""
        with self.lock:
            self._check_and_upgrade_index(len(vectors))
            
            if self.index_type == "ivf" and not self.index.is_trained:
                print("Warning: IVF index is not trained. Training on current batch.")
                self.index.train(vectors)

            self.index.add(vectors)
            self.metadata.extend(meta)
        print(f"Added {len(vectors)} new vectors. Index now has {self.index.ntotal} total vectors.")

    def save(self):
        """Saves index + metadata to disk (blocking)."""
        print("Saving index to disk...")
        with self.lock:
            temp_index_path = self.index_path.with_suffix(".tmp")
            faiss.write_index(self.index, str(temp_index_path))
            
            temp_meta_path = self.meta_path.with_suffix(".tmp")
            with open(temp_meta_path, "wb") as f:
                pickle.dump(self.metadata, f)
            
            temp_index_path.rename(self.index_path)
            temp_meta_path.rename(self.meta_path)
        print("Save complete.")

    def search(self, query_vec: np.ndarray, top_k: int = 5, nprobe: int = 10) -> list:
        """Searches the index for similar vectors."""
        with self.lock:
            if self.index.ntotal == 0:
                return []
            
            if self.index_type == "ivf":
                self.index.nprobe = nprobe
            
            distances, indices = self.index.search(query_vec, top_k)
            results = [self.metadata[i] for i in indices[0] if i != -1]
        return results

# --- Singleton instance & service wrappers ---
_indexer = FaissIndexer()

def add_to_index(vectors, metadata):
    """Public API for adding to the shared indexer."""
    if not vectors:  # nothing to add
        print("⚠️ Skipping empty vectors batch")
        return

    vector_arr = np.array(vectors, dtype="float32")
    if vector_arr.ndim == 1:
        vector_arr = vector_arr.reshape(1, -1)

    if vector_arr.shape[1] != _indexer.embedding_dim:
        raise ValueError(
            f"Embedding dimension mismatch: got {vector_arr.shape[1]}, "
            f"expected {_indexer.embedding_dim}"
        )

    _indexer.add(vector_arr, metadata)
    _indexer.save()

def search(query_vec, top_k=3):
    """Public API for searching the shared indexer, returns structured results."""
    query_arr = np.array([query_vec], dtype="float32")
    raw_results = _indexer.search(query_arr, top_k=top_k)

    # Transform raw metadata into desired format
    structured_results = []
    for item in raw_results:
        # Ensure the metadata dict has the required keys
        structured_results.append({
            "Header": item.get("header", ""),
            "Page": item.get("page", -1),
            "PDF_Name": item.get("pdf", ""),
            "Content": item.get("text", "")
        })
    return structured_results

