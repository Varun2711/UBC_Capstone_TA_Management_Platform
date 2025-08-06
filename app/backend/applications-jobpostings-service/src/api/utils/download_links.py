# src/api/utils/download_links.py
from django.conf import settings
from django.utils.crypto import salted_hmac
from datetime import datetime, timedelta

def generate_signed_url(file_path: str, expires_in: int = 300) -> str:
    expiry = int((datetime.utcnow() + timedelta(seconds=expires_in)).timestamp())
    value = f"{file_path}:{expiry}"
    signature = salted_hmac("nginx-download", value, secret=settings.SECRET_KEY).hexdigest()
    return f"/api/ajp/download?path={file_path}&exp={expiry}&sig={signature}"
