"""Versioned configuration loader — no magic numbers in code (blueprint §5.2, §8).

Every threshold in the whole system lives in a YAML file under ``config/`` and
is loaded through here. The loader **raises on a missing key** rather than
returning a default: a silent default is exactly how a threshold silently drifts
and breaks determinism/repeatability. If the config doesn't have it, that's a
bug to fix in the config, not to paper over in code.

``PIPELINE_VERSION`` is defined here and is the single value bumped on any model
or threshold change; it invalidates the content-addressed cache (rule R8) and
stamps every result.
"""

from __future__ import annotations

import functools
from pathlib import Path
from typing import Any

# Bump on ANY change to a model, a threshold, or a dependency version. This is
# what makes the result cache correct — an old cached result for a superseded
# pipeline is never returned. Keep in lockstep with config/*.yaml revisions.
PIPELINE_VERSION = "0.3.0"

_CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"


class ConfigError(RuntimeError):
    """A required config file or key is missing/malformed."""


@functools.lru_cache(maxsize=None)
def _load_file(name: str) -> dict[str, Any]:
    # Imported lazily so the scaffold/stub runs without PyYAML installed; it is
    # only needed the first time a real config value is read.
    import yaml

    path = _CONFIG_DIR / name
    if not path.exists():
        raise ConfigError(f"config file not found: {path}")
    with path.open("r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    if not isinstance(data, dict):
        raise ConfigError(f"config file {name} must be a mapping at the top level")
    return data


def get(name: str, *keys: str) -> Any:
    """Fetch ``config/<name>.yaml`` -> keys..., raising on any missing key.

    Example: ``get("gate_v1", "blur", "min_variance")``.
    """
    node: Any = _load_file(f"{name}.yaml")
    trail: list[str] = [name]
    for key in keys:
        if not isinstance(node, dict) or key not in node:
            raise ConfigError(f"missing config key: {' -> '.join(trail + [key])}")
        node = node[key]
        trail.append(key)
    return node


def clear_cache() -> None:
    """Test seam — drop cached YAML so a test can point at fresh files."""
    _load_file.cache_clear()
