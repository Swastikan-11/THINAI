from fastapi import HTTPException, status

class THINAIException(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)

class AuthenticationFailedException(THINAIException):
    def __init__(self, detail: str = "Authentication token invalid or expired"):
        super().__init__(detail=detail, status_code=status.HTTP_401_UNAUTHORIZED)

class PermissionDeniedException(THINAIException):
    def __init__(self, detail: str = "You do not have permission to access this resource"):
        super().__init__(detail=detail, status_code=status.HTTP_403_FORBIDDEN)

class ResourceNotFoundException(THINAIException):
    def __init__(self, resource: str, identifier: str):
        super().__init__(detail=f"{resource} with identifier '{identifier}' was not found", status_code=status.HTTP_404_NOT_FOUND)

class ExternalServiceUnavailableException(THINAIException):
    def __init__(self, service_name: str, detail: str = "External provider unavailable"):
        super().__init__(detail=f"{service_name}: {detail}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

class ValidationException(THINAIException):
    def __init__(self, detail: str = "Data validation error"):
        super().__init__(detail=detail, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

class ModelInferenceException(THINAIException):
    def __init__(self, detail: str = "Model inference computation failed"):
        super().__init__(detail=detail, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

