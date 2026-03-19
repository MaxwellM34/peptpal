from tortoise import fields
from tortoise.models import Model


class Peptide(Model):
    id = fields.IntField(primary_key=True)
    slug = fields.CharField(max_length=64, unique=True)
    name = fields.CharField(max_length=128)
    aliases: fields.JSONField = fields.JSONField(default=list)
    description = fields.TextField()
    disclaimer = fields.TextField()
    half_life_hours = fields.FloatField(null=True)
    recommended_dose_mcg_min = fields.FloatField(null=True)
    recommended_dose_mcg_max = fields.FloatField(null=True)
    max_dose_mcg = fields.FloatField(null=True)
    frequency_notes = fields.TextField(null=True)
    storage_temp = fields.CharField(max_length=16, default='fridge')  # fridge | freezer
    routes: fields.JSONField = fields.JSONField(default=list)  # ["subq","im","intranasal","topical"]
    common_protocols: fields.JSONField = fields.JSONField(default=list)
    side_effects: fields.JSONField = fields.JSONField(default=list)
    synergies: fields.JSONField = fields.JSONField(default=list)
    is_published = fields.BooleanField(default=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = 'peptides'

    def __str__(self) -> str:
        return self.name


class CommunitySubmission(Model):
    id = fields.IntField(primary_key=True)
    peptide = fields.ForeignKeyField('models.Peptide', null=True, on_delete=fields.SET_NULL)
    field_name = fields.CharField(max_length=128)
    suggested_value = fields.TextField()
    rationale = fields.TextField()
    submitter_email = fields.CharField(max_length=256, null=True)
    status = fields.CharField(max_length=16, default='pending')  # pending|approved|rejected
    reviewed_at = fields.DatetimeField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = 'community_submissions'

    def __str__(self) -> str:
        return f'Submission({self.field_name})'
