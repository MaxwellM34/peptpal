from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Header

from app.config import settings
from app.models.peptide import CommunitySubmission, Peptide
from app.schemas.peptide import (
    CommunitySubmissionOut,
    CommunitySubmissionPatch,
    PeptideCreate,
    PeptideDetail,
    PeptideUpdate,
)

router = APIRouter(prefix='/api/admin', tags=['admin'])


def require_admin(x_admin_token: str = Header(...)):
    if x_admin_token != settings.admin_secret_token:
        raise HTTPException(status_code=401, detail='Invalid admin token')


@router.get('/submissions', response_model=list[CommunitySubmissionOut], dependencies=[Depends(require_admin)])
async def list_submissions(status: str = 'pending'):
    submissions = await CommunitySubmission.filter(status=status).prefetch_related('peptide').order_by('-created_at')
    return [
        CommunitySubmissionOut(
            id=s.id,
            peptide_id=s.peptide_id,
            field_name=s.field_name,
            suggested_value=s.suggested_value,
            rationale=s.rationale,
            submitter_email=s.submitter_email,
            status=s.status,
            reviewed_at=s.reviewed_at,
            created_at=s.created_at,
        )
        for s in submissions
    ]


@router.patch('/submissions/{submission_id}', response_model=CommunitySubmissionOut, dependencies=[Depends(require_admin)])
async def review_submission(submission_id: int, patch: CommunitySubmissionPatch):
    submission = await CommunitySubmission.get_or_none(id=submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail='Submission not found')
    submission.status = patch.status
    submission.reviewed_at = datetime.now(timezone.utc)
    await submission.save()
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


@router.post('/peptides', response_model=PeptideDetail, dependencies=[Depends(require_admin)], status_code=201)
async def create_peptide(data: PeptideCreate):
    existing = await Peptide.get_or_none(slug=data.slug)
    if existing:
        raise HTTPException(status_code=409, detail='Peptide with this slug already exists')
    peptide = await Peptide.create(**data.model_dump())
    return PeptideDetail.model_validate(peptide)


@router.patch('/peptides/{peptide_id}', response_model=PeptideDetail, dependencies=[Depends(require_admin)])
async def update_peptide(peptide_id: int, data: PeptideUpdate):
    peptide = await Peptide.get_or_none(id=peptide_id)
    if not peptide:
        raise HTTPException(status_code=404, detail='Peptide not found')
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(peptide, field, value)
    await peptide.save()
    return PeptideDetail.model_validate(peptide)
