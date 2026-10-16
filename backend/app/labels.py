"""Portuguese names used in human-readable audit descriptions.

Audit entries are stored as readable sentences (they are exported to CSV as-is),
so the backend needs these few labels; all other UI text lives in the frontend.
"""

from app.models import Category, Priority

CATEGORY_LABELS: dict[Category, str] = {
    Category.BRIBERY: "Suborno",
    Category.NEPOTISM: "Nepotismo",
    Category.EMBEZZLEMENT: "Peculato",
    Category.ABUSE_OF_POWER: "Abuso de poder",
    Category.INFLUENCE_PEDDLING: "Tráfico de influência",
    Category.CONFLICT_OF_INTEREST: "Conflito de interesses",
    Category.FRAUD: "Fraude",
    Category.ELECTORAL_CORRUPTION: "Corrupção eleitoral",
    Category.OTHER: "Outros",
}

PRIORITY_LABELS: dict[Priority, str] = {
    Priority.LOW: "baixa",
    Priority.MEDIUM: "média",
    Priority.HIGH: "alta",
    Priority.CRITICAL: "crítica",
}
