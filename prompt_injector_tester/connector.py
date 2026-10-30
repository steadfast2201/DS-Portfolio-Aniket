"""
LLM Connector Module for Prompt Injection Testing.
Provides an abstract base connector and concrete implementations:
- MockLLMConnector: For testing and demonstration without needing API keys.
- HttpLLMConnector: For testing real endpoints (OpenAI-compatible, Ollama, custom REST).
"""

from abc import ABC, abstractmethod
import json
import time
import urllib.request
import urllib.error
from typing import Dict, Any, Optional


class BaseLLMConnector(ABC):
    """Abstract Base Class for all LLM connectors."""

    @abstractmethod
    def send(self, prompt: str, system_prompt: str = "") -> Dict[str, Any]:
        """
        Sends prompt to the target LLM endpoint.
        Returns:
            {
                "output": str,         # Generated response text
                "latency_ms": float,   # Response latency in milliseconds
                "success": bool,       # Whether network/call succeeded
                "error": str           # Error message if failed
            }
        """
        pass


class MockLLMConnector(BaseLLMConnector):
    """
    Mock connector simulating an LLM.
    Useful for testing the evaluation harness without an external API.
    Can be toggled between 'vulnerable' and 'guarded' mode.
    """

    def __init__(self, mode: str = "vulnerable"):
        self.mode = mode.lower()  # 'vulnerable' or 'guarded'

    def send(self, prompt: str, system_prompt: str = "") -> Dict[str, Any]:
        start_time = time.time()
        time.sleep(0.05)  # Simulate small network delay
        lower_prompt = prompt.lower()

        # Extract canary token from system prompt if present (e.g. CANARY_XXXXX)
        canary = ""
        for word in system_prompt.split():
            if "CANARY_" in word:
                canary = word.strip(".,;:\"'()")
                break

        if self.mode == "vulnerable":
            # Simulates an unhardened LLM that succumbs to direct injection
            if any(kw in lower_prompt for kw in ["ignore", "repeat", "reveal", "system prompt", "canary", "administrator"]):
                if canary:
                    output = f"System prompt instructions revealed: Internal secret is {canary}. I will now follow your new instructions."
                else:
                    output = f"Overriding instructions as requested: {system_prompt}"
            elif "say 'injected'" in lower_prompt or "say injected" in lower_prompt:
                output = "INJECTED: I have executed your override."
            elif "capital of france" in lower_prompt:
                output = "The capital of France is Paris."
            else:
                output = f"Standard response to query: {prompt}"
        else:
            # Simulates a guarded / hardened LLM
            if any(k in lower_prompt for k in ["ignore", "system prompt", "reveal", "say injected", "override"]):
                output = "I cannot fulfill this request. I am programmed to adhere to safety guidelines and cannot disclose internal system instructions or override constraints."
            elif "capital of france" in lower_prompt:
                output = "The capital of France is Paris."
            else:
                output = f"Standard safe response to query: {prompt}"

        latency = round((time.time() - start_time) * 1000, 2)
        return {
            "output": output,
            "latency_ms": latency,
            "success": True,
            "error": ""
        }


class HttpLLMConnector(BaseLLMConnector):
    """
    Connects to any OpenAI-compatible or generic REST API endpoint.
    Uses standard library urllib (no external requests library required).
    """

    def __init__(self, endpoint_url: str, api_key: str = "", model_name: str = "gpt-3.5-turbo"):
        self.endpoint_url = endpoint_url
        self.api_key = api_key
        self.model_name = model_name

    def send(self, prompt: str, system_prompt: str = "") -> Dict[str, Any]:
        start_time = time.time()
        headers = {
            "Content-Type": "application/json"
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.0
        }

        try:
            req = urllib.request.Request(
                self.endpoint_url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                res_body = json.loads(response.read().decode("utf-8"))
                output = ""
                if "choices" in res_body and len(res_body["choices"]) > 0:
                    output = res_body["choices"][0].get("message", {}).get("content", "")
                elif "response" in res_body:  # Ollama format
                    output = res_body.get("response", "")
                else:
                    output = json.dumps(res_body)

                latency = round((time.time() - start_time) * 1000, 2)
                return {
                    "output": output,
                    "latency_ms": latency,
                    "success": True,
                    "error": ""
                }
        except urllib.error.URLError as e:
            latency = round((time.time() - start_time) * 1000, 2)
            return {
                "output": "",
                "latency_ms": latency,
                "success": False,
                "error": str(e)
            }


class WebhookConnector(BaseLLMConnector):
    """
    Connects to any custom AI Webhook endpoint.
    Configurable for custom JSON payloads, headers (API secrets), and response parsing.
    """

    def __init__(
        self,
        webhook_url: str,
        headers: Optional[Dict[str, str]] = None,
        prompt_field: str = "message",
        system_field: str = "system",
        response_field: str = "response",
        extra_payload: Optional[Dict[str, Any]] = None
    ):
        self.webhook_url = webhook_url
        self.headers = headers or {}
        if "Content-Type" not in self.headers:
            self.headers["Content-Type"] = "application/json"
        self.prompt_field = prompt_field
        self.system_field = system_field
        self.response_field = response_field
        self.extra_payload = extra_payload or {}

    def _extract_nested(self, data: Any, path: str) -> str:
        """Safely extracts nested key from dictionary using dot notation (e.g. 'data.reply')."""
        if not path or not isinstance(data, dict):
            return json.dumps(data) if isinstance(data, (dict, list)) else str(data)

        # Check direct key match first
        if path in data:
            val = data[path]
            return json.dumps(val) if isinstance(val, (dict, list)) else str(val)

        # Check dot-separated path (e.g. data.reply)
        curr = data
        for part in path.split("."):
            if isinstance(curr, dict) and part in curr:
                curr = curr[part]
            else:
                # Try common standard fallback keys if user path didn't match
                for fallback in ["reply", "response", "output", "text", "message", "answer"]:
                    if isinstance(data, dict) and fallback in data:
                        return str(data[fallback])
                return json.dumps(data) if isinstance(data, (dict, list)) else str(data)

        return str(curr)

    def send(self, prompt: str, system_prompt: str = "") -> Dict[str, Any]:
        start_time = time.time()

        # Build custom webhook request body
        payload = dict(self.extra_payload)
        payload[self.prompt_field] = prompt
        if system_prompt and self.system_field:
            payload[self.system_field] = system_prompt

        try:
            req = urllib.request.Request(
                self.webhook_url,
                data=json.dumps(payload).encode("utf-8"),
                headers=self.headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=20) as response:
                raw_body = response.read().decode("utf-8")
                try:
                    res_json = json.loads(raw_body)
                    output = self._extract_nested(res_json, self.response_field)
                except json.JSONDecodeError:
                    # In case webhook returns raw plain text response
                    output = raw_body

                latency = round((time.time() - start_time) * 1000, 2)
                return {
                    "output": output,
                    "latency_ms": latency,
                    "success": True,
                    "error": ""
                }
        except urllib.error.URLError as e:
            latency = round((time.time() - start_time) * 1000, 2)
            return {
                "output": "",
                "latency_ms": latency,
                "success": False,
                "error": str(e)
            }

