from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_review_service
from app.application.review.service import ReviewService
from app.api.dto.review import ReviewCreate, ReviewRead, ReviewUpdate

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("", response_model=list[ReviewRead])
async def list_reviews(
    service: ReviewService = Depends(get_review_service),
    skip: int = 0,
    limit: int = 100,
):
    entities = await service.get_all(skip=skip, limit=limit)
    return [ReviewRead.model_validate(e) for e in entities]


@router.get("/{review_id}", response_model=ReviewRead)
async def get_review(review_id: int, service: ReviewService = Depends(get_review_service)):
    entity = await service.get_by_id(review_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Review not found")
    return ReviewRead.model_validate(entity)


@router.post("", response_model=ReviewRead, status_code=201)
async def create_review(data: ReviewCreate, service: ReviewService = Depends(get_review_service)):
    try:
        entity = await service.create(
            customer_id=data.customer_id,
            courier_id=data.courier_id,
            score=data.score,
            text=data.text,
        )
        return ReviewRead.model_validate(entity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{review_id}", response_model=ReviewRead)
async def update_review(
    review_id: int,
    data: ReviewUpdate,
    service: ReviewService = Depends(get_review_service),
):
    entity = await service.update(review_id, score=data.score, text=data.text)
    if not entity:
        raise HTTPException(status_code=404, detail="Review not found")
    try:
        return ReviewRead.model_validate(entity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{review_id}", status_code=204)
async def delete_review(review_id: int, service: ReviewService = Depends(get_review_service)):
    deleted = await service.delete(review_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Review not found")
