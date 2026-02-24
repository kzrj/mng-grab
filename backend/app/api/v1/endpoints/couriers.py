from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_courier_service
from app.application.courier.service import CourierService
from app.api.dto.courier import CourierCreate, CourierRead, CourierUpdate

router = APIRouter(prefix="/couriers", tags=["couriers"])


@router.get("", response_model=list[CourierRead])
async def list_couriers(
    service: CourierService = Depends(get_courier_service),
    skip: int = 0,
    limit: int = 100,
):
    entities = await service.get_all(skip=skip, limit=limit)
    return [CourierRead.model_validate(e) for e in entities]


@router.get("/{courier_id}", response_model=CourierRead)
async def get_courier(courier_id: int, service: CourierService = Depends(get_courier_service)):
    entity = await service.get_by_id(courier_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Courier not found")
    return CourierRead.model_validate(entity)


@router.post("", response_model=CourierRead, status_code=201)
async def create_courier(data: CourierCreate, service: CourierService = Depends(get_courier_service)):
    try:
        entity = await service.create(
            phone=data.phone, description=data.description, account_id=data.account_id
        )
        return CourierRead.model_validate(entity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{courier_id}", response_model=CourierRead)
async def update_courier(
    courier_id: int,
    data: CourierUpdate,
    service: CourierService = Depends(get_courier_service),
):
    entity = await service.update(
        courier_id,
        phone=data.phone,
        description=data.description,
        account_id=data.account_id,
    )
    if not entity:
        raise HTTPException(status_code=404, detail="Courier not found")
    try:
        return CourierRead.model_validate(entity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{courier_id}", status_code=204)
async def delete_courier(courier_id: int, service: CourierService = Depends(get_courier_service)):
    deleted = await service.delete(courier_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Courier not found")
