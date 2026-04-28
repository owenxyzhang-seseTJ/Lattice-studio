#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import socket
import sys
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, List

from rdkit import Chem
from rdkit.Chem import AllChem


ROOT = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
HOST = os.environ.get("LATTICE_STUDIO_HOST", "127.0.0.1")
PORT = int(os.environ.get("LATTICE_STUDIO_PORT", "8765"))


def has_meaningful_3d_coordinates(mol: Chem.Mol) -> bool:
    if mol.GetNumConformers() == 0:
      return False

    conf = mol.GetConformer()
    zs = [float(conf.GetAtomPosition(i).z) for i in range(mol.GetNumAtoms())]
    return (max(zs) - min(zs)) > 0.08


def build_force_field(mol: Chem.Mol, method: str):
    chosen = method.upper()

    if chosen in ("AUTO", "MMFF"):
        if AllChem.MMFFHasAllMoleculeParams(mol):
            props = AllChem.MMFFGetMoleculeProperties(mol, mmffVariant="MMFF94")
            ff = AllChem.MMFFGetMoleculeForceField(mol, props)
            return ff, "MMFF94"
        if chosen == "MMFF":
            raise ValueError("MMFF 参数不可用")

    if chosen in ("AUTO", "UFF"):
        if AllChem.UFFHasAllMoleculeParams(mol):
            ff = AllChem.UFFGetMoleculeForceField(mol)
            return ff, "UFF"
        if chosen == "UFF":
            raise ValueError("UFF 参数不可用")

    raise ValueError("当前分子无法使用 MMFF/UFF 力场")


def optimize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    molblock = payload.get("molblock")
    if not molblock or not isinstance(molblock, str):
        raise ValueError("缺少 molblock")

    method = str(payload.get("method", "AUTO")).upper()
    max_iters = int(payload.get("maxIters", 500))
    request_reembed = bool(payload.get("reembed", False))

    mol = Chem.MolFromMolBlock(molblock, removeHs=False, sanitize=True)
    if mol is None:
        raise ValueError("无法解析 molblock")

    original_count = mol.GetNumAtoms()
    mol = Chem.AddHs(mol)
    mol.UpdatePropertyCache(strict=False)

    need_embed = request_reembed or not has_meaningful_3d_coordinates(mol)
    if need_embed:
        params = AllChem.ETKDGv3()
        params.randomSeed = 0xF00D
        params.useRandomCoords = True
        status = AllChem.EmbedMolecule(mol, params)
        if status != 0:
            raise ValueError("构象嵌入失败")

    force_field, method_used = build_force_field(mol, method)
    force_field.Initialize()
    force_field.Minimize(maxIts=max_iters)
    energy = float(force_field.CalcEnergy())
    conf = mol.GetConformer()

    coordinates: List[List[float]] = []
    for atom_index in range(original_count):
        position = conf.GetAtomPosition(atom_index)
        coordinates.append([float(position.x), float(position.y), float(position.z)])

    return {
        "ok": True,
        "method": method_used,
        "energy": energy,
        "reembedded": need_embed,
        "coordinates": coordinates,
        "molblock": Chem.MolToMolBlock(mol),
    }


class LatticeStudioHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_POST(self):
        if self.path.rstrip("/") != "/api/optimize":
            self.send_error(HTTPStatus.NOT_FOUND, "Not Found")
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(length)

        try:
            payload = json.loads(raw_body.decode("utf-8"))
            result = optimize_payload(payload)
            self._write_json(HTTPStatus.OK, result)
        except Exception as exc:  # noqa: BLE001
            self._write_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": str(exc)})

    def do_GET(self):
        if self.path.rstrip("/") == "/healthz":
            self._write_json(HTTPStatus.OK, {"ok": True})
            return

        if self.path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def log_message(self, format: str, *args):  # noqa: A003
        print(f"[LatticeStudio] {self.address_string()} - {format % args}")

    def _write_json(self, status: HTTPStatus, payload: Dict[str, Any]):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def is_port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.4)
        return sock.connect_ex((host, port)) == 0


def create_server(host: str = HOST, port: int = PORT) -> ThreadingHTTPServer:
    return ThreadingHTTPServer((host, port), LatticeStudioHandler)


def main():
    if is_port_open(HOST, PORT):
        raise SystemExit(f"http://{HOST}:{PORT} 已在运行")

    server = create_server(HOST, PORT)
    print(f"Lattice Studio running at http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
