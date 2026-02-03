#!/bin/bash
# SmartSpender Enable Banking Sync
# Interactive script for syncing transactions via Enable Banking API

set -e

# Force C locale for numeric operations (decimal separator = period)
export LC_NUMERIC=C

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$HOME/Documents/SmartSpender"
OUTPUT_FILE="$OUTPUT_DIR/transactions.csv"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
  echo ""
  echo -e "${BLUE}🔄 SmartSpender Sync${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━"
  echo ""
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}!${NC} $1"
}

# Check dependencies
check_dependencies() {
  if ! command -v jq &> /dev/null; then
    print_error "jq is required but not installed."
    echo "  Install with: brew install jq"
    exit 1
  fi

  if ! command -v python3 &> /dev/null; then
    print_error "python3 is required but not installed."
    exit 1
  fi

  if [[ ! -f "$SCRIPT_DIR/eb-api.py" ]]; then
    print_error "eb-api.py not found in $SCRIPT_DIR"
    exit 1
  fi
}

# Check session status
check_session() {
  local status_json
  status_json=$(python3 "$SCRIPT_DIR/eb-api.py" status 2>&1) || true

  local session_status
  session_status=$(echo "$status_json" | jq -r '.status // "error"')

  case "$session_status" in
    "active")
      local days_remaining
      days_remaining=$(echo "$status_json" | jq -r '.days_remaining // "?"')
      print_success "Session active ($days_remaining days remaining)"
      return 0
      ;;
    "no_session"|"expired")
      print_warning "No active session. Starting authorization flow..."
      start_auth_flow
      return $?
      ;;
    "error")
      local error_msg
      error_msg=$(echo "$status_json" | jq -r '.error // "Unknown error"')
      if [[ "$error_msg" == *"Config not found"* ]]; then
        print_error "Enable Banking not configured."
        echo "  Run the setup first. See: smartspender.mentilead.com/setup"
        exit 1
      fi
      print_error "Session check failed: $error_msg"
      exit 1
      ;;
    *)
      print_error "Unknown session status: $session_status"
      exit 1
      ;;
  esac
}

# Start authorization flow
start_auth_flow() {
  echo ""
  echo "Which bank do you want to connect?"
  echo "  Common options: Nykredit, Danske Bank, Nordea, Jyske Bank"
  echo ""
  read -p "Bank name: " bank_name

  if [[ -z "$bank_name" ]]; then
    print_error "Bank name is required."
    exit 1
  fi

  echo ""
  echo "Starting authorization with $bank_name..."
  echo "A browser window will open for MitID login."
  echo ""

  local auth_result
  auth_result=$(python3 "$SCRIPT_DIR/eb-api.py" auth --bank "$bank_name" 2>&1) || true

  local status
  status=$(echo "$auth_result" | jq -r '.status // "error"')

  if [[ "$status" == "session_created" ]]; then
    local account_count
    account_count=$(echo "$auth_result" | jq -r '.account_count // 0')
    print_success "Authorization successful! Found $account_count account(s)."
    return 0
  else
    local error_msg
    error_msg=$(echo "$auth_result" | jq -r '.error // .message // "Unknown error"')
    print_error "Authorization failed: $error_msg"
    exit 1
  fi
}

# Get and display accounts
get_accounts() {
  local accounts_json
  accounts_json=$(python3 "$SCRIPT_DIR/eb-api.py" accounts 2>&1) || true

  local status
  status=$(echo "$accounts_json" | jq -r '.status // "error"')

  if [[ "$status" != "ok" ]]; then
    local error_msg
    error_msg=$(echo "$accounts_json" | jq -r '.error // "Unknown error"')
    print_error "Failed to get accounts: $error_msg"
    exit 1
  fi

  echo "$accounts_json"
}

display_accounts() {
  local accounts_json="$1"
  local account_count
  account_count=$(echo "$accounts_json" | jq -r '.account_count')

  echo ""
  echo "Your accounts:"

  local i=1
  while IFS= read -r account; do
    local name product iban currency masked_iban
    name=$(echo "$account" | jq -r '.name // .product // "Unknown"')
    product=$(echo "$account" | jq -r '.product // ""')
    iban=$(echo "$account" | jq -r '.iban // ""')
    currency=$(echo "$account" | jq -r '.currency // "DKK"')

    # Create display name
    local display_name="$name"
    if [[ -n "$product" && "$product" != "$name" && "$product" != "null" ]]; then
      display_name="$product"
    fi

    # Mask IBAN
    if [[ -n "$iban" && "$iban" != "null" ]]; then
      masked_iban="${iban:0:4}...${iban: -4}"
    else
      masked_iban="N/A"
    fi

    echo "  [$i] $display_name ($masked_iban) - $currency"
    ((i++))
  done < <(echo "$accounts_json" | jq -c '.accounts[]')

  echo "  [$i] All accounts"
  echo "  [0] Exit"
  echo ""
}

