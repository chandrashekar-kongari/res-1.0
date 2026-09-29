"""tracked applications per user

Revision ID: 005_applications
Revises: 004_user_profiles
Create Date: 2026-09-29
"""

from typing import Sequence, Union

from alembic import op

revision: str = "005_applications"
down_revision: Union[str, Sequence[str], None] = "004_user_profiles"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS applications (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          job_id TEXT NULL,
          company TEXT NOT NULL,
          role TEXT NOT NULL,
          url TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'NEEDTOAPPLY',
          applied_at TIMESTAMPTZ NOT NULL
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS applications_user_id_idx ON applications (user_id)"
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS applications_user_applied_idx
          ON applications (user_id, applied_at)
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS applications_user_url_key
          ON applications (user_id, url)
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS applications_user_job_id_key
          ON applications (user_id, job_id)
          WHERE job_id IS NOT NULL
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS applications")
