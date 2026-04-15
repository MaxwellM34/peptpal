"""Community forum models.

Pseudonymous dose-log posts feed a nightly consensus snapshot job. No PII:
users are identified by a client-generated UUID (stored only on their device).
Posts carry evidence flags (bloodwork attached, COA attached, longitudinal)
that feed the trust-weighted consensus math.
"""
from tortoise import fields
from tortoise.models import Model


class ForumUser(Model):
    """Pseudonymous user. Client generates the UUID; no email or PII required.

    Users opting into verified-identity later can set `verified = True` via a
    separate flow. Not used for initial MVP.
    """

    id = fields.IntField(primary_key=True)
    client_uuid = fields.CharField(max_length=64, unique=True)
    handle = fields.CharField(max_length=32, null=True)  # optional pseudonymous handle
    verified = fields.BooleanField(default=False)
    banned = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = 'forum_users'


class DoseLogPost(Model):
    """A structured dose log — the canonical post type in the forum.

    Everything here goes into the consensus math. Freeform discussion goes
    into ForumComment instead.
    """

    id = fields.IntField(primary_key=True)
    user = fields.ForeignKeyField('models.ForumUser', on_delete=fields.CASCADE)
    peptide_slug = fields.CharField(max_length=64, index=True)

    # Core dose data — feeds consensus math.
    dose_mcg = fields.FloatField()
    doses_per_week = fields.FloatField()
    weeks_on = fields.IntField(null=True)
    user_weight_kg = fields.FloatField()
    goal = fields.CharField(max_length=64)

    # Outcomes.
    outcome_score = fields.IntField(null=True)  # -2 to +2
    side_effect_severity = fields.IntField(null=True)  # 0–10

    # Evidence flags — gate post weight in consensus math.
    bloodwork_attached = fields.BooleanField(default=False)
    body_composition_attached = fields.BooleanField(default=False)
    batch_info_attached = fields.BooleanField(default=False)
    longitudinal = fields.BooleanField(default=False)

    # Moderation.
    vendor_flagged = fields.BooleanField(default=False)
    hidden = fields.BooleanField(default=False)
    report_count = fields.IntField(default=0)

    # Freeform body and any attached labs/COA URLs (just links for v1).
    body = fields.TextField(null=True)
    attachments: fields.JSONField = fields.JSONField(default=list)

    upvotes = fields.IntField(default=0)
    downvotes = fields.IntField(default=0)

    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = 'dose_log_posts'


class ForumComment(Model):
    """Freeform discussion thread under a DoseLogPost."""

    id = fields.IntField(primary_key=True)
    post = fields.ForeignKeyField('models.DoseLogPost', on_delete=fields.CASCADE)
    user = fields.ForeignKeyField('models.ForumUser', on_delete=fields.CASCADE)
    parent = fields.ForeignKeyField('models.ForumComment', null=True, on_delete=fields.CASCADE)
    body = fields.TextField()
    upvotes = fields.IntField(default=0)
    downvotes = fields.IntField(default=0)
    hidden = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = 'forum_comments'


class PostVote(Model):
    """Up/down vote on a post. Scoped by (user, post) pair."""

    id = fields.IntField(primary_key=True)
    user = fields.ForeignKeyField('models.ForumUser', on_delete=fields.CASCADE)
    post = fields.ForeignKeyField('models.DoseLogPost', on_delete=fields.CASCADE)
    value = fields.IntField()  # +1 or -1
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = 'post_votes'
        unique_together = (('user', 'post'),)


class ConsensusSnapshot(Model):
    """A precomputed consensus reading for (peptide_slug, goal, weight_bracket).

    Refreshed nightly by the snapshot job. Mobile clients read the latest row
    rather than recomputing on-device — keeps the math consistent and lets us
    version the consensus algorithm.
    """

    id = fields.IntField(primary_key=True)
    peptide_slug = fields.CharField(max_length=64, index=True)
    goal = fields.CharField(max_length=64)
    weight_bracket_kg_min = fields.FloatField()
    weight_bracket_kg_max = fields.FloatField()

    n_posts = fields.IntField()
    median_mcg_per_kg_per_week = fields.FloatField()
    p25_mcg_per_kg_per_week = fields.FloatField()
    p75_mcg_per_kg_per_week = fields.FloatField()
    minority_protocols: fields.JSONField = fields.JSONField(default=list)
    low_confidence = fields.BooleanField(default=False)

    computed_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = 'consensus_snapshots'
        unique_together = (('peptide_slug', 'goal', 'weight_bracket_kg_min'),)


class PostReport(Model):
    """A user report on a post — spam, vendor shilling, dangerous dose."""

    id = fields.IntField(primary_key=True)
    post = fields.ForeignKeyField('models.DoseLogPost', on_delete=fields.CASCADE)
    reporter = fields.ForeignKeyField('models.ForumUser', on_delete=fields.CASCADE)
    reason = fields.CharField(max_length=64)  # spam|vendor|dangerous|other
    notes = fields.TextField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = 'post_reports'
