#!/usr/bin/env python
"""
Test runner script for course-service API tests.
Provides convenient commands to run different test suites.
"""
import sys
import subprocess
import os
from pathlib import Path


def run_command(command, description):
    """Run a command and handle output."""
    print(f"\n{'='*60}")
    print(f"🧪 {description}")
    print(f"{'='*60}")
    print(f"Running: {command}")
    print("-" * 60)
    
    result = subprocess.run(command, shell=True, capture_output=False)
    
    if result.returncode == 0:
        print(f"\n✅ {description} - PASSED")
    else:
        print(f"\n❌ {description} - FAILED")
        return False
    return True


def main():
    """Main test runner function."""
    # Change to the src directory where manage.py is located
    src_dir = Path(__file__).parent.parent  # Go up from tests/ to src/
    os.chdir(src_dir)
    
    if len(sys.argv) < 2:
        print("Course Service Test Runner")
        print("=" * 40)
        print("Usage: python test_runner.py <command>")
        print("\nAvailable commands:")
        print("  all           - Run all tests")
        print("  unit          - Run all unit tests")
        print("  api           - Run all API tests")
        print("  terms         - Run Term API tests")
        print("  courses       - Run Course API tests")
        print("  offerings     - Run CourseOffering API tests")
        print("  sessions      - Run SharedSession API tests")
        print("  requests      - Run InstructorRequest API tests")
        print("  coverage      - Run tests with coverage report")
        print("  verbose       - Run all tests with verbose output")
        print("  fast          - Run tests without migrations")
        print("  parallel      - Run tests in parallel")
        print("  clean         - Clean test database and cache")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    # Base pytest command
    base_cmd = "python manage.py test"
    pytest_cmd = "pytest"
    
    success = True
    
    if command == "all":
        success = run_command(f"{pytest_cmd} tests/", "Running All Tests")
    
    elif command == "unit":
        success = run_command(f"{pytest_cmd} tests/ -k 'not test_list and not test_retrieve'", "Running Unit Tests")
    
    elif command == "api":
        success = run_command(f"{pytest_cmd} tests/ -k 'ViewSet'", "Running API Tests")
    
    elif command == "terms":
        success = run_command(f"{pytest_cmd} tests/test_terms.py", "Running Term Tests")
    
    elif command == "courses":
        success = run_command(f"{pytest_cmd} tests/test_courses.py", "Running Course Tests")
    
    elif command == "offerings":
        success = run_command(f"{pytest_cmd} tests/test_course_offerings.py", "Running CourseOffering Tests")
    
    elif command == "sessions":
        success = run_command(f"{pytest_cmd} tests/test_shared_sessions.py", "Running SharedSession Tests")
    
    elif command == "requests":
        success = run_command(f"{pytest_cmd} tests/test_instructor_requests.py", "Running InstructorRequest Tests")
    
    elif command == "coverage":
        success = run_command(f"{pytest_cmd} tests/ --cov=api --cov-report=html --cov-report=term", "Running Tests with Coverage")
        if success:
            print("\n📊 Coverage report generated in htmlcov/index.html")
    
    elif command == "verbose":
        success = run_command(f"{pytest_cmd} tests/ -v -s", "Running Tests (Verbose)")
    
    elif command == "fast":
        success = run_command(f"{pytest_cmd} tests/ --reuse-db --nomigrations", "Running Tests (Fast Mode)")
    
    elif command == "parallel":
        success = run_command(f"{pytest_cmd} tests/ -n auto", "Running Tests (Parallel)")
    
    elif command == "clean":
        print("🧹 Cleaning test environment...")
        run_command("rm -rf .pytest_cache", "Removing pytest cache")
        run_command("rm -rf htmlcov", "Removing coverage reports")
        run_command("find . -name '*.pyc' -delete", "Removing Python cache files")
        run_command("find . -name '__pycache__' -type d -exec rm -rf {} +", "Removing pycache directories")
        print("✅ Test environment cleaned")
        return
    
    else:
        print(f"❌ Unknown command: {command}")
        print("Use 'python test_runner.py' to see available commands")
        sys.exit(1)
    
    if success:
        print(f"\n🎉 All tests completed successfully!")
        print("=" * 60)
    else:
        print(f"\n💥 Some tests failed!")
        print("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    main()
