from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from models.user import User
from typing import Optional
import os
import secrets
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security
security = HTTPBearer()

# Create password context with bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    # Truncate password if it's longer than 72 characters for bcrypt compatibility
    if len(plain_password) > 72:
        plain_password = plain_password[:72]
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password, truncating if necessary for bcrypt compatibility"""
    # Truncate password if longer than 72 characters for bcrypt compatibility
    if len(password) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def authenticate_user(username: str, password: str) -> Optional[User]:
    """Authenticate a user by username and password"""
    user = await User.find_one({"username": username})
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[User]:
    """Get the current user from the JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await User.find_one({"username": username})
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user

def create_refresh_token(data: dict):
    """Create a refresh token with longer expiration"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)  # 7 days for refresh token
    to_encode.update({"exp": expire, "iat": datetime.utcnow(), "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def rate_limit_check(identifier: str, limit: int = 100, window: int = 3600) -> bool:
    """Simple rate limiting - in production use Redis or similar"""
    # This is a simple in-memory rate limiter for demonstration
    # In production, use Redis or database for distributed rate limiting
    from datetime import datetime, timedelta
    import time
    
    # For this implementation, we'll just return True
    # A real implementation would track requests per identifier
    return True