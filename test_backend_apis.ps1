$results = [System.Collections.Generic.List[PSCustomObject]]::new()

function Test-Api {
    param(
        [string]$Category,
        [string]$Name,
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [int]$ExpectedStatus = 200
    )

    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            UseBasicParsing = $true
        }

        if ($Headers.Count -gt 0) {
            $params["Headers"] = $Headers
        }

        if ($Body) {
            $params["ContentType"] = "application/json"
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
        }

        $response = Invoke-RestMethod @params
        $results.Add([PSCustomObject]@{
            Category = $Category
            Endpoint = "$Method $Uri"
            Name = $Name
            Status = "PASS"
            Details = "Success (200/201 OK)"
        })
        return $response
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            $results.Add([PSCustomObject]@{
                Category = $Category
                Endpoint = "$Method $Uri"
                Name = $Name
                Status = "PASS"
                Details = "Expected error status $statusCode handled correctly"
            })
        } else {
            $results.Add([PSCustomObject]@{
                Category = $Category
                Endpoint = "$Method $Uri"
                Name = $Name
                Status = "FAIL"
                Details = "Error: $($_.Exception.Message) (HTTP $statusCode)"
            })
        }
        return $null
    }
}

Write-Host "================== STARTING CAMPUSBUS BACKEND API TESTS =================="

# 1. Health & DB
$health = Test-Api -Category "Health" -Name "System Health & MongoDB Status" -Method "Get" -Uri "http://localhost:5000/api/health"

# 2. Authentication
$adminLogin = Test-Api -Category "Auth" -Name "Admin Login" -Method "Post" -Uri "http://localhost:5000/api/auth/login" -Body @{ email = "admin@campusbus.edu"; password = "Admin@123" }
$adminToken = $adminLogin.data.token
$adminHeader = @{ Authorization = "Bearer $adminToken" }

$driverLogin = Test-Api -Category "Auth" -Name "Driver Login" -Method "Post" -Uri "http://localhost:5000/api/auth/login" -Body @{ email = "driver1@campusbus.edu"; password = "Driver@123" }
$driverToken = $driverLogin.data.token
$driverHeader = @{ Authorization = "Bearer $driverToken" }

$studentLogin = Test-Api -Category "Auth" -Name "Student Login" -Method "Post" -Uri "http://localhost:5000/api/auth/login" -Body @{ email = "student1@campusbus.edu"; password = "Student@123" }
$studentToken = $studentLogin.data.token
$studentHeader = @{ Authorization = "Bearer $studentToken" }

# User Registration Test
$randSuffix = Get-Random -Minimum 1000 -Maximum 9999
$newStudentEmail = "test_student_$randSuffix@campusbus.edu"
$registerRes = Test-Api -Category "Auth" -Name "New Student Registration" -Method "Post" -Uri "http://localhost:5000/api/auth/register" -Body @{
    name = "Test Student $randSuffix"
    email = $newStudentEmail
    password = "TestPassword@123"
    role = "student"
    phone = "+1 (555) 012-3456"
    studentId = "STU-TEST-$randSuffix"
}
$newStudentToken = $registerRes.data.token
$newStudentHeader = @{ Authorization = "Bearer $newStudentToken" }

# Negative Auth Test (Invalid password)
Test-Api -Category "Auth" -Name "Invalid Credentials Handling" -Method "Post" -Uri "http://localhost:5000/api/auth/login" -Body @{ email = "admin@campusbus.edu"; password = "WrongPassword" } -ExpectedStatus 401

# Me & Profile
Test-Api -Category "Auth" -Name "Current User Profile (Me)" -Method "Get" -Uri "http://localhost:5000/api/auth/me" -Headers $studentHeader
Test-Api -Category "Auth" -Name "Update Profile" -Method "Put" -Uri "http://localhost:5000/api/auth/profile" -Headers $studentHeader -Body @{ phone = "+1 (555) 999-8888"; selectedStop = "Green Park Colony" }

# 3. Student APIs
Test-Api -Category "Student" -Name "Get Available Buses" -Method "Get" -Uri "http://localhost:5000/api/student/buses" -Headers $studentHeader
Test-Api -Category "Student" -Name "Select Bus for Student" -Method "Post" -Uri "http://localhost:5000/api/student/select-bus" -Headers $studentHeader -Body @{ busId = "bus_01"; selectedStop = "Green Park Colony" }
Test-Api -Category "Student" -Name "Get Student Dashboard" -Method "Get" -Uri "http://localhost:5000/api/student/dashboard" -Headers $studentHeader
Test-Api -Category "Student" -Name "Get Student Notifications" -Method "Get" -Uri "http://localhost:5000/api/student/notifications" -Headers $studentHeader
Test-Api -Category "Student" -Name "Mark Notification As Read" -Method "Put" -Uri "http://localhost:5000/api/student/notifications/notif_01/read" -Headers $studentHeader

