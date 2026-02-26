import re
from dataclasses import dataclass


_TOKEN_RE = re.compile(r"[xX\*\u00D7]")
_NUM_RE = re.compile(r"^-?\d+(\.\d+)?$")


@dataclass
class ParsedExpression:
    price: int
    qty: float
    freq: int
    amount: int
    normalized: str


def _to_number(token: str) -> float:
    cleaned = token.strip().lower().replace(",", "")
    if cleaned.endswith("만원"):
        value = cleaned[:-2].strip()
        if not _NUM_RE.match(value):
            raise ValueError("invalid number")
        return float(value) * 10000
    cleaned = (
        cleaned.replace("\uC6D0", "")
        .replace("\uBA85", "")
        .replace("\uD68C", "")
        .replace("\uC2DD", "")
        .replace("\uC6D4", "")
        .replace("\uAC74", "")
        .replace("\uAC1C", "")
    )
    if not _NUM_RE.match(cleaned):
        raise ValueError("invalid number")
    return float(cleaned)


def parse_calc_expression(expression: str) -> ParsedExpression:
    """
    Parse expressions such as:
    - 50000x3x12
    - 50,000 * 3 * 12
    - 5만원 x 2 x 12
    """
    if not expression or not expression.strip():
        raise ValueError("expression is empty")

    parts = [p.strip() for p in _TOKEN_RE.split(expression) if p.strip()]
    if len(parts) != 3:
        raise ValueError("expression must contain exactly 3 factors")

    price_raw = _to_number(parts[0])
    qty_raw = _to_number(parts[1])
    freq_raw = _to_number(parts[2])

    if price_raw < 0 or qty_raw < 0 or freq_raw < 0:
        raise ValueError("all factors must be non-negative")

    price = int(round(price_raw))
    qty = float(qty_raw)
    freq = int(round(freq_raw))
    amount = int(round(price * qty * freq))
    normalized = f"{price} x {qty:g} x {freq}"

    return ParsedExpression(
        price=price,
        qty=qty,
        freq=freq,
        amount=amount,
        normalized=normalized,
    )
