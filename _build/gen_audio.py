"""Generate the bundled pronunciation audio pack + manifest.

Input : _build/texts.json      (unique spoken strings, Traditional Chinese)
Output: assets/audio/<hash>.mp3 (zh-CN neural voice, simplified text fed to TTS)
        assets/js/data/audio-pack.js (window.PSC_AUDIO = {map:{text:hash}})
"""
import asyncio
import hashlib
import json
import os
import sys

import edge_tts
from opencc import OpenCC

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(ROOT, "assets", "audio")
MANIFEST = os.path.join(ROOT, "assets", "js", "data", "audio-pack.js")
VOICE = "zh-CN-XiaoxiaoNeural"
CONCURRENCY = 4

cc = OpenCC("t2s")


def key(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]


async def synth(text: str, path: str, sem: asyncio.Semaphore) -> bool:
    if os.path.exists(path) and os.path.getsize(path) > 500:
        return True
    spoken = cc.convert(text)
    for attempt in range(3):
        async with sem:
            try:
                com = edge_tts.Communicate(spoken, VOICE, rate="+0%")
                await com.save(path)
                if os.path.getsize(path) > 500:
                    return True
                print("  ! empty:", text, file=sys.stderr)
            except Exception as exc:  # noqa: BLE001
                print(f"  ! {text!r} attempt {attempt + 1}: {exc}", file=sys.stderr)
                await asyncio.sleep(1.5 * (attempt + 1))
    return False


async def main() -> None:
    texts = json.load(open(os.path.join(ROOT, "_build", "texts.json"), encoding="utf-8"))
    os.makedirs(AUDIO_DIR, exist_ok=True)
    sem = asyncio.Semaphore(CONCURRENCY)
    tasks = []
    mapping = {}
    for t in texts:
        k = key(t)
        mapping[t] = k
        tasks.append(synth(t, os.path.join(AUDIO_DIR, k + ".mp3"), sem))
    results = await asyncio.gather(*tasks)
    failed = [t for t, ok in zip(texts, results) if not ok]
    print(f"generated {len(texts) - len(failed)}/{len(texts)} clips, failed {len(failed)}")
    if failed:
        for t in failed[:10]:
            print("  FAILED:", t, file=sys.stderr)
        sys.exit(1)
    body = json.dumps(mapping, ensure_ascii=False, separators=(",", ":"))
    with open(MANIFEST, "w", encoding="utf-8") as fh:
        fh.write("/* 發音音檔索引：文字 → 音檔（assets/audio/<hash>.mp3） */\n")
        fh.write(f"window.PSC_AUDIO = {{ voice: '{VOICE}', dir: 'assets/audio/', map: {body} }};\n")
    total = sum(os.path.getsize(os.path.join(AUDIO_DIR, f)) for f in os.listdir(AUDIO_DIR))
    print(f"manifest: {len(mapping)} entries, audio pack {total / 1024:.0f} KB")


asyncio.run(main())
