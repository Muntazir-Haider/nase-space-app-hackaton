import os
import pytest

# Enforce local SQLite test isolation during pytest execution
# This prevents test runs from wiping or mutating remote production Neon data,
# and avoids WAN latency during rapid CI/CD and regression checks.
os.environ["NEON_DATABASE_URL"] = ""
os.environ["DATABASE_URL"] = ""
