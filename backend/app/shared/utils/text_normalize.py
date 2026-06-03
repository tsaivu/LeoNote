import re
import unicodedata


def normalize_search_text(value: str | None) -> str:
    if not value:
        return ""

    decomposed = unicodedata.normalize("NFD", value)
    without_marks = "".join(char for char in decomposed if unicodedata.category(char) != "Mn")
    normalized = without_marks.replace("đ", "d").replace("Đ", "D").lower()
    normalized = re.sub(r"[^a-z0-9\s]", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip()