# Select accounts
select_accounts() {
  local accounts_json="$1"
  local account_count
  account_count=$(echo "$accounts_json" | jq -r '.account_count')
  local all_option=$((account_count + 1))

  read -p "Select accounts to sync (e.g., 1,2 or $all_option for all): " selection

  if [[ "$selection" == "0" ]]; then
    echo "Exiting."
    exit 0
  fi

  # Parse selection
  local selected_indices=()

  if [[ "$selection" == "$all_option" ]]; then
    # Select all accounts
    for ((i=1; i<=account_count; i++)); do
      selected_indices+=($i)
    done
  else
    # Parse comma-separated values
    IFS=',' read -ra parts <<< "$selection"
    for part in "${parts[@]}"; do
      local num
      num=$(echo "$part" | tr -d ' ')
      if [[ "$num" =~ ^[0-9]+$ ]] && [[ "$num" -ge 1 ]] && [[ "$num" -le "$account_count" ]]; then
        selected_indices+=("$num")
      else
        print_error "Invalid selection: $num"
        exit 1
      fi
    done
  fi

  if [[ ${#selected_indices[@]} -eq 0 ]]; then
    print_error "No accounts selected."
    exit 1
  fi

  # Build list of account UIDs
  local selected_uids=()
  for idx in "${selected_indices[@]}"; do
    local uid
    uid=$(echo "$accounts_json" | jq -r ".accounts[$((idx-1))].uid")
    selected_uids+=("$uid")
  done

  echo "${selected_uids[@]}"
}

# Calculate date range
get_date_from() {
  # 90 days ago
  if date -v-90d +%Y-%m-%d 2>/dev/null; then
    return
  fi
  # Linux fallback
  date -d '90 days ago' +%Y-%m-%d
}

get_date_to() {
  date +%Y-%m-%d
}

# Get account name by UID
get_account_name() {
  local accounts_json="$1"
  local uid="$2"
  echo "$accounts_json" | jq -r ".accounts[] | select(.uid == \"$uid\") | .product // .name // \"Unknown\""
}

# Transform transaction to CSV row
transform_transaction() {
  local tx="$1"
  local account_uid="$2"
  local synced_at="$3"

  # Extract fields
  local booking_date status credit_debit_indicator
  booking_date=$(echo "$tx" | jq -r '.booking_date // ""')
  status=$(echo "$tx" | jq -r '.status // ""')
  credit_debit_indicator=$(echo "$tx" | jq -r '.credit_debit_indicator // ""')

  # Only process BOOK status
  if [[ "$status" != "BOOK" ]]; then
    return 1
  fi

  # Skip if no booking date
  if [[ -z "$booking_date" || "$booking_date" == "null" ]]; then
    return 1
  fi

  # Amount calculation
  local amount_str amount
  amount_str=$(echo "$tx" | jq -r '.transaction_amount.amount // "0"')
  amount=$(printf "%.2f" "$amount_str")

  if [[ "$credit_debit_indicator" == "DBIT" ]]; then
    amount="-$amount"
  fi

  # Currency
  local currency
  currency=$(echo "$tx" | jq -r '.transaction_amount.currency // "DKK"')

  # Description
  local description=""
  if [[ "$credit_debit_indicator" == "DBIT" ]]; then
    description=$(echo "$tx" | jq -r '.creditor.name // ""')
  else
    description=$(echo "$tx" | jq -r '.debtor.name // ""')
  fi

  if [[ -z "$description" || "$description" == "null" ]]; then
    description=$(echo "$tx" | jq -r '.remittance_information[0] // ""')
  fi

  if [[ -z "$description" || "$description" == "null" ]]; then
    description=$(echo "$tx" | jq -r '.bank_transaction_code.description // "Unknown"')
  fi

  # Clean description
  description=$(echo "$description" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -s ' ')

  # Raw text
  local raw_text
  raw_text=$(echo "$tx" | jq -r '.remittance_information | if type == "array" then join(" ") else . // "" end')
  if [[ -z "$raw_text" || "$raw_text" == "null" ]]; then
    raw_text="$description"
  fi

  # Balance after transaction (for tx_hash)
  local balance_after balance_indicator saldo
  balance_after=$(echo "$tx" | jq -r '.balance_after_transaction.amount // ""')
  balance_indicator=$(echo "$tx" | jq -r '.balance_after_transaction.credit_debit_indicator // ""')

  # Calculate tx_hash
  local tx_hash
  if [[ -n "$balance_after" && "$balance_after" != "null" ]]; then
    saldo=$(printf "%.2f" "$balance_after")
    if [[ "$balance_indicator" == "DBIT" ]]; then
      saldo="-$saldo"
    fi
    tx_hash="${account_uid}|${booking_date}|${amount}|${saldo}"
  else
    # Fallback: use normalized raw_text
    local raw_text_normalized
    raw_text_normalized=$(echo "$raw_text" | tr '[:upper:]' '[:lower:]' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    tx_hash="${account_uid}|${booking_date}|${amount}|${raw_text_normalized}"
  fi

  # Generate UUID for tx_id
  local tx_id
  if command -v uuidgen &> /dev/null; then
    tx_id=$(uuidgen | tr '[:upper:]' '[:lower:]')
  else
    tx_id=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "$(date +%s)-$RANDOM-$RANDOM")
  fi

  # Escape fields for CSV (handle commas and quotes)
  escape_csv() {
    local field="$1"
    if [[ "$field" == *","* || "$field" == *"\""* || "$field" == *$'\n'* ]]; then
      field="${field//\"/\"\"}"
      field="\"$field\""
    fi
    echo "$field"
  }

  # Output CSV row
  local csv_row
  csv_row="$(escape_csv "$tx_id"),$(escape_csv "$tx_hash"),$(escape_csv "$booking_date"),$(escape_csv "$amount"),$(escape_csv "$currency"),$(escape_csv "$description"),$(escape_csv "$raw_text"),enable-banking,$(escape_csv "$account_uid"),$(escape_csv "$synced_at")"

  echo "$csv_row"
  return 0
}

# Sync transactions for selected accounts
sync_transactions() {
  local accounts_json="$1"
  shift
  local selected_uids=("$@")

  local date_from date_to
  date_from=$(get_date_from)
  date_to=$(get_date_to)

  echo ""
  echo "Syncing transactions from $date_from to $date_to..."
  echo ""

  # Ensure output directory exists
  mkdir -p "$OUTPUT_DIR"

  # Create CSV header if file doesn't exist
  if [[ ! -f "$OUTPUT_FILE" ]]; then
    echo "tx_id,tx_hash,date,amount,currency,description,raw_text,bank,account,synced_at" > "$OUTPUT_FILE"
  fi

  # Load existing hashes for deduplication
  local existing_hashes
  existing_hashes=$(tail -n +2 "$OUTPUT_FILE" 2>/dev/null | cut -d',' -f2 | sort -u)

  local total_count=0
  local synced_at
  synced_at=$(date '+%Y-%m-%d %H:%M:%S')

  for uid in "${selected_uids[@]}"; do
    local account_name
    account_name=$(get_account_name "$accounts_json" "$uid")

    # Fetch transactions
    local tx_result
    tx_result=$(python3 "$SCRIPT_DIR/eb-api.py" transactions --account "$uid" --from "$date_from" --to "$date_to" 2>&1) || true

    local status
    status=$(echo "$tx_result" | jq -r '.status // "error"')

    if [[ "$status" == "error" ]]; then
      local error_type error_msg
      error_type=$(echo "$tx_result" | jq -r '.error // ""')
      error_msg=$(echo "$tx_result" | jq -r '.message // .details // "Unknown error"')

      if [[ "$error_type" == "rate_limit" ]]; then
        print_warning "$account_name: PSD2 rate limit reached. Skipping."
        continue
      fi

      print_error "$account_name: $error_msg"
      continue
    fi

    # Check for rate limit warning
    local warning
    warning=$(echo "$tx_result" | jq -r '.warning // ""')
    if [[ -n "$warning" && "$warning" != "null" ]]; then
      print_warning "$warning"
    fi

    # Process transactions
    local tx_count new_count dup_count
    tx_count=$(echo "$tx_result" | jq -r '.transaction_count // 0')
    new_count=0
    dup_count=0

    # Count transactions by status for verbose output
    local status_counts
    status_counts=$(echo "$tx_result" | jq -r '[.transactions[].status] | group_by(.) | map({status: .[0], count: length}) | .[] | "\(.status):\(.count)"' | tr '\n' ' ')

    while IFS= read -r tx; do
      local csv_row
      csv_row=$(transform_transaction "$tx" "$uid" "$synced_at") || continue

      # Extract tx_hash for deduplication
      local tx_hash
      tx_hash=$(echo "$csv_row" | cut -d',' -f2)

      # Check for duplicates
      if echo "$existing_hashes" | grep -qF "$tx_hash"; then
        ((dup_count++))
        continue
      fi

      # Append to CSV
      echo "$csv_row" >> "$OUTPUT_FILE"
      existing_hashes="$existing_hashes"$'\n'"$tx_hash"
      ((new_count++))
    done < <(echo "$tx_result" | jq -c '.transactions[]')

    # Build detail string
    local details="fetched: $tx_count [$status_counts]"
    if [[ $dup_count -gt 0 ]]; then
      details="$details, $dup_count duplicates skipped"
    fi

    print_success "$account_name: $new_count new transactions ($details)"
    total_count=$((total_count + new_count))
  done

  echo ""
  if [[ $total_count -gt 0 ]]; then
    print_success "Total: $total_count new transactions saved to $OUTPUT_FILE"
  else
    echo "No new transactions to sync."
  fi
}

# Main entry point
main() {
  print_header
  check_dependencies

  echo "Checking session..."
  check_session

  # Get accounts
  local accounts_json
  accounts_json=$(get_accounts)

  # Display account menu
  display_accounts "$accounts_json"

  # Get user selection
  local selected_uids
  read -ra selected_uids <<< "$(select_accounts "$accounts_json")"

  # Sync transactions
  sync_transactions "$accounts_json" "${selected_uids[@]}"

  echo ""
}

# Handle network errors
trap 'print_error "Cannot reach Enable Banking API. Check your connection."; exit 1' ERR

main "$@"
