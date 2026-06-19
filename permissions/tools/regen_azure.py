#!/usr/bin/env python3
"""Regenera los datos de permisos de Azure para Cloud Permissions Searcher.

Uso:
  python3 tools/regen_azure.py                       # descarga el dataset y reescribe data/
  python3 tools/regen_azure.py --source roles.json   # usa un fichero local
  python3 tools/regen_azure.py --include-data-actions # incluye también dataActions
"""
import argparse
import json
import os
import sys
import urllib.request

ENV_VAR = "AZURE_IAM_DATABASE"


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


def build(data, include_data_actions):
    """Devuelve (azure_roles, azure_actions) a partir de la lista de definiciones."""
    # 1) rol -> conjunto de acciones (comodines incluidos). Se fusiona por nombre.
    roles = {}
    groups = {}
    for r in data:
        name = r.get("roleName")
        if not name:
            continue
        groups[name] = r.get("roleType", "BuiltInRole")
        acts = roles.setdefault(name, set())
        for blk in r.get("permissions", []):
            acts.update(blk.get("actions") or [])
            if include_data_actions:
                acts.update(blk.get("dataActions") or [])

    role_size = {name: len(acts) for name, acts in roles.items()}

    # 2) azure_roles.json  (rol -> acciones + group), ordenado para diffs limpios.
    roles_out = {
        name: {"permissions": sorted(acts), "group": groups[name]}
        for name, acts in sorted(roles.items())
    }

    # 3) azure_actions.json  (acción -> { rol: nº acciones del rol }).
    actions_out = {}
    for name, acts in roles.items():
        for action in acts:
            actions_out.setdefault(action, {})[name] = role_size[name]
    actions_out = {
        action: dict(sorted(actions_out[action].items()))
        for action in sorted(actions_out)
    }

    return roles_out, actions_out


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", help="ruta local a built-in-roles-raw.json (si se omite, se descarga)")
    ap.add_argument("--out", default=os.path.join(here, "..", "data"), help="carpeta de salida (def: ../data)")
    ap.add_argument("--include-data-actions", action="store_true",
                    help="añadir también los dataActions (plano de datos)")
    args = ap.parse_args()

    src = load_source(args.source)
    roles_out, actions_out = build(src, args.include_data_actions)

    out = os.path.abspath(args.out)
    os.makedirs(out, exist_ok=True)
    roles_path = os.path.join(out, "azure_roles.json")
    act_path = os.path.join(out, "azure_actions.json")
    with open(roles_path, "w") as f:
        json.dump(roles_out, f, indent=4)
        f.write("\n")
    with open(act_path, "w") as f:
        json.dump(actions_out, f, indent=4)
        f.write("\n")

    print(f"OK  {roles_path}  -> {len(roles_out)} roles")
    print(f"OK  {act_path}  -> {len(actions_out)} acciones")


if __name__ == "__main__":
    main()
