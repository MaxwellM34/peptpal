from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from tortoise.contrib.fastapi import RegisterTortoise

from app.config import settings, TORTOISE_ORM
from app.routers import peptides, community, admin

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with RegisterTortoise(
        app,
        config=TORTOISE_ORM,
        generate_schemas=False,
        add_exception_handlers=True,
    ):
        yield


app = FastAPI(
    title='PeptPal API',
    description='Reference data API for the PeptPal harm-reduction app. All data is informational only.',
    version='0.1.0',
    lifespan=lifespan,
    docs_url='/api/docs',
    redoc_url='/api/redoc',
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


# Apply rate limit to community submissions route
@app.middleware('http')
async def rate_limit_submissions(request: Request, call_next):
    return await call_next(request)


app.include_router(peptides.router)
app.include_router(community.router)
app.include_router(admin.router)


@app.get('/api/health')
async def health():
    return {'status': 'ok', 'service': 'peptpal-api'}
