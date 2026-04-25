from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = 'postgres://peptpal:peptpal@localhost:5432/peptpal'
    admin_secret_token: str = 'changeme'
    allowed_origins: str = 'http://localhost:3000,http://localhost:8081,https://peptpal.com'

    class Config:
        env_file = '.env'
        extra = 'ignore'

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(',')]


settings = Settings()

TORTOISE_ORM = {
    'connections': {'default': settings.database_url},
    'apps': {
        'models': {
            'models': ['app.models.peptide', 'app.models.community', 'app.models.feedback', 'aerich.models'],
            'default_connection': 'default',
        }
    },
}
