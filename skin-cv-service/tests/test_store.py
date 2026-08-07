"""Content-addressed cache + scan/mask store (blueprint R8). Pure, no CV deps."""

from __future__ import annotations

import importlib

from app import store as store_module


def _fresh():
    # Reset module-level state between tests.
    importlib.reload(store_module)
    return store_module


def test_cache_key_includes_version():
    s = _fresh()
    assert s.cache_key("abc", "1.2.3") == "abc:1.2.3"


def test_put_and_get_roundtrip():
    s = _fresh()
    key = s.cache_key("deadbeef", "0.4.0")
    result = {"scan_id": "scn_deadbeef", "score": 42}
    s.put("scn_deadbeef", key, result, {"pigmentation": b"PNGBYTES"})

    assert s.get_cached(key) == result
    assert s.get_result("scn_deadbeef") == result
    assert s.get_mask("scn_deadbeef", "pigmentation") == b"PNGBYTES"
    assert s.get_mask("scn_deadbeef", "missing") is None
    assert s.get_cached("unknown:0.4.0") is None


def test_lru_eviction():
    s = _fresh()
    s._MAX = 3
    for i in range(5):
        sid = f"scn_{i}"
        s.put(sid, s.cache_key(str(i), "0.4.0"), {"i": i}, {})
    # Only the last 3 survive.
    assert s.get_result("scn_0") is None
    assert s.get_result("scn_1") is None
    assert s.get_result("scn_4") == {"i": 4}
    # The evicted scans' cache entries are gone too.
    assert s.get_cached(s.cache_key("0", "0.4.0")) is None
