"""User-submitted bug reports, feature requests, and general feedback.

No login required — submissions include an optional client UUID (for dedupe)
and optional email (for follow-up). Status is mutated by staff/admin only.
"""
from tortoise import fields
from tortoise.models import Model


class Feedback(Model):
    id = fields.IntField(primary_key=True)
    category = fields.CharField(max_length=16, index=True)  # bug | feature | general
    body = fields.TextField()
    email = fields.CharField(max_length=255, null=True)
    client_uuid = fields.CharField(max_length=64, null=True, index=True)
    app_version = fields.CharField(max_length=32, null=True)
    platform = fields.CharField(max_length=16, null=True)  # ios | android | web
    status = fields.CharField(max_length=16, default='new')  # new | triaged | resolved | dismissed
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = 'feedback'
