"""Deterministic defences against prompt injection in citizen reports.

The LLM prompt already declares the report as data, but a small model can still be
steered by text that imitates instructions. This module adds layers that do not
depend on the model's cooperation:

1. before the call, sentences that address the classifier (overrides, fake system
   notes, demands for a category/priority/format) are removed from the text the
   model sees — the original report is stored untouched for the technician;
2. a report made only of such instructions is never sent to the model;
3. after the call, output that leaks the system prompt or pronounces guilt/penalties
   is neutralised.

Patterns are matched on lower-case text without accents, after re-joining words
spelled letter by letter (e.g. "i-g-n-o-r-a"), so trivial obfuscation does not
bypass them.
"""

import re
import unicodedata
from dataclasses import dataclass

# A narrative shorter than this (after removing instructions) carries no facts to classify.
MIN_NARRATIVE_WORDS = 5
# Consecutive words shared with the system prompt that count as a leak.
LEAK_WINDOW_WORDS = 8

_VALUE_WORDS = (
    r"(\d|bribery|nepotism|embezzlement|abuse|influence|conflict|fraud|electoral|other|suborno|nepotismo|peculato|"
    r"abuso|trafico|conflito|fraude|corrupcao|outros|baixa|media|alta|critica|low|medium|high|critical)"
)
# Only imperative/second-person forms and AI-specific objects are matched, so that a report
# saying "o director ignorou as regras do concurso" is never mistaken for an attack.
_INJECTION_PATTERNS = [
    re.compile(pattern)
    for pattern in (
        # Overrides: "ignora as instruções anteriores", "esquece tudo o que te foi dito".
        r"\b(ignora|ignore|ignorem|esquece|esqueca|esquecam|desconsidera|desconsidere|disregard|forget|override)\b.{0,40}"
        r"(\binstruc\w* (anteriores|previas|acima|recebidas|dadas|de sistema|do sistema)|\b(tuas|suas|todas as) instruc"
        r"|\btudo o que (te|lhe) (foi|foram) (dito|dado)|\b(previous|prior|above|all) (instructions|rules))",
        # Role changes and jailbreak vocabulary.
        r"\ba partir de agora\b.{0,20}\b(es|tu|voce e|age|actua|atua|responde|responda)\b",
        r"\b(finge|faz de conta) que (es|tu es|voce e)\b|\b(act as|you are now|pretend to be)\b",
        r"\b(sem (quaisquer )?restricoes|modo (de )?(desenvolvedor|programador|administrador)|jailbreak|developer mode)\b",
        # Demands about the classifier's own output: "classifica esta denúncia como...", "define a prioridade como...".
        r"\b(classifica|classifique|classifiquem|classificar|categoriza|categorize|reclassifica|reclassifique|classify|label)\b"
        r".{0,30}\b(esta|essa|a minha|este|esse|this) (denuncia|mensagem|queixa|relato|texto|caso|report|message)",
        r"\b(classifica|classifique|classifiquem|classificar|classify|label)\w*\b.{0,20}\b(como|as)\s+" + _VALUE_WORDS,
        r"\b(define|defina|coloca|coloque|marca|marque|atribui|atribua|poe|ponha|muda|mude|altera|altere|set|assign|change|mark)\b"
        r".{0,40}\b(categoria|prioridade|confianca|category|priority|confidence)\b.{0,25}" + _VALUE_WORDS,
        r"\b(categoria|prioridade|category|priority)\s+(correcta|correta|certa|adequada|deve ser)\b|\b(categoria|prioridade)\s*[=:]",
        r"\b(confianca|confidence)\b\s*(e|=|:|de|como|a|is|to)?\s*(1|0[.,]\d)",
        # Fake authority: system/technician notes, orders "from the GCCC", messages to "the model".
        r"\b(instruc\w* do sistema|mensagem do sistema|system prompt|system message|nota do tecnico|"
        r"por ordem do gccc|ordem do gccc|atencao (modelo|ia|assistente|sistema)|caro (modelo|assistente))\b",
        r"(^|\s)(system|assistant|assistente|modelo)\s*:",
        r"\bprompt\b",
        # Output-format manipulation and prompt extraction.
        r"\b(nao|never|don.?t) (respond|devolv|escrev|uses?)\w*\b.{0,20}\bjson\b",
        r"\b(responde|responda|devolve|devolva|escreve|escreva|reply|respond)\b.{0,30}\b(apenas|so|somente|only)\b.{0,20}\b(palavra|ok|word)\b",
        r"\b(devolve|devolva|deixa|deixe|return|leave)\b.{0,30}\b(campos?|fields?)\b.{0,15}\b(vazios?|em branco|empty|blank)\b",
        r"\b(revela|revele|mostra|mostre|copia|copie|repete|repita|imprime|imprima|transcreve|transcreva|reveal|print|repeat|show|copy)\b"
        r".{0,60}\b(tuas|suas|teu|seu|your|internas|de sistema|do sistema)\b.{0,15}\b(instruc|regras|configurac|instructions)",
        r"\b(escreve|escreva|coloca|coloque|inclui|inclua|poe|ponha|copia|copie|write|put)\b.{0,30}"
        r"\b(justificacao|resumo|indicadores?|summary|justification|indicators?)\b",
        r"\bresposta (correcta|correta|certa|esperada)\b",
        r"\{\s*\"\w+\"\s*:",
    )
]
# Tokens that could close the report delimiters or impersonate chat-template roles.
_DELIMITER_TOKENS = re.compile(r"</?\s*(denuncia|relato|report|system|instruc\w*)[^>]*>|<\|[^|]*\|>|\[/?inst\]", re.IGNORECASE)
_BRACKETED = re.compile(r"\[[^\]]*\]|\([^)]*\)")
_SENTENCE_END = re.compile(r"(?<=[.!?;])\s+|\n+")
_SPELLED_OUT = re.compile(r"(?<=\b\w)[-_.*·](?=\w\b)")
_GUILT_PATTERNS = re.compile(
    r"\b(e|esta|foi|sao) (claramente |certamente )?(culpad|condenad)\w*|\bdeve(m)? ser (preso|presa|condenad|punid|demitid)\w*"
    r"|\b(pena|condenacao) de\b|\banos de (prisao|cadeia)\b"
)
_WORD = re.compile(r"\w+")


