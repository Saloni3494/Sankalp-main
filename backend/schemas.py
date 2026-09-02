from pydantic import BaseModel
from typing import Optional

class ReviewRequest(BaseModel):
    status: str
    outcome: str
