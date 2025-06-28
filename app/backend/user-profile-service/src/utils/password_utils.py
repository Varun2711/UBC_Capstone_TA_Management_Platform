import secrets
import string

def generate_secure_password(length=12):
    """Generate a secure random password"""
    # Use a mix of letters, digits, and safe special characters
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password