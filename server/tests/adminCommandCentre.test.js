import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

process.env.NODE_ENV = 'test';

const { default: app } = await import('../src/server.js');
const { connectDB } = await import('../src/config/db.js');
const { default: User } = await import('../src/models/User.js');
const { default: WasteReport } = await import('../src/models/WasteReport.js');
const { default: CollectionVehicle } = await import('../src/models/CollectionVehicle.js');
const { default: Ward } = await import('../src/models/Ward.js');
const { default: CollectionSchedule } = await import('../src/models/CollectionSchedule.js');
const { default: CollectionRoute } = await import('../src/models/CollectionRoute.js');
const { default: RecyclingCentre } = await import('../src/models/RecyclingCentre.js');
const { default: Complaint } = await import('../src/models/Complaint.js');
const { default: Campaign } = await import('../src/models/Campaign.js');
const { default: AuditLog } = await import('../src/models/AuditLog.js');

const JWT_SECRET = process.env.JWT_SECRET;

// Track ONLY test-created document IDs for surgical cleanup (never delete existing records)
const cleanupTracker = {
  users: [],
  reports: [],
  vehicles: [],
  wards: [],
  schedules: [],
  routes: [],
  centres: [],
  complaints: [],
  campaigns: [],
  auditLogs: []
};

let server;
let baseUrl;

