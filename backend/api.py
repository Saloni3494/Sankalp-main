"""
FastAPI backend for MPLADS Sentinel.
"""
import json, os, hashlib, secrets
from typing import Optional, List
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException, Query, Depends, Security, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func, text

from db.database import get_db, engine, Base, SessionLocal
from db.models import Work, Payment, InvestigationStatus, InvestigationOutcome, User
from schemas import ReviewRequest, LoginRequest, UserResponse, LoginResponse

# Ensure DB is created
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MPLADS Sentinel API")

allowed_origins_raw = os.environ.get("ALLOWED_ORIGINS", "*")
if allowed_origins_raw.strip() == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def get_api_key(api_key: str = Security(api_key_header)):
    # Very simple static key for hackathon/prototype protection of sensitive endpoints
    if api_key != "sankalp-admin-key":
        raise HTTPException(status_code=403, detail="Invalid or missing API Key")
    return api_key

# --- AUTHENTICATION & SECURITY ---
ACTIVE_SESSIONS: dict[str, int] = {}
bearer_scheme = HTTPBearer(auto_error=False)

def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return pwd_hash, salt

def verify_password(password: str, salt: str, hashed: str) -> bool:
    pwd_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(pwd_hash, hashed)

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    if not credentials:
        return None
    token = credentials.credentials
    user_id = ACTIVE_SESSIONS.get(token)
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id).first()

DEMO_ACCOUNTS = [
    {
        "username": "mospi_auditor",
        "email": "auditor@mospi.gov.in",
        "password": "auditor123",
        "name": "Dr. Priya Deshmukh",
        "role": "mospi_auditor",
        "role_title": "MoSPI Auditor",
        "assigned_scope": "All India",
        "designation": "Central Compliance & Vigilance Auditor, MoSPI",
        "jurisdiction": "All India (All States & UTs)",
        "department": "Ministry of Statistics & Programme Implementation",
        "avatar_initials": "MA"
    },
    {
        "username": "state_nodal",
        "email": "state.nodal@gov.in",
        "password": "state123",
        "name": "K. Vijayalakshmi, IAS",
        "role": "state_nodal_authority",
        "role_title": "State Nodal Authority",
        "assigned_scope": "Assigned State",
        "designation": "State Nodal Officer & Secretary (Planning)",
        "jurisdiction": "Assigned State: Maharashtra",
        "department": "State Planning & Development Department",
        "avatar_initials": "SN"
    },
    {
        "username": "district_authority",
        "email": "district.authority@mplads.gov.in",
        "password": "district123",
        "name": "S. Ranganathan, IAS",
        "role": "district_authority",
        "role_title": "District Authority",
        "assigned_scope": "Assigned District",
        "designation": "District Collector & District Authority",
        "jurisdiction": "Assigned District: South Delhi",
        "department": "District Collectorate & Planning Cell",
        "avatar_initials": "DA"
    },
    {
        "username": "mp_representative",
        "email": "mp.rep@sansad.nic.in",
        "password": "mp123",
        "name": "Rajesh Sharma, MP Delegate",
        "role": "mp_representative",
        "role_title": "MP Representative",
        "assigned_scope": "Assigned MP / relevant works",
        "designation": "Member of Parliament Representative",
        "jurisdiction": "Assigned MP: Rajesh Sharma (Lok Sabha - Patna Sahib)",
        "department": "Parliament of India (Sansad)",
        "avatar_initials": "MP"
    }
]

def seed_users_if_needed(db: Session):
    try:
        db.execute(text("ALTER TABLE users ADD COLUMN role_title VARCHAR"))
    except Exception:
        pass
    try:
        db.execute(text("ALTER TABLE users ADD COLUMN assigned_scope VARCHAR"))
    except Exception:
        pass
    db.commit()

    for acc in DEMO_ACCOUNTS:
        existing = db.query(User).filter((User.email == acc["email"]) | (User.username == acc["username"])).first()
        pwd_hash, salt = hash_password(acc["password"])
        if not existing:
            user = User(
                username=acc["username"],
                email=acc["email"],
                hashed_password=pwd_hash,
                salt=salt,
                name=acc["name"],
                role=acc["role"],
                role_title=acc["role_title"],
                assigned_scope=acc["assigned_scope"],
                designation=acc["designation"],
                jurisdiction=acc["jurisdiction"],
                department=acc["department"],
                avatar_initials=acc["avatar_initials"]
            )
            db.add(user)
        else:
            existing.name = acc["name"]
            existing.role = acc["role"]
            existing.role_title = acc["role_title"]
            existing.assigned_scope = acc["assigned_scope"]
            existing.designation = acc["designation"]
            existing.jurisdiction = acc["jurisdiction"]
            existing.department = acc["department"]
            existing.avatar_initials = acc["avatar_initials"]
            existing.hashed_password = pwd_hash
            existing.salt = salt
    db.commit()

