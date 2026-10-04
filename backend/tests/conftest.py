import os


# Model-only tests should not require a developer's real database credential.
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")

