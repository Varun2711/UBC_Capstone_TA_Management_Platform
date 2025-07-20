# Course Service Test Suite

This directory contains comprehensive pytest test suites for the course-service API endpoints.

## Test Structure

```
tests/
├── conftest.py                 # Test fixtures and configuration
├── test_terms.py              # Term API endpoint tests
├── test_courses.py            # Course API endpoint tests
├── test_course_offerings.py   # CourseOffering API endpoint tests
├── test_shared_sessions.py    # SharedSession API endpoint tests
├── test_instructor_requests.py # InstructorRequest API endpoint tests
├── test_integration.py        # Integration and workflow tests
├── test_runner.py            # Test runner script
└── README.md                 # This file
```

## Quick Start

### Running All Tests

```bash
# From the course-service/src directory
python tests/test_runner.py all
```

### Running Specific Test Suites

```bash
# Individual endpoint tests
python tests/test_runner.py terms
python tests/test_runner.py courses
python tests/test_runner.py offerings
python tests/test_runner.py sessions
python tests/test_runner.py requests

# Integration tests
python tests/test_runner.py integration
```

### Running with Coverage

```bash
python tests/test_runner.py coverage
```

## Test Categories

### Unit Tests

- Model method tests
- Field validation tests
- Model relationship tests

### API Tests

- CRUD operation tests (Create, Read, Update, Delete)
- Filtering and search tests
- Ordering and pagination tests
- Error handling tests

### Integration Tests

- Cross-endpoint workflow tests
- Data consistency tests
- Bulk operation tests

## Test Fixtures

The `conftest.py` file provides comprehensive fixtures for all models:

- `sample_department` - Department instance
- `sample_term` - Academic term instance
- `sample_course` - Course instance
- `sample_instructor` - Instructor instance
- `sample_student` - Student instance
- `sample_course_offering` - CourseOffering instance
- `sample_shared_session` - SharedSession instance
- `sample_instructor_request` - InstructorRequest instance
- `sample_time_slot` - TimeSlot instance

## Available Test Runner Commands

```bash
python tests/test_runner.py <command>
```

### Commands:

- `all` - Run all tests
- `unit` - Run all unit tests
- `api` - Run all API tests
- `terms` - Run Term API tests
- `courses` - Run Course API tests
- `offerings` - Run CourseOffering API tests
- `sessions` - Run SharedSession API tests
- `requests` - Run InstructorRequest API tests
- `coverage` - Run tests with coverage report
- `verbose` - Run all tests with verbose output
- `fast` - Run tests without migrations
- `parallel` - Run tests in parallel
- `clean` - Clean test database and cache

## Test Database

Tests use Django's test database which is automatically created and destroyed. The `pytest.ini` configuration includes:

- `--reuse-db` - Reuse test database between runs for speed
- `--nomigrations` - Skip migrations for faster test startup

## Coverage Reports

When running with coverage, reports are generated in:

- Terminal output (summary)
- `htmlcov/index.html` (detailed HTML report)

## Writing New Tests

### Test Naming Convention

- Test files: `test_<module_name>.py`
- Test classes: `Test<ModelName>ViewSet` or `Test<ModelName>Model`
- Test methods: `test_<operation>_<expected_result>`

### Example Test Structure

```python
@pytest.mark.django_db
class TestExampleViewSet:
    def test_list_examples(self, api_client, sample_example):
        """Test GET /examples/ - List all examples."""
        url = reverse('example-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
```

## Dependencies

Test dependencies are listed in `test-requirements.txt`:

- pytest and pytest-django for testing framework
- pytest-cov for coverage reporting
- pytest-xdist for parallel execution
- factory-boy for test data factories

## Continuous Integration

These tests are designed to run in CI/CD pipelines with:

- Fast execution using `--reuse-db` and `--nomigrations`
- Parallel execution support
- Coverage reporting
- Clean separation of unit vs integration tests

## Troubleshooting

### Common Issues

1. **Database connection errors**: Ensure PostgreSQL is running and accessible
2. **Migration errors**: Use `python tests/test_runner.py clean` to reset
3. **Import errors**: Ensure you're running from the `src/` directory
4. **Fixture errors**: Check that all required fixtures are available in `conftest.py`

### Debug Mode

```bash
# Run with verbose output and no capture
pytest tests/ -v -s

# Run specific test with debugging
pytest tests/test_courses.py::TestCourseViewSet::test_create_course -v -s
```
