"""The state machine over seed.NODES.

Pure, deterministic logic: given a node id and a chosen option id, decide the next
node — and refuse anything that isn't an allowed option on the current node. No model,
no generation. The frontend only ever renders what render_node() returns.
"""
from __future__ import annotations

from .seed import NODES

# Supported UI languages and the fallback order when a translation is missing.
LANGUAGES = ["hi", "en"]
_FALLBACK = ["hi", "en"]


def localize(mapping: dict[str, str] | None, lang: str) -> str:
    """Pick `lang` from a {lang: text} map, falling back hi -> en."""
    if not mapping:
        return ""
    if lang in mapping and mapping[lang]:
        return mapping[lang]
    for fb in _FALLBACK:
        if mapping.get(fb):
            return mapping[fb]
    # Last resort: any value present.
    return next(iter(mapping.values()), "")


def node_exists(node_id: str) -> bool:
    return node_id in NODES


def _render_option(opt: dict, lang: str) -> dict:
    out = {
        "id": opt["id"],
        "icon": opt.get("icon", "dot"),
        "label": localize(opt.get("label"), lang),
    }
    if "action" in opt:
        out["action"] = opt["action"]
    return out


def render_node(node_id: str, lang: str) -> dict:
    """Build the payload the frontend renders for one node."""
    node = NODES[node_id]
    options = [_render_option(o, lang) for o in node.get("options", [])]
    return {
        "node_id": node_id,
        "kind": node.get("kind", "info"),
        "icon": node.get("icon", "chat"),
        "text": localize(node.get("text"), lang),
        "options": options,
    }


def resolve_option(node_id: str, option_id: str) -> dict | None:
    """Return the chosen option dict if it is valid for this node, else None."""
    if node_id not in NODES:
        return None
    for opt in NODES[node_id].get("options", []):
        if opt["id"] == option_id:
            return opt
    return None
