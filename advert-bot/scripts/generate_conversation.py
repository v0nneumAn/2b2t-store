#!/usr/bin/env python3
"""
Generate AI conversation scripts for the 2b2t advert bot.

Usage:
    export OPENAI_API_KEY=...
    python scripts/generate_conversation.py --prompt prompts/conversation_v1.txt --output ../generated/conv-$(date +%s).json
"""

import argparse
import json
import os
import sys
from pathlib import Path

try:
    import openai
except ImportError:
    print("openai package not installed. Run: pip install openai")
    sys.exit(1)


def load_prompt(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def generate_conversation(prompt: str, model: str = "gpt-4o-mini") -> dict:
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant that writes natural Minecraft 2b2t chat conversations. "
                    "Output only valid JSON."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.9,
        max_tokens=1200,
    )
    content = response.choices[0].message.content
    return json.loads(content)


def main():
    parser = argparse.ArgumentParser(description="Generate advert conversation scripts")
    parser.add_argument("--prompt", default="prompts/conversation_v1.txt", help="Path to prompt file")
    parser.add_argument("--output", required=True, help="Output JSON file path")
    parser.add_argument("--model", default="gpt-4o-mini", help="OpenAI model to use")
    args = parser.parse_args()

    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY not set")
        sys.exit(1)

    prompt = load_prompt(args.prompt)
    conversation = generate_conversation(prompt, model=args.model)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(conversation, indent=2), encoding="utf-8")
    print(f"Wrote conversation to {output_path}")


if __name__ == "__main__":
    main()
