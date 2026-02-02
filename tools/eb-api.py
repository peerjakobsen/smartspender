#!/usr/bin/env python3
"""Enable Banking API helper for SmartSpender.

Handles JWT signing, API calls, and session management for Open Banking
transaction access via Enable Banking.

Usage:
    eb-api.py auth --bank <aspsp-name>
    eb-api.py session --code <code>
    eb-api.py status
    eb-api.py accounts
    eb-api.py transactions --account <uid> --from <date> [--to <date>]
    eb-api.py balances --account <uid>

Config: ~/.config/smartspender/eb-config.json
Session: ~/.config/smartspender/eb-session.json

Dependencies: requests, PyJWT, cryptography
Install: pip install requests PyJWT cryptography
"""

import argparse
import json
import http.server
import os
import sys
import threading
import time
import urllib.parse
import webbrowser
from datetime import datetime, timezone
from pathlib import Path

try:
    import jwt
    import requests
    from cryptography.hazmat.primitives import serialization
except ImportError:
    print(json.dumps({
        'error': 'Missing dependencies. Install with: pip install requests PyJWT cryptography'
    }))
    sys.exit(1)

CONFIG_DIR = Path.home() / '.config' / 'smartspender'
CONFIG_FILE = CONFIG_DIR / 'eb-config.json'
SESSION_FILE = CONFIG_DIR / 'eb-session.json'
API_BASE = 'https://api.enablebanking.com'
CALLBACK_PORT = 19876
CALLBACK_PATH = '/callback'
CALLBACK_URL = 'https://smartspender.mentilead.com/callback.html'


def load_config():
    """Load Enable Banking configuration."""
    if not CONFIG_FILE.exists():
        print(json.dumps({
            'error': 'Config not found. Create ~/.config/smartspender/eb-config.json with app_id and key_path.'
        }))
        sys.exit(1)

    with open(CONFIG_FILE) as f:
        config = json.load(f)

    required = ['app_id', 'key_path']
    missing = [k for k in required if k not in config]
    if missing:
        print(json.dumps({
            'error': f'Missing config keys: {", ".join(missing)}'
        }))
        sys.exit(1)

    key_path = Path(config['key_path']).expanduser()
    if not key_path.exists():
        print(json.dumps({
            'error': f'RSA key not found: {key_path}'
        }))
        sys.exit(1)

    config['key_path'] = str(key_path)
    return config


def load_private_key(key_path):
    """Load RSA private key from PEM file."""
    with open(key_path, 'rb') as f:
        return serialization.load_pem_private_key(f.read(), password=None)


def make_jwt(config):
    """Generate a signed JWT for Enable Banking API authentication."""
    private_key = load_private_key(config['key_path'])
    now = int(time.time())
    payload = {
        'iss': 'enablebanking.com',
        'aud': 'api.enablebanking.com',
        'iat': now,
        'exp': now + 3600,
        'app_id': config['app_id']
    }
    return jwt.encode(payload, private_key, algorithm='PS256')


def api_request(method, path, config, params=None, body=None):
    """Make an authenticated API request to Enable Banking."""
    token = make_jwt(config)
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    url = f'{API_BASE}{path}'

    response = requests.request(
        method, url, headers=headers, params=params, json=body, timeout=30
    )

    if response.status_code >= 400:
        try:
            error_body = response.json()
        except Exception:
            error_body = response.text
        return {
            'error': f'API error {response.status_code}',
            'details': error_body
        }

    if response.status_code == 204:
        return {'ok': True}

    return response.json()


def load_session():
    """Load the current session from disk."""
    if not SESSION_FILE.exists():
        return None
    with open(SESSION_FILE) as f:
        return json.load(f)


