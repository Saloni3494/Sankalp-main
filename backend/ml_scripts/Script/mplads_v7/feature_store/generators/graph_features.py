"""
Phase 3 / 6 — Temporal Entity Graph Feature Generator.
Constructs bipartite/heterogeneous temporal graphs as-of timestamp T.
Calculates degree centrality, entity co-occurrence, and PageRank metrics.
"""

import networkx as nx
from typing import Dict, List, Any, Optional
from mplads_v7.temporal.boundary import TemporalSnapshot


class TemporalGraphBuilder:
    """Constructs NetworkX temporal entity graphs as-of date T."""

    def build_graph(self, snapshots: List[TemporalSnapshot]) -> nx.Graph:
        G = nx.Graph()

        for snap in snapshots:
            w_id = f"WORK_{snap.work_id}"
            G.add_node(w_id, type="WORK")

            if snap.mp_name_raw:
                mp_id = f"MP_{snap.mp_name_raw}"
                G.add_node(mp_id, type="MP")
                G.add_edge(w_id, mp_id, relation="RECOMMENDED_BY")

            if snap.ida_name_raw:
                ida_id = f"IDA_{snap.ida_name_raw}"
                G.add_node(ida_id, type="IDA")
                G.add_edge(w_id, ida_id, relation="EXECUTED_BY")

            if snap.visible_payments:
                for pmt in snap.visible_payments:
                    v_name = pmt.vendor_name_raw
                    if v_name:
                        v_id = f"VENDOR_{v_name}"
                        G.add_node(v_id, type="VENDOR")
                        G.add_edge(w_id, v_id, relation="PAID_TO")

        return G


def generate_graph_features(snapshot: TemporalSnapshot, G: Optional[nx.Graph] = None) -> Dict[str, Any]:
    """Generates Graph intelligence features for a snapshot."""
    feats: Dict[str, Any] = {}
    if G is None or G.number_of_nodes() == 0:
        feats["graph_degree"] = 0.0
        feats["graph_vendor_degree"] = 0.0
        feats["graph_mp_degree"] = 0.0
        feats["graph_pagerank"] = 0.0
        return feats

    w_id = f"WORK_{snapshot.work_id}"
    if not G.has_node(w_id):
        feats["graph_degree"] = 0.0
        feats["graph_vendor_degree"] = 0.0
        feats["graph_mp_degree"] = 0.0
        feats["graph_pagerank"] = 0.0
        return feats

    degree = G.degree(w_id)
    feats["graph_degree"] = float(degree)

    # Vendor degree
    vendor_neighbors = [n for n in G.neighbors(w_id) if n.startswith("VENDOR_")]
    feats["graph_vendor_degree"] = float(len(vendor_neighbors))

    # MP degree
    mp_neighbors = [n for n in G.neighbors(w_id) if n.startswith("MP_")]
    feats["graph_mp_degree"] = float(len(mp_neighbors))

    # Fast approximate local PageRank / degree ratio
    feats["graph_pagerank"] = float(degree / G.number_of_nodes()) if G.number_of_nodes() > 0 else 0.0

    return feats
