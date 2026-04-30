"""
undercore-sdk — Official Python SDK for the Undercore API
Version 1.0.0 — Phase 125

Quick start:
    from undercore import Undercore

    with Undercore(api_key="uc_live_...") as uc:
        result = uc.works.list()
        for work in result.works:
            print(work.title, work.status)

Docs: https://developers.undercore.pro
"""

from .client import Undercore, UndercoreError
from .types import (
    Work,
    WorkStatus,
    WorksResponse,
    Writer,
    WritersResponse,
)

__version__ = "1.0.0"

__all__ = [
    "Undercore",
    "UndercoreError",
    "Work",
    "WorkStatus",
    "WorksResponse",
    "Writer",
    "WritersResponse",
    "__version__",
]
