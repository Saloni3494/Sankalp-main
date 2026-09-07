from pydantic import BaseModel
from typing import Optional

class ReviewRequest(BaseModel):
    status: str
    outcome: str

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    name: str
    role: str
    role_title: Optional[str] = None
    assigned_scope: Optional[str] = None
    designation: Optional[str] = None
    jurisdiction: Optional[str] = None
    department: Optional[str] = None
    avatar_initials: Optional[str] = "MP"

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    user: UserResponse

class CertificateVerifyRequest(BaseModel):
    work_id: str
    certificate_hash: str

class CertificateVerifyResponse(BaseModel):
    valid: bool
    tamper_evident: bool
    computed_hash: str
    submitted_hash: str
    integrity_score: int
    message: str
    block_number: int
    verified_at: str

