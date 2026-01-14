from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from .config import settings

_serializer = URLSafeTimedSerializer(settings.SECRET_KEY, salt="password-reset")


def create_reset_token(email: str) -> str:
    return _serializer.dumps({"email": email})


def verify_reset_token(token: str, max_age_seconds: int) -> str:
    """
    Returns email if token valid, otherwise raises ValueError
    """
    try:
        data = _serializer.loads(token, max_age=max_age_seconds)
        return data["email"]
    except SignatureExpired:
        raise ValueError("Token expired")
    except BadSignature:
        raise ValueError("Invalid token")
