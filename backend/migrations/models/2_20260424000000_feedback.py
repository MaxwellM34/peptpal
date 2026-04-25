from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "feedback" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "category" VARCHAR(16) NOT NULL,
            "body" TEXT NOT NULL,
            "email" VARCHAR(255),
            "client_uuid" VARCHAR(64),
            "app_version" VARCHAR(32),
            "platform" VARCHAR(16),
            "status" VARCHAR(16) NOT NULL DEFAULT 'new',
            "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS "idx_feedback_category" ON "feedback" ("category");
        CREATE INDEX IF NOT EXISTS "idx_feedback_client_uuid" ON "feedback" ("client_uuid");
        CREATE INDEX IF NOT EXISTS "idx_feedback_created_at" ON "feedback" ("created_at");
    """


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "feedback";
    """
