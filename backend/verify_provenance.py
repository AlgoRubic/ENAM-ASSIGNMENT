"""
Automated Provenance & Cryptographic Integrity Validator for FINN.
Verifies that:
1. Every cited primary document exists on disk in backend/app/data/documents/.
2. The calculated SHA-256 hash of each local file strictly matches the citation record.
3. Every 'exact_quote' field in the primary store exists verbatim in the corresponding PDF.
Fails the build with exit code 1 if any citation is fabricated, detached, or mismatched.
"""
import os
import sys
import hashlib
import tempfile
import atexit
from typing import Any, Dict, List, Tuple
from pypdf import PdfReader

if __name__ == "__main__" and "FINN_DB_PATH" not in os.environ:
    _CLI_DB_PATH = os.path.join(tempfile.gettempdir(), f"finn_verify_cli_{os.getpid()}.db")
    os.environ["FINN_DB_PATH"] = _CLI_DB_PATH
    atexit.register(lambda: os.path.exists(_CLI_DB_PATH) and os.remove(_CLI_DB_PATH))

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.data.verified_primary_store import VERIFIED_PRIMARY_STORE
from app.services.announcements import ANNOUNCEMENTS_DATA

DOCS_DIR = os.path.join(BASE_DIR, "app", "data", "documents")

# Content-addressed cache keyed by live SHA-256 checksum so repeated in-process
# audits do not re-parse unchanged PDF pages while always verifying disk bytes live.
_PDF_TEXT_CACHE: Dict[str, str] = {}


def _ascii_safe(text: str) -> str:
    """Ensures console output is strictly ASCII-safe on Windows CP1252 terminals."""
    return str(text).replace("₹", "INR ").encode("ascii", errors="backslashreplace").decode("ascii")


def _safe_print(text: str = "") -> None:
    print(_ascii_safe(text))


