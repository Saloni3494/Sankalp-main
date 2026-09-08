"""
Phase 1 — House-Specific Schema Adapters.
Transforms house-specific raw CSV structures into canonical internal representations.
Enforces Rule 6: Rajya Sabha constituency = "UNAVAILABLE".
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Tuple
import pandas as pd
import numpy as np


UNAVAILABLE = "UNAVAILABLE"
UNKNOWN = "UNKNOWN"
NOT_OBSERVED = "NOT_OBSERVED"
NOT_APPLICABLE = "NOT_APPLICABLE"


class BaseHouseAdapter(ABC):
    """Abstract Base Class for House-Specific Schema Adapters."""

    def __init__(self, house_name: str):
        self.house_name = house_name

    @abstractmethod
    def adapt(self, df: pd.DataFrame, logical_dataset: str) -> pd.DataFrame:
        """Transforms raw DataFrame into canonical column schema."""
        pass


class LokSabhaAdapter(BaseHouseAdapter):
    """Adapter for Lok Sabha CSV datasets."""

    def __init__(self):
        super().__init__("LOK_SABHA")

    def adapt(self, df: pd.DataFrame, logical_dataset: str) -> pd.DataFrame:
        df = df.copy()

        if logical_dataset == "RECOMMENDED":
            col_map = {
                "Work category": "work_category",
                "WORK": "work_name_raw",
                "State": "state",
                "IDA": "ida",
                "Hon'ble Members of Parliament": "mp_name_raw",
                "Constituency": "constituency",
                "Work description": "work_description",
                "Recommended date": "recommended_date",
                "RECOMMENDED AMOUNT   ( ₹ )": "recommended_amount",
                "Sanction Date": "sanction_date",
            }
            df = df.rename(columns=col_map)
            df["elected_or_nominated"] = "Elected MP"

        elif logical_dataset == "SANCTIONED":
            col_map = {
                "Work category": "work_category",
                "Work": "work_name_raw",
                "State": "state",
                "IDA": "ida",
                "Hon'ble Members of Parliament": "mp_name_raw",
                "Constituency": "constituency",
                "Work description": "work_description",
                "Recommended date": "recommended_date",
                "Sanction Date": "sanction_date",
                "Sanction Amount ( ₹ )": "sanction_amount",
                "Work Status": "work_status",
            }
            df = df.rename(columns=col_map)
            df["elected_or_nominated"] = "Elected MP"

        elif logical_dataset == "COMPLETED":
            image_col = None
            for candidate in ["Image", "Images", "image", "images"]:
                if candidate in df.columns:
                    image_col = candidate
                    break
            if not image_col:
                raise ValueError(f"[{self.house_name}] COMPLETED dataset missing mandatory 'Image'/'Images' column.")

            col_map = {
                "Work Category": "work_category",
                "Work": "work_name_raw",
                "State": "state",
                "IDA": "ida",
                "Work Description": "work_description",
                "Hon'ble Members of Parliament": "mp_name_raw",
                "Constituency": "constituency",
                image_col: "image_path",
                "Completion Date": "completion_date",
                "Amount Disbursed ( ₹ )": "disbursed_amount",
            }
            df = df.rename(columns=col_map)
            df["elected_or_nominated"] = "Elected MP"

        elif logical_dataset == "EXPENDITURE":
            col_map = {
                "State": "state",
                "Work": "work_name_raw",
                "Work ID": "work_id_raw",
                "IDA": "ida",
                "Hon'ble Members of Parliament": "mp_name_raw",
                "Constituency": "constituency",
                "Expenditure Date": "expenditure_date",
                "Vendor Name": "vendor_name_raw",
                "Payment Status": "payment_status",
                "Fund Disbursed Amount ( ₹ )": "disbursed_amount",
            }
            df = df.rename(columns=col_map)
            df["elected_or_nominated"] = "Elected MP"

        elif logical_dataset == "ALLOCATION":
            col_map = {
                "State": "state",
                "Hon'ble Members of Parliaments": "mp_name_raw",
                "Constituency": "constituency",
                "Allocated AMOUNT ( ₹ )": "allocated_amount",
            }
            df = df.rename(columns=col_map)
            df["elected_or_nominated"] = "Elected MP"

        elif logical_dataset == "CALAMITY":
            col_map = {
                "Calamity Type": "calamity_type",
                "Calamity Name": "calamity_name",
                "Hon'ble Members of Parliament": "mp_name_raw",
                "Date of Consent": "recommended_date",
                "Consent Amount ( ₹ )": "consent_amount",
            }
            df = df.rename(columns=col_map)
            df["constituency"] = UNAVAILABLE
            df["elected_or_nominated"] = "Elected MP"

        return df


class RajyaSabhaAdapter(BaseHouseAdapter):
    """Adapter for Rajya Sabha CSV datasets. Strictly enforces constituency = UNAVAILABLE."""

    def __init__(self):
        super().__init__("RAJYA_SABHA")

    def adapt(self, df: pd.DataFrame, logical_dataset: str) -> pd.DataFrame:
        df = df.copy()

        if logical_dataset == "RECOMMENDED":
            col_map = {
                "Work category": "work_category",
                "WORK": "work_name_raw",
                "State": "state",
                "IDA": "ida",
                "Hon'ble Members of Parliament": "mp_name_raw",
                "Elected/Nominated": "elected_or_nominated",
                "Work description": "work_description",
                "Recommended date": "recommended_date",
                "RECOMMENDED AMOUNT   ( ₹ )": "recommended_amount",
                "Sanction Date": "sanction_date",
            }
            df = df.rename(columns=col_map)

        elif logical_dataset == "SANCTIONED":
            col_map = {
                "Work category": "work_category",
                "Work": "work_name_raw",
                "State": "state",
                "IDA": "ida",
                "Hon'ble Members of Parliament": "mp_name_raw",
                "Elected/Nominated": "elected_or_nominated",
                "Work description": "work_description",
                "Recommended date": "recommended_date",
                "Sanction Date": "sanction_date",
                "Sanction Amount ( ₹ )": "sanction_amount",
                "Work Status": "work_status",
            }
            df = df.rename(columns=col_map)

        elif logical_dataset == "COMPLETED":
            image_col = None
            for candidate in ["Image", "Images", "image", "images"]:
                if candidate in df.columns:
                    image_col = candidate
                    break
            if not image_col:
                raise ValueError(f"[{self.house_name}] COMPLETED dataset missing mandatory 'Image'/'Images' column.")

            col_map = {
                "Work Category": "work_category",
                "Work": "work_name_raw",
                "State": "state",
                "IDA": "ida",
                "Work Description": "work_description",
                "Hon'ble Members of Parliament": "mp_name_raw",
                "Elected/Nominated": "elected_or_nominated",
                image_col: "image_path",
                "Completion Date": "completion_date",
                "Amount Disbursed ( ₹ )": "disbursed_amount",
            }
            df = df.rename(columns=col_map)

        elif logical_dataset == "EXPENDITURE":
            col_map = {
                "State": "state",
                "Work": "work_name_raw",
                "Work ID": "work_id_raw",
                "IDA": "ida",
                "Hon'ble Members of Parliament": "mp_name_raw",
                "Elected/Nominated": "elected_or_nominated",
                "Expenditure Date": "expenditure_date",
                "Vendor Name": "vendor_name_raw",
                "Payment Status": "payment_status",
                "Fund Disbursed Amount ( ₹ )": "disbursed_amount",
            }
            df = df.rename(columns=col_map)

        elif logical_dataset == "ALLOCATION":
            col_map = {
                "State": "state",
                "Hon'ble Members of Parliament": "mp_name_raw",
                "Elected/Nominated": "elected_or_nominated",
                "Allocated AMOUNT ( ₹ )": "allocated_amount",
            }
            df = df.rename(columns=col_map)

        elif logical_dataset == "CALAMITY":
            col_map = {
                "Calamity Type": "calamity_type",
                "Calamity Name": "calamity_name",
                "Hon'ble Members of Parliament": "mp_name_raw",
                "Date of Consent": "recommended_date",
                "Consent Amount ( ₹ )": "consent_amount",
            }
            df = df.rename(columns=col_map)
            df["elected_or_nominated"] = UNKNOWN

        # STRICT RULE 6 REQUIREMENT: Rajya Sabha constituency MUST BE "UNAVAILABLE"
        df["constituency"] = UNAVAILABLE

        return df


def get_adapter(house: str) -> BaseHouseAdapter:
    if house == "LOK_SABHA":
        return LokSabhaAdapter()
    elif house == "RAJYA_SABHA":
        return RajyaSabhaAdapter()
    else:
        raise ValueError(f"Unknown house: {house}")
