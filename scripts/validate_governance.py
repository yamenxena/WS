"""
Majaz AI OS — Governance Validator
Automated regression gate for config file integrity.
Source: itseffi/agentic-os evals-as-regression-gate pattern.
Contract: scripts/validate_governance.md

[AUTH: Majaz_OS | validate_governance | 1.0.0 | 2026-03-21]
"""

import re
import sys
from pathlib import Path


def _get_workspace_root() -> Path:
    """Auto-discover workspace root relative to this script."""
    return Path(__file__).resolve().parent.parent


def _has_yaml_frontmatter(content: str) -> bool:
    """Check if content starts with YAML frontmatter (--- ... ---)."""
    return content.strip().startswith("---")


def _extract_frontmatter(content: str) -> dict:
    """Extract YAML frontmatter fields as simple key:value pairs."""
    match = re.match(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return {}
    fields = {}
    for line in match.group(1).splitlines():
        if ":" in line:
            key, val = line.split(":", 1)
            fields[key.strip()] = val.strip()
    return fields


def _has_auth_footer(content: str) -> bool:
    """Check if content ends with [AUTH:...] provenance stamp."""
    return bool(re.search(r"\[AUTH:.*\]", content[-500:]))


def validate_governance(config_dir: Path = None) -> dict:
    """
    Validate all governance files for structural compliance.

    Checks:
    1. YAML frontmatter present
    2. Required fields (type, version) in frontmatter
    3. [AUTH:] provenance footer present
    4. Workflow files reference at least one context/SOP file

    Returns:
        {"passed": N, "failed": N, "errors": [...], "status": "PASS"|"FAIL"}
    """
    root = _get_workspace_root()
    if config_dir is None:
        config_dir = root / ".agents" / "config"

    errors = []
    passed = 0
    failed = 0

    # --- Check 1-3: Config files ---
    config_files = list(config_dir.glob("*.md"))
    for f in config_files:
        content = f.read_text(encoding="utf-8")
        file_label = f.name

        # Check: YAML frontmatter
        if not _has_yaml_frontmatter(content):
            errors.append({
                "file": file_label,
                "check": "yaml_frontmatter",
                "detail": "Missing YAML frontmatter (--- ... ---)"
            })
            failed += 1
        else:
            # Check: required fields
            fm = _extract_frontmatter(content)
            missing = [k for k in ["type", "version"] if k not in fm]
            if missing:
                errors.append({
                    "file": file_label,
                    "check": "required_fields",
                    "detail": f"Missing frontmatter fields: {', '.join(missing)}"
                })
                failed += 1
            else:
                passed += 1

        # Check: AUTH footer
        if not _has_auth_footer(content):
            errors.append({
                "file": file_label,
                "check": "auth_footer",
                "detail": "Missing [AUTH:] provenance stamp"
            })
            failed += 1
        else:
            passed += 1

    # --- Check 4: Constitution ---
    constitution = root / ".agents" / "GEMINI.md"
    if constitution.exists():
        content = constitution.read_text(encoding="utf-8")
        if _has_yaml_frontmatter(content) and _has_auth_footer(content):
            passed += 1
        else:
            if not _has_yaml_frontmatter(content):
                errors.append({"file": "GEMINI.md", "check": "yaml_frontmatter", "detail": "Missing"})
                failed += 1
            if not _has_auth_footer(content):
                errors.append({"file": "GEMINI.md", "check": "auth_footer", "detail": "Missing"})
                failed += 1
    else:
        errors.append({"file": "GEMINI.md", "check": "exists", "detail": "Constitution file not found"})
        failed += 1

    # --- Check 5: Workflow files reference context ---
    workflows_dir = root / ".agents" / "workflows"
    if workflows_dir.exists():
        for wf in workflows_dir.glob("*.md"):
            content = wf.read_text(encoding="utf-8")
            references_context = bool(
                re.search(r"(context/|comms/|operations/|GOALS)", content)
            )
            if references_context:
                passed += 1
            else:
                errors.append({
                    "file": wf.name,
                    "check": "context_reference",
                    "detail": "Workflow does not reference any context/ or comms/ files"
                })
                failed += 1

    # --- Check 6: CHANGELOG exists ---
    changelog = root / ".agents" / "CHANGELOG.md"
    if changelog.exists():
        passed += 1
    else:
        errors.append({"file": "CHANGELOG.md", "check": "exists", "detail": "Missing"})
        failed += 1

    status = "PASS" if failed == 0 else "FAIL"
    return {"passed": passed, "failed": failed, "errors": errors, "status": status}


# --- CLI ---
if __name__ == "__main__":
    result = validate_governance()

    print(f"\n{'='*50}")
    print(f"  GOVERNANCE VALIDATION: {result['status']}")
    print(f"  Passed: {result['passed']} | Failed: {result['failed']}")
    print(f"{'='*50}\n")

    if result["errors"]:
        for err in result["errors"]:
            print(f"  ❌ {err['file']} — {err['check']}: {err['detail']}")
        print()

    sys.exit(0 if result["status"] == "PASS" else 1)
