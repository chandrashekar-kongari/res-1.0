"""stack user id on users

Revision ID: 003_stack_user
Revises: 002_auth_providers
Create Date: 2026-09-28
"""

from typing import Sequence, Union

from alembic import op

revision: str = "003_stack_user"
down_revision: Union[str, Sequence[str], None] = "002_auth_providers"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS stack_user_id TEXT NULL")
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS users_stack_user_id_key
          ON users (stack_user_id)
          WHERE stack_user_id IS NOT NULL
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS users_stack_user_id_key")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS stack_user_id")
