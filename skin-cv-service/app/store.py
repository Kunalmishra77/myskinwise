"""In-memory scan + mask store and the content-addressed result cache (R8).

The cache is the blueprint's belt-and-braces determinism guarantee: the SAME
image bytes under the SAME pipeline version return the SAME stored result, so
even a hypothetical bug can't produce two different answers for one file.

This implementation is in-memory (per container) — enough for the service to
serve masks and satisfy R8 now. Durable object storage (blueprint §7) is a
later infra step; the interface here won't change when it lands.
"""

from __future__ import annotations

import threading
from collections import OrderedDict
from typing import Any

_LOCK = threading.Lock()
_MAX = 500  # cap memory: LRU-evict oldest scans

# scan_id -> {"result": dict, "masks": {concern: png_bytes}}
_scans: "OrderedDict[str, dict[str, Any]]" = OrderedDict()
# content cache_key (sha256:version) -> scan_id
_cache: "OrderedDict[str, str]" = OrderedDict()


def cache_key(image_sha256: str, pipeline_version: str) -> str:
    return f"{image_sha256}:{pipeline_version}"


def get_cached(key: str) -> dict[str, Any] | None:
    with _LOCK:
        scan_id = _cache.get(key)
        if scan_id and scan_id in _scans:
            _cache.move_to_end(key)
            return _scans[scan_id]["result"]
    return None


def put(scan_id: str, key: str, result: dict[str, Any], masks: dict[str, bytes]) -> None:
    with _LOCK:
        _scans[scan_id] = {"result": result, "masks": masks}
        _scans.move_to_end(scan_id)
        _cache[key] = scan_id
        _cache.move_to_end(key)
        while len(_scans) > _MAX:
            old_id, _ = _scans.popitem(last=False)
            # drop any cache entries pointing at the evicted scan
            for k in [k for k, v in _cache.items() if v == old_id]:
                _cache.pop(k, None)


def get_result(scan_id: str) -> dict[str, Any] | None:
    with _LOCK:
        entry = _scans.get(scan_id)
        return entry["result"] if entry else None


def get_mask(scan_id: str, concern: str) -> bytes | None:
    with _LOCK:
        entry = _scans.get(scan_id)
        return entry["masks"].get(concern) if entry else None
