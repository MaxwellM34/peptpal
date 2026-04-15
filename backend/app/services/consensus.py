"""Consensus computation: weighted-median dose with minority-protocol detection.

Mirrors the TypeScript implementation in packages/core/src/consensus.ts — keep
these in sync when either changes. This runs server-side as a nightly job to
produce ConsensusSnapshot rows that mobile reads.
"""
from dataclasses import dataclass

from app.models.community import DoseLogPost

# Weight brackets in kg — 10 kg wide, cover typical adult range.
WEIGHT_BRACKETS: list[tuple[float, float]] = [
    (50, 70),
    (60, 80),
    (70, 90),
    (80, 100),
    (90, 110),
    (100, 120),
    (110, 130),
]


@dataclass
class PostForConsensus:
    dose_mcg: float
    doses_per_week: float
    user_weight_kg: float
    bloodwork_attached: bool
    body_composition_attached: bool
    batch_info_attached: bool
    longitudinal: bool
    vendor_flagged: bool


def post_weight(p: PostForConsensus) -> float:
    if p.vendor_flagged:
        return 0.0
    w = 1.0
    if p.bloodwork_attached:
        w *= 5.0
    elif p.body_composition_attached:
        w *= 3.0
    if p.batch_info_attached:
        w *= 2.0
    if p.longitudinal:
        w *= 2.0
    return w


def weighted_quantile(values: list[float], weights: list[float], q: float) -> float:
    if not values:
        return 0.0
    pairs = sorted(
        [(v, w) for v, w in zip(values, weights) if w > 0],
        key=lambda x: x[0],
    )
    if not pairs:
        return 0.0
    total = sum(w for _, w in pairs)
    if total == 0:
        return pairs[len(pairs) // 2][0]
    target = total * q
    cum = 0.0
    for v, w in pairs:
        cum += w
        if cum >= target:
            return v
    return pairs[-1][0]


def compute_cluster_stats(
    posts: list[PostForConsensus],
) -> tuple[int, float, float, float, list[dict]]:
    """Return (n, median, p25, p75, minority_protocols) in mcg/kg/week."""
    per_kg_per_week = [
        (p.dose_mcg * p.doses_per_week) / p.user_weight_kg for p in posts
    ]
    weights = [post_weight(p) for p in posts]
    median = weighted_quantile(per_kg_per_week, weights, 0.5)
    p25 = weighted_quantile(per_kg_per_week, weights, 0.25)
    p75 = weighted_quantile(per_kg_per_week, weights, 0.75)

    total_weight = sum(weights)
    minority: list[dict] = []
    if total_weight > 0:
        for side in ('lower', 'higher'):
            subset = [
                (p, w, v)
                for p, w, v in zip(posts, weights, per_kg_per_week)
                if (v < median if side == 'lower' else v > median)
            ]
            sub_w = sum(w for _, w, _ in subset)
            if sub_w / total_weight < 0.15:
                continue
            sub_median = weighted_quantile(
                [v for _, _, v in subset],
                [w for _, w, _ in subset],
                0.5,
            )
            if abs(sub_median - median) / (median or 1) < 0.25:
                continue
            minority.append(
                {
                    'label': f'{side}-dose',
                    'median_mcg_per_kg_per_week': sub_median,
                    'weight_share': sub_w / total_weight,
                    'n': len(subset),
                }
            )

    return len(posts), median, p25, p75, minority


async def rebuild_snapshots_for_peptide(peptide_slug: str) -> int:
    """Rebuild all consensus snapshots for a peptide. Returns number written."""
    from app.models.community import ConsensusSnapshot

    all_posts = await DoseLogPost.filter(
        peptide_slug=peptide_slug,
        vendor_flagged=False,
        hidden=False,
    ).all()

    goals_in_data = sorted({p.goal for p in all_posts})
    written = 0

    for goal in goals_in_data:
        goal_posts = [p for p in all_posts if p.goal == goal]
        for w_min, w_max in WEIGHT_BRACKETS:
            bracket_posts = [p for p in goal_posts if w_min <= p.user_weight_kg <= w_max]
            if not bracket_posts:
                continue
            pc = [
                PostForConsensus(
                    dose_mcg=p.dose_mcg,
                    doses_per_week=p.doses_per_week,
                    user_weight_kg=p.user_weight_kg,
                    bloodwork_attached=p.bloodwork_attached,
                    body_composition_attached=p.body_composition_attached,
                    batch_info_attached=p.batch_info_attached,
                    longitudinal=p.longitudinal,
                    vendor_flagged=p.vendor_flagged,
                )
                for p in bracket_posts
            ]
            n, median, p25, p75, minority = compute_cluster_stats(pc)
            await ConsensusSnapshot.update_or_create(
                peptide_slug=peptide_slug,
                goal=goal,
                weight_bracket_kg_min=w_min,
                defaults={
                    'weight_bracket_kg_max': w_max,
                    'n_posts': n,
                    'median_mcg_per_kg_per_week': median,
                    'p25_mcg_per_kg_per_week': p25,
                    'p75_mcg_per_kg_per_week': p75,
                    'minority_protocols': minority,
                    'low_confidence': n < 5,
                },
            )
            written += 1

    return written


async def rebuild_all_snapshots() -> int:
    """Nightly job: rebuild snapshots across every peptide with posts."""
    slugs = await DoseLogPost.all().distinct().values_list('peptide_slug', flat=True)
    total = 0
    for slug in slugs:
        total += await rebuild_snapshots_for_peptide(slug)
    return total
