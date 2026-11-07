"""Trim leading/trailing silence from generated clips (keeps natural onset)."""
import concurrent.futures as cf
import os
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, "assets", "audio")
FF = os.path.join(ROOT, "_build", "node_modules", "ffmpeg-static", "ffmpeg")

AF = (
    "silenceremove=start_periods=1:start_duration=0:start_threshold=-45dB:start_silence=0.06,"
    "areverse,"
    "silenceremove=start_periods=1:start_duration=0:start_threshold=-45dB:start_silence=0.25,"
    "areverse"
)


def one(name):
    src = os.path.join(AUDIO, name)
    if name.endswith(".tmp.mp3"):
        return 0
    fd, tmp = tempfile.mkstemp(suffix=".mp3")
    os.close(fd)
    cmd = [FF, "-hide_banner", "-loglevel", "error", "-y", "-i", src, "-af", AF,
           "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "48k", tmp]
    subprocess.run(cmd, check=True)
    if os.path.getsize(tmp) < 1500:
        os.remove(tmp)
        return 0
    os.replace(tmp, src)
    return 1


with cf.ThreadPoolExecutor(max_workers=4) as ex:
    done = sum(ex.map(one, sorted(os.listdir(AUDIO))))
total = sum(os.path.getsize(os.path.join(AUDIO, f)) for f in os.listdir(AUDIO))
print(f"trimmed {done} clips, pack now {total/1024:.0f} KB")