# 4. Driver APIs
Test-Api -Category "Driver" -Name "Get Driver Dashboard" -Method "Get" -Uri "http://localhost:5000/api/driver/dashboard" -Headers $driverHeader
Test-Api -Category "Driver" -Name "Start Trip" -Method "Post" -Uri "http://localhost:5000/api/driver/start-trip" -Headers $driverHeader -Body @{ busId = "bus_01" }
Test-Api -Category "Driver" -Name "Update Trip Status (On Route)" -Method "Put" -Uri "http://localhost:5000/api/driver/trip-status" -Headers $driverHeader -Body @{ status = "on_route" }
Test-Api -Category "Driver" -Name "Update Trip Status (Approaching Stop)" -Method "Put" -Uri "http://localhost:5000/api/driver/trip-status" -Headers $driverHeader -Body @{ status = "approaching_stop"; nextStopName = "Green Park Colony" }
Test-Api -Category "Driver" -Name "Update Trip Status (Delayed)" -Method "Put" -Uri "http://localhost:5000/api/driver/trip-status" -Headers $driverHeader -Body @{ status = "delayed"; delayMinutes = 12; delayReason = "Heavy junction traffic" }
$emgReport = Test-Api -Category "Driver" -Name "Report Emergency" -Method "Post" -Uri "http://localhost:5000/api/driver/emergency" -Headers $driverHeader -Body @{ type = "breakdown"; description = "Air pressure drop in secondary line"; severity = "high" }
$emgId = $emgReport.data._id

# 5. Admin APIs
Test-Api -Category "Admin" -Name "Admin Fleet Overview" -Method "Get" -Uri "http://localhost:5000/api/admin/overview" -Headers $adminHeader

# Admin Buses CRUD
Test-Api -Category "Admin (Buses)" -Name "List Fleet Buses" -Method "Get" -Uri "http://localhost:5000/api/admin/buses" -Headers $adminHeader
$newBus = Test-Api -Category "Admin (Buses)" -Name "Create New Bus" -Method "Post" -Uri "http://localhost:5000/api/admin/buses" -Headers $adminHeader -Body @{
    busNumber = "BUS-09"
    registrationNumber = "DL-01-CB-9009"
    capacity = 45
    model = "Volvo 9400 Campus"
    status = "active"
}
$newBusId = $newBus.data._id
Test-Api -Category "Admin (Buses)" -Name "Update Bus" -Method "Put" -Uri "http://localhost:5000/api/admin/buses/$newBusId" -Headers $adminHeader -Body @{ capacity = 48; model = "Volvo 9400 B11R" }
Test-Api -Category "Admin (Buses)" -Name "Delete Bus" -Method "Delete" -Uri "http://localhost:5000/api/admin/buses/$newBusId" -Headers $adminHeader

# Admin Drivers CRUD
Test-Api -Category "Admin (Drivers)" -Name "List Drivers" -Method "Get" -Uri "http://localhost:5000/api/admin/drivers" -Headers $adminHeader
$newDriver = Test-Api -Category "Admin (Drivers)" -Name "Register Driver" -Method "Post" -Uri "http://localhost:5000/api/admin/drivers" -Headers $adminHeader -Body @{
    name = "Kavita Rao"
    email = "driver_kavita_$randSuffix@campusbus.edu"
    password = "Driver@123"
    phone = "+1 (555) 777-6666"
    licenseNumber = "DL-IND-99990"
}
$newDriverId = $newDriver.data._id
Test-Api -Category "Admin (Drivers)" -Name "Update Driver" -Method "Put" -Uri "http://localhost:5000/api/admin/drivers/$newDriverId" -Headers $adminHeader -Body @{ phone = "+1 (555) 777-8888" }
Test-Api -Category "Admin (Drivers)" -Name "Delete Driver" -Method "Delete" -Uri "http://localhost:5000/api/admin/drivers/$newDriverId" -Headers $adminHeader

# Admin Routes CRUD
Test-Api -Category "Admin (Routes)" -Name "List Routes" -Method "Get" -Uri "http://localhost:5000/api/admin/routes" -Headers $adminHeader
$newRoute = Test-Api -Category "Admin (Routes)" -Name "Create Route" -Method "Post" -Uri "http://localhost:5000/api/admin/routes" -Headers $adminHeader -Body @{
    name = "Southwest Tech Corridor"
    routeCode = "R-99"
    startPoint = "West Terminal"
    endPoint = "Main Campus Gate 3"
    totalDistanceKm = 14.2
    estimatedDurationMinutes = 35
}
$newRouteId = $newRoute.data._id
Test-Api -Category "Admin (Routes)" -Name "Update Route" -Method "Put" -Uri "http://localhost:5000/api/admin/routes/$newRouteId" -Headers $adminHeader -Body @{ totalDistanceKm = 15.0 }
Test-Api -Category "Admin (Routes)" -Name "Delete Route" -Method "Delete" -Uri "http://localhost:5000/api/admin/routes/$newRouteId" -Headers $adminHeader

