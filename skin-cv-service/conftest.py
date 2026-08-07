"""Make the service root importable so ``from app...`` works under pytest,
regardless of where pytest is invoked from."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
