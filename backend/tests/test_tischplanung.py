"""Backend tests for Tischplanung App - Auth, Events, Guests, Seating"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER = "TEST_testuser_auto"
TEST_PASS = "test123"

@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s

@pytest.fixture(scope="module")
def auth_token(api):
    # Try register first
    api.post(f"{BASE_URL}/api/auth/register", json={"username": TEST_USER, "password": TEST_PASS})
    r = api.post(f"{BASE_URL}/api/auth/login", json={"username": TEST_USER, "password": TEST_PASS})
    assert r.status_code == 200, f"Login failed: {r.text}"
    return r.json()["access_token"]

@pytest.fixture(scope="module")
def auth_api(api, auth_token):
    api.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api

# ---- Auth Tests ----
class TestAuth:
    def test_register_duplicate(self, api):
        api.post(f"{BASE_URL}/api/auth/register", json={"username": TEST_USER, "password": TEST_PASS})
        r = api.post(f"{BASE_URL}/api/auth/register", json={"username": TEST_USER, "password": TEST_PASS})
        assert r.status_code == 400

    def test_login_success(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login", json={"username": TEST_USER, "password": TEST_PASS})
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["username"] == TEST_USER

    def test_login_invalid(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login", json={"username": "wrong", "password": "wrong"})
        assert r.status_code == 401

    def test_me(self, auth_api):
        r = auth_api.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        assert "username" in r.json()

# ---- Event Tests ----
class TestEvents:
    event_id = None

    def test_create_event(self, auth_api):
        r = auth_api.post(f"{BASE_URL}/api/events", json={"name": "TEST_Event_Auto", "table_count": 3, "seats_per_table": 4})
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "TEST_Event_Auto"
        assert data["table_count"] == 3
        assert "id" in data
        TestEvents.event_id = data["id"]

    def test_list_events(self, auth_api):
        r = auth_api.get(f"{BASE_URL}/api/events")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_event(self, auth_api):
        r = auth_api.get(f"{BASE_URL}/api/events/{TestEvents.event_id}")
        assert r.status_code == 200
        assert r.json()["id"] == TestEvents.event_id

    def test_update_event(self, auth_api):
        r = auth_api.put(f"{BASE_URL}/api/events/{TestEvents.event_id}", json={"name": "TEST_Updated"})
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_Updated"

# ---- Guest Tests ----
class TestGuests:
    guest_id = None

    def test_add_guest(self, auth_api):
        eid = TestEvents.event_id
        r = auth_api.post(f"{BASE_URL}/api/events/{eid}/guests", json={"first_name": "TEST_Hans", "last_name": "Mueller"})
        assert r.status_code == 200
        data = r.json()
        assert data["first_name"] == "TEST_Hans"
        assert "id" in data
        TestGuests.guest_id = data["id"]

    def test_list_guests(self, auth_api):
        r = auth_api.get(f"{BASE_URL}/api/events/{TestEvents.event_id}/guests")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) > 0

    def test_delete_guest(self, auth_api):
        eid = TestEvents.event_id
        r = auth_api.delete(f"{BASE_URL}/api/events/{eid}/guests/{TestGuests.guest_id}")
        assert r.status_code == 200

# ---- Seating Tests ----
class TestSeating:
    def test_get_seating_empty(self, auth_api):
        r = auth_api.get(f"{BASE_URL}/api/events/{TestEvents.event_id}/seating")
        assert r.status_code == 200
        data = r.json()
        assert "tables" in data

    def test_save_seating(self, auth_api):
        tables = [[None, None, None, None], [None, None, None, None], [None, None, None, None]]
        r = auth_api.put(f"{BASE_URL}/api/events/{TestEvents.event_id}/seating", json={"tables": tables})
        assert r.status_code == 200
        assert r.json()["ok"] == True

    def test_get_seating_after_save(self, auth_api):
        r = auth_api.get(f"{BASE_URL}/api/events/{TestEvents.event_id}/seating")
        assert r.status_code == 200
        assert len(r.json()["tables"]) == 3

# Cleanup
class TestCleanup:
    def test_delete_event(self, auth_api):
        r = auth_api.delete(f"{BASE_URL}/api/events/{TestEvents.event_id}")
        assert r.status_code == 200
