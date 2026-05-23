from pydantic import BaseModel


class UserOut(BaseModel):
    id: int
    email: str
    name: str | None
    picture: str | None

    model_config = {"from_attributes": True}
