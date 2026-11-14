"""add compatibility preferences and explainable mentorship scores

Revision ID: 20261108_20
Revises: 20261108_19
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20261108_20"
down_revision = "20261108_19"
branch_labels = None
depends_on = None

JSONB = postgresql.JSONB(astext_type=sa.Text())


def upgrade() -> None:
    op.add_column("mentor_applications", sa.Column("programme", sa.String(120), nullable=True))
    op.add_column("mentor_applications", sa.Column("areas_of_expertise", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")))
    op.add_column("mentor_applications", sa.Column("mentorship_goals", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")))
    op.add_column("mentor_applications", sa.Column("teaching_style", sa.String(30), nullable=True))
    op.add_column("mentor_applications", sa.Column("communication_method", sa.String(30), nullable=True))
    op.add_column("mentor_applications", sa.Column("experience", sa.String(1000), nullable=True))

    op.add_column("mentee_applications", sa.Column("programme", sa.String(120), nullable=True))
    op.add_column("mentee_applications", sa.Column("interests", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")))
    op.add_column("mentee_applications", sa.Column("learning_difficulties", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")))
    op.add_column("mentee_applications", sa.Column("learning_style", sa.String(30), nullable=True))
    op.add_column("mentee_applications", sa.Column("communication_method", sa.String(30), nullable=True))

    op.add_column("mentorship_matches", sa.Column("score_breakdown", JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")))


def downgrade() -> None:
    op.drop_column("mentorship_matches", "score_breakdown")
    op.drop_column("mentee_applications", "communication_method")
    op.drop_column("mentee_applications", "learning_style")
    op.drop_column("mentee_applications", "learning_difficulties")
    op.drop_column("mentee_applications", "interests")
    op.drop_column("mentee_applications", "programme")
    op.drop_column("mentor_applications", "experience")
    op.drop_column("mentor_applications", "communication_method")
    op.drop_column("mentor_applications", "teaching_style")
    op.drop_column("mentor_applications", "mentorship_goals")
    op.drop_column("mentor_applications", "areas_of_expertise")
    op.drop_column("mentor_applications", "programme")
