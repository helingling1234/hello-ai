from cachetools import TTLCache
from typing import Any, Callable, Hashable
import functools

# Separate caches with different TTLs
_annotation_cache: TTLCache = TTLCache(maxsize=500, ttl=3600)
_literature_cache: TTLCache = TTLCache(maxsize=200, ttl=86400)
_disease_cache: TTLCache = TTLCache(maxsize=200, ttl=86400)

CACHES = {
    "annotation": _annotation_cache,
    "literature": _literature_cache,
    "disease": _disease_cache,
}


def get_cached(cache_name: str, key: Hashable) -> Any | None:
    cache = CACHES[cache_name]
    return cache.get(key)


def set_cached(cache_name: str, key: Hashable, value: Any) -> None:
    cache = CACHES[cache_name]
    cache[key] = value
