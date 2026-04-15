"""Forum API — pseudonymous dose logs, votes, comments, reports, consensus snapshots."""
from fastapi import APIRouter, HTTPException, Query

from app.models.community import (
    ConsensusSnapshot,
    DoseLogPost,
    ForumComment,
    ForumUser,
    PostReport,
    PostVote,
)
from app.schemas.community import (
    CommentCreate,
    CommentOut,
    ConsensusSnapshotOut,
    DoseLogPostCreate,
    DoseLogPostOut,
    ForumUserOut,
    ForumUserRegister,
    PostReportIn,
    PostVoteIn,
)
from app.services.consensus import rebuild_snapshots_for_peptide

router = APIRouter(prefix='/api/forum', tags=['forum'])

# Vendor-keyword heuristic for auto-flagging.
VENDOR_KEYWORDS = (
    'buy', 'coupon', 'discount', '% off', 'code', 'promo', 'order now', 'dm me',
    'telegram', 'order here', 'click here', 'best price',
)

# Report threshold for auto-hiding.
AUTO_HIDE_REPORT_COUNT = 5


def looks_like_vendor(body: str | None) -> bool:
    if not body:
        return False
    lo = body.lower()
    return any(k in lo for k in VENDOR_KEYWORDS)


async def get_or_create_user(client_uuid: str) -> ForumUser:
    user = await ForumUser.get_or_none(client_uuid=client_uuid)
    if user is None:
        user = await ForumUser.create(client_uuid=client_uuid)
    return user


# ─── Users ──────────────────────────────────────────────────────────────────


@router.post('/users', response_model=ForumUserOut, status_code=201)
async def register_user(payload: ForumUserRegister) -> ForumUserOut:
    existing = await ForumUser.get_or_none(client_uuid=payload.client_uuid)
    if existing is None:
        existing = await ForumUser.create(
            client_uuid=payload.client_uuid,
            handle=payload.handle,
        )
    elif payload.handle and existing.handle != payload.handle:
        existing.handle = payload.handle
        await existing.save()
    return ForumUserOut(
        id=existing.id,
        handle=existing.handle,
        verified=existing.verified,
        created_at=existing.created_at,
    )


# ─── Posts ──────────────────────────────────────────────────────────────────


@router.post('/posts', response_model=DoseLogPostOut, status_code=201)
async def create_post(payload: DoseLogPostCreate) -> DoseLogPostOut:
    user = await get_or_create_user(payload.client_uuid)
    if user.banned:
        raise HTTPException(status_code=403, detail='Account restricted.')

    vendor_flagged = looks_like_vendor(payload.body)

    post = await DoseLogPost.create(
        user=user,
        peptide_slug=payload.peptide_slug,
        dose_mcg=payload.dose_mcg,
        doses_per_week=payload.doses_per_week,
        weeks_on=payload.weeks_on,
        user_weight_kg=payload.user_weight_kg,
        goal=payload.goal,
        outcome_score=payload.outcome_score,
        side_effect_severity=payload.side_effect_severity,
        bloodwork_attached=payload.bloodwork_attached,
        body_composition_attached=payload.body_composition_attached,
        batch_info_attached=payload.batch_info_attached,
        longitudinal=payload.longitudinal,
        vendor_flagged=vendor_flagged,
        body=payload.body,
        attachments=payload.attachments,
    )

    # Opportunistic snapshot rebuild — keeps consensus fresh as posts land.
    await rebuild_snapshots_for_peptide(payload.peptide_slug)

    return DoseLogPostOut(
        id=post.id,
        user_id=user.id,
        user_handle=user.handle,
        peptide_slug=post.peptide_slug,
        dose_mcg=post.dose_mcg,
        doses_per_week=post.doses_per_week,
        weeks_on=post.weeks_on,
        user_weight_kg=post.user_weight_kg,
        goal=post.goal,
        outcome_score=post.outcome_score,
        side_effect_severity=post.side_effect_severity,
        bloodwork_attached=post.bloodwork_attached,
        body_composition_attached=post.body_composition_attached,
        batch_info_attached=post.batch_info_attached,
        longitudinal=post.longitudinal,
        vendor_flagged=post.vendor_flagged,
        body=post.body,
        attachments=post.attachments,
        upvotes=post.upvotes,
        downvotes=post.downvotes,
        created_at=post.created_at,
    )


@router.get('/posts', response_model=list[DoseLogPostOut])
async def list_posts(
    peptide_slug: str = Query(...),
    goal: str | None = None,
    limit: int = Query(50, ge=1, le=200),
) -> list[DoseLogPostOut]:
    q = DoseLogPost.filter(peptide_slug=peptide_slug, hidden=False).order_by('-created_at')
    if goal:
        q = q.filter(goal=goal)
    posts = await q.limit(limit).prefetch_related('user')
    return [
        DoseLogPostOut(
            id=p.id,
            user_id=p.user.id,
            user_handle=p.user.handle,
            peptide_slug=p.peptide_slug,
            dose_mcg=p.dose_mcg,
            doses_per_week=p.doses_per_week,
            weeks_on=p.weeks_on,
            user_weight_kg=p.user_weight_kg,
            goal=p.goal,
            outcome_score=p.outcome_score,
            side_effect_severity=p.side_effect_severity,
            bloodwork_attached=p.bloodwork_attached,
            body_composition_attached=p.body_composition_attached,
            batch_info_attached=p.batch_info_attached,
            longitudinal=p.longitudinal,
            vendor_flagged=p.vendor_flagged,
            body=p.body,
            attachments=p.attachments,
            upvotes=p.upvotes,
            downvotes=p.downvotes,
            created_at=p.created_at,
        )
        for p in posts
    ]


