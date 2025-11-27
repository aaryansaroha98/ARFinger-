#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == '__main__':
    os.chdir('.')
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving chess game at http://localhost:{PORT}")
        print("Open your browser and go to the URL above")
        httpd.serve_forever()
