#!/usr/bin/env python3
"""
Generate test JWT tokens for API testing
"""
import jwt
import time
from datetime import datetime, timedelta

# Secret key from .env file - corrected version
SECRET_KEY = "django-insecure-lb8wwsxk@ov0(i&6)0x4(jiva52n4k24#8+c0s&xh%z)w%1"

def generate_token(user_id, user_type, email, name):
    """Generate a JWT token for testing"""
    now = datetime.utcnow()
    payload = {
        'token_type': 'access',
        'exp': int((now + timedelta(hours=24)).timestamp()),  # 24 hours from now
        'iat': int(now.timestamp()),
        'jti': f"test-{user_type}-{int(time.time())}",
        'sub': user_id,
        'user_type': user_type,
        'email': email,
        'name': name
    }
    
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

# Generate tokens for each role
tokens = {
    'admin': generate_token('0001', 'admin', 'admin@gmail.com', 'Admin User'),
    'scheduler': generate_token('0002', 'scheduler', 'chad.davis@gmail.com', 'Chad Davis'),
    'instructor': generate_token('0003', 'instructor', 'naman.arora@gmail.com', 'Naman Arora'),
    'student': generate_token('0004', 'student', 'sarah.johnson@student.ubc.ca', 'Sarah Johnson')
}

print("# Mock tokens for testing")
print("MOCK_TOKENS = {")
for role, token in tokens.items():
    print(f"    '{role}': '{token}',")
print("}")

# Test token validation
print("\n# Testing token validation:")
for role, token in tokens.items():
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        print(f"{role}: VALID - user_type={decoded.get('user_type')}, sub={decoded.get('sub')}")
    except Exception as e:
        print(f"{role}: INVALID - {e}")
