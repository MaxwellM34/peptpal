"""Pydantic schemas for the forum API."""
from datetime import datetime

from pydantic import BaseModel, Field


class ForumUserRegister(BaseModel):
    client_uuid: str = Field(..., min_length=8, max_length=64)
    handle: str | None = Field(None, max_length=32)


class ForumUserOut(BaseModel):
    id: int
    handle: str | None
    verified: bool
    created_at: datetime


class DoseLogPostCreate(BaseModel):
    client_uuid: str
    peptide_slug: str
    dose_mcg: float = Field(..., gt=0)
    doses_per_week: float = Field(..., gt=0, le=21)
    weeks_on: int | None = Field(None, ge=0, le=520)
    user_weight_kg: float = Field(..., ge=30, le=300)
    goal: str
    outcome_score: int | None = Field(None, ge=-2, le=2)
    side_effect_severity: int | None = Field(None, ge=0, le=10)
    bloodwork_attached: bool = False
    body_composition_attached: bool = False
    batch_info_attached: bool = False
    longitudinal: bool = False
    body: str | None = Field(None, max_length=4000)
    attachments: list[str] = []


class DoseLogPostOut(BaseModel):
    id: int
    user_id: int
    user_handle: str | None
    peptide_slug: str
    dose_mcg: float
    doses_per_week: float
    weeks_on: int | None
    user_weight_kg: float
    goal: str
    outcome_score: int | None
    side_effect_severity: int | None
    bloodwork_attached: bool
    body_composition_attached: bool
    batch_info_attached: bool
    longitudinal: bool
    vendor_flagged: bool
    body: str | None
    attachments: list[str]
    upvotes: int
    downvotes: int
    created_at: datetime


class PostVoteIn(BaseModel):
    client_uuid: str
    value: int = Field(..., ge=-1, le=1)


class PostReportIn(BaseModel):
    client_uuid: str
    reason: str
    notes: str | None = None


class CommentCreate(BaseModel):
    client_uuid: str
    parent_id: int | None = None
    body: str = Field(..., min_length=1, max_length=4000)


class CommentOut(BaseModel):
    id: int
    post_id: int
    user_handle: str | None
    parent_id: int | None
    body: str
    upvotes: int
    downvotes: int
    created_at: datetime


class ConsensusSnapshotOut(BaseModel):
    peptide_slug: str
    goal: str
    weight_bracket_kg_min: float
    weight_bracket_kg_max: float
    n_posts: int
    median_mcg_per_kg_per_week: float
    p25_mcg_per_kg_per_week: float
    p75_mcg_per_kg_per_week: float
    minority_protocols: list[dict]
    low_confidence: bool
    computed_at: datetime
