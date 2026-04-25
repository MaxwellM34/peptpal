"""Pydantic schemas for feedback submissions."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


FeedbackCategory = Literal['bug', 'feature', 'general']


class FeedbackCreate(BaseModel):
    category: FeedbackCategory
    body: str = Field(..., min_length=1, max_length=4000)
    email: str | None = Field(None, max_length=255)
    client_uuid: str | None = Field(None, max_length=64)
    app_version: str | None = Field(None, max_length=32)
    platform: str | None = Field(None, max_length=16)


class FeedbackOut(BaseModel):
    id: int
    category: str
    body: str
    email: str | None
    client_uuid: str | None
    app_version: str | None
    platform: str | None
    status: str
    created_at: datetime
