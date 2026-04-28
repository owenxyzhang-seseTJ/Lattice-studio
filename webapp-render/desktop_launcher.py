#!/usr/bin/env python3
from __future__ import annotations

import os
import threading
import webbrowser

os.environ.setdefault("TK_SILENCE_DEPRECATION", "1")

import tkinter as tk
from tkinter import ttk

from server import HOST, PORT, create_server, is_port_open


APP_TITLE = "Lattice Studio"


class LatticeStudioApp:
    def __init__(self):
        self.host = HOST
        self.port = PORT
        self.url = f"http://{self.host}:{self.port}"
        self.server = None
        self.server_thread = None
        self.server_started_here = False

        self.root = tk.Tk()
        self.root.title(APP_TITLE)
        self.root.geometry("420x220")
        self.root.minsize(420, 220)
        self.root.configure(bg="#f5f5f7")
        self.root.protocol("WM_DELETE_WINDOW", self.close)

        self.status_var = tk.StringVar(value="正在准备本地工作台…")
        self.detail_var = tk.StringVar(value=self.url)

        self._build_ui()
        self._start_server()
        self.root.after(700, self.open_browser)

    def _build_ui(self):
        style = ttk.Style(self.root)
        try:
            style.theme_use("aqua")
        except tk.TclError:
            pass

        container = ttk.Frame(self.root, padding=22)
        container.pack(fill="both", expand=True)

        title = ttk.Label(container, text="Lattice Studio", font=("SF Pro Display", 22, "bold"))
        title.pack(anchor="w")

        subtitle = ttk.Label(
            container,
            text="为分子与晶体而设计的本地可视化工作台",
            font=("SF Pro Text", 11),
        )
        subtitle.pack(anchor="w", pady=(4, 18))

        status = ttk.Label(container, textvariable=self.status_var, font=("SF Pro Text", 12))
        status.pack(anchor="w")

        detail = ttk.Label(container, textvariable=self.detail_var, font=("SF Pro Text", 10))
        detail.pack(anchor="w", pady=(6, 18))

        actions = ttk.Frame(container)
        actions.pack(anchor="w")

        open_button = ttk.Button(actions, text="打开工作台", command=self.open_browser)
        open_button.pack(side="left")

        quit_button = ttk.Button(actions, text="退出", command=self.close)
        quit_button.pack(side="left", padx=(10, 0))

        hint = ttk.Label(
            container,
            text="保持此窗口开启即可维持本地 RDKit 优化服务。关闭后服务会一并停止。",
            font=("SF Pro Text", 10),
            wraplength=360,
        )
        hint.pack(anchor="w", side="bottom", pady=(18, 0))

    def _start_server(self):
        if is_port_open(self.host, self.port):
            self.status_var.set("检测到工作台已经在运行")
            self.detail_var.set(f"已复用现有服务: {self.url}")
            return

        self.server = create_server(self.host, self.port)
        self.server_thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.server_thread.start()
        self.server_started_here = True
        self.status_var.set("本地服务已启动")
        self.detail_var.set(f"工作台地址: {self.url}")

    def open_browser(self):
        webbrowser.open(self.url)
        if self.server_started_here:
            self.status_var.set("工作台已打开")
        else:
            self.status_var.set("已打开现有工作台")

    def close(self):
        if self.server:
            self.server.shutdown()
            self.server.server_close()
            self.server = None
        self.root.destroy()

    def run(self):
        self.root.mainloop()


def main():
    app = LatticeStudioApp()
    app.run()


if __name__ == "__main__":
    main()
