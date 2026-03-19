from datetime import datetime
from typing import Literal
from pydantic import BaseModel, field_validator


RouteType = Literal['subq', 'im', 'intranasal', 'topical']
StorageTemp = Literal['fridge', 'freezer']
SubmissionStatus = Literal['pending', 'approved', 'rejected']


class CommonProtocol(BaseModel):
    name: str
    description: str


class PeptideSummary(BaseModel):
    id: int
    slug: str
    name: str
    aliases: list[str]
    storage_temp: StorageTemp
    routes: list[RouteType]
    half_life_hours: float | None

    model_config = {'from_attributes': True}


class PeptideDetail(PeptideSummary):
    description: str
    disclaimer: str
    recommended_dose_mcg_min: float | None
    recommended_dose_mcg_max: float | None
    max_dose_mcg: float | None
    frequency_notes: str | None
    common_protocols: list[CommonProtocol]
    side_effects: list[str]
    synergies: list[str]
    updated_at: datetime


class PeptideCreate(BaseModel):
    slug: str
    name: str
    aliases: list[str] = []
    description: str
    disclaimer: str
    half_life_hours: float | None = None
    recommended_dose_mcg_min: float | None = None
    recommended_dose_mcg_max: float | None = None
    max_dose_mcg: float | None = None
    frequency_notes: str | None = None
    storage_temp: StorageTemp = 'fridge'
    routes: list[RouteType] = []
    common_protocols: list[CommonProtocol] = []
    side_effects: list[str] = []
    synergies: list[str] = []
    is_published: bool = True


class PeptideUpdate(BaseModel):
    name: str | None = None
    aliases: list[str] | None = None
    description: str | None = None
    disclaimer: str | None = None
    half_life_hours: float | None = None
    recommended_dose_mcg_min: float | None = None
    recommended_dose_mcg_max: float | None = None
    max_dose_mcg: float | None = None
    frequency_notes: str | None = None
    storage_temp: StorageTemp | None = None
    routes: list[RouteType] | None = None
    common_protocols: list[CommonProtocol] | None = None
    side_effects: list[str] | None = None
    synergies: list[str] | None = None
    is_published: bool | None = None


class CommunitySubmissionCreate(BaseModel):
    peptide_id: int | None = None
    field_name: str
    suggested_value: str
    rationale: str
    submitter_email: str | None = None

    @field_validator('rationale')
    @classmethod
    def rationale_min_length(cls, v: str) -> str:
        if len(v.strip()) < 10:
            raise ValueError('rationale must be at least 10 characters')
        return v.strip()


class CommunitySubmissionOut(BaseModel):
    id: int
    peptide_id: int | None
    field_name: str
    suggested_value: str
    rationale: str
    submitter_email: str | None
    status: SubmissionStatus
    reviewed_at: datetime | None
    created_at: datetime

    model_config = {'from_attributes': True}


class CommunitySubmissionPatch(BaseModel):
    status: SubmissionStatus


class PeptideListResponse(BaseModel):
    items: list[PeptideSummary]
    total: int