def compute_file_sha256(filepath: str) -> str:
    with open(filepath, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def extract_normalized_pdf_text(filepath: str, file_sha256: str = "") -> str:
    cache_key = file_sha256 or compute_file_sha256(filepath)
    if cache_key in _PDF_TEXT_CACHE:
        return _PDF_TEXT_CACHE[cache_key]
    reader = PdfReader(filepath)
    full_text = " ".join(" ".join(page.extract_text().split()) for page in reader.pages if page.extract_text())
    _PDF_TEXT_CACHE[cache_key] = full_text
    return full_text


def compute_provenance_audit_report(verbose: bool = False) -> Dict[str, Any]:
    """
    Computes live cryptographic provenance, verbatim quote verification, and numeric
    formula audit metrics directly from VERIFIED_PRIMARY_STORE, ANNOUNCEMENTS_DATA,
    and local PDFs in DOCS_DIR.
    """
    errors: List[str] = []
    provenance_errors: List[str] = []
    formula_errors: List[str] = []

    if verbose:
        _safe_print("\n=======================================================")
        _safe_print("  FINN PRIMARY PROVENANCE & INTEGRITY AUDIT")
        _safe_print("=======================================================\n")

    if not os.path.exists(DOCS_DIR):
        msg = f"Documents directory missing: {DOCS_DIR}"
        errors.append(msg)
        provenance_errors.append(msg)
        return {
            "passed": False,
            "errors": errors,
            "provenance_errors": provenance_errors,
            "formula_errors": formula_errors,
            "indexed_ticker_count": len(VERIFIED_PRIMARY_STORE),
            "indexed_tickers": list(VERIFIED_PRIMARY_STORE.keys()),
            "indexed_companies": [],
            "local_pdf_count": 0,
            "local_pdfs": [],
            "total_citation_count": 0,
            "verified_citation_count": 0,
            "verified_quote_count": 0,
            "what_changed_evidence_verified_count": 0,
            "narrative_audit_evidence_verified_count": 0,
            "formula_audit_status": "failed",
            "formula_audit_passed": False,
            "formula_checks_passed": 0,
            "formula_checks_total": 0,
            "formula_audit_details": [],
        }

    doc_files = sorted(f for f in os.listdir(DOCS_DIR) if f.endswith(".pdf"))
    if verbose:
        _safe_print(f"[*] Found {len(doc_files)} primary documents in archive:")

    file_hashes: Dict[str, str] = {}
    pdf_texts: Dict[str, str] = {}
    pdf_sizes_kb: Dict[str, float] = {}
    pdf_ref_counts: Dict[str, int] = {f: 0 for f in doc_files}

    for f in doc_files:
        fpath = os.path.join(DOCS_DIR, f)
        h = compute_file_sha256(fpath)
        file_hashes[f] = h
        pdf_texts[f] = extract_normalized_pdf_text(fpath, file_sha256=h)
        size_kb = os.path.getsize(fpath) / 1024
        pdf_sizes_kb[f] = round(size_kb, 1)
        if verbose:
            _safe_print(f"  - {f} ({size_kb:,.1f} KB)")
            _safe_print(f"    SHA-256: {h}")

    if verbose:
        _safe_print("\n[*] Validating Primary Source Citations across Indexed Companies...")

    citation_count = 0
    verified_quote_count = 0
    what_changed_verified_count = 0
    narrative_audit_verified_count = 0
    formula_checks_total = 0
    formula_checks_passed = 0
    formula_audit_details: List[Dict[str, Any]] = []
    indexed_companies: List[Dict[str, Any]] = []

    modules_to_check = [
        "business_snapshot",
        "financial_snapshot",
        "trajectory",
        "balance_sheet",
        "cash_quality",
        "guidance",
    ]

    for symbol, comp in VERIFIED_PRIMARY_STORE.items():
        if verbose:
            _safe_print(f"\n>> Inspecting {comp.get('name', symbol)} ({symbol}):")

        comp_citations = 0
        comp_verified_citations = 0
        comp_what_changed_ok = False
        comp_narrative_ok = 0
        comp_pdfs: List[str] = []

        # Check "What Changed" Evidence
        wc = comp.get("what_changed")
        if wc and "evidence" in wc:
            ev = wc["evidence"]
            local_fn = ev.get("local_filename")
            doc_h = ev.get("document_hash")
            if not local_fn or local_fn not in file_hashes:
                msg = f"[{symbol} what_changed] local_filename '{local_fn}' not found in archive."
                errors.append(msg)
                provenance_errors.append(msg)
            elif file_hashes[local_fn] != doc_h:
                msg = (
                    f"[{symbol} what_changed] Hash mismatch for {local_fn}. "
                    f"Stored: {doc_h}, Calculated: {file_hashes[local_fn]}"
                )
                errors.append(msg)
                provenance_errors.append(msg)
            else:
                what_changed_verified_count += 1
                comp_what_changed_ok = True
                if local_fn not in comp_pdfs:
                    comp_pdfs.append(local_fn)
                if verbose:
                    _safe_print(f"  [+] What-Changed Evidence: Verified with {local_fn}")

        # Check narrative_audit evidence items
        na = comp.get("narrative_audit", {})
        for qa in na.get("quarters_audited", []):
            ev = qa.get("evidence")
            if ev:
                local_fn = ev.get("local_filename")
                doc_h = ev.get("document_hash")
                if local_fn and local_fn in file_hashes and file_hashes[local_fn] == doc_h:
                    narrative_audit_verified_count += 1
                    comp_narrative_ok += 1
                    if local_fn not in comp_pdfs:
                        comp_pdfs.append(local_fn)

        for mod_name in modules_to_check:
            mod = comp.get(mod_name)
            if not mod or "primary_citations" not in mod:
                continue

            for cit in mod["primary_citations"]:
                citation_count += 1
                comp_citations += 1
                local_fn = cit.get("local_filename")
                doc_h = cit.get("document_hash")
                quote = cit.get("exact_quote")

                if not local_fn:
                    msg = f"[{symbol} {mod_name}] Citation {cit.get('doc_id')} missing 'local_filename'."
                    errors.append(msg)
                    provenance_errors.append(msg)
                    continue

                if local_fn not in file_hashes:
                    msg = f"[{symbol} {mod_name}] File '{local_fn}' not found in {DOCS_DIR}."
                    errors.append(msg)
                    provenance_errors.append(msg)
                    continue

                calc_h = file_hashes[local_fn]
                if calc_h != doc_h:
                    msg = (
                        f"[{symbol} {mod_name}] SHA-256 mismatch for {local_fn}. "
                        f"Expected {doc_h}, found {calc_h}"
                    )
                    errors.append(msg)
                    provenance_errors.append(msg)
                    continue

                pdf_ref_counts[local_fn] = pdf_ref_counts.get(local_fn, 0) + 1
                if local_fn not in comp_pdfs:
                    comp_pdfs.append(local_fn)

                if quote:
                    norm_quote = " ".join(quote.split())
                    if norm_quote in pdf_texts[local_fn]:
                        verified_quote_count += 1
                        comp_verified_citations += 1
                        if verbose:
                            _safe_print(
                                f"  [+] {mod_name}: Verbatim quote matched in {local_fn} (Page: {cit.get('page_or_time')})"
                            )
                    else:
                        msg = _ascii_safe(
                            f"[{symbol} {mod_name}] Quote not found verbatim in {local_fn}!\n"
                            f"    Quote: '{quote[:70]}...'"
                        )
                        errors.append(msg)
                        provenance_errors.append(msg)

        # Verify numeric formulas (EBITDA margin, PAT margin, CFO/PAT cash conversion, FCF = CFO - Capex)
        comp_formula_passed = 0
        comp_formula_total = 0
        expected_ebitda_m = 0.0
        expected_pat_m = 0.0
        expected_cc = 0.0
        expected_fcf = 0.0

        fs = comp.get("financial_snapshot", {})
        if fs:
            rev = float(fs.get("revenue_cr", 0))
            ebitda = float(fs.get("ebitda_cr", 0))
            pat = float(fs.get("pat_cr", 0))
            expected_ebitda_m = round((ebitda / rev) * 100.0, 2) if rev else 0.0
            expected_pat_m = round((pat / rev) * 100.0, 2) if rev else 0.0

            formula_checks_total += 2
            comp_formula_total += 2
            if abs(float(fs.get("ebitda_margin", 0)) - expected_ebitda_m) > 0.05:
                msg = (
                    f"[{symbol} financial_snapshot] EBITDA margin mismatch: "
                    f"stored {fs.get('ebitda_margin')}% vs calculated {expected_ebitda_m}%"
                )
                errors.append(msg)
                formula_errors.append(msg)
            else:
                formula_checks_passed += 1
                comp_formula_passed += 1

            if abs(float(fs.get("pat_margin", 0)) - expected_pat_m) > 0.05:
                msg = (
                    f"[{symbol} financial_snapshot] PAT margin mismatch: "
                    f"stored {fs.get('pat_margin')}% vs calculated {expected_pat_m}%"
                )
                errors.append(msg)
                formula_errors.append(msg)
            else:
                formula_checks_passed += 1
                comp_formula_passed += 1

        cq = comp.get("cash_quality", {})
        if cq:
            cfo = float(cq.get("cfo_cr", 0))
            cq_pat = float(cq.get("pat_cr", 0))
            capex = float(cq.get("capital_expenditure_cr", 0))
            expected_cc = round(cfo / cq_pat, 2) if cq_pat else 0.0
            expected_fcf = round(cfo - capex, 2)

            formula_checks_total += 2
            comp_formula_total += 2
            if abs(float(cq.get("cash_conversion_ratio", 0)) - expected_cc) > 0.02:
                msg = (
                    f"[{symbol} cash_quality] Cash conversion ratio mismatch: "
                    f"stored {cq.get('cash_conversion_ratio')}x vs calculated {expected_cc}x (CFO {cfo} / PAT {cq_pat})"
                )
                errors.append(msg)
                formula_errors.append(msg)
            else:
                formula_checks_passed += 1
                comp_formula_passed += 1

            if abs(float(cq.get("fcf_cr", 0)) - expected_fcf) > 0.05:
                msg = (
                    f"[{symbol} cash_quality] FCF mismatch: "
                    f"stored {cq.get('fcf_cr')} vs calculated {expected_fcf} (CFO {cfo} - Capex {capex})"
                )
                errors.append(msg)
                formula_errors.append(msg)
            else:
                formula_checks_passed += 1
                comp_formula_passed += 1

            if verbose:
                _safe_print(
                    f"  [+] Numeric Formulas Verified: EBITDA%={expected_ebitda_m}%, PAT%={expected_pat_m}%, "
                    f"CFO/PAT={expected_cc}x, FCF=INR {expected_fcf} Cr"
                )

        formula_audit_details.append({
            "symbol": symbol,
            "scope": "pull_terminal",
            "ebitda_margin_pct": expected_ebitda_m,
            "pat_margin_pct": expected_pat_m,
            "cash_conversion_ratio": expected_cc,
            "fcf_cr": expected_fcf,
            "checks_passed": comp_formula_passed,
            "checks_total": comp_formula_total,
            "status": "green" if comp_formula_passed == comp_formula_total else "red",
        })

        indexed_companies.append({
            "symbol": symbol,
            "name": comp.get("name", symbol),
            "sector": comp.get("sector", ""),
            "provenance_status": comp.get("provenance_status", "indexed_primary"),
            "citation_count": comp_citations,
            "verified_citation_count": comp_verified_citations,
            "what_changed_verified": comp_what_changed_ok,
            "narrative_audit_verified_count": comp_narrative_ok,
            "formula_checks_passed": comp_formula_passed,
            "formula_checks_total": comp_formula_total,
            "local_pdfs": comp_pdfs,
        })

    # Verify announcement results_breakdown margins
    for ann in ANNOUNCEMENTS_DATA:
        rb = ann.get("results_breakdown")
        if rb:
            rev = float(rb["revenue"]["current"])
            ebitda = float(rb["ebitda"]["current"])
            pat = float(rb["pat"]["current"])
            exp_em = round((ebitda / rev) * 100.0, 2) if rev else 0.0
            exp_pm = round((pat / rev) * 100.0, 2) if rev else 0.0
            ann_passed = 0
            formula_checks_total += 2
            if abs(float(rb["ebitda_margin_pct"]) - exp_em) > 0.05:
                msg = f"[{ann['id']}] Announcement EBITDA margin mismatch: {rb['ebitda_margin_pct']} vs {exp_em}"
                errors.append(msg)
                formula_errors.append(msg)
            else:
                formula_checks_passed += 1
                ann_passed += 1
            if abs(float(rb["pat_margin_pct"]) - exp_pm) > 0.05:
                msg = f"[{ann['id']}] Announcement PAT margin mismatch: {rb['pat_margin_pct']} vs {exp_pm}"
                errors.append(msg)
                formula_errors.append(msg)
            else:
                formula_checks_passed += 1
                ann_passed += 1

            formula_audit_details.append({
                "symbol": ann.get("symbol", ""),
                "filing_id": ann.get("id", ""),
                "scope": "announcement_digest",
                "ebitda_margin_pct": exp_em,
                "pat_margin_pct": exp_pm,
                "checks_passed": ann_passed,
                "checks_total": 2,
                "status": "green" if ann_passed == 2 else "red",
            })

    if verbose:
        _safe_print("\n=======================================================")
        _safe_print(
            f"  AUDIT SUMMARY: {citation_count} Citations checked, {verified_quote_count} Verbatim quotes verified."
        )
        if errors:
            _safe_print(f"  FAILED: {len(errors)} provenance errors detected:")
            for e in errors:
                _safe_print(f"  [!] {e}")
            _safe_print("=======================================================\n")
        else:
            _safe_print("  SUCCESS: 100% Cryptographic Provenance & Verbatim Grounding Verified!")
            _safe_print("=======================================================\n")

    local_pdfs = [
        {
            "filename": f,
            "sha256": file_hashes[f],
            "size_kb": pdf_sizes_kb[f],
            "referenced_by_citations": pdf_ref_counts.get(f, 0),
            "hash_verified": True,
        }
        for f in doc_files
    ]

    formula_ok = len(formula_errors) == 0 and formula_checks_total > 0

    return {
        "passed": len(errors) == 0,
        "errors": errors,
        "provenance_errors": provenance_errors,
        "formula_errors": formula_errors,
        "indexed_ticker_count": len(VERIFIED_PRIMARY_STORE),
        "indexed_tickers": list(VERIFIED_PRIMARY_STORE.keys()),
        "indexed_companies": indexed_companies,
        "local_pdf_count": len(doc_files),
        "local_pdfs": local_pdfs,
        "total_citation_count": citation_count,
        "verified_citation_count": verified_quote_count,
        "verified_quote_count": verified_quote_count,
        "what_changed_evidence_verified_count": what_changed_verified_count,
        "narrative_audit_evidence_verified_count": narrative_audit_verified_count,
        "formula_audit_status": "passed" if formula_ok else "failed",
        "formula_audit_passed": formula_ok,
        "formula_checks_passed": formula_checks_passed,
        "formula_checks_total": formula_checks_total,
        "formula_audit_details": formula_audit_details,
    }


def validate_provenance() -> Tuple[bool, List[str]]:
    report = compute_provenance_audit_report(verbose=True)
    return report["passed"], report["errors"]


if __name__ == "__main__":
    success, errs = validate_provenance()
    sys.exit(0 if success else 1)
