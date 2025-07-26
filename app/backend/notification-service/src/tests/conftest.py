import pytest

@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """
    This fixture automatically enables database access for all tests,
    so you don't have to add the @pytest.mark.django_db decorator to each one.
    """
    pass