# Seed default users
try:
    with SessionLocal() as _db:
        seed_users_if_needed(_db)
except Exception as e:
    print(f"Error seeding demo users: {e}")

@app.post("/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    ident = payload.username_or_email.strip().lower()
    user = db.query(User).filter(
        (func.lower(User.email) == ident) | (func.lower(User.username) == ident)
    ).first()
    
    if not user or not verify_password(payload.password, user.salt, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid government email/username or password. Please verify your credentials."
        )
    
    token = f"sankalp_sec_{secrets.token_urlsafe(32)}"
    ACTIVE_SESSIONS[token] = user.id
    
    return LoginResponse(
        token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@app.get("/auth/me", response_model=UserResponse)
def get_me(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme), db: Session = Depends(get_db)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication token required")
    token = credentials.credentials
    user_id = ACTIVE_SESSIONS.get(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    return UserResponse.model_validate(user)

@app.get("/auth/demo-users")
def get_demo_users():
    return DEMO_ACCOUNTS

@app.post("/auth/logout")
def logout(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)):
    if credentials and credentials.credentials in ACTIVE_SESSIONS:
        del ACTIVE_SESSIONS[credentials.credentials]
    return {"status": "logged_out", "message": "Session successfully terminated"}


@app.get("/")
def root():
    return {"status": "ok", "service": "MPLADS Sentinel API"}

@app.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    total = db.query(Work).count()
    if total == 0:
        raise HTTPException(status_code=503, detail="Database empty. Run the pipeline first.")
    
    flagged = db.query(Work).filter(Work.risk_score > 0).count()
    high_risk = db.query(Work).filter(Work.risk_score >= 50).count()
    
    amount_at_risk = db.query(func.sum(Work.amount_disbursed)).filter(Work.risk_score >= 50).scalar() or 0
    missing_photo = db.query(Work).filter(Work.missing_photo == True).count()
    
    ls_count = db.query(Work).filter(Work.parliament_house == "Lok Sabha").count()
    rs_count = db.query(Work).filter(Work.parliament_house == "Rajya Sabha").count()
    
    return {
        "total_works": total,
        "flagged_works": flagged,
        "high_risk_works": high_risk,
        "total_amount_at_risk": amount_at_risk,
        "missing_photo_count": missing_photo,
        "by_house": {
            "Lok Sabha": {"count": ls_count},
            "Rajya Sabha": {"count": rs_count}
        }
    }

@app.get("/works")
def get_works(
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    min_risk: float = Query(0, ge=0, le=100),
    house: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    flagged_only: bool = Query(False),
    sort_by: str = Query("risk_score"),
    asc: bool = Query(False),
    db: Session = Depends(get_db)
):
    query = db.query(Work)
    
    if min_risk > 0:
        query = query.filter(Work.risk_score >= min_risk)
    if flagged_only:
        query = query.filter(Work.risk_score > 0)
    if house:
        query = query.filter(Work.parliament_house == house)
    if state:
        query = query.filter(Work.state == state)
        
    total = query.count()
    
    sort_map = {
        "id": Work.work_id,
        "sanctionedL": Work.sanction_amount,
        "spentL": Work.amount_disbursed,
        "progress": Work.amount_disbursed,
        "riskScore": Work.risk_score
    }
    sort_col = sort_map.get(sort_by, Work.risk_score)
    if asc:
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())
        
    works = query.offset(offset).limit(limit).all()
    
    # Convert to dict to match old frontend contract
    results = []
    for w in works:
        results.append({
            "work_id": w.work_id,
            "parliament_house": w.parliament_house,
            "work_category": w.work_category,
            "state": w.state,
            "ida": w.ida,
            "mp_name": w.mp_name,
            "constituency": w.constituency,
            "work_description": w.work_description,
            "risk_score": w.risk_score,
            "evidence": w.evidence,
            "amount_disbursed": w.amount_disbursed,
            "sanction_amount": w.sanction_amount,
            "missing_photo": w.missing_photo,
            "investigation_status": w.investigation_status,
        })

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "results": results,
    }

