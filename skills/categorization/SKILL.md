---
name: categorization
description: Danish merchant knowledge and transaction categorization rules. Reference this when classifying transactions into spending categories.
---

# Categorization

## Purpose

Provides Claude with Danish merchant knowledge and categorization rules for classifying bank transactions into spending categories.

## Categories

15 Danish spending categories with subcategories:

| Category | Subcategories | Description |
|----------|---------------|-------------|
| Bolig | Husleje, El, Vand, Varme, Forsikring | Housing costs |
| Dagligvarer | Supermarked, Specialbutik | Groceries |
| Transport | Offentlig, Bil, Taxi, Cykel | Transportation |
| Abonnementer | Streaming, Fitness, Software, Telefon | Subscriptions |
| Restauranter | Restaurant, Café, Takeaway | Dining out |
| Shopping | Tøj, Elektronik, Bolig, Andet | Shopping |
| Sundhed | Apotek, Læge, Tandlæge | Health |
| Underholdning | Biograf, Koncert, Spil | Entertainment |
| Rejser | Fly, Hotel, Ferie | Travel |
| Børn | Daginstitution, Tøj, Legetøj | Children |
| Personlig pleje | Frisør, Kosmetik | Personal care |
| Uddannelse | Kurser, Bøger, Materialer | Education |
| Opsparing | Overførsler til opsparing | Savings transfers |
| Indkomst | Løn, Refusion | Income |
| Andet | Ukategoriseret | Other / fallback |

## Merchant Pattern Database

Map raw transaction text patterns to normalized merchant names and categories. Patterns use `*` as wildcard.

### Dagligvarer (Groceries)
| Pattern | Merchant | Subcategory |
|---------|----------|-------------|
| `*NETTO*` | Netto | Supermarked |
| `*FØTEX*` or `*FOETEX*` | Føtex | Supermarked |
| `*REMA*1000*` or `*REMA1000*` | Rema 1000 | Supermarked |
| `*IRMA*` | Irma | Supermarked |
| `*LIDL*` | Lidl | Supermarked |
| `*ALDI*` | Aldi | Supermarked |
| `*BILKA*` | Bilka | Supermarked |
| `*MENY*` | Meny | Supermarked |
| `*SPAR*` | Spar | Supermarked |
| `*FAKTA*` | Fakta | Supermarked |
| `*COOP*` | Coop | Supermarked |
| `*DAGLIG*BRUGSEN*` or `*DAGLI*BRUGSEN*` | Dagli'Brugsen | Supermarked |
| `*SUPER*BRUGSEN*` | SuperBrugsen | Supermarked |
| `*KVICKLY*` | Kvickly | Supermarked |

### Transport
| Pattern | Merchant | Subcategory |
|---------|----------|-------------|
| `*DSB*` | DSB | Offentlig |
| `*REJSEKORT*` | Rejsekort | Offentlig |
| `*MOVIA*` | Movia | Offentlig |
| `*Q8*` | Q8 | Bil |
| `*CIRCLE*K*` | Circle K | Bil |
| `*SHELL*` | Shell | Bil |
| `*OK BENZIN*` or `*OK PLUS*` | OK | Bil |
| `*UBER*` | Uber | Taxi |
| `*TAXA*` or `*DANTAXI*` | Taxa | Taxi |
| `*DONKEY*REPUBLIC*` | Donkey Republic | Cykel |

### Abonnementer (Subscriptions)
| Pattern | Merchant | Subcategory |
|---------|----------|-------------|
| `*NETFLIX*` | Netflix | Streaming |
| `*SPOTIFY*` | Spotify | Streaming |
| `*DISNEY*PLUS*` or `*DISNEYPLUS*` | Disney+ | Streaming |
| `*HBO*` or `*MAX*STREAMING*` | HBO Max | Streaming |
| `*VIAPLAY*` | Viaplay | Streaming |
| `*TV2*PLAY*` or `*TV 2 PLAY*` | TV2 Play | Streaming |
| `*YOUTUBE*PREMIUM*` or `*GOOGLE*YOUTUBE*` | YouTube Premium | Streaming |
| `*APPLE*MUSIC*` | Apple Music | Streaming |
| `*FITNESS*WORLD*` | Fitness World | Fitness |
| `*FITNESS*DK*` | Fitness DK | Fitness |
| `*SATS*` | SATS | Fitness |
| `*TDC*` or `*YOUSEE*` | TDC | Telefon |
| `*TELENOR*` | Telenor | Telefon |
| `*TELIA*` | Telia | Telefon |
| `*ADOBE*` | Adobe CC | Software |
| `*MICROSOFT*365*` or `*MICROSOFT*OFFICE*` | Microsoft 365 | Software |
| `*ICLOUD*` or `*APPLE.COM/BILL*` | iCloud | Software |
| `*DROPBOX*` | Dropbox | Software |

