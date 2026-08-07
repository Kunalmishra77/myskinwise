"""Global determinism pinning — imported for its side effects at process start.

Rule R9 from the blueprint. Same input image -> byte-identical output, forever,
is a *correctness* requirement for a measuring instrument, and the easiest way
to break it is an unseeded RNG or a multi-threaded float reduction whose
summation order varies. This module removes both classes of variance before any
pipeline code runs.

Import it FIRST, before numpy/cv2 are used in anger:

    from app import determinism  # noqa: F401  (side effects)

Kept dependency-light so it is safe to import from tests and from the app entry
alike.
"""

from __future__ import annotations

import os
import random


def pin() -> None:
    """Pin every source of non-determinism we control. Idempotent."""
    # Hash seed must be set before interpreter start to fully take effect; we
    # set it anyway so a re-exec / subprocess inherits it (see PYTHONHASHSEED
    # handling in the test harness).
    os.environ.setdefault("PYTHONHASHSEED", "0")

    random.seed(0)

    try:
        import numpy as np

        np.random.seed(0)
    except Exception:  # numpy not yet installed (bare scaffold) — fine.
        pass

    try:
        import cv2

        # Single-threaded: parallel float reductions sum in a non-deterministic
        # order, which changes the last bits and can flip a borderline result.
        cv2.setNumThreads(1)
        cv2.setRNGSeed(0)
    except Exception:  # opencv not yet installed — fine for the bare scaffold.
        pass


# Pin on import.
pin()
