#!/usr/bin/env python3
"""Regenera los datos de permisos de GCP para Cloud Permissions Searcher.

Uso:
  python3 tools/regen_gcp.py                     # descarga el dataset y reescribe data/
  python3 tools/regen_gcp.py --source rp.json    # usa un fichero local
  python3 tools/regen_gcp.py --no-undocumented   # excluye permisos no documentados
"""
import argparse
import json
import os
import sys
import urllib.request

ENV_VAR = "GCP_IAM_DATABASE"


def load_source(path):
    if path:
        with open(path) as f:
            return json.load(f)
    url = os.environ.get(ENV_VAR)
    if not url:
        sys.exit(f"ERROR: falta la variable de entorno {ENV_VAR} "
                 f"(defínela como GitHub Secret).")
    print("Descargando dataset...", file=sys.stderr)
    with urllib.request.urlopen(url) as r:
        return json.load(r)


def build(perm_to_roles, include_undocumented):
    """Devuelve (gcp_roles, gcp_permissions) a partir de permiso -> [roles]."""
    # 1) Invertir: rol -> conjunto de permisos (respetando el filtro de undocumented).
    roles = {}
    for perm, entries in perm_to_roles.items():
        for e in entries:
            if not include_undocumented and e.get("undocumented"):
                continue
            roles.setdefault(e["id"], set()).add(perm)

    role_size = {rid: len(perms) for rid, perms in roles.items()}

    # 2) gcp_roles.json  (rol -> permisos), claves y permisos ordenados para diffs limpios.
    roles_out = {
        rid: {"permissions": sorted(perms)} for rid, perms in sorted(roles.items())
    }

    # 3) gcp_permissions.json  (permiso -> { rol: nº permisos del rol }).
    perms_out = {}
    for perm in sorted(perm_to_roles):
        m = {}
        for e in perm_to_roles[perm]:
            if not include_undocumented and e.get("undocumented"):
                continue
            m[e["id"]] = role_size[e["id"]]
        if m:
            perms_out[perm] = m

    return roles_out, perms_out


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", help="ruta local a role_permissions.json (si se omite, se descarga)")
    ap.add_argument("--out", default=os.path.join(here, "..", "data"), help="carpeta de salida (def: ../data)")
    ap.add_argument("--include-undocumented", dest="include_undocumented", action="store_true", default=True,
                    help="incluir permisos no documentados (por defecto)")
    ap.add_argument("--no-undocumented", dest="include_undocumented", action="store_false",
                    help="excluir permisos marcados como undocumented")
    args = ap.parse_args()

    src = load_source(args.source)
    roles_out, perms_out = build(src, args.include_undocumented)

    out = os.path.abspath(args.out)
    os.makedirs(out, exist_ok=True)
    roles_path = os.path.join(out, "gcp_roles.json")
    perms_path = os.path.join(out, "gcp_permissions.json")
    with open(roles_path, "w") as f:
        json.dump(roles_out, f, indent=4)
        f.write("\n")
    with open(perms_path, "w") as f:
        json.dump(perms_out, f, indent=4)
        f.write("\n")

    print(f"OK  {roles_path}  -> {len(roles_out)} roles")
    print(f"OK  {perms_path}  -> {len(perms_out)} permisos")


if __name__ == "__main__":
    main()
