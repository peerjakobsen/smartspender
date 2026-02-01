# Phase 3a: Receipt & Invoice Enrichment — Shaping Notes

## Scope

Add direct receipt upload to SmartSpender. Users paste a receipt photo or drag a PDF invoice into the Cowork chat. Claude Vision extracts merchant, date, total, and line items. The receipt is matched to an existing bank transaction and stored with item-level detail.

## Key Decisions

### Two CSV Files, Not One
Receipts are split across `receipts.csv` (metadata + match status) and `receipt-items.csv` (line-item detail). This avoids data duplication — a single receipt with 15 line items would otherwise repeat merchant/date/total 15 times. It also makes matching logic cleaner since it operates on receipt-level data only.

### Matching Workflow
Auto-link when exactly 1 transaction matches by date (+-1 day) AND amount (+-1%). Present candidates when multiple matches exist. Store as unmatched when nothing fits. Users can always correct the match.

### Upload via Chat
User pastes images or drags PDFs into Cowork chat. No browser automation needed — Claude Vision handles extraction directly from the attached file.

### Product Subcategory Taxonomy
Receipt-level subcategories (Mejeriprodukter, Koed, Alkohol, etc.) live in the receipt-parsing skill, separate from the existing merchant-level categorization in `skills/categorization/SKILL.md`. Merchant categories are broad (Dagligvarer > Supermarked). Receipt item categories are granular (Dagligvarer > Mejeriprodukter).

### No Changes to Overview/Report Commands
Phase 3a focuses on data capture only. Receipt-level insights in overview and report commands come in a later phase.

## Context

- SmartSpender already stores bank transactions in transactions.csv and categorized data in categorized.csv
- The existing categorization skill handles merchant-level categories
- Receipt matching depends on having synced transactions — `/smartspender:sync` must have run first
- Claude Vision can read receipt images and PDF invoices natively in Cowork
- All data lives as local CSV files in the working directory

## What's Out of Scope (Phase 3a)

- Storebox integration (Phase 3b)
- Coop app receipt sync (Phase 3b)
- e-Boks invoice import (Phase 3c)
- Email receipt scanning (Phase 3c)
- Receipt-level insights in overview/report commands (later phase)
- Bulk receipt import
- Receipt image storage (only the file reference is stored)
