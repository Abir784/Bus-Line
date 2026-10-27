#!/usr/bin/env python3
"""Daemonize the Next.js dev server using a classic double-fork."""
import os
import sys
import time

WORK_DIR = '/home/z/my-project'
LOG_FILE = '/home/z/my-project/dev.log'
PID_FILE = '/home/z/my-project/dev-server.pid'


def daemonize():
    if os.fork() > 0:
        sys.exit(0)
    os.setsid()
    if os.fork() > 0:
        sys.exit(0)
    sys.stdout.flush()
    sys.stderr.flush()
    with open('/dev/null', 'rb') as f:
        os.dup2(f.fileno(), 0)
    with open(LOG_FILE, 'ab', buffering=0) as f:
        os.dup2(f.fileno(), 1)
        os.dup2(f.fileno(), 2)


def main():
    daemonize()
    with open(PID_FILE, 'w') as f:
        f.write(str(os.getpid()))
    os.chdir(WORK_DIR)
    os.execvp('./node_modules/.bin/next', ['./node_modules/.bin/next', 'dev', '-p', '3000'])


if __name__ == '__main__':
    main()
