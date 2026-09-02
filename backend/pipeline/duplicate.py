"""
Duplicate-work detection: two layers.
1. High-confidence rule match: same MP + same amount + same completion date + near-identical description.
2. TF-IDF text similarity within same state (secondary/supporting signal, not a sole trigger).
"""

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .config import DUPLICATE_SIMILARITY_THRESHOLD


def flag_rule_based_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """Group by (mp_name, amount_disbursed, completion_date, work_description) exact match."""
    df = df.copy()
    group_cols = [c for c in ["parliament_house", "mp_name", "amount_disbursed", "completion_date", "work_description"] if c in df.columns]
    if len(group_cols) < 4:
        df["is_duplicate_candidate"] = False
        df["duplicate_group_id"] = None
        return df

    df["_dup_key"] = df[group_cols].fillna("__NA__").astype(str).agg("|".join, axis=1)
    group_sizes = df["_dup_key"].value_counts()
    dup_keys = group_sizes[group_sizes > 1].index

    df["is_duplicate_candidate"] = df["_dup_key"].isin(dup_keys)
    df["duplicate_group_id"] = df["_dup_key"].where(df["is_duplicate_candidate"])
    df = df.drop(columns=["_dup_key"])
    return df


def flag_semantic_duplicates(df: pd.DataFrame, threshold: float = DUPLICATE_SIMILARITY_THRESHOLD, max_rows: int = 5000) -> pd.DataFrame:
    """
    TF-IDF + cosine similarity within same state, as a secondary confidence signal.
    Capped at max_rows for runtime safety on the prototype; full-scale would batch by state.
    """
    df = df.copy()
    df["semantic_duplicate_score"] = 0.0

    if "work_description" not in df.columns or "state" not in df.columns:
        return df

    subset = df.dropna(subset=["work_description"]).copy()
    if len(subset) > max_rows:
        subset = subset.sample(max_rows, random_state=42)

    for state, group in subset.groupby("state"):
        if len(group) < 2:
            continue
        try:
            vectorizer = TfidfVectorizer(stop_words="english", max_features=2000)
            tfidf = vectorizer.fit_transform(group["work_description"].astype(str))
            sim_matrix = cosine_similarity(tfidf)
            # max similarity to any OTHER row in the same state group
            import numpy as np
            scores = sim_matrix.copy()
            for i in range(len(scores)):
                scores[i, i] = 0  # ignore self-similarity
            best_scores = scores.max(axis=1)
            df.loc[group.index, "semantic_duplicate_score"] = best_scores
        except ValueError:
            continue  # e.g. empty vocabulary for a tiny group

    df["is_semantic_duplicate"] = df["semantic_duplicate_score"] >= threshold
    return df
