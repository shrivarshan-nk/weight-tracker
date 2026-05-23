from datetime import datetime

from pydantic import BaseModel, Field


class WeightLogCreate(BaseModel):
    weight_kg: float = Field(..., gt=0, lt=1000, description="Weight in kilograms")
    logged_at: datetime
    note: str | None = None


class WeightLogUpdate(BaseModel):
    weight_kg: float | None = Field(None, gt=0, lt=1000)
    logged_at: datetime | None = None
    note: str | None = None


class WeightLogOut(BaseModel):
    id: int
    user_id: int
    weight_kg: float
    logged_at: datetime
    note: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
