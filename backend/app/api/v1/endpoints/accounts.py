from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.dependencies import get_account_service
from app.application.account.service import AccountService
from app.api.dto.account import AccountCreate, AccountRead, AccountUpdate

router = APIRouter(prefix="/accounts", tags=["accounts"])


class AccountTopUp(BaseModel):
    amount: float = Field(..., gt=0, description="Сумма пополнения (> 0)")


@router.get("", response_model=list[AccountRead])
async def list_accounts(
    service: AccountService = Depends(get_account_service),
    skip: int = 0,
    limit: int = 100,
):
    entities = await service.get_all(skip=skip, limit=limit)
    return [AccountRead.model_validate(e) for e in entities]


@router.get("/{account_id}", response_model=AccountRead)
async def get_account(account_id: int, service: AccountService = Depends(get_account_service)):
    entity = await service.get_by_id(account_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Account not found")
    return AccountRead.model_validate(entity)


@router.post("", response_model=AccountRead, status_code=201)
async def create_account(data: AccountCreate, service: AccountService = Depends(get_account_service)):
    try:
        entity = await service.create(name=data.name, phone=data.phone, password=data.password)
        return AccountRead.model_validate(entity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{account_id}", response_model=AccountRead)
async def update_account(
    account_id: int,
    data: AccountUpdate,
    service: AccountService = Depends(get_account_service),
):
    try:
        entity = await service.update(
            account_id,
            name=data.name,
            phone=data.phone,
            password=data.password,
        )
        if not entity:
            raise HTTPException(status_code=404, detail="Account not found")
        return AccountRead.model_validate(entity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{account_id}", status_code=204)
async def delete_account(account_id: int, service: AccountService = Depends(get_account_service)):
    deleted = await service.delete(account_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Account not found")


@router.post("/{account_id}/topup", response_model=AccountRead)
async def topup_account(
    account_id: int,
    data: AccountTopUp,
    service: AccountService = Depends(get_account_service),
):
    """Пополнить баланс аккаунта на указанную сумму."""
    try:
        account = await service.add_balance(account_id, data.amount)
        return AccountRead.model_validate(account)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
