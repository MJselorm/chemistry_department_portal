"""Presentation-safe academic resource names without changing storage paths."""
import re


def display_name(filename: str, folder_path: str = "") -> str:
    """Remove export timestamps from filenames while preserving ordinary names."""
    cleaned = re.sub(r"^\d{10,}[_-]+", "", filename)
    if cleaned != filename:
        return re.sub(r"\s+", " ", cleaned.replace("_", " ")).strip()

    # Some imported files contain only punctuation before their extension.
    stem, dot, suffix = filename.rpartition(".")
    if dot and re.fullmatch(r"[_.\s-]+", stem):
        folder = folder_path.rsplit("/", 1)[-1].replace("_", " ").replace("-", " ").title()
        return f"{folder or 'Academic resource'} resource.{suffix.lower()}"
    return filename
