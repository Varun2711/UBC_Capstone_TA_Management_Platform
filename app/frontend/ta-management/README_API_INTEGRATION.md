# Course Service API Integration

This document explains the integration of the Course Service API with the System Settings page and provides usage examples.

## Overview

The System Settings page now connects to the backend Course Service API to manage academic terms and system configurations. The integration includes:

- **Real-time data loading** from the Course Service API
- **CRUD operations** for academic terms
- **System settings management** with localStorage fallback
- **Error handling and loading states**
- **Authentication support**

## Files Added/Modified

### New Service Files

1. **`src/services/courseAPI.js`** - Main API client for Course Service
   - Handles all HTTP requests to the backend
   - Includes authentication headers
   - Provides methods for terms, courses, offerings, and shared sessions

2. **`src/services/systemSettingsService.js`** - System settings management
   - High-level service for system configuration
   - Term validation and transformation
   - Settings persistence (localStorage fallback)

3. **`src/hooks/useCourseService.js`** - React hooks for API operations
   - Custom hooks for managing API state
   - Loading and error state handling
   - Reusable across components

### Modified Files

1. **`src/pages/Admin/SystemSetting.jsx`** - Updated to use real API
   - Removed mock data
   - Added API integration
   - Enhanced error handling and loading states
   - Improved term management with validation

## API Endpoints Used

The System Settings page uses the following Course Service endpoints:

### Terms Management
- `GET /api/course-term-service/terms/` - Get all terms
- `POST /api/course-term-service/terms/` - Create new term
- `PATCH /api/course-term-service/terms/{id}/` - Update term
- `DELETE /api/course-term-service/terms/{id}/` - Delete term
- `GET /api/course-term-service/terms/active/` - Get active terms
- `GET /api/course-term-service/terms/current/` - Get current terms
- `PATCH /api/course-term-service/terms/{id}/archive/` - Archive term

### System Information
- `GET /api/course-term-service/courses/` - Get courses count
- `GET /api/course-term-service/course-offerings/current/` - Get current offerings

## Configuration

### API Base URL
The API base URL is configured in `courseAPI.js`:
```javascript
const API_BASE_URL = 'http://localhost:8002/api/course-term-service';
```

### Authentication
The system expects a JWT token in localStorage:
```javascript
const token = localStorage.getItem('authToken');
```

## Usage Examples

### Basic Usage in Components

```jsx
import { useSystemSettings } from '@/hooks/useCourseService'

function MyComponent() {
  const {
    terms,
    settings,
    loading,
    error,
    loadAll,
    createTerm,
    updateSetting
  } = useSystemSettings()

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleCreateTerm = async (termData) => {
    try {
      await createTerm(termData)
      console.log('Term created successfully')
    } catch (err) {
      console.error('Failed to create term:', err)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h2>Terms: {terms.length}</h2>
      {/* Render terms */}
    </div>
  )
}
```

### Direct API Usage

```javascript
import courseAPI from '@/services/courseAPI'
import systemSettingsService from '@/services/systemSettingsService'

// Get terms
const terms = await courseAPI.getTerms()

// Create term with validation
const termData = {
  name: "Winter 2025",
  startDate: "2025-01-06",
  endDate: "2025-04-30",
  description: "Winter Term 2025"
}

const validation = systemSettingsService.validateTermData(termData)
if (validation.isValid) {
  const newTerm = await systemSettingsService.createAcademicTerm(termData)
} else {
  console.error('Validation errors:', validation.errors)
}
```

## Features

### Academic Terms Management
- **Create Terms**: Add new academic terms with validation
- **Edit Terms**: Update existing term information
- **Delete Terms**: Remove terms (with protection for active terms)
- **Archive Terms**: Archive old terms (admin only)
- **Dynamic Status**: Terms show real-time status (active, upcoming, completed)

### System Settings
- **General Settings**: Institution name, timezone, academic year
- **Deadlines**: Grade submission, withdrawal deadlines
- **Notifications**: Email/SMS preferences
- **Security**: Password policies, session timeouts
- **Enrollment**: Course limits, waitlist settings

### Data Validation
- **Term Validation**: Date logic, duration limits
- **Required Fields**: Automatic validation of required data
- **Error Messages**: User-friendly error reporting

### Loading States
- **Loading Indicators**: Spinners for async operations
- **Disabled States**: UI disabled during operations
- **Progress Feedback**: Clear status messages

## Error Handling

The system includes comprehensive error handling:

1. **Network Errors**: Connection issues with the API
2. **Authentication Errors**: Invalid or expired tokens
3. **Validation Errors**: Client-side data validation
4. **Server Errors**: Backend error responses
5. **User-Friendly Messages**: Clear error descriptions

## Development

### Running the Backend
Ensure the Course Service is running on `http://localhost:8002`:
```bash
cd app/backend/course-service
python manage.py runserver 8002
```

### Authentication Setup
For development, you can use the debug endpoint to test authentication:
```javascript
await courseAPI.debugAuth()
```

### Testing API Calls
All API calls include error handling and can be tested individually:
```javascript
try {
  const terms = await courseAPI.getTerms()
  console.log('Success:', terms)
} catch (error) {
  console.error('Error:', error.message)
}
```

## Future Enhancements

1. **Real Settings API**: Replace localStorage with proper backend settings
2. **Bulk Operations**: Support for bulk term creation/updates
3. **Import/Export**: CSV/JSON import/export for terms
4. **Advanced Filtering**: Enhanced search and filtering options
5. **Audit Logging**: Track changes to system settings
6. **Real-time Updates**: WebSocket integration for live updates

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend allows frontend origin
2. **Authentication Failed**: Check if token is valid
3. **Network Timeout**: Verify backend is running
4. **Validation Errors**: Check term date logic

### Debug Mode
Enable debug logging in the browser console to see detailed API calls and responses.

## API Documentation

For complete API documentation, visit the Course Service API root:
```
GET http://localhost:8002/api/course-term-service/
```

This returns a comprehensive API reference with all available endpoints and examples.
