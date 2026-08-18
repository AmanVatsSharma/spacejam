-- Copy all mock calendar data from Test Center to Hyderabad center
-- Target: 49c302a3-d393-4ee2-abd7-a11b500c093f (Hyderabad — the one the frontend picks)
-- Source: 57b1a65a-ccce-493d-b64b-84b621623048 (Test Center — where mock data was inserted)

-- Copy events
INSERT INTO events ("id", "centerId", "meetingRoomId", "requestedById", "title", "description", "company", "eventDate", "startTime", "endTime", "durationMinutes", "attendeesCount", "eventType", "status", "cost", "notes", "createdAt", "updatedAt")
SELECT gen_random_uuid(), '49c302a3-d393-4ee2-abd7-a11b500c093f', NULL, "requestedById", "title", "description", "company", "eventDate", "startTime", "endTime", "durationMinutes", "attendeesCount", "eventType", "status", "cost", "notes", now(), now()
FROM events WHERE "centerId" = '57b1a65a-ccce-493d-b64b-84b621623048' AND "eventDate" >= '2026-08-01';

-- Copy visits
INSERT INTO visits ("id", "centerId", "requestedById", "visitorName", "visitorPhone", "visitorEmail", "company", "visitDate", "startTime", "endTime", "tourType", "interestedPlan", "partySize", "status", "notes", "createdAt", "updatedAt")
SELECT gen_random_uuid(), '49c302a3-d393-4ee2-abd7-a11b500c093f', "requestedById", "visitorName", "visitorPhone", "visitorEmail", "company", "visitDate", "startTime", "endTime", "tourType", "interestedPlan", "partySize", "status", "notes", now(), now()
FROM visits WHERE "centerId" = '57b1a65a-ccce-493d-b64b-84b621623048';

-- Set customer birthdays + centerId for Hyderabad
UPDATE customers SET dob = '1992-08-05', "centerId" = '49c302a3-d393-4ee2-abd7-a11b500c093f' WHERE id = '6e76186c-821a-4a6d-aa40-d23ca1af25a6';
UPDATE customers SET dob = '1988-08-12', "centerId" = '49c302a3-d393-4ee2-abd7-a11b500c093f' WHERE id = 'a94d8558-f930-4ee9-b27a-949fb5ce14b0';
UPDATE customers SET dob = '1995-08-18', "centerId" = '49c302a3-d393-4ee2-abd7-a11b500c093f' WHERE id = '545b30f2-7044-4704-a387-1b7284d02e1c';
UPDATE customers SET dob = '1990-08-23', "centerId" = '49c302a3-d393-4ee2-abd7-a11b500c093f' WHERE id = 'ab8c6674-5d88-457d-a178-942758f5477b';
UPDATE customers SET dob = '1993-08-28', "centerId" = '49c302a3-d393-4ee2-abd7-a11b500c093f' WHERE id = '4bbee18e-ab3f-4970-9ea9-97f6152d38fa';
