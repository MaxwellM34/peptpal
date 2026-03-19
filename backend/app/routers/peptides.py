from fastapi import APIRouter, HTTPException, Query

from app.models.peptide import Peptide
from app.schemas.peptide import PeptideDetail, PeptideListResponse, PeptideSummary

router = APIRouter(prefix='/api/peptides', tags=['peptides'])


@router.get('', response_model=PeptideListResponse)
async def list_peptides():
    peptides = await Peptide.filter(is_published=True).order_by('name')
    items = [PeptideSummary.model_validate(p) for p in peptides]
    return PeptideListResponse(items=items, total=len(items))


@router.get('/search', response_model=PeptideListResponse)
async def search_peptides(q: str = Query(..., min_length=1)):
    # Tortoise doesn't have native JSON array search, so filter by name + description
    # and do alias matching in Python
    all_peptides = await Peptide.filter(is_published=True)
    q_lower = q.lower()
    matched = [
        p
        for p in all_peptides
        if q_lower in p.name.lower()
        or any(q_lower in alias.lower() for alias in (p.aliases or []))
        or q_lower in p.description.lower()
    ]
    items = [PeptideSummary.model_validate(p) for p in matched]
    return PeptideListResponse(items=items, total=len(items))


@router.get('/{slug}', response_model=PeptideDetail)
async def get_peptide(slug: str):
    peptide = await Peptide.get_or_none(slug=slug, is_published=True)
    if not peptide:
        raise HTTPException(status_code=404, detail='Peptide not found')
    return PeptideDetail.model_validate(peptide)