@app.get("/works/{work_id:path}/investigate")
def investigate_work(work_id: str, house: Optional[str] = None, db: Session = Depends(get_db)):
    """Use Groq LLM to generate an AI investigation brief for a specific work."""
    query = db.query(Work).filter(Work.work_id == work_id)
    if house:
        query = query.filter(Work.parliament_house == house)
    w = query.first()
    if not w:
        raise HTTPException(404, detail=f"Work {work_id} not found")

    # Gather vendors using column-specific query (payment_date may not exist in DB)
    vendor_rows = db.query(Payment.vendor_name, Payment.payment_amount).filter(Payment.work_id == work_id).all()
    vendor_totals = {}
    for v_name, v_amount in vendor_rows:
        if v_name:
            vendor_totals[v_name] = vendor_totals.get(v_name, 0) + (v_amount or 0)

    evidence_list = w.evidence if isinstance(w.evidence, list) else []

    context = {
        "work_id": w.work_id,
        "description": w.work_description,
        "category": w.work_category,
        "state": w.state,
        "constituency": w.constituency,
        "mp_name": w.mp_name,
        "sanction_amount": w.sanction_amount,
        "amount_disbursed": w.amount_disbursed,
        "risk_score": w.risk_score,
        "evidence_flags": evidence_list,
        "missing_photo": w.missing_photo,
        "lifecycle_coverage": w.lifecycle_coverage,
        "data_completeness": w.data_completeness,
        "recommended_date": str(w.recommended_date) if w.recommended_date else None,
        "sanction_date": str(w.sanction_date) if w.sanction_date else None,
        "completion_date": str(w.completion_date) if w.completion_date else None,
        "vendors": [{"name": k, "total_paid": v} for k, v in vendor_totals.items()],
        "investigation_status": w.investigation_status.value if w.investigation_status else None,
    }

    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(500, detail="GROQ_API_KEY not configured")

    try:
        from groq import Groq
        client = Groq(api_key=groq_key)

        system_prompt = """You are an expert MPLADS (Member of Parliament Local Area Development Scheme) compliance auditor AI.
Analyze the provided project data and return ONLY a valid JSON object with these exact keys:

1. "recommended_action": {
   "title": string (brief action title),
   "reason": string (1-2 sentence explanation why this action is needed based on the evidence),
   "priority": "High" | "Medium" | "Low"
}

2. "risk_genome": [
   {"name": "Timeline", "score": 0-100, "color": "bg-danger" | "bg-warning" | "bg-india-green"},
   {"name": "Financial", "score": 0-100, "color": ...},
   {"name": "Documentation", "score": 0-100, "color": ...},
   {"name": "Vendor", "score": 0-100, "color": ...},
   {"name": "Compliance", "score": 0-100, "color": ...},
   {"name": "Duplicate", "score": 0-100, "color": ...}
]
For color: score >= 60 = "bg-danger", 30-59 = "bg-warning", < 30 = "bg-india-green"

3. "other_actions": [string, string, string, string] (4 alternative investigation actions)

4. "investigation_steps": [
   {"name": string, "status": "Completed" | "Running" | "Needs Evidence" | "Pending"}
] (5-7 investigation pipeline steps with realistic statuses based on available data)

5. "investigation_brief": string (3-4 sentence professional summary of findings)

6. "primary_risk_dimensions": string (1 sentence describing which dimensions drive the risk)

Return ONLY valid JSON. No markdown, no explanation."""

        response = client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Analyze this MPLADS project:\n{json.dumps(context, default=str)}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=1200
        )

        result = json.loads(response.choices[0].message.content)
        result["source"] = "groq-qwen3.8-27b"
        result["vendors"] = [{"name": k, "total_paid": v} for k, v in vendor_totals.items()]
        result["mp_name"] = w.mp_name
        return result

    except Exception as e:
        # Fallback: rule-based response if Groq fails
        has_timeline = any("date" in str(ev).lower() or "before" in str(ev).lower() or "after" in str(ev).lower() for ev in evidence_list)
        has_financial = any("exceeds" in str(ev).lower() or "amount" in str(ev).lower() for ev in evidence_list)
        has_missing = w.missing_photo or False

        return {
            "source": "fallback-rule-based",
            "recommended_action": {
                "title": "Review flagged evidence" if evidence_list else "No action needed",
                "reason": evidence_list[0] if evidence_list else "Project has no risk flags.",
                "priority": "High" if w.risk_score >= 60 else "Medium" if w.risk_score >= 30 else "Low"
            },
            "risk_genome": [
                {"name": "Timeline", "score": 80 if has_timeline else 10, "color": "bg-danger" if has_timeline else "bg-india-green"},
                {"name": "Financial", "score": 75 if has_financial else 10, "color": "bg-danger" if has_financial else "bg-india-green"},
                {"name": "Documentation", "score": 70 if has_missing else 10, "color": "bg-danger" if has_missing else "bg-india-green"},
                {"name": "Vendor", "score": min(50, len(vendor_totals) * 15), "color": "bg-warning" if len(vendor_totals) > 2 else "bg-india-green"},
                {"name": "Compliance", "score": int((1 - (w.data_completeness or 0)) * 100), "color": "bg-warning" if (w.data_completeness or 0) < 0.7 else "bg-india-green"},
                {"name": "Duplicate", "score": 10, "color": "bg-india-green"}
            ],
            "other_actions": ["Review payment records", "Compare similar works", "Verify vendor information", "Escalate for investigation"],
            "investigation_steps": [
                {"name": "Risk Analysis", "status": "Completed"},
                {"name": "Financial Check", "status": "Completed" if has_financial else "Pending"},
                {"name": "Timeline Audit", "status": "Completed" if has_timeline else "Pending"},
                {"name": "Vendor Check", "status": "Completed" if vendor_totals else "Needs Evidence"},
                {"name": "Documentation Check", "status": "Needs Evidence" if has_missing else "Completed"},
                {"name": "Investigation Brief", "status": "Pending"}
            ],
            "investigation_brief": f"Project {w.work_id} in {w.state} has a risk score of {w.risk_score}. {'Evidence flags: ' + ', '.join(evidence_list[:3]) + '.' if evidence_list else 'No anomalies detected.'}",
            "primary_risk_dimensions": "Rule-based fallback - Groq API unavailable.",
            "vendors": [{"name": k, "total_paid": v} for k, v in vendor_totals.items()],
            "mp_name": w.mp_name,
            "error": str(e)
        }