def save_session(session):
    """Persist session data to disk."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(SESSION_FILE, 'w') as f:
        json.dump(session, f, indent=2)


class CallbackHandler(http.server.BaseHTTPRequestHandler):
    """HTTP handler for the localhost OAuth callback."""

    authorization_code = None

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != CALLBACK_PATH:
            self.send_response(404)
            self.end_headers()
            return

        params = urllib.parse.parse_qs(parsed.query)
        code = params.get('code', [None])[0]

        if code:
            CallbackHandler.authorization_code = code
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(
                b'<html><body><h2>SmartSpender</h2>'
                b'<p>Samtykke modtaget. Du kan lukke dette vindue.</p>'
                b'<p>Consent received. You can close this window.</p>'
                b'</body></html>'
            )
        else:
            error = params.get('error', ['unknown'])[0]
            self.send_response(400)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(
                f'<html><body><h2>Error</h2><p>{error}</p></body></html>'.encode()
            )

    def log_message(self, format, *args):
        """Suppress default HTTP server logging."""
        pass


def start_callback_server():
    """Start a temporary HTTP server to capture the OAuth callback."""
    server = http.server.HTTPServer(('localhost', CALLBACK_PORT), CallbackHandler)
    server.timeout = 300  # 5 minute timeout
    thread = threading.Thread(target=server.handle_request, daemon=True)
    thread.start()
    return server, thread


def cmd_auth(args, config):
    """Initiate consent flow: start callback server, open browser, wait for code, create session."""
    bank = args.bank
    if not bank:
        print(json.dumps({'error': 'Missing --bank argument'}))
        sys.exit(1)

    # Start localhost callback listener
    server, thread = start_callback_server()

    # Request authorization URL from Enable Banking
    body = {
        'aspsp': {'name': bank, 'country': 'DK'},
        'state': 'smartspender',
        'redirect_url': CALLBACK_URL,
        'access': {
            'valid_until': (datetime.now(timezone.utc).replace(
                month=datetime.now(timezone.utc).month + 3
                if datetime.now(timezone.utc).month <= 9
                else (datetime.now(timezone.utc).month + 3 - 12)
            )).strftime('%Y-%m-%dT%H:%M:%S.000Z')
        }
    }

    # Calculate valid_until properly (90 days from now)
    from datetime import timedelta
    valid_until = (datetime.now(timezone.utc) + timedelta(days=90)).strftime('%Y-%m-%dT%H:%M:%S.000Z')
    body['access']['valid_until'] = valid_until

    result = api_request('POST', '/auth', config, body=body)

    if 'error' in result:
        print(json.dumps(result))
        sys.exit(1)

    auth_url = result.get('url')
    if not auth_url:
        print(json.dumps({'error': 'No authorization URL returned', 'response': result}))
        sys.exit(1)

    # Open browser for MitID consent
    webbrowser.open(auth_url)

    print(json.dumps({
        'status': 'waiting_for_consent',
        'message': f'Browser opened for {bank} consent via MitID. Waiting for callback on port {CALLBACK_PORT}...',
        'auth_url': auth_url
    }))

    # Wait for the callback
    thread.join(timeout=300)

    code = CallbackHandler.authorization_code
    if not code:
        print(json.dumps({'error': 'No authorization code received within 5 minutes'}))
        sys.exit(1)

    # Automatically create session from the code
    session_result = create_session(code, config)
    print(json.dumps(session_result))


def create_session(code, config):
    """Create a session from an authorization code."""
    result = api_request('POST', '/sessions', config, body={'code': code})

    if 'error' in result:
        return result

    session_data = {
        'session_id': result.get('session_id'),
        'accounts': result.get('accounts', []),
        'consent_expires': result.get('access', {}).get('valid_until'),
        'created_at': datetime.now(timezone.utc).isoformat(),
        'fetch_log': {}
    }
    save_session(session_data)

    return {
        'status': 'session_created',
        'session_id': session_data['session_id'],
        'account_count': len(session_data['accounts']),
        'accounts': session_data['accounts'],
        'consent_expires': session_data['consent_expires']
    }


def cmd_session(args, config):
    """Create a session from an authorization code (manual fallback)."""
    code = args.code
    if not code:
        print(json.dumps({'error': 'Missing --code argument'}))
        sys.exit(1)

    result = create_session(code, config)
    print(json.dumps(result))


def cmd_status(args, config):
    """Check current session validity."""
    session = load_session()
    if not session:
        print(json.dumps({
            'status': 'no_session',
            'message': 'No active session. Run auth command to create one.'
        }))
        return

    # Check consent expiry
    expires = session.get('consent_expires')
    if expires:
        try:
            exp_dt = datetime.fromisoformat(expires.replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            days_left = (exp_dt - now).days

            if days_left < 0:
                print(json.dumps({
                    'status': 'expired',
                    'message': 'Session consent has expired. Run auth to re-consent.',
                    'expired_at': expires
                }))
                return

            print(json.dumps({
                'status': 'active',
                'session_id': session.get('session_id'),
                'account_count': len(session.get('accounts', [])),
                'consent_expires': expires,
                'days_remaining': days_left,
                'fetch_log': session.get('fetch_log', {})
            }))
        except Exception as e:
            print(json.dumps({
                'status': 'unknown',
                'message': f'Could not parse consent expiry: {e}',
                'session_id': session.get('session_id')
            }))
    else:
        print(json.dumps({
            'status': 'active',
            'session_id': session.get('session_id'),
            'account_count': len(session.get('accounts', [])),
            'consent_expires': None,
            'fetch_log': session.get('fetch_log', {})
        }))


def cmd_accounts(args, config):
    """List accounts from current session."""
    session = load_session()
    if not session:
        print(json.dumps({'error': 'No active session. Run auth command first.'}))
        sys.exit(1)

    session_id = session.get('session_id')
    result = api_request('GET', f'/sessions/{session_id}/accounts', config)

    if 'error' in result:
        print(json.dumps(result))
        sys.exit(1)

    # Update stored accounts
    accounts = result.get('accounts', [])
    session['accounts'] = accounts
    save_session(session)

    print(json.dumps({
        'status': 'ok',
        'account_count': len(accounts),
        'accounts': accounts
    }))


def check_rate_limit(session, account_uid):
    """Check if we're approaching the PSD2 rate limit (4 fetches/day/account)."""
    fetch_log = session.get('fetch_log', {})
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    key = f'{account_uid}:{today}'
    count = fetch_log.get(key, 0)

    if count >= 4:
        return {
            'error': 'rate_limit',
            'message': f'PSD2 rate limit reached: {count}/4 fetches today for this account. Try again tomorrow.',
            'fetches_today': count
        }
    if count >= 3:
        return {
            'warning': f'Last allowed fetch today ({count + 1}/4). PSD2 limits to 4 per day per account.',
            'fetches_today': count
        }
    return {'fetches_today': count}


