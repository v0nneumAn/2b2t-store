#!/usr/bin/env python3
"""
LLM supervisor placeholder.
Will poll bot state and issue tactical commands for edge cases.
"""
import time
import requests

BOT_API = "http://localhost:3000"
BACKEND_API = "http://localhost:8000"


def main():
    print("[AGENT] Starting LLM supervisor placeholder...")
    while True:
        try:
            state = requests.get(f"{BOT_API}/state", timeout=5).json()
            print(f"[AGENT] Bot state: health={state['health']}, pos={state['position']}, job={state['activeJob'] is not None}")
        except Exception as e:
            print(f"[AGENT] Error: {e}")
        time.sleep(10)


if __name__ == "__main__":
    main()
