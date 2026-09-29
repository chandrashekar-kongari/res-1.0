"""account-level assistant instructions

Revision ID: 006_chat_instructions
Revises: 005_applications
Create Date: 2026-09-29
"""

from typing import Sequence, Union

from alembic import op

revision: str = "006_chat_instructions"
down_revision: Union[str, Sequence[str], None] = "005_applications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE user_profiles
          ADD COLUMN IF NOT EXISTS chat_instructions TEXT NOT NULL DEFAULT ''
        """
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE user_profiles DROP COLUMN IF EXISTS chat_instructions"
    )
