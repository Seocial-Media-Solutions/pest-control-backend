# Get sample IDs for testing
$baseUrl = "http://localhost:3000/api"

Write-Host "`n=== Fetching Sample Data for Testing ===" -ForegroundColor Cyan

# Get Customers
try {
    $customers = Invoke-RestMethod -Uri "$baseUrl/customers" -UseBasicParsing
    if ($customers.data.customers.Count -gt 0) {
        $customerId = $customers.data.customers[0]._id
        Write-Host "`n✅ Customer ID: $customerId" -ForegroundColor Green
        Write-Host "   Name: $($customers.data.customers[0].fullName)"
    } else {
        Write-Host "`n⚠️ No customers found" -ForegroundColor Yellow
        $customerId = "000000000000000000000000"
    }
} catch {
    Write-Host "`n❌ Error fetching customers: $_" -ForegroundColor Red
    $customerId = "000000000000000000000000"
}

# Get Technicians
try {
    $technicians = Invoke-RestMethod -Uri "$baseUrl/technicians" -UseBasicParsing
    if ($technicians.data.Count -gt 0) {
        $technicianId = $technicians.data[0]._id
        Write-Host "`n✅ Technician ID: $technicianId" -ForegroundColor Green
        Write-Host "   Name: $($technicians.data[0].fullName)"
    } else {
        Write-Host "`n⚠️ No technicians found" -ForegroundColor Yellow
        $technicianId = "000000000000000000000000"
    }
} catch {
    Write-Host "`n❌ Error fetching technicians: $_" -ForegroundColor Red
    $technicianId = "000000000000000000000000"
}

# Get Bookings
try {
    $bookings = Invoke-RestMethod -Uri "$baseUrl/bookings" -UseBasicParsing
    if ($bookings.data.Count -gt 0) {
        $bookingId = $bookings.data[0]._id
        Write-Host "`n✅ Booking ID: $bookingId" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️ No bookings found" -ForegroundColor Yellow
        $bookingId = $null
    }
} catch {
    Write-Host "`n❌ Error fetching bookings: $_" -ForegroundColor Red
    $bookingId = $null
}

Write-Host "`n=== Sample IDs Retrieved ===" -ForegroundColor Cyan
Write-Host "Customer ID:   $customerId"
Write-Host "Technician ID: $technicianId"
Write-Host "Booking ID:    $bookingId"

# Export to JSON for the test script
$ids = @{
    customerId = $customerId
    technicianId = $technicianId
    bookingId = $bookingId
}

$ids | ConvertTo-Json | Out-File -FilePath "test-ids.json" -Encoding UTF8
Write-Host "`n✅ IDs saved to test-ids.json" -ForegroundColor Green
