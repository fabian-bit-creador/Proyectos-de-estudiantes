#!/usr/bin/env python3
"""Sincroniza las descargas autónomas del portal con los HTML del repositorio.

python3 scripts/sync-portal.py          actualiza index.html
python3 scripts/sync-portal.py --check  comprueba sin escribir (salida 1 si difieren)
"""
import argparse
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PORTAL = ROOT / "index.html"
FILES_PATTERN = re.compile(
    r'(<script type="application/json" id="collection-files">)(.*?)(</script>)', re.S
)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    html = PORTAL.read_text(encoding="utf-8")
    # La navegación del propio portal es la única lista de rutas.
    routes_match = re.search(r"const RUTAS=\{(.*?)\};", html, re.S)
    if not routes_match:
        raise SystemExit("No se encontró la lista RUTAS del portal.")
    routes = dict(re.findall(r"([A-Za-z0-9_]+):'([^']+)'", routes_match.group(1)))
    match = FILES_PATTERN.search(html)
    if not match or not routes:
        raise SystemExit("Falta el bloque collection-files o las rutas.")
    stored = json.loads(match.group(2))
    current = {}
    for key, relative in routes.items():
        source = (ROOT / relative).resolve()
        if not source.is_relative_to(ROOT) or not source.is_file():
            raise SystemExit(f"Ruta inválida o archivo ausente: {relative}")
        current[key] = source.read_text(encoding="utf-8")
    changed = [key for key in current if stored.get(key) != current[key]]
    removed = sorted(set(stored) - set(current))
    if args.check:
        if changed or removed:
            raise SystemExit("Descargas desactualizadas: " + ", ".join(changed + removed))
        print(f"Las {len(current)} descargas coinciden con sus archivos.")
        return
    if not changed and not removed:
        print("El portal ya está sincronizado.")
        return
    # Un </script> del HTML embebido nunca debe cerrar el bloque JSON del portal.
    payload = json.dumps(current, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
    updated = html[:match.start(2)] + payload + html[match.end(2):]
    PORTAL.write_text(updated, encoding="utf-8")
    print("Descargas sincronizadas: " + ", ".join(changed + removed))


if __name__ == "__main__":
    main()