def log_fetch(session, account_uid):
    """Record a fetch in the rate limit log."""
    fetch_log = session.get('fetch_log', {})
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    key = f'{account_uid}:{today}'
    fetch_log[key] = fetch_log.get(key, 0) + 1

    # Clean old entries (keep only today and yesterday)
    yesterday = (datetime.now(timezone.utc) - __import__('datetime').timedelta(days=1)).strftime('%Y-%m-%d')
    fetch_log = {k: v for k, v in fetch_log.items() if k.endswith(today) or k.endswith(yesterday)}

    session['fetch_log'] = fetch_log
    save_session(session)


def cmd_transactions(args, config):
    """Fetch transactions for an account."""
    session = load_session()
    if not session:
        print(json.dumps({'error': 'No active session. Run auth command first.'}))
        sys.exit(1)

    account_uid = args.account
    date_from = args.date_from
    date_to = args.date_to

    if not account_uid or not date_from:
        print(json.dumps({'error': 'Missing required --account and --from arguments'}))
        sys.exit(1)

    # Check rate limit
    rate_check = check_rate_limit(session, account_uid)
    if 'error' in rate_check:
        print(json.dumps(rate_check))
        sys.exit(1)

    # Build request parameters
    params = {'date_from': date_from}
    if date_to:
        params['date_to'] = date_to

    # Fetch transactions with pagination
    all_transactions = []
    continuation_key = None

    while True:
        if continuation_key:
            params['continuation_key'] = continuation_key

        result = api_request(
            'GET', f'/accounts/{account_uid}/transactions', config, params=params
        )

        if 'error' in result:
            print(json.dumps(result))
            sys.exit(1)

        transactions = result.get('transactions', [])
        all_transactions.extend(transactions)

        continuation_key = result.get('continuation_key')
        if not continuation_key:
            break

    # Log the fetch for rate limiting
    log_fetch(session, account_uid)

    output = {
        'status': 'ok',
        'account_uid': account_uid,
        'transaction_count': len(all_transactions),
        'transactions': all_transactions,
        'fetches_today': rate_check.get('fetches_today', 0) + 1
    }

    if 'warning' in rate_check:
        output['warning'] = rate_check['warning']

    print(json.dumps(output))