# Admin Schedules CRUD
Test-Api -Category "Admin (Schedules)" -Name "List Schedules" -Method "Get" -Uri "http://localhost:5000/api/admin/schedules" -Headers $adminHeader
$newSched = Test-Api -Category "Admin (Schedules)" -Name "Create Schedule" -Method "Post" -Uri "http://localhost:5000/api/admin/schedules" -Headers $adminHeader -Body @{
    title = "Late Evening Library Run"
    routeId = "route_01"
    busId = "bus_01"
    departureTime = "08:00 PM"
    estimatedArrivalTime = "08:45 PM"
    shift = "evening"
}
$newSchedId = $newSched.data._id
Test-Api -Category "Admin (Schedules)" -Name "Update Schedule" -Method "Put" -Uri "http://localhost:5000/api/admin/schedules/$newSchedId" -Headers $adminHeader -Body @{ departureTime = "08:15 PM" }
Test-Api -Category "Admin (Schedules)" -Name "Delete Schedule" -Method "Delete" -Uri "http://localhost:5000/api/admin/schedules/$newSchedId" -Headers $adminHeader

# Admin Exam Mode
Test-Api -Category "Admin (Exam Mode)" -Name "Toggle Exam Mode" -Method "Post" -Uri "http://localhost:5000/api/admin/exam-mode" -Headers $adminHeader -Body @{ enabled = $true; customMessage = "Examination Express Routes Active" }

# Admin Broadcast Notification
Test-Api -Category "Admin (Notifications)" -Name "Broadcast Notification" -Method "Post" -Uri "http://localhost:5000/api/admin/notifications" -Headers $adminHeader -Body @{
    title = "Midterm Transit Advisory"
    message = "Special morning express buses operating for all exam hall venues."
    type = "exam"
    targetAudience = "all"
}

# Admin Trips & Emergency
Test-Api -Category "Admin (Trips & Emergency)" -Name "Get Trips Monitoring" -Method "Get" -Uri "http://localhost:5000/api/admin/trips" -Headers $adminHeader
Test-Api -Category "Admin (Trips & Emergency)" -Name "Operator Trip Override" -Method "Put" -Uri "http://localhost:5000/api/admin/trips/trip_01" -Headers $adminHeader -Body @{ status = "on_route"; delayMinutes = 0 }
if ($emgId) {
    Test-Api -Category "Admin (Trips & Emergency)" -Name "Resolve Emergency" -Method "Put" -Uri "http://localhost:5000/api/admin/emergencies/$emgId" -Headers $adminHeader -Body @{ resolutionNotes = "Mechanic team deployed; pressure valve replaced"; status = "resolved" }
}

# 6. Tracking APIs
Test-Api -Category "Tracking" -Name "Get All Bus Locations" -Method "Get" -Uri "http://localhost:5000/api/tracking/all"
Test-Api -Category "Tracking" -Name "Get Single Bus Location" -Method "Get" -Uri "http://localhost:5000/api/tracking/bus/bus_01"
Test-Api -Category "Tracking" -Name "Ingest Hardware GPS Coordinate" -Method "Post" -Uri "http://localhost:5000/api/tracking/update" -Headers $driverHeader -Body @{
    busId = "bus_01"
    latitude = 28.5620
    longitude = 77.3300
    speedKmH = 42
    heading = 120
}

# 7. Offline APIs
Test-Api -Category "Offline" -Name "Get Offline Snapshot" -Method "Get" -Uri "http://localhost:5000/api/offline/snapshot"
Test-Api -Category "Offline" -Name "Sync Offline Queued Updates" -Method "Post" -Uri "http://localhost:5000/api/offline/sync" -Headers $driverHeader -Body @{
    queuedUpdates = @(
        @{
            requestId = "req_test_01"
            type = "trip_status_update"
            payload = @{
                tripId = "trip_01"
                status = "on_route"
            }
            clientTimestamp = (Get-Date).ToString("o")
        }
    )
}

Write-Host "================== TEST EXECUTION FINISHED =================="

# Output results summary and table
$passed = ($results | Where-Object { $_.Status -eq 'PASS' }).Count
$failed = ($results | Where-Object { $_.Status -eq 'FAIL' }).Count

Write-Host "SUMMARY: Total Tests = $($results.Count) | Passed = $passed | Failed = $failed"

$results | Format-Table Category, Name, Status, Details -AutoSize
