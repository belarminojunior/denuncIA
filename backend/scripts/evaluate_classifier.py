"""Measure the AI classifier against the reference labels in demo_data.py.

The AI suggestions stored by seed_db are hand-written examples. This script runs
the real classifier (LLM_MODE from .env: mock or ollama) on the same reports and
compares its answers with `expected_category` / `expected_priority`.

Usage (from the backend folder):
    python -m scripts.evaluate_classifier
    python -m scripts.evaluate_classifier --limit 5 --output avaliacao.csv
"""

import argparse
import csv
import time
from collections import Counter

from app.labels import CATEGORY_LABELS
from app.models import Category
from app.services.llm_service import classify_report
from scripts.demo_data import DEMO_REPORTS

CSV_HEADER = [
    "chave", "categoria_esperada", "categoria_ia", "categoria_correta", "prioridade_esperada", "prioridade_ia",
    "prioridade_correta", "confianca", "segundos", "erro",
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Avalia o classificador com as denúncias de referência.")
    parser.add_argument("--limit", type=int, help="avalia apenas as primeiras N denúncias")
    parser.add_argument("--output", default="avaliacao_classificador.csv", help="ficheiro CSV com os resultados")
    args = parser.parse_args()

    reports = DEMO_REPORTS[: args.limit] if args.limit else DEMO_REPORTS
    rows = []
    for number, spec in enumerate(reports, start=1):
        started = time.perf_counter()
        result = classify_report(spec.description)
        seconds = time.perf_counter() - started
        rows.append({
            "chave": spec.key,
            "categoria_esperada": spec.expected_category.value,
            "categoria_ia": result.category.value,
            "categoria_correta": result.category == spec.expected_category,
            "prioridade_esperada": spec.expected_priority.value,
            "prioridade_ia": result.priority.value,
            "prioridade_correta": result.priority == spec.expected_priority,
            "confianca": round(result.confidence, 2),
            "segundos": round(seconds, 1),
            "erro": result.error or "",
        })
        mark = "✓" if rows[-1]["categoria_correta"] else "✗"
        print(f"[{number}/{len(reports)}] {mark} {spec.key}: esperada {spec.expected_category.value}, "
              f"IA {result.category.value} ({seconds:.1f}s)")

    with open(args.output, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=CSV_HEADER)
        writer.writeheader()
        writer.writerows(rows)

    print_summary(rows)
    print(f"\nResultados detalhados em {args.output}")


def print_summary(rows: list[dict]) -> None:
    # Failed calls are reported separately: they measure availability, not accuracy.
    answered = [row for row in rows if not row["erro"]]
    print(f"\nDenúncias avaliadas: {len(rows)} · falhas do modelo: {len(rows) - len(answered)}")
    if not answered:
        return

    category_hits = sum(row["categoria_correta"] for row in answered)
    priority_hits = sum(row["prioridade_correta"] for row in answered)
    print(f"Exatidão da categoria:  {category_hits / len(answered):.0%} ({category_hits}/{len(answered)})")
    print(f"Exatidão da prioridade: {priority_hits / len(answered):.0%} ({priority_hits}/{len(answered)})")
    print(f"Tempo médio por denúncia: {sum(row['segundos'] for row in answered) / len(answered):.1f}s")

    totals = Counter(row["categoria_esperada"] for row in answered)
    hits = Counter(row["categoria_esperada"] for row in answered if row["categoria_correta"])
    print("\nAcerto por categoria (recall):")
    for category in Category:
        if totals[category.value]:
            print(f"  {CATEGORY_LABELS[category]:<24} {hits[category.value]}/{totals[category.value]}")


if __name__ == "__main__":
    main()
