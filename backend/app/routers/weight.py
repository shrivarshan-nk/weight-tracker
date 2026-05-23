from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.health_log import WeightLog
from app.models.user import User
from app.schemas.weight import WeightLogCreate, WeightLogOut, WeightLogUpdate

router = APIRouter(prefix="/weight", tags=["weight"])


@router.get("", response_model=list[WeightLogOut])
def list_weight_logs(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(WeightLog).filter(WeightLog.user_id == current_user.id)
    if from_date:
        query = query.filter(WeightLog.logged_at >= from_date)
    if to_date:
        query = query.filter(WeightLog.logged_at <= to_date)
    return query.order_by(WeightLog.logged_at.asc()).all()


@router.post("", response_model=WeightLogOut, status_code=status.HTTP_201_CREATED)
def create_weight_log(
    body: WeightLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = WeightLog(
        user_id=current_user.id,
        weight_kg=body.weight_kg,
        logged_at=body.logged_at,
        note=body.note,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.patch("/{entry_id}", response_model=WeightLogOut)
def update_weight_log(
    entry_id: int,
    body: WeightLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = (
        db.query(WeightLog)
        .filter(WeightLog.id == entry_id, WeightLog.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found"
        )

    if body.weight_kg is not None:
        entry.weight_kg = body.weight_kg
    if body.logged_at is not None:
        entry.logged_at = body.logged_at
    if body.note is not None:
        entry.note = body.note

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_weight_log(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = (
        db.query(WeightLog)
        .filter(WeightLog.id == entry_id, WeightLog.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found"
        )
    db.delete(entry)
    db.commit()