### Restauranter (Dining)
| Pattern | Merchant | Subcategory |
|---------|----------|-------------|
| `*WOLT*` | Wolt | Takeaway |
| `*JUST*EAT*` | Just Eat | Takeaway |
| `*TOO GOOD TO GO*` or `*TOOGOODTOGO*` | Too Good To Go | Takeaway |
| `*STARBUCKS*` | Starbucks | Café |
| `*JOE*THE*JUICE*` or `*JOE & THE JUICE*` | Joe & The Juice | Café |
| `*LAGKAGEHUSET*` | Lagkagehuset | Café |
| `*MCDONALDS*` or `*MC DONALDS*` | McDonald's | Restaurant |
| `*BURGER*KING*` | Burger King | Restaurant |

### Shopping
| Pattern | Merchant | Subcategory |
|---------|----------|-------------|
| `*H&M*` or `*H M *` or `*HM *` | H&M | Tøj |
| `*ZALANDO*` | Zalando | Tøj |
| `*IKEA*` | IKEA | Bolig |
| `*ELGIGANTEN*` | Elgiganten | Elektronik |
| `*POWER*` | Power | Elektronik |
| `*NORMAL*` | Normal | Andet |
| `*FLYING*TIGER*` | Flying Tiger | Andet |
| `*SØSTRENE*GRENE*` or `*SOSTRENE*GRENE*` | Søstrene Grene | Andet |
| `*AMAZON*` | Amazon | Andet |
| `*JYSK*` | Jysk | Bolig |

### Bolig (Housing)
| Pattern | Merchant | Subcategory |
|---------|----------|-------------|
| `*ØRSTED*` or `*OERSTED*` | Ørsted | El |
| `*HOFOR*` | HOFOR | Vand |
| `*TRYG*` | Tryg | Forsikring |
| `*TOPDANMARK*` | Topdanmark | Forsikring |
| `*ALKA*` or `*CODAN*` | Codan | Forsikring |
| `*HUSLEJE*` or `*FAST OVERFØRSEL*HUSLEJE*` | Husleje | Husleje |
| `*NORLYS*` | Norlys | El |
| `*EWII*` | Ewii | El |

### Sundhed (Health)
| Pattern | Merchant | Subcategory |
|---------|----------|-------------|
| `*APOTEK*` | Apoteket | Apotek |
| `*MATAS*` | Matas | Apotek |
| `*TANDLÆGE*` or `*TANDLAEGE*` | Tandlæge | Tandlæge |
| `*LÆGE*` or `*LAEGE*` | Læge | Læge |

### Underholdning (Entertainment)
| Pattern | Merchant | Subcategory |
|---------|----------|-------------|
| `*NORDISK*FILM*` | Nordisk Film | Biograf |
| `*CINEMAXX*` | CinemaxX | Biograf |
| `*TICKETMASTER*` | Ticketmaster | Koncert |
| `*BILLETLUGEN*` | Billetlugen | Koncert |

### Rejser (Travel)
| Pattern | Merchant | Subcategory |
|---------|----------|-------------|
| `*SAS*` or `*SCANDINAVIAN*AIRLINES*` | SAS | Fly |
| `*NORWEGIAN*` | Norwegian | Fly |
| `*RYANAIR*` | Ryanair | Fly |
| `*AIRBNB*` | Airbnb | Hotel |
| `*HOTELS.COM*` or `*BOOKING.COM*` | Booking.com | Hotel |

### Personlig pleje
| Pattern | Merchant | Subcategory |
|---------|----------|-------------|
| `*SEPHORA*` | Sephora | Kosmetik |
| `*FRISØR*` or `*FRISOER*` or `*CUTTERS*` | Frisør | Frisør |

### Uddannelse (Education)
| Pattern | Merchant | Subcategory |
|---------|----------|-------------|
| `*SAXO*` | Saxo | Bøger |
| `*AMAZON*KINDLE*` | Amazon Kindle | Bøger |

## Normalization Rules

Before matching patterns, normalize the raw transaction text:
1. Convert to uppercase for matching
2. Replace Danish characters: `Ø` → `OE`, `Æ` → `AE`, `Å` → `AA` (for pattern matching only — preserve originals in raw_text)
3. Collapse multiple spaces into one
4. Trim leading/trailing whitespace

## Transaction Type Detection

Use the transaction description prefix to identify the payment method:

