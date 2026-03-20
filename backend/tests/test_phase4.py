"""
Phase 4 Backend Tests - Tischplanung App
Testing: Visitor role, Menu feature, new guest fields (notes, vehicle, license_plate), Staff management
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://seating-checkin.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_USER = "admin"
ADMIN_PASS = "admin123"
VISITOR_USER = "gast"
VISITOR_PASS = "gast123"


class TestAdminUserManagement:
    """Test admin ability to create visitor-role users"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_admin_token(self):
        """Login as admin and get token"""
        res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USER,
            "password": ADMIN_PASS
        })
        assert res.status_code == 200, f"Admin login failed: {res.text}"
        return res.json()["access_token"]
    
    def test_admin_login(self):
        """Admin can login successfully"""
        res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USER,
            "password": ADMIN_PASS
        })
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["role"] == "admin"
        print("PASS: Admin login successful")
    
    def test_admin_can_list_users(self):
        """Admin can list all users"""
        token = self.get_admin_token()
        res = self.session.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        users = res.json()
        assert isinstance(users, list)
        print(f"PASS: Admin can list users ({len(users)} users found)")
    
    def test_admin_can_create_visitor_user(self):
        """Admin can create a visitor-role user"""
        token = self.get_admin_token()
        
        # Create visitor user
        test_visitor = {
            "username": "TEST_visitor_phase4",
            "password": "test1234",
            "role": "visitor"
        }
        res = self.session.post(
            f"{BASE_URL}/api/admin/users",
            json=test_visitor,
            headers={"Authorization": f"Bearer {token}"}
        )
        # May already exist, check both success and duplicate error
        if res.status_code == 200:
            data = res.json()
            assert data["role"] == "visitor"
            print(f"PASS: Created visitor user with id {data['id']}")
        elif res.status_code == 400 and "bereits vergeben" in res.text:
            print("PASS: Visitor user already exists (expected)")
        else:
            pytest.fail(f"Unexpected response: {res.status_code} - {res.text}")
    
    def test_visitor_login(self):
        """Visitor user 'gast' can login"""
        res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": VISITOR_USER,
            "password": VISITOR_PASS
        })
        assert res.status_code == 200, f"Visitor login failed: {res.text}"
        data = res.json()
        assert data["role"] == "visitor"
        print("PASS: Visitor 'gast' login successful")


