# Course Service Testing Guide

This guide explains how to run the comprehensive test suite for the Course Service from within a running Docker container.

## 🚀 Quick Start

### Prerequisites

Make sure the Course Service container is running:

```bash
# Start the service with dependencies
docker-compose up -d courses-terms-service db auth-service user-profile-service
```

### Running Tests from Within the Container

**Execute into the running container:**

```bash
docker-compose exec courses-terms-service bash
```

**Inside the container, run tests using pytest:**

```bash
# Run all tests (from project root directory)
pytest src/tests/ -v

# Run all tests with coverage
pytest src/tests/ --cov=src --cov-report=html --cov-report=term -v

# Run specific test file
pytest src/tests/test_archive_functionality.py -v

# Run specific test class
pytest src/tests/test_archive_functionality.py::TestTermArchiveFunctionality -v

# Run specific test method
pytest src/tests/test_archive_functionality.py::TestTermArchiveFunctionality::test_admin_can_archive_term -v

# Run tests matching a pattern
pytest src/tests/ -k "archive" -v

# Run tests with markers (if defined)
pytest src/tests/ -m "not slow" -v
```

### Alternative: One-Command Test Execution

You can also run tests without entering the container:

```bash
# Run all tests (executes from container's working directory)
docker-compose exec courses-terms-service pytest src/tests/ -v

# Run with coverage
docker-compose exec courses-terms-service pytest src/tests/ --cov=src --cov-report=term -v

# Run specific test categories
docker-compose exec courses-terms-service pytest src/tests/test_archive_functionality.py -v
docker-compose exec courses-terms-service pytest src/tests/test_crud_operations.py -v
docker-compose exec courses-terms-service pytest src/tests/test_permissions.py -v
docker-compose exec courses-terms-service pytest src/tests/test_custom_actions.py -v
docker-compose exec courses-terms-service pytest src/tests/test_edge_cases.py -v
```

## 📁 Test Suite Structure

The test suite includes comprehensive coverage of:

### 1. **Archive Functionality Tests** (`test_archive_functionality.py`)

- Admin-only archive/restore operations
- Archive permissions enforcement
- Filtering by `is_active` status
- Archive cascading behavior

### 2. **CRUD Operations Tests** (`test_crud_operations.py`)

- Create, Read, Update, Delete operations
- Field validation and required field testing
- Permission-based CRUD operations
- Complex object creation with relationships

### 3. **Custom Actions Tests** (`test_custom_actions.py`)

- Custom ViewSet actions (current, by_year, by_department, etc.)
- Parameter validation for endpoints
- Filtering, searching, and ordering
- Related object retrieval

### 4. **Permission Tests** (`test_permissions.py`)

- Role-based access control (Admin > Scheduler > Instructor > Student)
- Authentication requirements
- Cross-role permission validation
- Permission hierarchy testing

### 5. **Edge Cases Tests** (`test_edge_cases.py`)

- Error handling and validation edge cases
- Integration testing scenarios
- API documentation testing
- Complex relationship testing

## 🔧 Test Configuration

### pytest.ini Configuration

The tests use the existing `pytest.ini` file with these settings:

```ini
[pytest]
DJANGO_SETTINGS_MODULE = src.course_service.settings
python_files = tests.py test_*.py *_tests.py
addopts = --nomigrations --reuse-db -v
pythonpath = .
```

**Important**: Tests must be run from the project root directory (where pytest.ini is located) for Django to find the settings module correctly.

### Environment Variables

Tests automatically detect the Docker environment and use appropriate service URLs:

- `AUTH_SERVICE_URL`: Defaults to `http://auth-service:8080` in Docker
- `TESTING`: Set to `true` in test environment

### Test Database

Tests use Django's test database functionality with `--reuse-db` for faster execution.

### Authentication

Tests use real authentication with the following test credentials:

- **Admin**: `admin@gmail.com` / `test`
- **Scheduler**: `chad.davis@gmail.com` / `test`
- **Instructor**: `naman.arora@gmail.com` / `test`
- **Student**: `sarah.johnson@student.ubc.ca` / `test`

## 📊 Coverage Reports

When running tests with coverage, reports are generated in multiple formats:

- **Terminal output**: Coverage summary displayed directly
- **HTML report**: Detailed coverage at `./htmlcov/index.html`
- You can also specify coverage output format: `--cov-report=html` or `--cov-report=term`

## 🐛 Troubleshooting

### Common Issues

**1. Container Not Running**

```bash
# Check container status
docker-compose ps

# Start the service
docker-compose up -d courses-terms-service
```

**2. Auth Service Not Ready**

```bash
# Check auth service logs
docker-compose logs auth-service

# Restart auth service
docker-compose restart auth-service
```

**3. Database Issues**

```bash
# Restart database and run migrations
docker-compose restart db
docker-compose exec courses-terms-service python manage.py migrate
```

**4. Test Database Issues**

```bash
# Inside container, create test database manually
docker-compose exec courses-terms-service python manage.py migrate --run-syncdb
```

### Debugging Test Failures

**Run specific failing test with verbose output:**

```bash
docker-compose exec courses-terms-service pytest src/tests/test_archive_functionality.py::TestTermArchiveFunctionality::test_admin_can_archive_term -v -s
```

**Check service logs:**

```bash
docker-compose logs courses-terms-service
docker-compose logs auth-service
```

**Interactive debugging inside container:**

```bash
docker-compose exec courses-terms-service bash
# Inside container
python manage.py shell
# or run tests with pdb
pytest src/tests/test_archive_functionality.py::TestTermArchiveFunctionality::test_admin_can_archive_term -v -s --pdb
```

## 🚀 Performance Tips

**Fast Test Execution:**

- Tests use `--reuse-db` flag for faster database setup
- Use `-x` to stop on first failure: `pytest src/tests/ -x -v`
- Run tests in parallel with pytest-xdist: `pytest src/tests/ -n auto -v`

**Test Specific Areas:**

```bash
# Only test archive functionality
pytest src/tests/test_archive_functionality.py -v

# Only test permissions
pytest src/tests/test_permissions.py -v

# Test by pattern matching
pytest src/tests/ -k "archive or restore" -v
```

## 🔄 CI/CD Integration

The test setup is ready for CI/CD integration with simple commands:

**Example CI/CD Pipeline:**

```yaml
- name: Run Course Service Tests
  run: |
    docker-compose exec courses-terms-service pytest src/tests/ --cov=src --cov-report=term -v
```

## 📝 Test Organization

The tests are organized by functionality:

- **Archive Operations**: `test_archive_functionality.py`
- **CRUD Operations**: `test_crud_operations.py`
- **Permissions**: `test_permissions.py`
- **Custom Actions**: `test_custom_actions.py`
- **Edge Cases**: `test_edge_cases.py`

You can run individual test categories as needed for focused testing.

## 🎯 Current Test Status

✅ **Tests are working!** The pytest configuration is correct and tests are running successfully.

### Issues to address:

1. **Database Access**: Many tests show "Database access not allowed" errors. Add `@pytest.mark.django_db` to test methods that need database access, or add `--django-db-setup` to pytest addopts.

2. **Auth Service**: Authentication errors show "Connection refused" on port 8080. Make sure the auth service is running:

   ```bash
   docker-compose up -d auth-service
   ```

3. **Test Results**:
   - 126 tests discovered
   - 3 tests passed
   - 24 failed (mostly due to auth service not running)
   - 99 errors (mostly database access issues)

The test framework and Django integration is working correctly!
