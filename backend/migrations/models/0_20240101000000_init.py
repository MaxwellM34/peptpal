from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "peptides" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "slug" VARCHAR(64) NOT NULL UNIQUE,
            "name" VARCHAR(128) NOT NULL,
            "aliases" JSONB NOT NULL DEFAULT '[]',
            "description" TEXT NOT NULL,
            "disclaimer" TEXT NOT NULL,
            "half_life_hours" DOUBLE PRECISION,
            "recommended_dose_mcg_min" DOUBLE PRECISION,
            "recommended_dose_mcg_max" DOUBLE PRECISION,
            "max_dose_mcg" DOUBLE PRECISION,
            "frequency_notes" TEXT,
            "storage_temp" VARCHAR(16) NOT NULL DEFAULT 'fridge',
            "routes" JSONB NOT NULL DEFAULT '[]',
            "common_protocols" JSONB NOT NULL DEFAULT '[]',
            "side_effects" JSONB NOT NULL DEFAULT '[]',
            "synergies" JSONB NOT NULL DEFAULT '[]',
            "is_published" BOOL NOT NULL DEFAULT TRUE,
            "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS "community_submissions" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "field_name" VARCHAR(128) NOT NULL,
            "suggested_value" TEXT NOT NULL,
            "rationale" TEXT NOT NULL,
            "submitter_email" VARCHAR(256),
            "status" VARCHAR(16) NOT NULL DEFAULT 'pending',
            "reviewed_at" TIMESTAMPTZ,
            "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            "peptide_id" INT REFERENCES "peptides" ("id") ON DELETE SET NULL
        );
        CREATE TABLE IF NOT EXISTS "aerich" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "version" VARCHAR(255) NOT NULL,
            "app" VARCHAR(100) NOT NULL,
            "content" JSONB NOT NULL
        );
    """


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "community_submissions";
        DROP TABLE IF EXISTS "peptides";
    """