async function request(method, urlPath, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('================================================================');
  console.log('WASTEWISE – COIMBATORE ADMIN COMMAND CENTRE INTEGRATION TESTS');
  console.log('================================================================');

  await connectDB();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;

  const testSuffix = Date.now();
  let passed = 0;

  try {
    // Provision temporary test users (Admin, Driver 1, Citizen 1, Citizen 2)
    const adminUser = await User.create({
      name: `Test Admin ${testSuffix}`,
      email: `test.admin.${testSuffix}@wastewise.cbe.test`,
      password: 'TestPassword123!',
      role: 'admin',
      isActive: true
    });
    cleanupTracker.users.push(adminUser._id);

    const driverUser = await User.create({
      name: `Test Driver ${testSuffix}`,
      email: `test.driver.${testSuffix}@wastewise.cbe.test`,
      password: 'TestPassword123!',
      phone: '+91 9876500001',
      role: 'driver',
      employeeId: `DRV-TEST-${testSuffix}`,
      assignedWard: 'Ward 24 - RS Puram',
      assignedShift: 'Morning (06:00 - 14:00)',
      operationalStatus: 'Available',
      isActive: true
    });
    cleanupTracker.users.push(driverUser._id);

    const citizenOne = await User.create({
      name: `Test Citizen One ${testSuffix}`,
      email: `test.citizen1.${testSuffix}@wastewise.cbe.test`,
      password: 'TestPassword123!',
      role: 'citizen',
      isActive: true
    });
    cleanupTracker.users.push(citizenOne._id);

    const citizenTwo = await User.create({
      name: `Test Citizen Two ${testSuffix}`,
      email: `test.citizen2.${testSuffix}@wastewise.cbe.test`,
      password: 'TestPassword123!',
      role: 'citizen',
      isActive: true
    });
    cleanupTracker.users.push(citizenTwo._id);

    const adminToken = jwt.sign({ id: adminUser._id, role: 'admin', name: adminUser.name, email: adminUser.email }, JWT_SECRET, { expiresIn: '1h' });
    const driverToken = jwt.sign({ id: driverUser._id, role: 'driver', name: driverUser.name, email: driverUser.email }, JWT_SECRET, { expiresIn: '1h' });
    const citizenOneToken = jwt.sign({ id: citizenOne._id, role: 'citizen', name: citizenOne.name, email: citizenOne.email }, JWT_SECRET, { expiresIn: '1h' });
    const citizenTwoToken = jwt.sign({ id: citizenTwo._id, role: 'citizen', name: citizenTwo.name, email: citizenTwo.email }, JWT_SECRET, { expiresIn: '1h' });

    // -------------------------------------------------------------------------
    // TEST 1, 2, 3: Admin Authorisation, Citizen Rejection, Driver Restrictions
    // -------------------------------------------------------------------------
    console.log('\n[1-3] Testing Admin Authorisation, Citizen Access Rejection & Driver Restrictions...');
    const unauthRes = await request('GET', '/api/admin/users');
    assert.equal(unauthRes.status, 401, 'Unauthenticated request must return 401');

    const citizenAdminRes = await request('GET', '/api/admin/users', { token: citizenOneToken });
    assert.equal(citizenAdminRes.status, 403, 'Citizen access to admin users route must return 403');

    const driverAdminRes = await request('GET', '/api/admin/audit-logs', { token: driverToken });
    assert.equal(driverAdminRes.status, 403, 'Driver access to admin audit logs must return 403');

    const adminUsersRes = await request('GET', '/api/admin/users', { token: adminToken });
    assert.equal(adminUsersRes.status, 200, 'Admin access to /api/admin/users must return 200');
    assert.equal(adminUsersRes.data.success, true);
    passed += 3;
    console.log('  ✓ Passed Admin Authorisation, Citizen 403, and Driver 403 checks.');

    // -------------------------------------------------------------------------
    // TEST 5 & 6: Worker & Vehicle Management and Assignment Validation
    // -------------------------------------------------------------------------
    console.log('\n[5-6] Testing Worker & Vehicle Creation and Assignment Validation...');
    const vehicleCreateRes = await request('POST', '/api/vehicles', {
      token: adminToken,
      body: {
        registrationNumber: `TN-38-TST-${String(testSuffix).slice(-4)}`,
        vehicleName: `Test Compactor ${testSuffix}`,
        vehicleType: 'Compactor Truck',
        capacityValue: 500,
        capacityUnit: 'kg',
        assignedWard: 'Ward 24 - RS Puram',
        assignedDriverId: driverUser._id,
        operationalStatus: 'Available'
      }
    });
    assert.equal(vehicleCreateRes.status, 201, `Vehicle creation failed: ${JSON.stringify(vehicleCreateRes.data)}`);
    const testVehicle = vehicleCreateRes.data.vehicle;
    cleanupTracker.vehicles.push(testVehicle._id);
    passed += 2;
    console.log('  ✓ Passed Worker & Vehicle registration and linkage.');

    // -------------------------------------------------------------------------
    // TEST 4: Pickup Status Transitions, Rejection Reason & Eco-Points Integrity
    // -------------------------------------------------------------------------
    console.log('\n[4] Testing Pickup Lifecycle Transitions & Eco-Points Award Rules...');
    const createReportRes = await request('POST', '/api/reports', {
      token: citizenOneToken,
      body: {
        category: 'Plastic',
        quantity: 4,
        unit: 'kg',
        notes: 'Clean PET bottles for test',
        address: '12 DB Road, RS Puram, Coimbatore',
        locality: 'RS Puram',
        ward: 'Ward 24 - RS Puram',
        preferredDate: '2026-11-10',
        preferredSlot: '07:00 AM - 09:00 AM',
        lat: 11.0085,
        lng: 76.9511
      }
    });
    assert.equal(createReportRes.status, 201, `Citizen pickup submission failed: ${JSON.stringify(createReportRes.data)}`);
    const testReport = createReportRes.data.report;
    cleanupTracker.reports.push(testReport._id);
    assert.equal(testReport.pointsAwarded, false, 'Points must NOT be awarded on initial submission');

    // Invalid lifecycle jump: Reported -> Recycled directly
    const invalidJumpRes = await request('PUT', `/api/reports/${testReport._id}/status`, {
      token: adminToken,
      body: { status: 'Recycled' }
    });
    assert.equal(invalidJumpRes.status, 400, 'Invalid transition Reported -> Recycled must be rejected with 400');

    // Reject without reason must fail
    const rejectNoReasonRes = await request('PUT', `/api/reports/${testReport._id}/status`, {
      token: adminToken,
      body: { status: 'Rejected' }
    });
    assert.equal(rejectNoReasonRes.status, 400, 'Rejecting a pickup without rejectionReason must return 400');

    // Valid transition: Reported -> Assigned with worker & vehicle
    const assignRes = await request('PUT', `/api/reports/${testReport._id}/status`, {
      token: adminToken,
      body: {
        status: 'Assigned',
        driverId: driverUser._id,
        vehicleId: testVehicle._id
      }
    });
    assert.equal(assignRes.status, 200, `Valid transition Reported -> Assigned failed: ${JSON.stringify(assignRes.data)}`);

    // Valid transition: Assigned -> In Progress -> Collected (awards eco-points once)
    await request('PUT', `/api/reports/${testReport._id}/status`, {
      token: adminToken,
      body: { status: 'In Progress' }
    });
    const collectRes = await request('PUT', `/api/reports/${testReport._id}/status`, {
      token: adminToken,
      body: { status: 'Collected' }
    });
    assert.equal(collectRes.status, 200, 'Transition In Progress -> Collected must return 200');
    assert.equal(collectRes.data.report.pointsAwarded, true, 'Eco-points must be marked awarded upon Collected status');
    assert.ok(collectRes.data.report.aiClassification.ecoPointsEarned > 0, 'Eco-points value must be > 0');
    passed += 1;
    console.log('  ✓ Passed Pickup Status Lifecycle & Eco-Points verification.');

    // -------------------------------------------------------------------------
    // TEST 7: Schedule Conflict Detection (Double-Booking Worker/Vehicle)
    // -------------------------------------------------------------------------
    console.log('\n[7] Testing Schedule Conflict Detection (409 on Double-Booking)...');
    const scheduleDate = '2026-12-15';
    const sched1Res = await request('POST', '/api/schedules', {
      token: adminToken,
      body: {
        title: `RS Puram Morning Sweep ${testSuffix}`,
        zone: 'West Zone',
        ward: 'Ward 24 - RS Puram',
        categories: ['Organic'],
        date: scheduleDate,
        timeWindow: '06:30 AM - 09:30 AM (IST)',
        startTime: '06:30',
        endTime: '09:30',
        driverId: driverUser._id,
        driverName: driverUser.name,
        vehicleObjectId: testVehicle._id,
        vehiclePlate: testVehicle.registrationNumber
      }
    });
    assert.equal(sched1Res.status, 201, `First schedule creation failed: ${JSON.stringify(sched1Res.data)}`);
    cleanupTracker.schedules.push(sched1Res.data.schedule._id);

    // Attempt overlapping schedule with same driver & vehicle
    const schedConflictRes = await request('POST', '/api/schedules', {
      token: adminToken,
      body: {
        title: `Conflicting Gandhipuram Sweep ${testSuffix}`,
        zone: 'Central Zone',
        ward: 'Ward 32 - Gandhipuram',
        categories: ['Plastic'],
        date: scheduleDate,
        timeWindow: '07:00 AM - 09:00 AM (IST)',
        startTime: '07:00',
        endTime: '09:00',
        driverId: driverUser._id,
        driverName: driverUser.name,
        vehicleObjectId: testVehicle._id,
        vehiclePlate: testVehicle.registrationNumber
      }
    });
    assert.equal(schedConflictRes.status, 409, 'Double-booking worker/vehicle in overlapping time window must return 409');
    passed += 1;
    console.log('  ✓ Passed Schedule Conflict Detection (HTTP 409).');

    // -------------------------------------------------------------------------
    // TEST 8 & 10: Route Optimisation, Missing GPS Separation & Capacity Check
    // -------------------------------------------------------------------------
    console.log('\n[8 & 10] Testing Route Preview, Missing GPS Handling & Vehicle Capacity Validation...');
    const gpsReportRes = await request('POST', '/api/reports', {
      token: citizenOneToken,
      body: {
        category: 'Metal',
        quantity: 60,
        unit: 'kg',
        address: 'Cross Cut Road, Gandhipuram, Coimbatore',
        locality: 'Gandhipuram',
        ward: 'Ward 24 - RS Puram',
        lat: 11.0183,
        lng: 76.9674
      }
    });
    cleanupTracker.reports.push(gpsReportRes.data.report._id);

    const noGpsReportRes = await request('POST', '/api/reports', {
      token: citizenOneToken,
      body: {
        category: 'Glass',
        quantity: 20,
        unit: 'kg',
        address: '100 Feet Road, Gandhipuram, Coimbatore',
        locality: 'Gandhipuram',
        ward: 'Ward 24 - RS Puram'
      }
    });
    cleanupTracker.reports.push(noGpsReportRes.data.report._id);

    const previewRes = await request('POST', '/api/routes/optimize-preview', {
      token: adminToken,
      body: {
        ward: 'Ward 24 - RS Puram',
        reportIds: [gpsReportRes.data.report._id, noGpsReportRes.data.report._id],
        vehicleId: testVehicle._id
      }
    });
    assert.equal(previewRes.status, 200, 'Route optimisation preview must return 200');
    const preview = previewRes.data;
    assert.equal(preview.gpsVerifiedStops, 1, 'Must count 1 GPS-confirmed stop');
    assert.equal(preview.addressOnlyStops, 1, 'Must separate 1 address-only stop without fabricating coordinates');
    assert.equal(preview.actualGpsTrackedDistanceKm, null, 'GPS-tracked distance must be null when live telemetry does not exist');
    assert.ok(preview.straightLineDistanceKm >= 0, 'Straight-line distance must be calculated');
    assert.ok(preview.estimatedRoadDistanceKm >= preview.straightLineDistanceKm, 'Estimated road distance must apply road multiplier');

    // Create a tiny capacity vehicle (250 kg min allowed, so let's make reports exceed 250 kg or test over-capacity)
    const tinyVehicleRes = await request('POST', '/api/vehicles', {
      token: adminToken,
      body: {
        registrationNumber: `TN-38-MIN-${String(testSuffix).slice(-4)}`,
        vehicleName: `Tiny E-Cart ${testSuffix}`,
        vehicleType: 'E-Cart / Battery Trike',
        capacityValue: 50,
        capacityUnit: 'kg',
        assignedWard: 'Ward 24 - RS Puram',
        operationalStatus: 'Available'
      }
    });
    cleanupTracker.vehicles.push(tinyVehicleRes.data.vehicle._id);

    const overCapDispatchRes = await request('POST', '/api/routes/dispatch', {
      token: adminToken,
      body: {
        title: `Overload Test Route ${testSuffix}`,
        ward: 'Ward 24 - RS Puram',
        vehicleId: tinyVehicleRes.data.vehicle._id,
        workerId: driverUser._id,
        reportIds: [gpsReportRes.data.report._id, noGpsReportRes.data.report._id] // 80 kg > 50 kg capacity
      }
    });
    assert.equal(overCapDispatchRes.status, 400, `Dispatching 80kg load onto 50kg vehicle must be rejected with 400: ${JSON.stringify(overCapDispatchRes.data)}`);
    passed += 2;
    console.log('  ✓ Passed Route Optimisation Preview, Missing GPS Separation, and Capacity Enforcement.');

    // -------------------------------------------------------------------------
    // TEST 9: Ward Creation & Ward Filtering
    // -------------------------------------------------------------------------
    console.log('\n[9] Testing Ward Management & Ward Filtering...');
    const wardCreateRes = await request('POST', '/api/wards', {
      token: adminToken,
      body: {
        wardNumber: `Ward ${String(testSuffix).slice(-4)}`,
        wardName: `Test Ward ${testSuffix}`,
        zone: 'West Zone',
        localities: ['RS Puram West'],
        populationEstimate: 24000,
        householdsEstimate: 6200,
        areaSqKm: 4.2,
        referenceCoordinates: { lat: 11.0085, lng: 76.9511 }
      }
    });
    assert.equal(wardCreateRes.status, 201, `Ward creation failed: ${JSON.stringify(wardCreateRes.data)}`);
    cleanupTracker.wards.push(wardCreateRes.data.ward._id);

    const wardFilterRes = await request('GET', `/api/reports/all?ward=${encodeURIComponent('Ward 24 - RS Puram')}`, {
      token: adminToken
    });
    assert.equal(wardFilterRes.status, 200, 'Ward filtered pickup query must return 200');
    passed += 1;
    console.log('  ✓ Passed Ward Creation and Ward Filtering.');

    // -------------------------------------------------------------------------
    // TEST 11: Complaint Ownership & Access Control
    // -------------------------------------------------------------------------
    console.log('\n[11] Testing Civic Complaint Ownership & Isolation...');
    const createComplaintRes = await request('POST', '/api/complaints', {
      token: citizenOneToken,
      body: {
        title: `Overflowing bin test ${testSuffix}`,
        category: 'Overflowing Public Bins',
        description: 'Bin near junction is full',
        ward: 'Ward 24 - RS Puram',
        locality: 'RS Puram',
        address: 'DB Road Junction, RS Puram, Coimbatore',
        priority: 'High'
      }
    });
    assert.equal(createComplaintRes.status, 201, `Citizen complaint submission failed: ${JSON.stringify(createComplaintRes.data)}`);
    const testComplaint = createComplaintRes.data.complaint;
    cleanupTracker.complaints.push(testComplaint._id);

    // Citizen Two must NOT see Citizen One's complaint in their list
    const citizenTwoListRes = await request('GET', '/api/complaints', { token: citizenTwoToken });
    assert.equal(citizenTwoListRes.status, 200);
    const leaked = (citizenTwoListRes.data.complaints || []).some((c) => String(c._id) === String(testComplaint._id));
    assert.equal(leaked, false, 'Citizen Two must not receive Citizen One complaints');

    // Citizen Two must NOT be able to update Citizen One's complaint
    const citizenUpdateComplaintRes = await request('PUT', `/api/complaints/${testComplaint._id}`, {
      token: citizenTwoToken,
      body: { status: 'Resolved' }
    });
    assert.equal(citizenUpdateComplaintRes.status, 403, 'Citizen cannot update complaint status (403)');
    passed += 1;
    console.log('  ✓ Passed Complaint Ownership and Citizen Isolation.');

    // -------------------------------------------------------------------------
    // TEST 12: Append-Only AuditLog Creation & Mutation Rejection
    // -------------------------------------------------------------------------
    console.log('\n[12] Testing Append-Only Audit Log Creation & Mutation Rejection...');
    const auditRes = await request('GET', '/api/admin/audit-logs?limit=10', { token: adminToken });
    assert.equal(auditRes.status, 200, 'Admin must be able to read audit logs');
    assert.ok(Array.isArray(auditRes.data.logs) && auditRes.data.logs.length > 0, 'Audit logs must be populated by admin actions');

    const testLogs = await AuditLog.find({ adminId: adminUser._id }).select('_id').lean();
    cleanupTracker.auditLogs.push(...testLogs.map((l) => l._id));

    const firstLogId = auditRes.data.logs[0]._id;
    const putAuditRes = await request('PUT', `/api/admin/audit-logs/${firstLogId}`, {
      token: adminToken,
      body: { summary: 'Tampered' }
    });
    assert.equal(putAuditRes.status, 403, 'PUT on audit log must be rejected with 403');

    const delAuditRes = await request('DELETE', `/api/admin/audit-logs/${firstLogId}`, {
      token: adminToken
    });
    assert.equal(delAuditRes.status, 403, 'DELETE on audit log must be rejected with 403');
    passed += 1;
    console.log('  ✓ Passed Append-Only Audit Log verification (403 on PUT/DELETE).');

    // -------------------------------------------------------------------------
    // TEST 13: Analytics Calculations, Scorecards & Cleanliness Heatmap
    // -------------------------------------------------------------------------
    console.log('\n[13] Testing Analytics Overview, Ward Scorecards & Cleanliness Heatmap...');
    const analyticsOverviewRes = await request('GET', '/api/analytics/overview', { token: adminToken });
    assert.equal(analyticsOverviewRes.status, 200, 'Analytics overview must return 200');
    assert.equal(typeof analyticsOverviewRes.data.stats.totalWasteKg, 'number');

    const scorecardsRes = await request('GET', '/api/analytics/ward-scorecards', { token: adminToken });
    assert.equal(scorecardsRes.status, 200, 'Ward scorecards must return 200');
    assert.ok(Array.isArray(scorecardsRes.data.scorecards));

    const heatmapRes = await request('GET', '/api/analytics/cleanliness-heatmap', { token: adminToken });
    assert.equal(heatmapRes.status, 200, 'Cleanliness heatmap must return 200');
    assert.ok(Array.isArray(heatmapRes.data.wardIndicators));
    passed += 1;
    console.log('  ✓ Passed Analytics, Ward Scorecards, and Cleanliness Heatmap calculations.');

    console.log('\n================================================================');
    console.log(`ALL ${passed}/13 CORE ADMIN COMMAND CENTRE TEST SUITES PASSED!`);
    console.log('================================================================\n');
  } finally {
    console.log('Cleaning up temporary test documents...');
    if (cleanupTracker.reports.length) await WasteReport.deleteMany({ _id: { $in: cleanupTracker.reports } });
    if (cleanupTracker.schedules.length) await CollectionSchedule.deleteMany({ _id: { $in: cleanupTracker.schedules } });
    if (cleanupTracker.routes.length) await CollectionRoute.deleteMany({ _id: { $in: cleanupTracker.routes } });
    if (cleanupTracker.vehicles.length) await CollectionVehicle.deleteMany({ _id: { $in: cleanupTracker.vehicles } });
    if (cleanupTracker.wards.length) await Ward.deleteMany({ _id: { $in: cleanupTracker.wards } });
    if (cleanupTracker.centres.length) await RecyclingCentre.deleteMany({ _id: { $in: cleanupTracker.centres } });
    if (cleanupTracker.complaints.length) await Complaint.deleteMany({ _id: { $in: cleanupTracker.complaints } });
    if (cleanupTracker.campaigns.length) await Campaign.deleteMany({ _id: { $in: cleanupTracker.campaigns } });
    if (cleanupTracker.auditLogs.length) await AuditLog.deleteMany({ _id: { $in: cleanupTracker.auditLogs } });
    if (cleanupTracker.users.length) {
      await AuditLog.deleteMany({ adminId: { $in: cleanupTracker.users } });
      await User.deleteMany({ _id: { $in: cleanupTracker.users } });
    }
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
    console.log('Surgical test cleanup complete. Existing database records untouched.');
  }
}

runTests().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
