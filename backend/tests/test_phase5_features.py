"""
Test Phase 5 Features:
- Group Check-in endpoint
- Email Templates CRUD
- Personal greeting field in guests
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://seating-checkin.preview.emergentagent.com')

class TestAuth:
    """Get auth token for tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        token = response.json()["access_token"]
        return token

    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}


class TestEmailTemplatesCRUD(TestAuth):
    """Email Templates CRUD tests"""
    
    def test_list_email_templates_empty_initially(self, headers):
        """GET /api/email-templates - List templates"""
        response = requests.get(f"{BASE_URL}/api/email-templates", headers=headers)
        assert response.status_code == 200
        # Should be a list (possibly empty)
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} existing templates")

    def test_create_email_template(self, headers):
        """POST /api/email-templates - Create a new template"""
        payload = {
            "name": "TEST_Einladung",
            "subject": "Einladung zu unserem Event",
            "body": "{persoenliche_anrede},\n\nwir laden Sie herzlich ein.\n\nMit freundlichen Grüßen"
        }
        response = requests.post(f"{BASE_URL}/api/email-templates", json=payload, headers=headers)
        assert response.status_code == 200, f"Create template failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["name"] == payload["name"]
        assert data["subject"] == payload["subject"]
        assert data["body"] == payload["body"]
        print(f"Created template with ID: {data['id']}")
        return data["id"]

    def test_get_single_email_template(self, headers):
        """GET /api/email-templates/{id} - Get single template"""
        # First create a template
        create_payload = {
            "name": "TEST_GetSingle",
            "subject": "Test Subject",
            "body": "Test Body"
        }
        create_res = requests.post(f"{BASE_URL}/api/email-templates", json=create_payload, headers=headers)
        assert create_res.status_code == 200
        template_id = create_res.json()["id"]
        
        # Then get it
        response = requests.get(f"{BASE_URL}/api/email-templates/{template_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == template_id
        assert data["name"] == create_payload["name"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/email-templates/{template_id}", headers=headers)

    def test_update_email_template(self, headers):
        """PUT /api/email-templates/{id} - Update template"""
        # First create a template
        create_payload = {
            "name": "TEST_UpdateMe",
            "subject": "Original Subject",
            "body": "Original Body"
        }
        create_res = requests.post(f"{BASE_URL}/api/email-templates", json=create_payload, headers=headers)
        assert create_res.status_code == 200
        template_id = create_res.json()["id"]
        
        # Update it
        update_payload = {
            "name": "TEST_UpdateMe_Updated",
            "subject": "Updated Subject",
            "body": "Updated Body with {persoenliche_anrede}"
        }
        response = requests.put(f"{BASE_URL}/api/email-templates/{template_id}", json=update_payload, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_payload["name"]
        assert data["subject"] == update_payload["subject"]
        assert data["body"] == update_payload["body"]
        
        # Verify by GET
        get_res = requests.get(f"{BASE_URL}/api/email-templates/{template_id}", headers=headers)
        assert get_res.status_code == 200
        assert get_res.json()["name"] == update_payload["name"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/email-templates/{template_id}", headers=headers)

    def test_delete_email_template(self, headers):
        """DELETE /api/email-templates/{id} - Delete template"""
        # First create a template
        create_payload = {
            "name": "TEST_DeleteMe",
            "subject": "To Be Deleted",
            "body": "This will be deleted"
        }
        create_res = requests.post(f"{BASE_URL}/api/email-templates", json=create_payload, headers=headers)
        assert create_res.status_code == 200
        template_id = create_res.json()["id"]
        
        # Delete it
        response = requests.delete(f"{BASE_URL}/api/email-templates/{template_id}", headers=headers)
        assert response.status_code == 200
        
        # Verify it's gone
        get_res = requests.get(f"{BASE_URL}/api/email-templates/{template_id}", headers=headers)
        assert get_res.status_code == 404


class TestPersonalGreetingField(TestAuth):
    """Test personal_greeting field in guest CRUD"""
    
    @pytest.fixture(scope="class")
    def test_event(self, headers):
        """Create a test event"""
        payload = {
            "name": "TEST_PersonalGreetingEvent",
            "table_count": 5,
            "seats_per_table": 6
        }
        response = requests.post(f"{BASE_URL}/api/events", json=payload, headers=headers)
        assert response.status_code == 200
        event = response.json()
        yield event
        # Cleanup
        requests.delete(f"{BASE_URL}/api/events/{event['id']}", headers=headers)

    def test_create_guest_with_personal_greeting(self, headers, test_event):
        """POST /api/events/{id}/guests - Create guest with personal_greeting"""
        payload = {
            "first_name": "TEST_Stefan",
            "last_name": "Müller",
            "guest_type": "erwachsener",
            "email": "stefan@test.com",
            "salutation": "Herr",
            "personal_greeting": "Lieber Stefan"
        }
        response = requests.post(f"{BASE_URL}/api/events/{test_event['id']}/guests", json=payload, headers=headers)
        assert response.status_code == 200, f"Create guest failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["first_name"] == payload["first_name"]
        assert data["personal_greeting"] == payload["personal_greeting"]
        print(f"Created guest with personal_greeting: '{data['personal_greeting']}'")
        return data["id"]

    def test_update_guest_personal_greeting(self, headers, test_event):
        """PUT /api/events/{id}/guests/{id} - Update personal_greeting"""
        # First create a guest
        create_payload = {
            "first_name": "TEST_Anna",
            "last_name": "Schmidt",
            "guest_type": "erwachsener",
            "personal_greeting": "Liebe Anna"
        }
        create_res = requests.post(f"{BASE_URL}/api/events/{test_event['id']}/guests", json=create_payload, headers=headers)
        assert create_res.status_code == 200
        guest_id = create_res.json()["id"]
        
        # Update personal_greeting
        update_payload = {
            "personal_greeting": "Sehr geehrte Frau Schmidt"
        }
        response = requests.put(f"{BASE_URL}/api/events/{test_event['id']}/guests/{guest_id}", json=update_payload, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["personal_greeting"] == update_payload["personal_greeting"]
        print(f"Updated personal_greeting to: '{data['personal_greeting']}'")

    def test_guest_list_includes_personal_greeting(self, headers, test_event):
        """GET /api/events/{id}/guests - List includes personal_greeting"""
        # Create a guest with personal_greeting
        create_payload = {
            "first_name": "TEST_ListTest",
            "last_name": "User",
            "personal_greeting": "Hallo ListTest"
        }
        requests.post(f"{BASE_URL}/api/events/{test_event['id']}/guests", json=create_payload, headers=headers)
        
        # List guests
        response = requests.get(f"{BASE_URL}/api/events/{test_event['id']}/guests", headers=headers)
        assert response.status_code == 200
        guests = response.json()
        # Find our test guest
        test_guest = next((g for g in guests if g["first_name"] == "TEST_ListTest"), None)
        assert test_guest is not None, "Test guest not found in list"
        assert test_guest["personal_greeting"] == create_payload["personal_greeting"]


class TestGroupCheckin(TestAuth):
    """Test group check-in endpoint"""
    
    @pytest.fixture(scope="class")
    def test_event_with_guests(self, headers):
        """Create event with main guest and companions"""
        # Create event
        event_payload = {
            "name": "TEST_GroupCheckinEvent",
            "table_count": 5,
            "seats_per_table": 6
        }
        event_res = requests.post(f"{BASE_URL}/api/events", json=event_payload, headers=headers)
        assert event_res.status_code == 200
        event = event_res.json()
        
        # Create main guest
        main_guest_payload = {
            "first_name": "TEST_MainGuest",
            "last_name": "Family",
            "guest_type": "erwachsener"
        }
        main_res = requests.post(f"{BASE_URL}/api/events/{event['id']}/guests", json=main_guest_payload, headers=headers)
        assert main_res.status_code == 200
        main_guest = main_res.json()
        
        # Create companions linked to main guest
        companion1_payload = {
            "first_name": "TEST_Companion1",
            "last_name": "Family",
            "guest_type": "erwachsener",
            "companion_of": main_guest["id"]
        }
        comp1_res = requests.post(f"{BASE_URL}/api/events/{event['id']}/guests", json=companion1_payload, headers=headers)
        assert comp1_res.status_code == 200
        companion1 = comp1_res.json()
        
        companion2_payload = {
            "first_name": "TEST_Companion2",
            "last_name": "Family",
            "guest_type": "kind",
            "companion_of": main_guest["id"]
        }
        comp2_res = requests.post(f"{BASE_URL}/api/events/{event['id']}/guests", json=companion2_payload, headers=headers)
        assert comp2_res.status_code == 200
        companion2 = comp2_res.json()
        
        yield {
            "event": event,
            "main_guest": main_guest,
            "companions": [companion1, companion2]
        }
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/events/{event['id']}", headers=headers)

    def test_group_checkin_checks_in_all(self, headers, test_event_with_guests):
        """PUT /api/events/{event_id}/guests/{guest_id}/group-checkin - Check in main guest and all companions"""
        event = test_event_with_guests["event"]
        main_guest = test_event_with_guests["main_guest"]
        companions = test_event_with_guests["companions"]
        
        # Verify all are not checked in initially
        guests_res = requests.get(f"{BASE_URL}/api/events/{event['id']}/guests", headers=headers)
        assert guests_res.status_code == 200
        guests = guests_res.json()
        for g in guests:
            if g["first_name"].startswith("TEST_"):
                assert g["checked_in"] == False, f"Guest {g['first_name']} should not be checked in initially"
        
        # Perform group check-in
        response = requests.put(
            f"{BASE_URL}/api/events/{event['id']}/guests/{main_guest['id']}/group-checkin",
            headers=headers
        )
        assert response.status_code == 200, f"Group check-in failed: {response.text}"
        data = response.json()
        assert data["ok"] == True
        assert data["checked_in_count"] == 3  # main guest + 2 companions
        assert main_guest["id"] in data["guest_ids"]
        for comp in companions:
            assert comp["id"] in data["guest_ids"]
        print(f"Group check-in successful: {data['checked_in_count']} guests checked in")
        
        # Verify all are now checked in
        guests_res = requests.get(f"{BASE_URL}/api/events/{event['id']}/guests", headers=headers)
        guests = guests_res.json()
        for g in guests:
            if g["first_name"].startswith("TEST_"):
                assert g["checked_in"] == True, f"Guest {g['first_name']} should be checked in after group check-in"

    def test_group_checkin_no_companions(self, headers):
        """Group check-in for guest with no companions should check in only that guest"""
        # Create event
        event_payload = {"name": "TEST_SingleGuestEvent", "table_count": 2, "seats_per_table": 4}
        event_res = requests.post(f"{BASE_URL}/api/events", json=event_payload, headers=headers)
        event = event_res.json()
        
        # Create single guest (no companions)
        guest_payload = {"first_name": "TEST_SingleGuest", "last_name": "Alone"}
        guest_res = requests.post(f"{BASE_URL}/api/events/{event['id']}/guests", json=guest_payload, headers=headers)
        guest = guest_res.json()
        
        # Group check-in
        response = requests.put(f"{BASE_URL}/api/events/{event['id']}/guests/{guest['id']}/group-checkin", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["checked_in_count"] == 1  # Only the single guest
        print(f"Single guest group check-in: {data['checked_in_count']} guest checked in")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/events/{event['id']}", headers=headers)


class TestCleanup(TestAuth):
    """Cleanup any leftover TEST_ prefixed email templates"""
    
    def test_cleanup_test_templates(self, headers):
        """Delete all TEST_ prefixed templates"""
        response = requests.get(f"{BASE_URL}/api/email-templates", headers=headers)
        if response.status_code == 200:
            templates = response.json()
            deleted = 0
            for t in templates:
                if t.get("name", "").startswith("TEST_"):
                    del_res = requests.delete(f"{BASE_URL}/api/email-templates/{t['id']}", headers=headers)
                    if del_res.status_code == 200:
                        deleted += 1
            print(f"Cleaned up {deleted} test templates")
