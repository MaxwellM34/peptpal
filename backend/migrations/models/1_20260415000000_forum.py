from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "forum_users" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "client_uuid" VARCHAR(64) NOT NULL UNIQUE,
            "handle" VARCHAR(32),
            "verified" BOOL NOT NULL DEFAULT FALSE,
            "banned" BOOL NOT NULL DEFAULT FALSE,
            "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS "dose_log_posts" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "user_id" INT NOT NULL REFERENCES "forum_users" ("id") ON DELETE CASCADE,
            "peptide_slug" VARCHAR(64) NOT NULL,
            "dose_mcg" DOUBLE PRECISION NOT NULL,
            "doses_per_week" DOUBLE PRECISION NOT NULL,
            "weeks_on" INT,
            "user_weight_kg" DOUBLE PRECISION NOT NULL,
            "goal" VARCHAR(64) NOT NULL,
            "outcome_score" INT,
            "side_effect_severity" INT,
            "bloodwork_attached" BOOL NOT NULL DEFAULT FALSE,
            "body_composition_attached" BOOL NOT NULL DEFAULT FALSE,
            "batch_info_attached" BOOL NOT NULL DEFAULT FALSE,
            "longitudinal" BOOL NOT NULL DEFAULT FALSE,
            "vendor_flagged" BOOL NOT NULL DEFAULT FALSE,
            "hidden" BOOL NOT NULL DEFAULT FALSE,
            "report_count" INT NOT NULL DEFAULT 0,
            "body" TEXT,
            "attachments" JSONB NOT NULL DEFAULT '[]',
            "upvotes" INT NOT NULL DEFAULT 0,
            "downvotes" INT NOT NULL DEFAULT 0,
            "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS "idx_dose_log_posts_peptide_slug" ON "dose_log_posts" ("peptide_slug");

        CREATE TABLE IF NOT EXISTS "forum_comments" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "post_id" INT NOT NULL REFERENCES "dose_log_posts" ("id") ON DELETE CASCADE,
            "user_id" INT NOT NULL REFERENCES "forum_users" ("id") ON DELETE CASCADE,
            "parent_id" INT REFERENCES "forum_comments" ("id") ON DELETE CASCADE,
            "body" TEXT NOT NULL,
            "upvotes" INT NOT NULL DEFAULT 0,
            "downvotes" INT NOT NULL DEFAULT 0,
            "hidden" BOOL NOT NULL DEFAULT FALSE,
            "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS "post_votes" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "user_id" INT NOT NULL REFERENCES "forum_users" ("id") ON DELETE CASCADE,
            "post_id" INT NOT NULL REFERENCES "dose_log_posts" ("id") ON DELETE CASCADE,
            "value" INT NOT NULL,
            "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT "uniq_user_post_vote" UNIQUE ("user_id", "post_id")
        );

        CREATE TABLE IF NOT EXISTS "consensus_snapshots" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "peptide_slug" VARCHAR(64) NOT NULL,
            "goal" VARCHAR(64) NOT NULL,
            "weight_bracket_kg_min" DOUBLE PRECISION NOT NULL,
            "weight_bracket_kg_max" DOUBLE PRECISION NOT NULL,
            "n_posts" INT NOT NULL,
            "median_mcg_per_kg_per_week" DOUBLE PRECISION NOT NULL,
            "p25_mcg_per_kg_per_week" DOUBLE PRECISION NOT NULL,
            "p75_mcg_per_kg_per_week" DOUBLE PRECISION NOT NULL,
            "minority_protocols" JSONB NOT NULL DEFAULT '[]',
            "low_confidence" BOOL NOT NULL DEFAULT FALSE,
            "computed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT "uniq_consensus_peptide_goal_bracket" UNIQUE ("peptide_slug", "goal", "weight_bracket_kg_min")
        );
        CREATE INDEX IF NOT EXISTS "idx_consensus_peptide_slug" ON "consensus_snapshots" ("peptide_slug");

        CREATE TABLE IF NOT EXISTS "post_reports" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "post_id" INT NOT NULL REFERENCES "dose_log_posts" ("id") ON DELETE CASCADE,
            "reporter_id" INT NOT NULL REFERENCES "forum_users" ("id") ON DELETE CASCADE,
            "reason" VARCHAR(64) NOT NULL,
            "notes" TEXT,
            "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "post_reports";
        DROP TABLE IF EXISTS "consensus_snapshots";
        DROP TABLE IF EXISTS "post_votes";
        DROP TABLE IF EXISTS "forum_comments";
        DROP TABLE IF EXISTS "dose_log_posts";
        DROP TABLE IF EXISTS "forum_users";
    """
