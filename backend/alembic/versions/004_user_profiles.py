"""application profile per user

Revision ID: 004_user_profiles
Revises: 003_stack_user
Create Date: 2026-09-29
"""

from typing import Sequence, Union

from alembic import op

revision: str = "004_user_profiles"
down_revision: Union[str, Sequence[str], None] = "003_stack_user"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS user_profiles (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          first_name TEXT NOT NULL DEFAULT '',
          last_name TEXT NOT NULL DEFAULT '',
          email TEXT NOT NULL DEFAULT '',
          phone TEXT NOT NULL DEFAULT '',
          city TEXT NOT NULL DEFAULT '',
          region TEXT NOT NULL DEFAULT '',
          country TEXT NOT NULL DEFAULT '',
          linkedin_url TEXT NOT NULL DEFAULT '',
          github_url TEXT NOT NULL DEFAULT '',
          portfolio_url TEXT NOT NULL DEFAULT '',
          current_title TEXT NOT NULL DEFAULT '',
          years_experience INTEGER NULL,
          work_authorized BOOLEAN NULL,
          requires_sponsorship BOOLEAN NULL,
          willing_to_relocate BOOLEAN NULL,
          default_resume_id UUID NULL REFERENCES resumes(id) ON DELETE SET NULL,
          source_resume_id UUID NULL REFERENCES resumes(id) ON DELETE SET NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS user_profiles")
