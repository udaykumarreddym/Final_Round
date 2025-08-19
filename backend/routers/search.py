from fastapi import APIRouter
from pydantic import BaseModel
from services import embedder, indexer

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    top_k: int = 3

@router.post("/")
async def search(req: SearchRequest):
    query_vec = embedder.embed_query(req.query)
    results = indexer.search(query_vec, req.top_k)
    return {"results": results}
