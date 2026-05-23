from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.google_auth import verify_google_token
from app.core.jwt import create_access_token
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleLoginRequest(BaseModel):
    token: str


@router.post("/google")
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        google_payload = verify_google_token(payload.token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

    email = google_payload["email"]
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            email=email,
            name=google_payload.get("name"),
            picture=google_payload.get("picture"),
            auth_provider="google",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    jwt_token = create_access_token({"user_id": user.id})
    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": UserOut.model_validate(user),
    }
