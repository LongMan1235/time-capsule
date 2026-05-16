from __future__ import annotations

from pydantic import BaseModel
from fastapi import FastAPI

app = FastAPI(title="Time Capsule AI Search")


class SearchRequest(BaseModel):
    userId: str
    query: str


class IndexRequest(BaseModel):
    mediaId: str


class FeedbackRequest(BaseModel):
    identityId: str
    mediaId: str
    accepted: bool


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/index")
def index_media(request: IndexRequest) -> dict[str, str]:
    # Production path:
    # 1. Pull encrypted media metadata from API/database.
    # 2. Generate CLIP/image/caption embeddings in a private worker.
    # 3. Store vectors in pgvector/Pinecone with user-scoped namespaces.
    # 4. Store only encrypted face centroids and consent-scoped identity refs.
    return {"status": "queued", "mediaId": request.mediaId}


@app.post("/search")
def search(request: SearchRequest) -> dict[str, list[dict[str, object]]]:
    return {
        "results": [
            {
                "mediaId": "demo-media",
                "eventId": "demo-event",
                "score": 0.91,
                "reason": f"Semantic match for '{request.query}'",
                "caption": "AI search service is connected. Add vector storage to return real media.",
            }
        ]
    }


@app.post("/identity-feedback")
def identity_feedback(request: FeedbackRequest) -> dict[str, object]:
    return {
        "status": "recorded",
        "identityId": request.identityId,
        "accepted": request.accepted,
    }
