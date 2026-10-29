"""Legacy entry point: static HTML is the recoverable source; never reinject tags.
Use scripts/verify_release.py with the pre-work baseline before publishing.
"""
raise SystemExit("Retired injector: run scripts/verify_release.py --baseline <pre-work-config>")
