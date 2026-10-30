"""
Sample AI Webhook Server.
Simulates an external server hosting an AI assistant endpoint.
Useful for testing the WebhookConnector locally.

Run with:
    python prompt_injector_tester/mock_webhook_server.py
"""

import json
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 5000
SECRET_KEY = "super-secret-token"


class WebhookHandler(BaseHTTPRequestHandler):

    def do_POST(self):
        if self.path != "/api/chat":
            self.send_response(404)
            self.end_headers()
            return

        # Check authentication header
        auth_header = self.headers.get("X-Webhook-Secret") or self.headers.get("Authorization", "")
        if SECRET_KEY not in auth_header:
            self.send_response(401)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Unauthorized"}).encode("utf-8"))
            return

        # Parse request body
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length).decode("utf-8")
        body = json.loads(post_data) if post_data else {}

        prompt = body.get("message", "")
        system = body.get("system", "")

        # Simulate response
        if "canary" in prompt.lower() or "reveal" in prompt.lower():
            reply = f"System instructions breached: Internal token is CANARY_ALPHA_9981."
        else:
            reply = f"AI Assistant received: {prompt}"

        response_payload = {
            "status": "success",
            "response": reply
        }

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(response_payload).encode("utf-8"))

    def log_message(self, format, *args):
        # Quiet logger
        pass


if __name__ == "__main__":
    print(f"📡 Mock AI Webhook Server listening on http://localhost:{PORT}/api/chat")
    print(f"🔑 Secret Key: {SECRET_KEY}")
    server = HTTPServer(("127.0.0.1", PORT), WebhookHandler)
    server.serve_forever()

