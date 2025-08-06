"""
Test runner for bulk import functionality.
Run this script to execute all tests for the bulk import feature.
"""

import sys
import os
import unittest

# Add the parent directory to the path so we can import modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

def run_unit_tests():
    """Run the unit tests that don't require Django setup."""
    print("Running CSV Processing Unit Tests...")
    print("=" * 50)
    
    # Import the unit test module
    from tests.test_csv_processing import CSVProcessingUnitTests, CSVFileHandlingTests
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test cases
    suite.addTests(loader.loadTestsFromTestCase(CSVProcessingUnitTests))
    suite.addTests(loader.loadTestsFromTestCase(CSVFileHandlingTests))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()

def run_integration_tests():
    """Run integration tests (requires Django setup)."""
    print("\\nRunning Integration Tests...")
    print("=" * 50)
    print("Note: Integration tests require Django environment to be set up.")
    print("Run with: python manage.py test tests.test_bulk_import")
    
def main():
    """Main test runner function."""
    print("Bulk Import Test Suite")
    print("=" * 50)
    
    # Run unit tests
    unit_success = run_unit_tests()
    
    # Show integration test instructions
    run_integration_tests()
    
    print("\\n" + "=" * 50)
    if unit_success:
        print("✅ Unit tests passed!")
    else:
        print("❌ Some unit tests failed!")
    
    print("\\nTo run all tests including Django integration tests:")
    print("1. Activate your Django environment")
    print("2. Run: python manage.py test tests.test_bulk_import")
    print("3. Run: python manage.py test tests.test_csv_processing")

if __name__ == "__main__":
    main()