@app.get("/works/{work_id:path}")
def get_work(work_id: str, house: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Work).filter(Work.work_id == work_id)
    if house:
        query = query.filter(Work.parliament_house == house)
    
    work = query.first()
    if not work:
        raise HTTPException(status_code=404, detail=f"Work {work_id} not found")
        
    return {
        "work_id": work.work_id,
        "parliament_house": work.parliament_house,
        "work_category": work.work_category,
        "state": work.state,
        "ida": work.ida,
        "mp_name": work.mp_name,
        "constituency": work.constituency,
        "work_description": work.work_description,
        "risk_score": work.risk_score,
        "evidence": work.evidence,
        "amount_disbursed": work.amount_disbursed,
        "sanction_amount": work.sanction_amount,
        "recommended_date": work.recommended_date,
        "sanction_date": work.sanction_date,
        "completion_date": work.completion_date,
        "missing_photo": work.missing_photo,
        "investigation_status": work.investigation_status.value if work.investigation_status else None,
        "investigation_outcome": work.investigation_outcome.value if work.investigation_outcome else None,
        "vendor_count": work.vendor_count,
        "payment_count": work.payment_count,
        "data_completeness": work.data_completeness,
        "lifecycle_coverage": work.lifecycle_coverage
    }

# New Endpoints required by V7 Spec

@app.get("/works/{work_id:path}/lifecycle")
def get_work_lifecycle(work_id: str, house: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Work).filter(Work.work_id == work_id)
    if house: query = query.filter(Work.parliament_house == house)
    w = query.first()
    if not w: raise HTTPException(404)
    return {
        "recommended_date": w.recommended_date,
        "sanction_date": w.sanction_date,
        "completion_date": w.completion_date,
        "lifecycle_coverage": w.lifecycle_coverage
    }

@app.get("/works/{work_id:path}/payments")
def get_work_payments(work_id: str, house: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Payment).filter(Payment.work_id == work_id)
    if house: query = query.filter(Payment.parliament_house == house)
    payments = query.all()
    return [{"vendor_name": p.vendor_name, "payment_amount": p.payment_amount, "payment_date": p.payment_date} for p in payments]