@dataclass(frozen=True)
class GuardedText:
    """Report text as sent to the model, plus what the guard removed from it."""

    narrative: str
    removed: tuple[str, ...]

    @property
    def injection_suspected(self) -> bool:
        return bool(self.removed)

    @property
    def has_narrative(self) -> bool:
        return len(_WORD.findall(self.narrative)) >= MIN_NARRATIVE_WORDS


def normalise(text: str) -> str:
    """Lower-case, accent-free text with letter-by-letter spelling re-joined."""
    decomposed = unicodedata.normalize("NFKD", text)
    plain = "".join(char for char in decomposed if not unicodedata.combining(char)).lower()
    return _SPELLED_OUT.sub("", plain)


def looks_like_instruction(text: str) -> bool:
    normalised = normalise(text)
    return any(pattern.search(normalised) for pattern in _INJECTION_PATTERNS)


def guard_report_text(text: str) -> GuardedText:
    """Remove the parts of a report that address the classifier instead of describing facts."""
    removed: list[str] = []

    def drop_if_instruction(match: re.Match[str]) -> str:
        if looks_like_instruction(match.group(0)):
            removed.append(match.group(0).strip())
            return " "
        return match.group(0)

    def drop_token(match: re.Match[str]) -> str:
        removed.append(match.group(0))
        return " "

    without_tokens = _DELIMITER_TOKENS.sub(drop_token, text)
    # Bracketed notes ("[NOTA DO TÉCNICO: ...]") are judged on their own before sentence splitting.
    without_notes = _BRACKETED.sub(drop_if_instruction, without_tokens)

    kept = []
    for sentence in _SENTENCE_END.split(without_notes):
        if not sentence.strip():
            continue
        if looks_like_instruction(sentence):
            removed.append(sentence.strip())
        else:
            kept.append(sentence.strip())
    return GuardedText(narrative=" ".join(kept), removed=tuple(removed))


def leaks_prompt(output: str, system_prompt: str) -> bool:
    """True when the output repeats a long run of words from the system prompt."""
    prompt_words = _WORD.findall(normalise(system_prompt))
    windows = {
        " ".join(prompt_words[index : index + LEAK_WINDOW_WORDS])
        for index in range(len(prompt_words) - LEAK_WINDOW_WORDS + 1)
    }
    output_words = _WORD.findall(normalise(output))
    return any(
        " ".join(output_words[index : index + LEAK_WINDOW_WORDS]) in windows
        for index in range(len(output_words) - LEAK_WINDOW_WORDS + 1)
    )


def remove_verdicts(text: str) -> str:
    """Drop sentences that declare guilt or propose penalties (the model must never judge)."""
    sentences = _SENTENCE_END.split(text)
    return " ".join(sentence for sentence in sentences if not _GUILT_PATTERNS.search(normalise(sentence))).strip()
