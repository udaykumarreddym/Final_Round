from fastapi import APIRouter, UploadFile 
from pathlib import Path 
import shutil 
from services import pdf_reader, sectionizer, embedder, indexer 
router = APIRouter() 
PDF_STORE = Path("store/pdfs") 
PDF_STORE.mkdir(parents=True, exist_ok=True) # 🔹 Utility function to save a PDF immediately 

async def save_pdf(file: UploadFile) -> Path: 
    """ Save uploaded PDF to disk immediately. Returns the saved PDF path. """ 
    pdf_path = PDF_STORE / file.filename 
    with open(pdf_path, "wb") as buffer: 
        shutil.copyfileobj(file.file, buffer) 
    return pdf_path 

# 🔹 Process a saved PDF (extract text, embed, index) 
async def process_pdf(pdf_path: Path): 
    sections = sectionizer.split_into_sections(pdf_path) 
    vectors, metadata = embedder.embed_sections(sections) 
    indexer.add_to_index(vectors, metadata) 

# 🔹 Bulk PDF upload endpoint 

@router.post("/upload_bulk") 
async def upload_bulk(files: list[UploadFile]): 
    # Delete existing PDFs 
    if PDF_STORE.exists(): 
        for file in PDF_STORE.iterdir(): 
            if file.is_file(): 
                file.unlink() 
            
    # Delete FAISS index + metadata 
    if indexer._indexer.index_path.exists(): 
        indexer._indexer.index_path.unlink() 
    if indexer._indexer.meta_path.exists(): 
        indexer._indexer.meta_path.unlink() 

    # Clear in-memory FAISS index 
    indexer._indexer.load() # initializes empty index 
    # Save PDFs immediately 
    saved_paths = [] 
    for file in files: 
        path = await save_pdf(file) 
        saved_paths.append(str(path)) 
    
    return { 
        "message": f"Uploaded {len(files)} bulk PDFs successfully", 
        "saved_paths": saved_paths 
    } 

# 🔹 Single PDF upload endpoint 
@router.post("/upload_single") 
async def upload_single(file: UploadFile): 
    path = await save_pdf(file) 
    all_pdf_paths = list(PDF_STORE.glob("*.pdf"))
    for pdf_path in all_pdf_paths:
        await process_pdf(pdf_path)
    return { 
        "message": f"Uploaded single PDF '{file.filename}' successfully", 
        "saved_path": str(path) 
    }