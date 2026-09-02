from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, JSON, Enum, UniqueConstraint, ForeignKey
from .database import Base
import enum
from datetime import datetime

class ParliamentHouse(str, enum.Enum):
    LOK_SABHA = "Lok Sabha"
    RAJYA_SABHA = "Rajya Sabha"

class InvestigationStatus(str, enum.Enum):
    UNREVIEWED = "UNREVIEWED"
    REVIEWED = "REVIEWED"
    INVESTIGATION_OPEN = "INVESTIGATION_OPEN"
    INVESTIGATION_CLOSED = "INVESTIGATION_CLOSED"

class InvestigationOutcome(str, enum.Enum):
    UNKNOWN_NONE = "UNKNOWN/NONE"
    CLEARED = "CLEARED"
    INCONCLUSIVE = "INCONCLUSIVE"
    IRREGULARITY_CONFIRMED = "IRREGULARITY_CONFIRMED"

class Work(Base):
    __tablename__ = "works"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    parliament_house = Column(String, index=True)
    work_id = Column(String, index=True)
    
    work_category = Column(String)
    state = Column(String)
    ida = Column(String)
    mp_name = Column(String)
    constituency = Column(String)
    work_description = Column(String)
    
    recommended_date = Column(DateTime, nullable=True)
    sanction_date = Column(DateTime, nullable=True)
    completion_date = Column(DateTime, nullable=True)
    
    sanction_amount = Column(Float, nullable=True)
    amount_disbursed = Column(Float, nullable=True)
    
    lifecycle_coverage = Column(String)
    missing_photo = Column(Boolean)
    
    vendor_count = Column(Integer, default=0)
    payment_count = Column(Integer, default=0)
    
    # Store evidence JSON and risk score
    risk_score = Column(Float, default=0)
    evidence = Column(JSON, default=list)
    evidence_count = Column(Integer, default=0)
    data_completeness = Column(Float, default=0)
    
    # Investigation Workflow
    investigation_status = Column(Enum(InvestigationStatus), default=InvestigationStatus.UNREVIEWED)
    investigation_outcome = Column(Enum(InvestigationOutcome), default=InvestigationOutcome.UNKNOWN_NONE)
    
    # Provenance
    event_time = Column(DateTime, nullable=True)
    available_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint('parliament_house', 'work_id', name='uq_house_work_id'),
    )

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    parliament_house = Column(String, index=True)
    work_id = Column(String, index=True)
    vendor_name = Column(String)
    payment_amount = Column(Float)
    payment_date = Column(DateTime, nullable=True)
    event_time = Column(DateTime, nullable=True)
    available_at = Column(DateTime, nullable=True)
    
class Vendor(Base):
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    raw_name = Column(String, index=True)
    normalized_name = Column(String, index=True)
    resolution_confidence = Column(Float, default=1.0)
