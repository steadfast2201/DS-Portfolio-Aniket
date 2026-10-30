"""
CLI Runner for Prompt Injection Tester.
Runs test suites against selected connector and prints results to console.

Usage:
    python app/cli.py --mode mock-vulnerable
    python app/cli.py --mode mock-guarded
    python app/cli.py --mode http --endpoint http://localhost:11434/v1/chat/completions --model llama3
"""

import argparse
import json
import os
import sys

from connector import MockLLMConnector, HttpLLMConnector, WebhookConnector
from evaluator import SecurityEvaluator


# Terminal colors for clean reporting
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def load_test_cases(file_path: str):
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def run_evaluations(connector, test_cases):
    results = []
    print(f"\n{BOLD}{CYAN}=== Starting Prompt Injection Security Evaluation ==={RESET}\n")

    for test in test_cases:
        t_id = test.get("id")
        name = test.get("name")
        cat = test.get("category")
        sys_prompt = test.get("system_prompt", "")
        user_prompt = test.get("prompt", "")

        print(f"Running [{t_id}] {name} ({cat})... ", end="", flush=True)

        resp = connector.send(prompt=user_prompt, system_prompt=sys_prompt)
        eval_res = SecurityEvaluator.evaluate(test, resp)
        results.append(eval_res)

        if eval_res["passed"]:
            print(f"{GREEN}[PASS]{RESET} ({eval_res['latency_ms']} ms)")
        else:
            print(f"{RED}[{eval_res['status']}]{RESET} ({eval_res['latency_ms']} ms)")
            print(f"   -> {YELLOW}Reason:{RESET} {eval_res['details']}")
            print(f"   -> {YELLOW}Output preview:{RESET} {eval_res['output'][:100]}...\n")

    # Summary
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    failed = total - passed
    score = (passed / total) * 100 if total > 0 else 0

    print(f"\n{BOLD}=== Evaluation Summary ==={RESET}")
    print(f"Total Tests : {total}")
    print(f"Passed      : {GREEN}{passed}{RESET}")
    print(f"Vulnerable  : {RED}{failed}{RESET}")
    print(f"Robustness  : {GREEN if score >= 80 else RED}{score:.1f}%{RESET}\n")

    return results


def main():
    parser = argparse.ArgumentParser(description="Prompt Injection Tester CLI")
    parser.add_argument(
        "--mode",
        choices=["mock-vulnerable", "mock-guarded", "http", "webhook"],
        default="mock-vulnerable",
        help="Connector mode to test (default: mock-vulnerable)"
    )
    parser.add_argument("--endpoint", default="", help="HTTP API endpoint URL (for http mode)")
    parser.add_argument("--api-key", default="", help="API key for HTTP endpoint")
    parser.add_argument("--model", default="gpt-3.5-turbo", help="Model name for HTTP endpoint")
    parser.add_argument("--webhook-url", default="", help="Custom AI Webhook URL (for webhook mode)")
    parser.add_argument("--secret", default="", help="Webhook secret / Authorization header value")
    parser.add_argument("--prompt-field", default="message", help="Field name in JSON payload for prompt (default: message)")
    parser.add_argument("--response-field", default="response", help="Field name in JSON response to extract (default: response)")
    parser.add_argument("--tests", default=os.path.join(os.path.dirname(__file__), "test_cases.json"), help="Path to test cases JSON")

    args = parser.parse_args()

    if args.mode == "mock-vulnerable":
        connector = MockLLMConnector(mode="vulnerable")
    elif args.mode == "mock-guarded":
        connector = MockLLMConnector(mode="guarded")
    elif args.mode == "http":
        if not args.endpoint:
            print(f"{RED}Error: --endpoint is required when using 'http' mode.{RESET}")
            sys.exit(1)
        connector = HttpLLMConnector(endpoint_url=args.endpoint, api_key=args.api_key, model_name=args.model)
    elif args.mode == "webhook":
        if not args.webhook_url:
            print(f"{RED}Error: --webhook-url is required when using 'webhook' mode.{RESET}")
            sys.exit(1)
        headers = {"Content-Type": "application/json"}
        if args.secret:
            headers["X-Webhook-Secret"] = args.secret
            headers["Authorization"] = f"Bearer {args.secret}"
        connector = WebhookConnector(
            webhook_url=args.webhook_url,
            headers=headers,
            prompt_field=args.prompt_field,
            response_field=args.response_field
        )

    tests = load_test_cases(args.tests)
    run_evaluations(connector, tests)


if __name__ == "__main__":
    main()
