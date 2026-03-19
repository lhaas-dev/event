"""Iteration 2 backend tests: auth, admin, guests with new fields"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

ADMIN_USER = "admin"
ADMIN_PASS = "admin123"
TEST_USER = "TEST_iter2user"
TEST_PASS = "test4567"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
    assert r.status_code == 200
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---- Auth tests ----

class TestAuth:
    def test_login_admin_success(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["username"] == ADMIN_USER
        assert data["role"] == "admin"

    def test_login_invalid_credentials(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "bad", "password": "bad"})
        assert r.status_code == 401

    def test_register_endpoint_removed(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json={"username": "x", "password": "y"})
        assert r.status_code == 404

    def test_me_endpoint(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["username"] == ADMIN_USER
        assert data["role"] == "admin"


# ---- Admin tests ----

class TestAdmin:
    created_user_id = None

    def test_admin_list_users(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_create_user(self, admin_headers):
        # Cleanup first if exists
        r = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers)
        for u in r.json():
            if u["username"] == TEST_USER:
                requests.delete(f"{BASE_URL}/api/admin/users/{u['id']}", headers=admin_headers)
        
        r = requests.post(f"{BASE_URL}/api/admin/users", headers=admin_headers,
                          json={"username": TEST_USER, "password": TEST_PASS, "role": "user"})
        assert r.status_code == 200
        data = r.json()
        assert data["username"] == TEST_USER
        TestAdmin.created_user_id = data["id"]

    def test_new_user_can_login(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": TEST_USER, "password": TEST_PASS})
        assert r.status_code == 200
        data = r.json()
        assert data["role"] == "user"

    def test_admin_reset_password(self, admin_headers):
        if not TestAdmin.created_user_id:
            pytest.skip("No user created")
        new_pass = "newpass99"
        r = requests.put(f"{BASE_URL}/api/admin/users/{TestAdmin.created_user_id}/password",
                         headers=admin_headers, json={"password": new_pass})
        assert r.status_code == 200
        # Verify new password works
        r2 = requests.post(f"{BASE_URL}/api/auth/login", json={"username": TEST_USER, "password": new_pass})
        assert r2.status_code == 200

    def test_non_admin_cannot_access_admin(self):
        # Login as regular user
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": TEST_USER, "password": "newpass99"})
        if r.status_code != 200:
            pytest.skip("Could not login as test user")
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        r2 = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        assert r2.status_code == 403

    def test_admin_delete_user(self, admin_headers):
        if not TestAdmin.created_user_id:
            pytest.skip("No user created")
        r = requests.delete(f"{BASE_URL}/api/admin/users/{TestAdmin.created_user_id}", headers=admin_headers)
        assert r.status_code == 200


# ---- Guest tests with new fields ----

class TestGuestsNewFields:
    event_id = None

    def test_create_event(self, admin_headers):
        r = requests.post(f"{BASE_URL}/api/events", headers=admin_headers,
                          json={"name": "TEST_Event_Iter2", "table_count": 3, "seats_per_table": 4})
        assert r.status_code == 200
        TestGuestsNewFields.event_id = r.json()["id"]

    def test_add_erwachsener_guest(self, admin_headers):
        if not TestGuestsNewFields.event_id:
            pytest.skip("No event")
        r = requests.post(f"{BASE_URL}/api/events/{TestGuestsNewFields.event_id}/guests",
                          headers=admin_headers,
                          json={"first_name": "Max", "last_name": "Mustermann", "guest_type": "erwachsener"})
        assert r.status_code == 200
        data = r.json()
        assert data["guest_type"] == "erwachsener"
        assert data["first_name"] == "Max"
        assert data["last_name"] == "Mustermann"

    def test_add_kind_guest(self, admin_headers):
        if not TestGuestsNewFields.event_id:
            pytest.skip("No event")
        r = requests.post(f"{BASE_URL}/api/events/{TestGuestsNewFields.event_id}/guests",
                          headers=admin_headers,
                          json={"first_name": "Lena", "last_name": "Mustermann", "guest_type": "kind"})
        assert r.status_code == 200
        assert r.json()["guest_type"] == "kind"

    def test_add_guest_with_companion(self, admin_headers):
        if not TestGuestsNewFields.event_id:
            pytest.skip("No event")
        # Create main guest
        r = requests.post(f"{BASE_URL}/api/events/{TestGuestsNewFields.event_id}/guests",
                          headers=admin_headers,
                          json={"first_name": "Anna", "last_name": "Schmidt", "guest_type": "erwachsener"})
        main_id = r.json()["id"]
        # Create companion
        r2 = requests.post(f"{BASE_URL}/api/events/{TestGuestsNewFields.event_id}/guests",
                           headers=admin_headers,
                           json={"first_name": "Tim", "last_name": "Schmidt", "guest_type": "kind", "companion_of": main_id})
        assert r2.status_code == 200
        assert r2.json()["companion_of"] == main_id

    def test_update_guest(self, admin_headers):
        if not TestGuestsNewFields.event_id:
            pytest.skip("No event")
        guests = requests.get(f"{BASE_URL}/api/events/{TestGuestsNewFields.event_id}/guests",
                              headers=admin_headers).json()
        if not guests:
            pytest.skip("No guests")
        gid = guests[0]["id"]
        r = requests.put(f"{BASE_URL}/api/events/{TestGuestsNewFields.event_id}/guests/{gid}",
                         headers=admin_headers,
                         json={"guest_type": "kind"})
        assert r.status_code == 200

    def test_cleanup_event(self, admin_headers):
        if not TestGuestsNewFields.event_id:
            return
        requests.delete(f"{BASE_URL}/api/events/{TestGuestsNewFields.event_id}", headers=admin_headers)