class TestVisitorEndpoints:
    """Test visitor-specific read-only endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_visitor_token(self):
        """Login as visitor and get token"""
        res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": VISITOR_USER,
            "password": VISITOR_PASS
        })
        if res.status_code != 200:
            pytest.skip(f"Visitor login failed: {res.text}")
        return res.json()["access_token"]
    
    def get_admin_token(self):
        """Login as admin"""
        res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USER,
            "password": ADMIN_PASS
        })
        return res.json()["access_token"]
    
    def test_visitor_can_list_events(self):
        """Visitor can access /api/visitor/events"""
        token = self.get_visitor_token()
        res = self.session.get(
            f"{BASE_URL}/api/visitor/events",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        events = res.json()
        assert isinstance(events, list)
        print(f"PASS: Visitor can list events ({len(events)} events)")
    
    def test_visitor_can_view_event_details(self):
        """Visitor can get event details via visitor endpoint"""
        token = self.get_visitor_token()
        
        # First get list of events
        res = self.session.get(
            f"{BASE_URL}/api/visitor/events",
            headers={"Authorization": f"Bearer {token}"}
        )
        events = res.json()
        if not events:
            pytest.skip("No events available to test")
        
        event_id = events[0]["id"]
        res = self.session.get(
            f"{BASE_URL}/api/visitor/events/{event_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        event = res.json()
        assert "name" in event
        print(f"PASS: Visitor can view event details - '{event['name']}'")
    
    def test_visitor_can_view_guests(self):
        """Visitor can view guest list for an event"""
        token = self.get_visitor_token()
        
        res = self.session.get(
            f"{BASE_URL}/api/visitor/events",
            headers={"Authorization": f"Bearer {token}"}
        )
        events = res.json()
        if not events:
            pytest.skip("No events available to test")
        
        event_id = events[0]["id"]
        res = self.session.get(
            f"{BASE_URL}/api/visitor/events/{event_id}/guests",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        guests = res.json()
        assert isinstance(guests, list)
        print(f"PASS: Visitor can view guests ({len(guests)} guests)")
    
    def test_visitor_can_view_seating(self):
        """Visitor can view seating plan"""
        token = self.get_visitor_token()
        
        res = self.session.get(
            f"{BASE_URL}/api/visitor/events",
            headers={"Authorization": f"Bearer {token}"}
        )
        events = res.json()
        if not events:
            pytest.skip("No events available to test")
        
        event_id = events[0]["id"]
        res = self.session.get(
            f"{BASE_URL}/api/visitor/events/{event_id}/seating",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        seating = res.json()
        assert "tables" in seating
        print(f"PASS: Visitor can view seating plan")
    
    def test_visitor_can_view_menu(self):
        """Visitor can view menu via visitor endpoint"""
        token = self.get_visitor_token()
        
        res = self.session.get(
            f"{BASE_URL}/api/visitor/events",
            headers={"Authorization": f"Bearer {token}"}
        )
        events = res.json()
        if not events:
            pytest.skip("No events available to test")
        
        event_id = events[0]["id"]
        res = self.session.get(
            f"{BASE_URL}/api/visitor/events/{event_id}/menu",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        menu = res.json()
        assert isinstance(menu, list)
        print(f"PASS: Visitor can view menu ({len(menu)} items)")


class TestMenuCRUD:
    """Test menu item CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_admin_token(self):
        res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USER,
            "password": ADMIN_PASS
        })
        return res.json()["access_token"]
    
    def get_or_create_event(self, token):
        """Get first event or create one for testing"""
        res = self.session.get(
            f"{BASE_URL}/api/events",
            headers={"Authorization": f"Bearer {token}"}
        )
        events = res.json()
        if events:
            return events[0]["id"]
        
        # Create test event
        res = self.session.post(
            f"{BASE_URL}/api/events",
            json={"name": "TEST_MenuTest_Event", "table_count": 5, "seats_per_table": 6},
            headers={"Authorization": f"Bearer {token}"}
        )
        return res.json()["id"]
    
    def test_create_menu_item_food(self):
        """Create a food menu item with price and allergens"""
        token = self.get_admin_token()
        event_id = self.get_or_create_event(token)
        
        item_data = {
            "name": "TEST_Rinderfilet",
            "description": "Mit Kartoffeln und Gemüse",
            "category": "essen",
            "price": 24.50,
            "allergens": "Gluten, Sellerie"
        }
        res = self.session.post(
            f"{BASE_URL}/api/events/{event_id}/menu",
            json=item_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "TEST_Rinderfilet"
        assert data["category"] == "essen"
        assert data["price"] == 24.50
        assert data["allergens"] == "Gluten, Sellerie"
        print(f"PASS: Created food menu item with id {data['id']}")
        
        # Cleanup
        self.session.delete(
            f"{BASE_URL}/api/events/{event_id}/menu/{data['id']}",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    def test_create_menu_item_drink(self):
        """Create a drink menu item"""
        token = self.get_admin_token()
        event_id = self.get_or_create_event(token)
        
        item_data = {
            "name": "TEST_Hauswein",
            "description": "Rotwein aus der Region",
            "category": "getraenke",
            "price": 8.00,
            "allergens": "Sulfite"
        }
        res = self.session.post(
            f"{BASE_URL}/api/events/{event_id}/menu",
            json=item_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["category"] == "getraenke"
        print(f"PASS: Created drink menu item with id {data['id']}")
        
        # Cleanup
        self.session.delete(
            f"{BASE_URL}/api/events/{event_id}/menu/{data['id']}",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    def test_list_menu_items(self):
        """List all menu items for an event"""
        token = self.get_admin_token()
        event_id = self.get_or_create_event(token)
        
        res = self.session.get(
            f"{BASE_URL}/api/events/{event_id}/menu",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        items = res.json()
        assert isinstance(items, list)
        print(f"PASS: Listed menu items ({len(items)} items)")
    
    def test_update_menu_item(self):
        """Update a menu item"""
        token = self.get_admin_token()
        event_id = self.get_or_create_event(token)
        
        # Create item
        create_res = self.session.post(
            f"{BASE_URL}/api/events/{event_id}/menu",
            json={"name": "TEST_ToUpdate", "category": "essen", "price": 10.00},
            headers={"Authorization": f"Bearer {token}"}
        )
        item_id = create_res.json()["id"]
        
        # Update item
        update_res = self.session.put(
            f"{BASE_URL}/api/events/{event_id}/menu/{item_id}",
            json={"name": "TEST_Updated", "price": 15.00},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert update_res.status_code == 200
        data = update_res.json()
        assert data["name"] == "TEST_Updated"
        assert data["price"] == 15.00
        print(f"PASS: Updated menu item successfully")
        
        # Cleanup
        self.session.delete(
            f"{BASE_URL}/api/events/{event_id}/menu/{item_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    def test_delete_menu_item(self):
        """Delete a menu item"""
        token = self.get_admin_token()
        event_id = self.get_or_create_event(token)
        
        # Create item
        create_res = self.session.post(
            f"{BASE_URL}/api/events/{event_id}/menu",
            json={"name": "TEST_ToDelete", "category": "essen"},
            headers={"Authorization": f"Bearer {token}"}
        )
        item_id = create_res.json()["id"]
        
        # Delete item
        del_res = self.session.delete(
            f"{BASE_URL}/api/events/{event_id}/menu/{item_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert del_res.status_code == 200
        
        # Verify deleted
        list_res = self.session.get(
            f"{BASE_URL}/api/events/{event_id}/menu",
            headers={"Authorization": f"Bearer {token}"}
        )
        items = list_res.json()
        assert all(i["id"] != item_id for i in items)
        print(f"PASS: Deleted menu item successfully")


class TestGuestNewFields:
    """Test new guest fields: notes, vehicle, license_plate"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_admin_token(self):
        res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USER,
            "password": ADMIN_PASS
        })
        return res.json()["access_token"]
    
    def get_or_create_event(self, token):
        res = self.session.get(
            f"{BASE_URL}/api/events",
            headers={"Authorization": f"Bearer {token}"}
        )
        events = res.json()
        if events:
            return events[0]["id"]
        
        res = self.session.post(
            f"{BASE_URL}/api/events",
            json={"name": "TEST_GuestFields_Event", "table_count": 5, "seats_per_table": 6},
            headers={"Authorization": f"Bearer {token}"}
        )
        return res.json()["id"]
    
    def test_create_guest_with_new_fields(self):
        """Create guest with notes, vehicle, license_plate"""
        token = self.get_admin_token()
        event_id = self.get_or_create_event(token)
        
        guest_data = {
            "first_name": "TEST_Hans",
            "last_name": "Tester",
            "guest_type": "erwachsener",
            "is_staff": False,
            "notes": "VIP Gast",
            "vehicle": "BMW X5",
            "license_plate": "ZH 123 456"
        }
        res = self.session.post(
            f"{BASE_URL}/api/events/{event_id}/guests",
            json=guest_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["notes"] == "VIP Gast"
        assert data["vehicle"] == "BMW X5"
        assert data["license_plate"] == "ZH 123 456"
        print(f"PASS: Created guest with new fields - id {data['id']}")
        
        # Cleanup
        self.session.delete(
            f"{BASE_URL}/api/events/{event_id}/guests/{data['id']}",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    def test_update_guest_new_fields(self):
        """Update guest's notes, vehicle, license_plate"""
        token = self.get_admin_token()
        event_id = self.get_or_create_event(token)
        
        # Create guest
        create_res = self.session.post(
            f"{BASE_URL}/api/events/{event_id}/guests",
            json={"first_name": "TEST_Update", "last_name": "Fields", "guest_type": "erwachsener"},
            headers={"Authorization": f"Bearer {token}"}
        )
        guest_id = create_res.json()["id"]
        
        # Update with new fields
        update_res = self.session.put(
            f"{BASE_URL}/api/events/{event_id}/guests/{guest_id}",
            json={
                "notes": "Updated note",
                "vehicle": "Mercedes",
                "license_plate": "SG 999 888"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert update_res.status_code == 200
        data = update_res.json()
        assert data["notes"] == "Updated note"
        assert data["vehicle"] == "Mercedes"
        assert data["license_plate"] == "SG 999 888"
        print(f"PASS: Updated guest new fields successfully")
        
        # Cleanup
        self.session.delete(
            f"{BASE_URL}/api/events/{event_id}/guests/{guest_id}",
            headers={"Authorization": f"Bearer {token}"}
        )


class TestStaffManagement:
    """Test staff (Mitarbeiter) management via is_staff flag"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_admin_token(self):
        res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USER,
            "password": ADMIN_PASS
        })
        return res.json()["access_token"]
    
    def get_or_create_event(self, token):
        res = self.session.get(
            f"{BASE_URL}/api/events",
            headers={"Authorization": f"Bearer {token}"}
        )
        events = res.json()
        if events:
            return events[0]["id"]
        
        res = self.session.post(
            f"{BASE_URL}/api/events",
            json={"name": "TEST_Staff_Event", "table_count": 5, "seats_per_table": 6},
            headers={"Authorization": f"Bearer {token}"}
        )
        return res.json()["id"]
    
    def test_create_staff_member(self):
        """Create a staff member with is_staff=True and new fields"""
        token = self.get_admin_token()
        event_id = self.get_or_create_event(token)
        
        staff_data = {
            "first_name": "TEST_Maria",
            "last_name": "Kellner",
            "guest_type": "erwachsener",
            "is_staff": True,
            "notes": "Service Team",
            "vehicle": "VW Golf",
            "license_plate": "BE 111 222"
        }
        res = self.session.post(
            f"{BASE_URL}/api/events/{event_id}/guests",
            json=staff_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["is_staff"] == True
        assert data["notes"] == "Service Team"
        print(f"PASS: Created staff member with id {data['id']}")
        
        # Cleanup
        self.session.delete(
            f"{BASE_URL}/api/events/{event_id}/guests/{data['id']}",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    def test_staff_separated_from_guests(self):
        """Verify staff members can be filtered from regular guests"""
        token = self.get_admin_token()
        event_id = self.get_or_create_event(token)
        
        # Create one staff and one guest
        staff = self.session.post(
            f"{BASE_URL}/api/events/{event_id}/guests",
            json={"first_name": "TEST_Staff", "last_name": "Person", "is_staff": True},
            headers={"Authorization": f"Bearer {token}"}
        ).json()
        
        guest = self.session.post(
            f"{BASE_URL}/api/events/{event_id}/guests",
            json={"first_name": "TEST_Guest", "last_name": "Person", "is_staff": False},
            headers={"Authorization": f"Bearer {token}"}
        ).json()
        
        # List all guests
        list_res = self.session.get(
            f"{BASE_URL}/api/events/{event_id}/guests",
            headers={"Authorization": f"Bearer {token}"}
        )
        all_guests = list_res.json()
        
        # Verify both exist and have correct is_staff flag
        test_guests = [g for g in all_guests if g["first_name"].startswith("TEST_")]
        staff_members = [g for g in test_guests if g["is_staff"]]
        regular_guests = [g for g in test_guests if not g["is_staff"]]
        
        assert len(staff_members) >= 1
        assert len(regular_guests) >= 1
        print(f"PASS: Staff and guests properly separated ({len(staff_members)} staff, {len(regular_guests)} guests)")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/events/{event_id}/guests/{staff['id']}", headers={"Authorization": f"Bearer {token}"})
        self.session.delete(f"{BASE_URL}/api/events/{event_id}/guests/{guest['id']}", headers={"Authorization": f"Bearer {token}"})


class TestCheckinEndpoint:
    """Test check-in toggle functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_admin_token(self):
        res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USER,
            "password": ADMIN_PASS
        })
        return res.json()["access_token"]
    
    def test_toggle_checkin(self):
        """Toggle guest check-in status"""
        token = self.get_admin_token()
        
        # Get or create event
        res = self.session.get(f"{BASE_URL}/api/events", headers={"Authorization": f"Bearer {token}"})
        events = res.json()
        if not events:
            res = self.session.post(
                f"{BASE_URL}/api/events",
                json={"name": "TEST_Checkin_Event", "table_count": 3, "seats_per_table": 6},
                headers={"Authorization": f"Bearer {token}"}
            )
            event_id = res.json()["id"]
        else:
            event_id = events[0]["id"]
        
        # Create guest
        guest_res = self.session.post(
            f"{BASE_URL}/api/events/{event_id}/guests",
            json={"first_name": "TEST_Checkin", "last_name": "Test"},
            headers={"Authorization": f"Bearer {token}"}
        )
        guest_id = guest_res.json()["id"]
        initial_status = guest_res.json().get("checked_in", False)
        
        # Toggle checkin
        toggle_res = self.session.put(
            f"{BASE_URL}/api/events/{event_id}/guests/{guest_id}/checkin",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert toggle_res.status_code == 200
        toggled_status = toggle_res.json()["checked_in"]
        assert toggled_status != initial_status
        print(f"PASS: Toggled checkin from {initial_status} to {toggled_status}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/events/{event_id}/guests/{guest_id}", headers={"Authorization": f"Bearer {token}"})


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
