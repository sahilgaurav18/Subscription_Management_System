import math
from typing import TypeVar, Dict, Any
from sqlalchemy.orm import Query

T = TypeVar("T")


def paginate_query(query: Query, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 20
    if page_size > 100:
        page_size = 100

    total = query.order_by(None).count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }

