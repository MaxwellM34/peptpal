"""
Run this script after applying migrations to seed the reference peptide data.
Usage: python -m app.seed.run_seed
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from tortoise import Tortoise

from app.config import TORTOISE_ORM
from app.models.peptide import Peptide
from app.seed.peptides import PEPTIDES


async def seed():
    await Tortoise.init(config=TORTOISE_ORM)
    await Tortoise.generate_schemas(safe=True)

    created = 0
    updated = 0

    for data in PEPTIDES:
        existing = await Peptide.get_or_none(slug=data["slug"])
        if existing:
            for field, value in data.items():
                setattr(existing, field, value)
            await existing.save()
            updated += 1
            print(f"  Updated: {data['name']}")
        else:
            await Peptide.create(**data)
            created += 1
            print(f"  Created: {data['name']}")

    print(f"\nSeed complete: {created} created, {updated} updated ({len(PEPTIDES)} total)")
    await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(seed())
