from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_customer_service
from app.application.customer.service import CustomerService
from app.api.dto.customer import CustomerCreate, CustomerRead, CustomerUpdate

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=list[CustomerRead])
async def list_customers(
    service: CustomerService = Depends(get_customer_service),
    skip: int = 0,
    limit: int = 100,
):
    entities = await service.get_all(skip=skip, limit=limit)
    return [CustomerRead.model_validate(e) for e in entities]


@router.get("/{customer_id}", response_model=CustomerRead)
async def get_customer(customer_id: int, service: CustomerService = Depends(get_customer_service)):
    entity = await service.get_by_id(customer_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerRead.model_validate(entity)


@router.post("", response_model=CustomerRead, status_code=201)
async def create_customer(data: CustomerCreate, service: CustomerService = Depends(get_customer_service)):
    try:
        entity = await service.create(phone=data.phone, description=data.description)
        return CustomerRead.model_validate(entity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{customer_id}", response_model=CustomerRead)
async def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    service: CustomerService = Depends(get_customer_service),
):
    entity = await service.update(customer_id, phone=data.phone, description=data.description)
    if not entity:
        raise HTTPException(status_code=404, detail="Customer not found")
    try:
        return CustomerRead.model_validate(entity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{customer_id}", status_code=204)
async def delete_customer(customer_id: int, service: CustomerService = Depends(get_customer_service)):
    deleted = await service.delete(customer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Customer not found")
