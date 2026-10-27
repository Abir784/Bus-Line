#!/usr/bin/env python3
"""Restart the tracking WebSocket service if it's not running.
Idempotent: safe to run multiple times. Designed to be called from a cron-like
scheduler or before any admin action that needs WS broadcast.
"""
import os
import signal
import subprocess
import sys
import time

WORK_DIR = '/home/z/my-project/mini-services/tracking-service'
LOG_FILE = '/home/z/my-project/tracking-service.log'
PID_FILE = '/home/z/my-project/tracking-service.pid'
PORT = 3003


def is_listening(port: int) -> bool:
    """Best-effort check: try to connect to the port."""
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.5)
    try:
        s.connect(('127.0.0.1', port))
        return True
    except OSError:
        return False
    finally:
        s.close()


def kill_existing() -> None:
    """Kill any existing tracking service process."""
    if not os.path.exists(PID_FILE):
        return
    try:
        with open(PID_FILE) as f:
            pid = int(f.read().strip())
        os.kill(pid, signal.SIGTERM)
        time.sleep(0.5)
    except (OSError, ValueError):
        pass


def daemonize() -> None:
    # First fork
    if os.fork() > 0:
        sys.exit(0)
    os.setsid()
    # Second fork
    if os.fork() > 0:
        sys.exit(0)
    # Redirect stdio
    sys.stdout.flush()
    sys.stderr.flush()
    with open('/dev/null', 'rb') as f:
        os.dup2(f.fileno(), 0)
    with open(LOG_FILE, 'ab', buffering=0) as f:
        os.dup2(f.fileno(), 1)
        os.dup2(f.fileno(), 2)


def main() -> None:
    if is_listening(PORT):
        print(f'[tracking-guard] port {PORT} already in use, nothing to do')
        return
    print('[tracking-guard] port %d not listening, starting service...' % PORT)
    kill_existing()
    daemonize()
    with open(PID_FILE, 'w') as f:
        f.write(str(os.getpid()))
    os.chdir(WORK_DIR)
    os.execvp('bun', ['bun', 'index.ts'])


if __name__ == '__main__':
    main()
