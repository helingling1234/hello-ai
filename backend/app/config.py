from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    ncbi_api_key: str = ""
    transvar_refversion: str = "hg38"
    cache_ttl_annotation: int = 3600    # 1 hour
    cache_ttl_literature: int = 86400   # 24 hours
    cache_ttl_disease: int = 86400      # 24 hours
    backend_cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]


settings = Settings()
