from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    GOOGLE_CLIENT_ID: str
    JWT_SECRET: str

    model_config = {"env_file": ".env"}


settings = Settings()
