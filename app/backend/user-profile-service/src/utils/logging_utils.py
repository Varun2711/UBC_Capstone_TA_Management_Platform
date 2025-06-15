import logging

def setup_logger():
    """Configure and return a logger for the user profile service."""
    logger = logging.getLogger('user_profile_service')
    logger.setLevel(logging.INFO)
    
    # Create console handler
    handler = logging.StreamHandler()
    handler.setLevel(logging.INFO)
    
    # Create formatter
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    
    # Add handler to logger
    logger.addHandler(handler)
    
    return logger

# Create a logger instance that can be imported
logger = setup_logger()

def log_user_activity(user_type, user_id, action):
    """Log user activity in a standardized format."""
    logger.info(f"USER ACTIVITY: {user_type}:{user_id} - {action}")