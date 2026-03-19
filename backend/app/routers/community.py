from fastapi import APIRouter, Request

from app.models.peptide import CommunitySubmission, Peptide
from app.schemas.peptide import CommunitySubmissionCreate, CommunitySubmissionOut

router = APIRouter(prefix='/api/community', tags=['community'])


@router.post('/submissions', response_model=CommunitySubmissionOut, status_code=201)
async def create_submission(payload: CommunitySubmissionCreate, request: Request):
    peptide = None
    if payload.peptide_id is not None:
        peptide = await Peptide.get_or_none(id=payload.peptide_id)

    submission = await CommunitySubmission.create(
        peptide=peptide,
        field_name=payload.field_name,
        suggested_value=payload.suggested_value,
        rationale=payload.rationale,
        submitter_email=payload.submitter_email or None,
        status='pending',
    )
    # Eagerly fetch peptide_id for response
    await submission.fetch_related('peptide')
    return CommunitySubmissionOut(
        id=submission.id,
        peptide_id=submission.peptide_id,
        field_name=submission.field_name,
        suggested_value=submission.suggested_value,
        rationale=submission.rationale,
        submitter_email=submission.submitter_email,
        status=submission.status,
        reviewed_at=submission.reviewed_at,
        created_at=submission.created_at,
    )
