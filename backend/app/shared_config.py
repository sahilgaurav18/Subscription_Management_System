import os
import json
from typing import Dict, Any, List

# Locate shared/config relative to current file
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
# current dir is backend/app -> parent is backend -> parent is repo root
REPO_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
SHARED_CONFIG_DIR = os.path.join(REPO_ROOT, "shared", "config")


def load_shared_json(filename: str) -> Dict[str, Any]:
    file_path = os.path.join(SHARED_CONFIG_DIR, filename)
    if not os.path.exists(file_path):
        # Fallback if running inside Docker with container structure /app
        alt_path = os.path.join("/app", "shared", "config", filename)
        if os.path.exists(alt_path):
            file_path = alt_path
        else:
            raise FileNotFoundError(f"Shared config file not found: {file_path}")
    
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_password_rules() -> Dict[str, Any]:
    return load_shared_json("password_rules.json")


def get_status_transitions() -> Dict[str, Any]:
    return load_shared_json("status_transitions.json")


def get_billing_periods() -> Dict[str, Any]:
    return load_shared_json("billing_periods.json")


def get_payment_methods() -> Dict[str, Any]:
    return load_shared_json("payment_methods.json")

