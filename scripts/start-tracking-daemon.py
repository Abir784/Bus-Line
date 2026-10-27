#!/usr/bin/env python3
"""Daemonize the tracking service using a classic double-fork."""
import os
import sys
import subprocess
import time

WORK_DIR = '/home/z/my-project/mini-services/tracking-service'
LOG_FILE = '/home/z/my-project/tracking-service.log'
PID_FILE = '/home/z/my-project/tracking-service.pid'


def daemonize():
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


def main():
    daemonize()
    # Write pid file
    with open(PID_FILE, 'w') as f:
        f.write(str(os.getpid()))
    # Exec bun
    os.chdir(WORK_DIR)
    os.execvp('bun', ['bun', 'index.ts'])


if __name__ == '__main__':
    main()
