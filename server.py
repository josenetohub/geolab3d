#!/usr/bin/env python3
"""
GeoLab 3D - Servidor Local Automático
Inicia o servidor HTTP e abre o jogo no navegador padrão.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

# Garante compatibilidade com o terminal do Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 8000

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

def start_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    port = PORT
    server = None
    for p in range(PORT, PORT + 20):
        try:
            server = socketserver.TCPServer(("", p), QuietHandler)
            port = p
            break
        except OSError:
            continue
            
    if not server:
        print("[ERRO] Nenhuma porta disponivel encontrada.")
        sys.exit(1)

    url = f"http://localhost:{port}"
    print("=" * 60)
    print("   GeoLab 3D - Laboratorio & Jogo de Geometria Espacial")
    print("=" * 60)
    print(f" Servidor iniciado com sucesso!")
    print(f" Acesse em seu navegador: {url}")
    print(" Pressione Ctrl+C para encerrar o servidor.")
    print("=" * 60)

    webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado. Obrigado por jogar GeoLab 3D!")
        server.server_close()

if __name__ == "__main__":
    start_server()
