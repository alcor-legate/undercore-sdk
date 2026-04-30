"""
Undercore API — Python type definitions
Phase 125 — undercore-sdk v1.0.0

Typed dataclasses that mirror the exact response format of api.undercore.pro/v1/*
Work.status uses the 6 official CISAC lifecycle states (never "active" — deprecated).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Literal, Optional

# ── Work ────────────────────────────────────────────────────────

#: CISAC work lifecycle status values.
#: These 6 states are the official Undercore lifecycle (CISAC doctrine).
#: The legacy status "active" is deprecated and will never be returned.
WorkStatus = Literal[
    "draft",
    "needs_review",
    "documented",
    "registered",
    "conflict",
    "archived",
]


@dataclass
class Work:
    """A musical work (composition) in the catalog."""

    id: int
    title: str
    #: International Standard Musical Work Code — None for unregistered works.
    iswc: Optional[str]
    #: CISAC lifecycle status.
    status: WorkStatus
    created_at: str
    updated_at: str

    @classmethod
    def _from_dict(cls, data: dict) -> "Work":
        return cls(
            id=int(data["id"]),
            title=str(data["title"]),
            iswc=data.get("iswc"),
            status=data["status"],  # type: ignore[arg-type]
            created_at=str(data.get("created_at", "")),
            updated_at=str(data.get("updated_at", "")),
        )


# ── Writer ──────────────────────────────────────────────────────


@dataclass
class Writer:
    """A writer (composer or lyricist) registered in the catalog."""

    id: int
    #: Writer name — displayed in UPPERCASE per Undercore convention.
    name: str
    #: IPI (Interested Parties Information) number — None if not registered.
    ipi: Optional[str]
    #: Performing Rights Organization affiliation (e.g. ASCAP, BMI, SESAC).
    pro_affiliation: Optional[str]
    created_at: str

    @classmethod
    def _from_dict(cls, data: dict) -> "Writer":
        return cls(
            id=int(data["id"]),
            name=str(data["name"]),
            ipi=data.get("ipi"),
            pro_affiliation=data.get("pro_affiliation"),
            created_at=str(data.get("created_at", "")),
        )


# ── Paginated responses ─────────────────────────────────────────


@dataclass
class WorksResponse:
    """Paginated list of works."""

    works: List[Work]
    page: int
    per_page: int
    total: int

    @classmethod
    def _from_dict(cls, data: dict) -> "WorksResponse":
        return cls(
            works=[Work._from_dict(w) for w in data.get("works", [])],
            page=int(data.get("page", 1)),
            per_page=int(data.get("per_page", 50)),
            total=int(data.get("total", 0)),
        )


@dataclass
class WritersResponse:
    """Paginated list of writers."""

    writers: List[Writer]
    page: int
    per_page: int
    total: int

    @classmethod
    def _from_dict(cls, data: dict) -> "WritersResponse":
        return cls(
            writers=[Writer._from_dict(w) for w in data.get("writers", [])],
            page=int(data.get("page", 1)),
            per_page=int(data.get("per_page", 50)),
            total=int(data.get("total", 0)),
        )
