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
from typing import Dict, List, Tuple
from pypdf import PdfReader

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.data.verified_primary_store import VERIFIED_PRIMARY_STORE

DOCS_DIR = os.path.join(BASE_DIR, "app", "data", "documents")


def compute_file_sha256(filepath: str) -> str:
    with open(filepath, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def extract_normalized_pdf_text(filepath: str) -> str:
    reader = PdfReader(filepath)
    full_text = " ".join(" ".join(page.extract_text().split()) for page in reader.pages if page.extract_text())
    return full_text


def validate_provenance() -> Tuple[bool, List[str]]:
    errors = []
    print("\n=======================================================")
    print("  FINN PRIMARY PROVENANCE & INTEGRITY AUDIT")
    print("=======================================================\n")

    # 1. Verify all committed primary document files
    if not os.path.exists(DOCS_DIR):
        errors.append(f"Documents directory missing: {DOCS_DIR}")
        return False, errors

    doc_files = [f for f in os.listdir(DOCS_DIR) if f.endswith(".pdf")]
    print(f"[*] Found {len(doc_files)} primary documents in archive:")
    
    file_hashes: Dict[str, str] = {}
    pdf_texts: Dict[str, str] = {}

    for f in doc_files:
        fpath = os.path.join(DOCS_DIR, f)
        h = compute_file_sha256(fpath)
        file_hashes[f] = h
        pdf_texts[f] = extract_normalized_pdf_text(fpath)
        size_kb = os.path.getsize(fpath) / 1024
        print(f"  - {f} ({size_kb:,.1f} KB)")
        print(f"    SHA-256: {h}")

    print("\n[*] Validating Primary Source Citations across Indexed Companies...")
    citation_count = 0
    verified_quote_count = 0

    for symbol, comp in VERIFIED_PRIMARY_STORE.items():
        print(f"\n>> Inspecting {comp.get('name', symbol)} ({symbol}):")
        
        # Check "What Changed" Evidence
        wc = comp.get("what_changed")
        if wc and "evidence" in wc:
            ev = wc["evidence"]
            local_fn = ev.get("local_filename")
            doc_h = ev.get("document_hash")
            if not local_fn or local_fn not in file_hashes:
                errors.append(f"[{symbol} what_changed] local_filename '{local_fn}' not found in archive.")
            elif file_hashes[local_fn] != doc_h:
                errors.append(
                    f"[{symbol} what_changed] Hash mismatch for {local_fn}. "
                    f"Stored: {doc_h}, Calculated: {file_hashes[local_fn]}"
                )
            else:
                print(f"  [+] What-Changed Evidence: Verified with {local_fn}")

        # Check all module citations
        modules_to_check = [
            "business_snapshot",
            "financial_snapshot",
            "trajectory",
            "balance_sheet",
            "cash_quality",
            "guidance"
        ]

        for mod_name in modules_to_check:
            mod = comp.get(mod_name)
            if not mod or "primary_citations" not in mod:
                continue
            
            for cit in mod["primary_citations"]:
                citation_count += 1
                local_fn = cit.get("local_filename")
                doc_h = cit.get("document_hash")
                quote = cit.get("exact_quote")

                if not local_fn:
                    errors.append(f"[{symbol} {mod_name}] Citation {cit.get('doc_id')} missing 'local_filename'.")
                    continue

                if local_fn not in file_hashes:
                    errors.append(f"[{symbol} {mod_name}] File '{local_fn}' not found in {DOCS_DIR}.")
                    continue

                calc_h = file_hashes[local_fn]
                if calc_h != doc_h:
                    errors.append(
                        f"[{symbol} {mod_name}] SHA-256 mismatch for {local_fn}. "
                        f"Expected {doc_h}, found {calc_h}"
                    )
                    continue

                # Verify exact verbatim quote in PDF text
                if quote:
                    norm_quote = " ".join(quote.split())
                    if norm_quote in pdf_texts[local_fn]:
                        verified_quote_count += 1
                        print(f"  [+] {mod_name}: Verbatim quote matched in {local_fn} (Page: {cit.get('page_or_time')})")
                    else:
                        errors.append(
                            f"[{symbol} {mod_name}] Quote not found verbatim in {local_fn}!\n"
                            f"    Quote: '{quote[:70]}...'"
                        )

    print(f"\n=======================================================")
    print(f"  AUDIT SUMMARY: {citation_count} Citations checked, {verified_quote_count} Verbatim quotes verified.")
    if errors:
        print(f"  FAILED: {len(errors)} provenance errors detected:")
        for e in errors:
            print(f"  [!] {e}")
        print("=======================================================\n")
        return False, errors
    else:
        print("  SUCCESS: 100% Cryptographic Provenance & Verbatim Grounding Verified!")
        print("=======================================================\n")
        return True, []


if __name__ == "__main__":
    success, errs = validate_provenance()
    sys.exit(0 if success else 1)
