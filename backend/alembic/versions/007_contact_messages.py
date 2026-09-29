"""marketing contact notes

Revision ID: 007_contact_messages
Revises: 006_chat_instructions
Create Date: 2026-09-29
"""

from typing import Sequence, Union

from alembic import op

revision: str = "007_contact_messages"
down_revision: Union[str, Sequence[str], None] = "006_chat_instructions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS contact_messages (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL
        )
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS contact_messages_created_idx
          ON contact_messages (created_at DESC)
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS contact_messages")
