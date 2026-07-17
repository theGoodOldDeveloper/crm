"""
CRM VPS deploy script (src-only redeploy)
Csak a src/ mappat csomagolja es kuldi fel, majd docker compose --build-et futtat.
Hasznalat: python deploy.py
"""

import paramiko
import tarfile
import os
import tempfile
import sys

# Config
HOST = "156.67.29.41"
USER = "photovegh"
PASSWORD = "Sususoft_0913"
REMOTE_DIR = "/opt/mcrm"
LOCAL_ROOT = os.path.dirname(os.path.abspath(__file__))

# 1. Tar: src/ + egyeb szukseges fajlok (NO node_modules/.next/data)
print("[1/4] Csomagolas...")
tmp = tempfile.mktemp(suffix=".tar.gz")

INCLUDE = [
    "src",
    "prisma",
    "public",
    "next.config.js",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.js",
    "Dockerfile",
    "docker-compose.yml",
    "docker-compose.prod.yml",
    "start.sh",
]

with tarfile.open(tmp, "w:gz") as tar:
    for item in INCLUDE:
        full = os.path.join(LOCAL_ROOT, item)
        if os.path.exists(full):
            tar.add(full, arcname=item)
        else:
            print(f"  SKIP (hianyzik): {item}")

size_mb = os.path.getsize(tmp) / 1024 / 1024
print(f"  OK: {tmp} ({size_mb:.1f} MB)")

# 2. SSH kapcsolat
print(f"\n[2/4] Kapcsolodas: {USER}@{HOST}...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
print("  OK: Kapcsolodva")

def run(cmd, timeout=60, check=True):
    print(f"  $ {cmd[:80]}{'...' if len(cmd) > 80 else ''}")
    stdin, stdout, stderr = client.exec_command(f"sudo -S bash -c '{cmd}'", timeout=timeout)
    stdin.write(PASSWORD + "\n")
    stdin.flush()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    code = stdout.channel.recv_exit_status()
    if out:
        for line in out.splitlines():
            print(f"    {line}")
    if err:
        for line in err.splitlines():
            if "sudo" not in line.lower() and line.strip():
                print(f"    WARN: {line}", file=sys.stderr)
    if check and code != 0:
        raise RuntimeError(f"Parancs sikertelen (exit {code}): {cmd}")
    return out

# 3. Feltoltes
print(f"\n[3/4] Feltoltes -> {REMOTE_DIR}/crm_deploy.tar.gz...")
sftp = client.open_sftp()
sftp.put(tmp, f"{REMOTE_DIR}/crm_deploy.tar.gz")
sftp.close()
print("  OK: Feltoltve")

# 4. Kicsomagolas + build
print("\n[4/4] Kicsomagolas es build (ez nehany percig tarthat)...")
run(f"cd {REMOTE_DIR} && tar -xzf crm_deploy.tar.gz && rm crm_deploy.tar.gz")
run(
    f"cd {REMOTE_DIR} && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build 2>&1 | tail -30",
    timeout=600,
)

# Ellenorzes
print("\nEllenorzes:")
run("docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'", check=False)

client.close()
os.unlink(tmp)
print("\nDeploy kesz! -> https://mcrm.thegoodolddeveloper.cloud")