| Prefix Pattern | Type | Notes |
|----------------|------|-------|
| `Dankort-køb` | Card payment (physical) | Danish debit card |
| `Visa-køb` | Card payment (physical) | Visa card |
| `Overførsel` | Bank transfer | Internal or external |
| `Fast overførsel` | Standing order | Recurring transfer |
| `PBS` or `Betalingsservice` | Direct debit | Subscriptions and bills |
| `MobilePay` | Mobile payment | Person-to-person or merchant |
| `Løn fra` | Salary | Income — categorize as Indkomst |
| `Hævning` | ATM withdrawal | Categorize as Andet |

## Matching Order

When categorizing a transaction, check these sources in order — stop at the first match:

1. **learnings/categorization.md** — Check for user corrections learned from previous sessions (confidence 1.0). These take precedence over all other rules.
2. **learnings/merchants.md** — Check for merchant name aliases to normalize the raw text before pattern matching.
3. **merchant-overrides.csv** — Check for a matching `raw_pattern` (confidence 1.0). These are learned from previous user corrections within the same session.
4. **Static pattern database** — Check the merchant pattern tables above (confidence 1.0 exact / 0.8 partial).
5. **Intelligent classification** — No pattern match, but Claude can infer category from transaction context (confidence 0.5–0.7).
6. **Fallback** — Cannot determine category — assign to "Andet" (confidence 0.0).

## Confidence Scoring

Assign a confidence score to each categorization:

| Match Type | Confidence | Description |
|------------|------------|-------------|
| Merchant override match | 1.0 | Transaction text matches a learned override in merchant-overrides.csv |
| Exact pattern match | 1.0 | Transaction text matches a known merchant pattern |
| Partial pattern match | 0.8 | Part of the text matches a known pattern |
| Intelligent classification | 0.5–0.7 | No pattern match, but Claude can infer from context |
| Unknown | 0.0 | Cannot determine category — assign to Andet |

When `manual_override` is TRUE for a transaction, always use the user's category regardless of what patterns suggest.

## Learning from Corrections

When a user manually corrects a transaction's category, the correction should be saved to **learnings/categorization.md** so future sessions automatically apply the learned rule.

**How to record a categorization learning:**
1. Open `learnings/categorization.md`
2. Append a new row to the Learnings table with:
   - **Date**: Today's date (YYYY-MM-DD)
   - **Pattern**: The normalized raw text pattern to match (uppercase, wildcards allowed)
   - **Merchant**: The normalized merchant name
   - **Category**: The user-corrected category
   - **Subcategory**: The user-corrected subcategory
   - **Context**: Brief note about why this correction was made

**Example learning entry:**
```markdown
| 2026-01-15 | *NETFLIX* | Netflix | Underholdning | Streaming | User: "Netflix er underholdning, ikke abonnement" |
```

**Also update merchant-overrides.csv** for the current session:
1. Take the corrected transaction's `raw_text` from transactions.csv
2. Normalize it: uppercase, trim whitespace, collapse multiple spaces
3. Use this as the `raw_pattern`
4. Use the user-corrected `merchant`, `category`, and `subcategory` from categorized.csv
5. Set `created_at` to the current timestamp
6. Only append if no row with the same `raw_pattern` already exists

## Ambiguous Merchants

- **Netto**: Always `Dagligvarer`, even though they sell non-grocery items
- **7-Eleven**: `Dagligvarer` (most purchases are food/drink)
- **Amazon**: Default to `Shopping` unless description contains "Prime" or "Kindle" (then `Abonnementer` or `Uddannelse`)
- **Normal**: `Shopping` → `Andet` (sells mixed categories)
- **Matas**: `Sundhed` → `Apotek` (primarily health/beauty)
- **Wolt**: `Restauranter` → `Takeaway` unless the Wolt+ subscription charge (then `Abonnementer`)

## Examples

### Example 1: Clear Match
```
raw_text: "NETTO FO 1234 KØBENHAVN"
normalized: "NETTO FO 1234 KOEBENHAVN"
pattern match: *NETTO* → Netto
result: category=Dagligvarer, subcategory=Supermarked, merchant=Netto, confidence=1.0
```

### Example 2: PBS Subscription
```
raw_text: "PBS FITNESS WORLD"
normalized: "PBS FITNESS WORLD"
pattern match: *FITNESS*WORLD* → Fitness World
result: category=Abonnementer, subcategory=Fitness, merchant=Fitness World, confidence=1.0, is_recurring=TRUE
```

### Example 3: Intelligent Classification
```
raw_text: "RESTAURANT COFOCO KBH"
normalized: "RESTAURANT COFOCO KBH"
no pattern match — but "RESTAURANT" prefix suggests dining
result: category=Restauranter, subcategory=Restaurant, merchant=Cofoco, confidence=0.6
```

### Example 4: Income
```
raw_text: "Løn fra Arbejdsgiver ApS"
prefix match: "Løn fra" → salary
result: category=Indkomst, subcategory=Løn, merchant=Arbejdsgiver ApS, confidence=1.0
```