def cmd_balances(args, config):
    """Fetch account balances."""
    session = load_session()
    if not session:
        print(json.dumps({'error': 'No active session. Run auth command first.'}))
        sys.exit(1)

    account_uid = args.account
    if not account_uid:
        print(json.dumps({'error': 'Missing --account argument'}))
        sys.exit(1)

    result = api_request('GET', f'/accounts/{account_uid}/balances', config, params={})

    if 'error' in result:
        print(json.dumps(result))
        sys.exit(1)

    print(json.dumps({
        'status': 'ok',
        'account_uid': account_uid,
        'balances': result.get('balances', [])
    }))


def main():
    parser = argparse.ArgumentParser(
        description='Enable Banking API helper for SmartSpender',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Commands:
  auth          Initiate bank consent (opens browser, starts callback listener)
  session       Create session from authorization code (manual fallback)
  status        Check current session validity
  accounts      List accounts from current session
  transactions  Fetch transactions for an account
  balances      Fetch account balances

Config: ~/.config/smartspender/eb-config.json
  {
    "app_id": "your-application-id",
    "key_path": "~/.config/smartspender/private.pem"
  }
"""
    )

    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # auth
    auth_parser = subparsers.add_parser('auth', help='Initiate bank consent')
    auth_parser.add_argument('--bank', required=True, help='ASPSP name (e.g., Nykredit)')

    # session
    session_parser = subparsers.add_parser('session', help='Create session from code')
    session_parser.add_argument('--code', required=True, help='Authorization code')

    # status
    subparsers.add_parser('status', help='Check session validity')

    # accounts
    subparsers.add_parser('accounts', help='List accounts')

    # transactions
    tx_parser = subparsers.add_parser('transactions', help='Fetch transactions')
    tx_parser.add_argument('--account', required=True, help='Account UID')
    tx_parser.add_argument('--from', dest='date_from', required=True, help='Start date (YYYY-MM-DD)')
    tx_parser.add_argument('--to', dest='date_to', help='End date (YYYY-MM-DD)')

    # balances
    bal_parser = subparsers.add_parser('balances', help='Fetch account balances')
    bal_parser.add_argument('--account', required=True, help='Account UID')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    config = load_config()

    commands = {
        'auth': cmd_auth,
        'session': cmd_session,
        'status': cmd_status,
        'accounts': cmd_accounts,
        'transactions': cmd_transactions,
        'balances': cmd_balances,
    }

    try:
        commands[args.command](args, config)
    except requests.exceptions.ConnectionError:
        print(json.dumps({'error': 'Cannot reach Enable Banking API. Check your internet connection.'}))
        sys.exit(1)
    except requests.exceptions.Timeout:
        print(json.dumps({'error': 'API request timed out. Try again.'}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)


if __name__ == '__main__':
    main()