@app.get("/works/{work_id:path}/vendors")
def get_work_vendors(work_id: str, house: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Payment.vendor_name, func.sum(Payment.payment_amount).label("total")).filter(Payment.work_id == work_id)
    if house: query = query.filter(Payment.parliament_house == house)
    vendors = query.group_by(Payment.vendor_name).all()
    return [{"vendor_name": v[0], "total_paid": v[1]} for v in vendors if v[0]]

@app.get("/works/{work_id:path}/evidence")
def get_work_evidence(work_id: str, house: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Work).filter(Work.work_id == work_id)
    if house: query = query.filter(Work.parliament_house == house)
    w = query.first()
    if not w: raise HTTPException(404)
    return {"evidence": w.evidence, "evidence_count": w.evidence_count, "data_completeness": w.data_completeness}

@app.post("/investigations/{work_id:path}/review")
def review_work(work_id: str, req: ReviewRequest, house: Optional[str] = None, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    query = db.query(Work).filter(Work.work_id == work_id)
    if house: query = query.filter(Work.parliament_house == house)
    w = query.first()
    if not w: raise HTTPException(404)
    
    try:
        w.investigation_status = InvestigationStatus(req.status)
        w.investigation_outcome = InvestigationOutcome(req.outcome)
        db.commit()
    except ValueError:
        raise HTTPException(400, "Invalid status or outcome")
        
    return {"status": "success", "work_id": w.work_id, "investigation_status": w.investigation_status}

@app.get("/risk/works/{work_id:path}")
def get_risk_work(work_id: str, house: Optional[str] = None, db: Session = Depends(get_db)):
    return get_work_evidence(work_id, house, db)

@app.get("/analytics/states")
def get_analytics_states(db: Session = Depends(get_db)):
    query = db.query(Work.state, func.count(Work.id), func.avg(Work.risk_score)).group_by(Work.state).all()
    return [{"state": r[0], "count": r[1], "avg_risk": r[2]} for r in query if r[0]]

@app.get("/analytics/funds")
def get_analytics_funds(house: Optional[str] = Query(None), db: Session = Depends(get_db)):
    # Base query for totals
    query_total = db.query(
        func.sum(Work.sanction_amount).label("total_sanctioned"),
        func.sum(Work.amount_disbursed).label("total_expenditure")
    )
    if house and house != "All Houses":
        query_total = query_total.filter(Work.parliament_house == house)
    
    totals = query_total.first()
    
    # Base query for state-wise
    query_states = db.query(
        Work.state,
        func.sum(Work.sanction_amount).label("sanctioned"),
        func.sum(Work.amount_disbursed).label("expenditure")
    ).group_by(Work.state)
    
    if house and house != "All Houses":
        query_states = query_states.filter(Work.parliament_house == house)
        
    state_funds = query_states.all()
    
    state_data = []
    for r in state_funds:
        if not r.state:
            continue
        sanc = r.sanctioned or 0
        exp = r.expenditure or 0
        utilization = (exp / sanc * 100) if sanc > 0 else 0
        state_data.append({
            "state": r.state,
            "sanctioned": sanc,
            "expenditure": exp,
            "utilization": round(utilization, 2)
        })
    
    return {
        "totals": {
            "sanctioned": totals.total_sanctioned or 0,
            "expenditure": totals.total_expenditure or 0,
            "utilization": round(((totals.total_expenditure or 0) / (totals.total_sanctioned or 1)) * 100, 2) if totals.total_sanctioned else 0
        },
        "state_data": sorted(state_data, key=lambda x: x["sanctioned"], reverse=True)
    }

@app.get("/analytics/insights")
def get_analytics_insights(house: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Work)
    if house and house != "All Houses":
        query = query.filter(Work.parliament_house == house)
        
    works = query.all()
    
    total_works = len(works)
    if total_works == 0:
        return {"error": "No works found"}
        
    high_priority = sum(1 for w in works if w.risk_score >= 50)
    avg_risk = sum(w.risk_score for w in works) / total_works
    
    # Data completeness average (ignoring nulls)
    completeness_vals = [w.data_completeness for w in works if w.data_completeness is not None]
    avg_completeness = sum(completeness_vals) / len(completeness_vals) if completeness_vals else 0
    
    # Evidence Signals
    signals = {
        "Financial": 0,
        "Lifecycle": 0,
        "Duplicate": 0,
        "Rule-Based / ML Anomaly": 0,
        "Missing Evidence": 0
    }
    
    # Risk Bands
    risk_bands = {
        "Low (0-24)": 0,
        "Medium (25-49)": 0,
        "High (50-74)": 0,
        "Critical (75-100)": 0
    }
    
    strong_evidence_works = 0
    
    for w in works:
        score = w.risk_score or 0
        if score < 25: risk_bands["Low (0-24)"] += 1
        elif score < 50: risk_bands["Medium (25-49)"] += 1
        elif score < 75: risk_bands["High (50-74)"] += 1
        else: risk_bands["Critical (75-100)"] += 1
        
        if (w.evidence_count or 0) >= 2:
            strong_evidence_works += 1
            
        evidences = w.evidence if isinstance(w.evidence, list) else []
        for e in evidences:
            e_lower = str(e).lower()
            if "amount" in e_lower or "value" in e_lower or "utilized" in e_lower:
                signals["Financial"] += 1
            elif "date" in e_lower or "completion" in e_lower or "delayed" in e_lower:
                signals["Lifecycle"] += 1
            elif "duplicate" in e_lower or "matches" in e_lower:
                signals["Duplicate"] += 1
            elif "photo" in e_lower:
                signals["Missing Evidence"] += 1
            else:
                signals["Rule-Based / ML Anomaly"] += 1

    # Top Works
    top_works = sorted([w for w in works if w.risk_score > 0], key=lambda x: x.risk_score, reverse=True)[:15]
    top_works_data = []
    for w in top_works:
        top_works_data.append({
            "work_id": w.work_id,
            "house": w.parliament_house,
            "risk_score": w.risk_score,
            "evidence_count": w.evidence_count,
            "data_completeness": w.data_completeness,
            "top_factors": w.evidence[:2] if isinstance(w.evidence, list) else []
        })

    signal_array = [{"name": k, "count": v} for k, v in signals.items() if v > 0]
    band_array = [{"name": k, "count": v} for k, v in risk_bands.items()]

    return {
        "total_works": total_works,
        "high_priority_count": high_priority,
        "strong_evidence_works": strong_evidence_works,
        "average_risk_score": round(avg_risk, 2),
        "average_data_completeness": round(avg_completeness * 100, 2),
        "evidence_signals": sorted(signal_array, key=lambda x: x["count"], reverse=True),
        "risk_bands": band_array,
        "top_works": top_works_data
    }

@app.get("/analytics/compliance")
def get_analytics_compliance(house: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Work)
    if house and house != "All Houses":
        query = query.filter(Work.parliament_house == house)
        
    works = query.all()
    
    total_works = len(works)
    if total_works == 0:
        return {"error": "No works found"}
        
    stats = {
        "rule_exceptions": 0,
        "missing_evidence": 0,
        "requires_review": 0,
        "financial_exceptions": {
            "Expenditure > Sanction": 0,
            "Amount Inconsistencies": 0
        },
        "timeline_exceptions": {
            "Completion before sanction": 0,
            "Recommendation after sanction": 0,
            "Impossible dates": 0
        },
        "lifecycle": {},
        "workflow": {},
        "data_quality": {
            "Photo Availability": 0,
            "Insufficient Evidence": 0
        }
    }
    
    action_queue = []
    
    completeness_vals = [w.data_completeness for w in works if w.data_completeness is not None]
    avg_completeness = sum(completeness_vals) / len(completeness_vals) if completeness_vals else 0

    for w in works:
        # Lifecycle
        lc = w.lifecycle_coverage or "UNKNOWN_DUE_TO_COVERAGE"
        stats["lifecycle"][lc] = stats["lifecycle"].get(lc, 0) + 1
        
        # Workflow
        wf = w.investigation_status.value if w.investigation_status else "UNREVIEWED"
        stats["workflow"][wf] = stats["workflow"].get(wf, 0) + 1
        
        if wf == "UNREVIEWED" and w.risk_score and w.risk_score >= 50:
            stats["requires_review"] += 1
            
        if w.missing_photo:
            stats["missing_evidence"] += 1
            stats["data_quality"]["Photo Availability"] += 1
            
        evidences = w.evidence if isinstance(w.evidence, list) else []
        has_rule_exception = False
        exception_types = []
        
        for e in evidences:
            e_lower = str(e).lower()
            if "exceeds sanctioned" in e_lower or "expenditure > sanction" in e_lower:
                stats["financial_exceptions"]["Expenditure > Sanction"] += 1
                has_rule_exception = True
                exception_types.append("Expenditure > Sanction")
            elif "invalid amount" in e_lower or "negative" in e_lower:
                stats["financial_exceptions"]["Amount Inconsistencies"] += 1
                has_rule_exception = True
                exception_types.append("Amount Inconsistency")
                
            if "completed before" in e_lower:
                stats["timeline_exceptions"]["Completion before sanction"] += 1
                has_rule_exception = True
                exception_types.append("Timeline Reversal")
            elif "recommended after" in e_lower:
                stats["timeline_exceptions"]["Recommendation after sanction"] += 1
                has_rule_exception = True
                exception_types.append("Recommendation Reversal")
            elif "impossible date" in e_lower:
                stats["timeline_exceptions"]["Impossible dates"] += 1
                has_rule_exception = True
                exception_types.append("Impossible Dates")
                
        if has_rule_exception:
            stats["rule_exceptions"] += 1
            
        if w.evidence_count and w.evidence_count < 2 and w.risk_score and w.risk_score > 0:
            stats["data_quality"]["Insufficient Evidence"] += 1
            
        if has_rule_exception or w.missing_photo or (w.data_completeness and w.data_completeness < 0.5):
            action_queue.append({
                "work_id": w.work_id,
                "house": w.parliament_house,
                "exception_type": exception_types[0] if exception_types else ("Missing Evidence" if w.missing_photo else "Low Data Completeness"),
                "evidence_count": w.evidence_count,
                "data_completeness": w.data_completeness,
                "investigation_status": wf,
                "has_rule_exception": has_rule_exception,
                "risk_score": w.risk_score or 0
            })

    # Sort queue: Rule exceptions first, then high risk, then low completeness
    action_queue = sorted(action_queue, key=lambda x: (not x["has_rule_exception"], -x["risk_score"], x["data_completeness"] or 1))[:15]
    
    # Format charts
    lifecycle_chart = [{"name": k, "count": v} for k, v in stats["lifecycle"].items()]
    workflow_chart = [{"name": k, "count": v} for k, v in stats["workflow"].items()]
    financial_chart = [{"name": k, "count": v} for k, v in stats["financial_exceptions"].items() if v > 0]
    timeline_chart = [{"name": k, "count": v} for k, v in stats["timeline_exceptions"].items() if v > 0]
    quality_chart = [{"name": k, "count": v} for k, v in stats["data_quality"].items() if v > 0]

    return {
        "kpis": {
            "rule_exceptions": stats["rule_exceptions"],
            "missing_evidence": stats["missing_evidence"],
            "average_completeness": round(avg_completeness * 100, 2),
            "requires_review": stats["requires_review"]
        },
        "lifecycle_coverage": lifecycle_chart,
        "investigation_workflow": workflow_chart,
        "financial_compliance": financial_chart,
        "timeline_compliance": timeline_chart,
        "data_quality": quality_chart,
        "action_queue": action_queue
    }

@app.get("/analytics/dashboard")
def get_analytics_dashboard(house: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Work)
    if house and house != "All Houses":
        query = query.filter(Work.parliament_house == house)
    works = query.all()

    risk_dist = {"Low risk": 0, "Medium risk": 0, "High risk": 0, "Safe": 0}
    risk_factors = {}
    categories = {
        "Timeline Anomalies": 0,
        "Financial Irregularities": 0,
        "Compliance Exceptions": 0,
        "Vendor/Execution Risks": 0
    }
    alerts = []

    for w in works:
        if w.risk_score >= 60:
            risk_dist["High risk"] += 1
        elif w.risk_score >= 30:
            risk_dist["Medium risk"] += 1
        elif w.risk_score > 0:
            risk_dist["Low risk"] += 1
        else:
            risk_dist["Safe"] += 1

        evidence_list = w.evidence if isinstance(w.evidence, list) else []
        has_timeline = False
        has_financial = False
        has_compliance = False
        has_vendor = False

        top_evidence = ""
        for e in evidence_list:
            e_str = str(e).lower()
            risk_factors[e] = risk_factors.get(e, 0) + 1
            if not top_evidence:
                top_evidence = str(e)
            
            if "date" in e_str or "timeline" in e_str or "before" in e_str or "after" in e_str or "impossible" in e_str:
                has_timeline = True
            if "exceeds" in e_str or "amount" in e_str or "cost" in e_str or "financial" in e_str or "negative" in e_str:
                has_financial = True
            if "compliance" in e_str or "missing" in e_str or "bypass" in e_str:
                has_compliance = True
            if "vendor" in e_str or "execution" in e_str or "payment" in e_str:
                has_vendor = True
        
        if has_timeline: categories["Timeline Anomalies"] += 1
        if has_financial: categories["Financial Irregularities"] += 1
        if has_compliance: categories["Compliance Exceptions"] += 1
        if has_vendor: categories["Vendor/Execution Risks"] += 1

        if w.risk_score >= 60:
            alerts.append({
                "id": w.work_id,
                "projectId": w.work_id,
                "title": top_evidence or "High risk detected",
                "project": w.work_description or w.work_id,
                "level": "High",
                "confidence": min(99, int(w.risk_score)),
                "action": "Investigate",
                "facts": [
                    {"label": "State", "value": w.state},
                    {"label": "Completeness", "value": f"{int((w.data_completeness or 0)*100)}%"}
                ]
            })

    total = max(len(works), 1)
    dist_chart = [
        {"name": "Safe", "value": round(risk_dist["Safe"]/total*100), "color": "#2F6B3F"},
        {"name": "Low risk", "value": round(risk_dist["Low risk"]/total*100), "color": "#fcd34d"},
        {"name": "Medium risk", "value": round(risk_dist["Medium risk"]/total*100), "color": "#fb923c"},
        {"name": "High risk", "value": round(risk_dist["High risk"]/total*100), "color": "#C94F22"},
    ]

    sorted_factors = sorted(risk_factors.items(), key=lambda x: x[1], reverse=True)[:5]
    factors_chart = [{"name": k, "value": round(v/total*100)} for k, v in sorted_factors]

    alerts = sorted(alerts, key=lambda x: x["confidence"], reverse=True)[:5]

    cat_cards = [
        {"key": "timeline", "title": "Timeline Anomalies", "count": categories["Timeline Anomalies"], "blurb": "Projects starting before sanction or with impossible dates."},
        {"key": "financial", "title": "Financial Irregularities", "count": categories["Financial Irregularities"], "blurb": "Disbursements exceeding sanctions or unusual spikes."},
        {"key": "compliance", "title": "Compliance Exceptions", "count": categories["Compliance Exceptions"], "blurb": "Missing vital documentation or violating core workflows."},
        {"key": "vendor", "title": "Vendor/Execution Risks", "count": categories["Vendor/Execution Risks"], "blurb": "Suspicious vendor concentrations or payment anomalies."}
    ]

    return {
        "risk_distribution": dist_chart,
        "risk_factors": factors_chart,
        "risk_categories": cat_cards,
        "alerts": alerts
    }

@app.get("/analytics/states/{state_name}")
def get_analytics_state_summary(state_name: str, house: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Work).filter(func.lower(Work.state) == state_name.lower())
    if house and house != "All Houses":
        query = query.filter(Work.parliament_house == house)
    
    works = query.all()
    projects = len(works)
    sanctioned = sum((w.sanction_amount or 0) for w in works)
    spent = sum((w.amount_disbursed or 0) for w in works)
    high_risk = sum(1 for w in works if w.risk_score and w.risk_score >= 60)
    
    delayed = 0
    for w in works:
        evidences = w.evidence if isinstance(w.evidence, list) else []
        if any("before" in str(e).lower() or "after" in str(e).lower() for e in evidences):
            delayed += 1

    utilization = round((spent / sanctioned * 100)) if sanctioned > 0 else 0
    avg_risk = sum(w.risk_score for w in works if w.risk_score) / max(projects, 1)
    risk_level = "High" if avg_risk >= 60 else "Medium" if avg_risk >= 30 else "Low"

    return {
        "name": state_name.title(),
        "projects": projects,
        "fundsUtilisedCr": round(spent / 10000000, 2),
        "highRisk": high_risk,
        "delayed": delayed,
        "utilisation": utilization,
        "risk": risk_level
    }

@app.post("/pipeline/run")
def rerun_pipeline(api_key: str = Depends(get_api_key)):
    """Re-run the pipeline with authentication."""
    from pipeline.run_pipeline import run
    try:
        # We can pass an optional prediction_time here if requested by frontend, but for now it uses today if None.
        master = run()
        return {"status": "ok", "total_works": len(master)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
