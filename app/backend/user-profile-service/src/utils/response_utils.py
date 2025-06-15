def success_response(data=None, message="Operation successful"):
    """
    Create a standardized success response.
    
    Args:
        data (any, optional): Response data
        message (str, optional): Success message
        
    Returns:
        dict: Formatted response
    """
    response = {
        "success": True,
        "message": message
    }
    
    if data is not None:
        response["data"] = data
        
    return response

def error_response(message="Operation failed", errors=None, status_code=400):
    """
    Create a standardized error response.
    
    Args:
        message (str, optional): Error message
        errors (dict/list, optional): Detailed error information
        status_code (int, optional): HTTP status code
        
    Returns:
        tuple: (response_dict, status_code)
    """
    response = {
        "success": False,
        "message": message
    }
    
    if errors is not None:
        response["errors"] = errors
        
    return response