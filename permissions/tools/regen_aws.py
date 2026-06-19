#!/usr/bin/env python3
"""Regenera los datos de permisos de AWS para Cloud Permissions Searcher.

Uso:
  python3 tools/regen_aws.py                  # descarga el dataset y reescribe data/
  python3 tools/regen_aws.py --source mp.json # usa un fichero local
"""
import argparse
import json
import os
import sys
import urllib.request

ENV_VAR = "AWS_IAM_DATABASE"


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


def build(data):
    """Devuelve (aws_policies, aws_actions) a partir del dataset de policies."""
    # 1) policy -> conjunto de acciones (incluye policies sin acciones, con lista vacía).
    policies = {}
    for p in data["policies"]:
        name = p.get("name")
        if not name:
            continue
        actions = p.get("effective_action_names") or []
        policies.setdefault(name, set()).update(actions)

    policy_size = {name: len(acts) for name, acts in policies.items()}

    # 2) aws_policies.json  (policy -> acciones), ordenado para diffs limpios.
    policies_out = {
        name: {"permissions": sorted(acts)} for name, acts in sorted(policies.items())
    }

    # 3) aws_actions.json  (acción -> { policy: nº acciones de la policy }).
    actions_out = {}
    for name, acts in policies.items():
        for action in acts:
            actions_out.setdefault(action, {})[name] = policy_size[name]
    actions_out = {
        action: dict(sorted(actions_out[action].items()))
        for action in sorted(actions_out)
    }

    return policies_out, actions_out


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", help="ruta local a managed_policies.json (si se omite, se descarga)")
    ap.add_argument("--out", default=os.path.join(here, "..", "data"), help="carpeta de salida (def: ../data)")
    args = ap.parse_args()

    src = load_source(args.source)
    policies_out, actions_out = build(src)

    out = os.path.abspath(args.out)
    os.makedirs(out, exist_ok=True)
    pol_path = os.path.join(out, "aws_policies.json")
    act_path = os.path.join(out, "aws_actions.json")
    with open(pol_path, "w") as f:
        json.dump(policies_out, f, indent=4)
        f.write("\n")
    with open(act_path, "w") as f:
        json.dump(actions_out, f, indent=4)
        f.write("\n")

    print(f"OK  {pol_path}  -> {len(policies_out)} policies")
    print(f"OK  {act_path}  -> {len(actions_out)} acciones")


if __name__ == "__main__":
    main()