# ─── Votes ──────────────────────────────────────────────────────────────────


@router.post('/posts/{post_id}/vote', status_code=201)
async def vote(post_id: int, payload: PostVoteIn) -> dict:
    user = await get_or_create_user(payload.client_uuid)
    post = await DoseLogPost.get_or_none(id=post_id)
    if post is None:
        raise HTTPException(status_code=404, detail='Post not found')

    existing = await PostVote.get_or_none(user=user, post=post)
    if payload.value == 0:
        if existing:
            await existing.delete()
    else:
        if existing:
            existing.value = payload.value
            await existing.save()
        else:
            await PostVote.create(user=user, post=post, value=payload.value)

    # Recompute aggregates.
    ups = await PostVote.filter(post=post, value=1).count()
    downs = await PostVote.filter(post=post, value=-1).count()
    post.upvotes = ups
    post.downvotes = downs
    await post.save()

    return {'upvotes': ups, 'downvotes': downs}


# ─── Reports ────────────────────────────────────────────────────────────────


@router.post('/posts/{post_id}/report', status_code=201)
async def report_post(post_id: int, payload: PostReportIn) -> dict:
    user = await get_or_create_user(payload.client_uuid)
    post = await DoseLogPost.get_or_none(id=post_id)
    if post is None:
        raise HTTPException(status_code=404, detail='Post not found')

    await PostReport.create(
        post=post,
        reporter=user,
        reason=payload.reason,
        notes=payload.notes,
    )
    post.report_count = await PostReport.filter(post=post).count()
    if post.report_count >= AUTO_HIDE_REPORT_COUNT:
        post.hidden = True
    await post.save()
    return {'reported': True, 'hidden': post.hidden}


# ─── Comments ───────────────────────────────────────────────────────────────


@router.post('/posts/{post_id}/comments', response_model=CommentOut, status_code=201)
async def create_comment(post_id: int, payload: CommentCreate) -> CommentOut:
    user = await get_or_create_user(payload.client_uuid)
    post = await DoseLogPost.get_or_none(id=post_id)
    if post is None:
        raise HTTPException(status_code=404, detail='Post not found')

    parent = None
    if payload.parent_id:
        parent = await ForumComment.get_or_none(id=payload.parent_id)

    c = await ForumComment.create(
        post=post,
        user=user,
        parent=parent,
        body=payload.body,
    )
    return CommentOut(
        id=c.id,
        post_id=post.id,
        user_handle=user.handle,
        parent_id=parent.id if parent else None,
        body=c.body,
        upvotes=c.upvotes,
        downvotes=c.downvotes,
        created_at=c.created_at,
    )


@router.get('/posts/{post_id}/comments', response_model=list[CommentOut])
async def list_comments(post_id: int) -> list[CommentOut]:
    comments = await ForumComment.filter(post_id=post_id, hidden=False).prefetch_related('user').order_by('created_at')
    return [
        CommentOut(
            id=c.id,
            post_id=post_id,
            user_handle=c.user.handle,
            parent_id=c.parent_id,
            body=c.body,
            upvotes=c.upvotes,
            downvotes=c.downvotes,
            created_at=c.created_at,
        )
        for c in comments
    ]


# ─── Consensus snapshots ────────────────────────────────────────────────────


@router.get('/consensus', response_model=list[ConsensusSnapshotOut])
async def get_consensus(
    peptide_slug: str = Query(...),
    goal: str | None = None,
    weight_kg: float | None = None,
) -> list[ConsensusSnapshotOut]:
    q = ConsensusSnapshot.filter(peptide_slug=peptide_slug)
    if goal:
        q = q.filter(goal=goal)
    if weight_kg is not None:
        q = q.filter(weight_bracket_kg_min__lte=weight_kg, weight_bracket_kg_max__gte=weight_kg)
    snapshots = await q.order_by('-computed_at').all()
    return [
        ConsensusSnapshotOut(
            peptide_slug=s.peptide_slug,
            goal=s.goal,
            weight_bracket_kg_min=s.weight_bracket_kg_min,
            weight_bracket_kg_max=s.weight_bracket_kg_max,
            n_posts=s.n_posts,
            median_mcg_per_kg_per_week=s.median_mcg_per_kg_per_week,
            p25_mcg_per_kg_per_week=s.p25_mcg_per_kg_per_week,
            p75_mcg_per_kg_per_week=s.p75_mcg_per_kg_per_week,
            minority_protocols=s.minority_protocols,
            low_confidence=s.low_confidence,
            computed_at=s.computed_at,
        )
        for s in snapshots
    ]
