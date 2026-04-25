from fastapi import APIRouter, Request

from app.limiter import limiter
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate, FeedbackOut

router = APIRouter(prefix='/api/feedback', tags=['feedback'])


@router.post('', response_model=FeedbackOut, status_code=201)
@limiter.limit('5/hour;20/day')
async def create_feedback(request: Request, payload: FeedbackCreate) -> FeedbackOut:
    fb = await Feedback.create(
        category=payload.category,
        body=payload.body,
        email=payload.email or None,
        client_uuid=payload.client_uuid or None,
        app_version=payload.app_version or None,
        platform=payload.platform or None,
    )
    return FeedbackOut(
        id=fb.id,
        category=fb.category,
        body=fb.body,
        email=fb.email,
        client_uuid=fb.client_uuid,
        app_version=fb.app_version,
        platform=fb.platform,
        status=fb.status,
        created_at=fb.created_at,
    )
