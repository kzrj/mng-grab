from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_account_service
from app.application.account.service import AccountService
from app.api.dto.account import AccountCreate, AccountRead, AccountUpdate

router = APIRouter(prefix="/accounts", tags=["accounts"])


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
