import requests
import sys
import json
from datetime import datetime

class TaronERPTester:
    def __init__(self, base_url="https://taron-hub.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {
            'users': [],
            'tasks': [],
            'projects': [],
            'clients': [],
            'expenses': [],
            'income': [],
            'safety_protocols': [],
            'messages': [],
            'daily_reports': [],
            'purchase_requests': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_owner_login(self):
        """Test owner login and get token"""
        success, response = self.run_test(
            "Owner Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@taron.com", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Token obtained for user: {response['user']['name']}")
            return True
        return False

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            print(f"   Stats: {json.dumps(response, indent=2)}")
        return success

    def test_user_management(self):
        """Test user management endpoints"""
        # Get users
        success, users = self.run_test("Get Users", "GET", "users", 200)
        if not success:
            return False

        # Create new user
        new_user_data = {
            "name": "Test Employee",
            "email": "test.employee@taron.com",
            "password": "testpass123",
            "role": "employee",
            "phone": "+91 9876543210",
            "department": "Engineering"
        }
        success, user_response = self.run_test(
            "Create User", "POST", "auth/register", 200, data=new_user_data
        )
        if success and 'id' in user_response:
            self.created_resources['users'].append(user_response['id'])
            print(f"   Created user: {user_response['name']}")

        return success

    def test_task_management(self):
        """Test task management endpoints"""
        # Get team members first
        success, team_members = self.run_test("Get Team Members", "GET", "team-members", 200)
        if not success or not team_members:
            print("   No team members available for task assignment")
            return False

        # Create task
        task_data = {
            "title": "Test Task",
            "description": "This is a test task for API testing",
            "assigned_to": team_members[0]['id'],
            "priority": "high",
            "status": "pending",
            "due_date": "2024-12-31"
        }
        success, task_response = self.run_test(
            "Create Task", "POST", "tasks", 200, data=task_data
        )
        if success and 'id' in task_response:
            task_id = task_response['id']
            self.created_resources['tasks'].append(task_id)
            print(f"   Created task: {task_response['title']}")

            # Get tasks
            success, tasks = self.run_test("Get Tasks", "GET", "tasks", 200)
            if success:
                print(f"   Found {len(tasks)} tasks")

            # Update task status
            success, _ = self.run_test(
                "Update Task", "PUT", f"tasks/{task_id}", 200, 
                data={"status": "in_progress"}
            )

        return success

    def test_project_management(self):
        """Test project management endpoints"""
        # Get team members for project assignment
        success, team_members = self.run_test("Get Team Members", "GET", "team-members", 200)
        if not success or not team_members:
            return False

        # Create project
        project_data = {
            "name": "Test Project",
            "description": "API Testing Project",
            "team_leader_id": team_members[0]['id'],
            "status": "active",
            "start_date": "2024-01-01",
            "progress": 25
        }
        success, project_response = self.run_test(
            "Create Project", "POST", "projects", 200, data=project_data
        )
        if success and 'id' in project_response:
            self.created_resources['projects'].append(project_response['id'])
            print(f"   Created project: {project_response['name']}")

            # Get projects
            success, projects = self.run_test("Get Projects", "GET", "projects", 200)
            if success:
                print(f"   Found {len(projects)} projects")

        return success

    def test_client_management(self):
        """Test client management endpoints"""
        # Get team members for client assignment
        success, team_members = self.run_test("Get Team Members", "GET", "team-members", 200)
        if not success or not team_members:
            return False

        # Create client
        client_data = {
            "name": "Test Client Corp",
            "email": "contact@testclient.com",
            "phone": "+91 9876543210",
            "company": "Test Client Corporation",
            "address": "123 Test Street, Test City",
            "assigned_to": team_members[0]['id']
        }
        success, client_response = self.run_test(
            "Create Client", "POST", "clients", 200, data=client_data
        )
        if success and 'id' in client_response:
            self.created_resources['clients'].append(client_response['id'])
            print(f"   Created client: {client_response['name']}")

            # Get clients
            success, clients = self.run_test("Get Clients", "GET", "clients", 200)
            if success:
                print(f"   Found {len(clients)} clients")

        return success

    def test_finance_management(self):
        """Test finance management endpoints"""
        # Create expense
        expense_data = {
            "title": "Test Office Supplies",
            "description": "Monthly office supplies purchase",
            "amount": 5000.0,
            "category": "supplies",
            "date": "2024-01-15",
            "is_gst_applicable": True,
            "gst_amount": 900.0
        }
        success, expense_response = self.run_test(
            "Create Expense", "POST", "expenses", 200, data=expense_data
        )
        if success and 'id' in expense_response:
            self.created_resources['expenses'].append(expense_response['id'])
            print(f"   Created expense: {expense_response['title']}")

        # Create income
        income_data = {
            "title": "Project Payment",
            "description": "Payment from client project",
            "amount": 50000.0,
            "source": "project",
            "date": "2024-01-20",
            "is_gst_applicable": True,
            "gst_amount": 9000.0
        }
        success, income_response = self.run_test(
            "Create Income", "POST", "income", 200, data=income_data
        )
        if success and 'id' in income_response:
            self.created_resources['income'].append(income_response['id'])
            print(f"   Created income: {income_response['title']}")

        # Get finance summary
        success, summary = self.run_test("Get Finance Summary", "GET", "finance/summary", 200)
        if success:
            print(f"   Finance Summary: Income={summary.get('total_income', 0)}, Expenses={summary.get('total_expenses', 0)}")

        return success

    def test_purchase_requests(self):
        """Test purchase request endpoints"""
        # Create purchase request
        request_data = {
            "title": "New Laptop",
            "description": "MacBook Pro for development team",
            "amount": 150000.0,
            "category": "equipment",
            "urgency": "normal"
        }
        success, request_response = self.run_test(
            "Create Purchase Request", "POST", "purchase-requests", 200, data=request_data
        )
        if success and 'id' in request_response:
            request_id = request_response['id']
            self.created_resources['purchase_requests'].append(request_id)
            print(f"   Created purchase request: {request_response['title']}")

            # Get purchase requests
            success, requests = self.run_test("Get Purchase Requests", "GET", "purchase-requests", 200)
            if success:
                print(f"   Found {len(requests)} purchase requests")

            # Approve request
            success, _ = self.run_test(
                "Approve Purchase Request", "PUT", f"purchase-requests/{request_id}/approve", 200,
                data={"remarks": "Approved for Q1 budget"}
            )

        return success

    def test_safety_protocols(self):
        """Test safety protocol endpoints"""
        # Create safety protocol
        protocol_data = {
            "title": "Fire Safety Protocol",
            "description": "Emergency fire evacuation procedures",
            "category": "fire",
            "priority": "high"
        }
        success, protocol_response = self.run_test(
            "Create Safety Protocol", "POST", "safety-protocols", 200, data=protocol_data
        )
        if success and 'id' in protocol_response:
            self.created_resources['safety_protocols'].append(protocol_response['id'])
            print(f"   Created safety protocol: {protocol_response['title']}")

            # Get safety protocols
            success, protocols = self.run_test("Get Safety Protocols", "GET", "safety-protocols", 200)
            if success:
                print(f"   Found {len(protocols)} safety protocols")

        return success

    def test_messages(self):
        """Test messaging endpoints"""
        # Send broadcast message
        message_data = {
            "subject": "Test Broadcast",
            "content": "This is a test broadcast message",
            "is_broadcast": True
        }
        success, message_response = self.run_test(
            "Send Broadcast Message", "POST", "messages", 200, data=message_data
        )
        if success and 'id' in message_response:
            self.created_resources['messages'].append(message_response['id'])
            print(f"   Sent message: {message_response['subject']}")

            # Get messages
            success, messages = self.run_test("Get Messages", "GET", "messages", 200)
            if success:
                print(f"   Found {len(messages)} messages")

        return success

    def test_daily_reports(self):
        """Test daily report endpoints"""
        # Create daily report
        report_data = {
            "date": "2024-01-15",
            "tasks_completed": ["Completed API testing", "Updated documentation"],
            "tasks_in_progress": ["Working on frontend tests"],
            "issues": "No major issues",
            "notes": "Good progress on testing suite"
        }
        success, report_response = self.run_test(
            "Create Daily Report", "POST", "daily-reports", 200, data=report_data
        )
        if success and 'id' in report_response:
            self.created_resources['daily_reports'].append(report_response['id'])
            print(f"   Created daily report for: {report_response['date']}")

            # Get daily reports
            success, reports = self.run_test("Get Daily Reports", "GET", "daily-reports", 200)
            if success:
                print(f"   Found {len(reports)} daily reports")

        return success

    def test_attendance(self):
        """Test attendance endpoints"""
        # Create attendance record
        attendance_data = {
            "user_id": self.user_id,
            "date": "2024-01-15",
            "status": "present",
            "check_in": "2024-01-15T09:00:00",
            "check_out": "2024-01-15T18:00:00",
            "notes": "Regular working day"
        }
        success, attendance_response = self.run_test(
            "Create Attendance", "POST", "attendance", 200, data=attendance_data
        )
        if success:
            print(f"   Created attendance record for: {attendance_response.get('date', 'N/A')}")

            # Get attendance
            success, attendance = self.run_test("Get Attendance", "GET", "attendance", 200)
            if success:
                print(f"   Found {len(attendance)} attendance records")

        return success

def main():
    print("🚀 Starting Taron Technology ERP API Testing...")
    tester = TaronERPTester()
    
    # Test authentication first
    if not tester.test_owner_login():
        print("❌ Authentication failed, stopping tests")
        return 1

    # Test all modules
    test_results = []
    
    test_results.append(("Dashboard Stats", tester.test_dashboard_stats()))
    test_results.append(("User Management", tester.test_user_management()))
    test_results.append(("Task Management", tester.test_task_management()))
    test_results.append(("Project Management", tester.test_project_management()))
    test_results.append(("Client Management", tester.test_client_management()))
    test_results.append(("Finance Management", tester.test_finance_management()))
    test_results.append(("Purchase Requests", tester.test_purchase_requests()))
    test_results.append(("Safety Protocols", tester.test_safety_protocols()))
    test_results.append(("Messages", tester.test_messages()))
    test_results.append(("Daily Reports", tester.test_daily_reports()))
    test_results.append(("Attendance", tester.test_attendance()))

    # Print summary
    print(f"\n📊 Test Results Summary:")
    print(f"Total tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    print(f"\n📋 Module Results:")
    for module, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {module}: {status}")

    print(f"\n🗂️ Created Resources:")
    for resource_type, resources in tester.created_resources.items():
        if resources:
            print(f"  {resource_type}: {len(resources)} items")

    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())