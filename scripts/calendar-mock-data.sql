-- Calendar mock data for demo — August 2026 (current month) + September
-- Center: Test Center (57b1a65a-ccce-493d-b64b-84b621623048)
-- Admin user: 27155b6d-9a6c-449c-ac7d-e7ecc93426a2

-- ═══════════════════════════════════════════════════
-- EVENTS (15 spread across August 2026)
-- ═══════════════════════════════════════════════════
INSERT INTO events ("id", "centerId", "meetingRoomId", "requestedById", "title", "description", "company", "eventDate", "startTime", "endTime", "durationMinutes", "attendeesCount", "eventType", "status", "cost", "notes", "createdAt", "updatedAt")
VALUES
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', 'bf6175b7-8c99-4c56-b031-bdd95c9e15c1', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Q3 All-Hands Meeting', 'Quarterly company-wide meeting to discuss progress and goals', 'SpaceJam', '2026-08-03', '10:00', '11:30', 90, 45, 'MEETING', 'CONFIRMED', 0, 'Projector + AV setup needed', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', NULL, '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Startup Pitch Workshop', 'Hands-on workshop for startups to refine their pitch decks', 'Incubator Hub', '2026-08-05', '14:00', '17:00', 180, 25, 'WORKSHOP', 'CONFIRMED', 500, 'Whiteboards, sticky notes, coffee', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', 'f5913e8a-cd9c-4866-9dc7-0a5f2ce13403', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Board Strategy Session', 'Monthly board meeting — financial review and strategic planning', 'SpaceJam', '2026-08-06', '09:00', '11:00', 120, 8, 'CONFERENCE', 'CONFIRMED', 0, 'Closed door', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', 'a7f1ee9f-b241-4d7e-b776-9a484f26fc2f', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Client Meeting — Acme Corp', 'Product demo and contract negotiation', 'Acme Corp', '2026-08-10', '11:00', '12:00', 60, 5, 'MEETING_ROOM', 'CONFIRMED', 0, NULL, now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', NULL, '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Community Networking Mixer', 'Monthly networking event for all coworking members', NULL, '2026-08-12', '18:00', '20:00', 120, 60, 'SOCIAL', 'PENDING', 1200, 'Catering: finger food + drinks', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', 'bf6175b7-8c99-4c56-b031-bdd95c9e15c1', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Lead Generation Training', 'Sales team training on new CRM tools and lead scoring', 'Sales Dept', '2026-08-13', '10:00', '13:00', 180, 12, 'TRAINING', 'CONFIRMED', 0, 'Laptops required', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', 'f5913e8a-cd9c-4866-9dc7-0a5f2ce13403', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Investor Pitch — TechNova', 'Series A pitch to venture partners', 'TechNova', '2026-08-14', '15:00', '16:30', 90, 6, 'CONFERENCE', 'CONFIRMED', 0, 'NDA required', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', 'a7f1ee9f-b241-4d7e-b776-9a484f26fc2f', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Team Standup — Engineering', 'Weekly engineering sync', 'Engineering', '2026-08-17', '09:30', '10:00', 30, 8, 'MEETING_ROOM', 'CONFIRMED', 0, NULL, now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', NULL, '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Digital Marketing Workshop', 'SEO, social media, and content strategy bootcamp', 'GrowthLab', '2026-08-19', '13:00', '16:00', 180, 30, 'WORKSHOP', 'PENDING', 800, 'Projector, handouts, Wi-Fi for guests', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', 'bf6175b7-8c99-4c56-b031-bdd95c9e15c1', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Legal Compliance Review', 'Quarterly compliance and policy review meeting', 'Legal', '2026-08-20', '11:00', '12:30', 90, 4, 'MEETING', 'CONFIRMED', 0, 'Confidential', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', 'f5913e8a-cd9c-4866-9dc7-0a5f2ce13403', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Product Launch Planning', 'Launch timeline, marketing plan, and resource allocation', 'Product Team', '2026-08-21', '14:00', '16:00', 120, 10, 'CONFERENCE', 'CONFIRMED', 0, NULL, now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', 'a7f1ee9f-b241-4d7e-b776-9a484f26fc2f', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'HR Interview — Senior Developer', 'Final round technical interview', NULL, '2026-08-24', '10:00', '11:00', 60, 3, 'MEETING_ROOM', 'CONFIRMED', 0, NULL, now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', NULL, '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Founders Fireside Chat', 'Interactive Q&A with successful startup founders', NULL, '2026-08-26', '17:00', '19:00', 120, 80, 'SOCIAL', 'PENDING', 2000, 'Stage, mics, photography', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', 'bf6175b7-8c99-4c56-b031-bdd95c9e15c1', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Monthly Financial Review', 'Budget analysis and forecast for September', 'Finance', '2026-08-27', '09:00', '10:30', 90, 5, 'MEETING', 'CONFIRMED', 0, NULL, now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', 'f5913e8a-cd9c-4866-9dc7-0a5f2ce13403', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Annual Day Celebration', 'SpaceJam annual celebration with awards and dinner', 'SpaceJam', '2026-08-28', '19:00', '22:00', 180, 150, 'SOCIAL', 'CONFIRMED', 15000, 'Full catering, DJ, decorations, awards', now(), now());

-- September events (for when user navigates forward)
INSERT INTO events ("id", "centerId", "meetingRoomId", "requestedById", "title", "description", "company", "eventDate", "startTime", "endTime", "durationMinutes", "attendeesCount", "eventType", "status", "cost", "createdAt", "updatedAt")
VALUES
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', 'bf6175b7-8c99-4c56-b031-bdd95c9e15c1', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'September Kickoff Meeting', 'Monthly planning and team alignment', 'SpaceJam', '2026-09-01', '10:00', '11:00', 60, 20, 'MEETING', 'CONFIRMED', 0, now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', NULL, '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'AI & ML Conference 2026', 'Full-day conference with industry speakers', 'TechComm', '2026-09-10', '09:00', '17:00', 480, 200, 'CONFERENCE', 'PENDING', 25000, now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', 'f5913e8a-cd9c-4866-9dc7-0a5f2ce13403', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Q4 Investor Update', 'Quarterly investor relations briefing', 'SpaceJam', '2026-09-15', '14:00', '15:30', 90, 12, 'CONFERENCE', 'CONFIRMED', 0, now(), now());

-- ═══════════════════════════════════════════════════
-- VISITS (12 scheduled tours across August 2026)
-- ═══════════════════════════════════════════════════
INSERT INTO visits ("id", "centerId", "requestedById", "visitorName", "visitorPhone", "visitorEmail", "company", "visitDate", "startTime", "endTime", "tourType", "interestedPlan", "partySize", "status", "notes", "createdAt", "updatedAt")
VALUES
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Rahul Verma', '+91 98100 12345', 'rahul.verma@techstart.in', 'TechStart Solutions', '2026-08-04', '11:00', '12:00', 'SCHEDULED_TOUR', 'Dedicated Desk', 2, 'SCHEDULED', 'Interested in 10 hot desks + 1 private cabin', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Priya Reddy', '+91 98200 23456', 'priya@finovate.co', 'Finovate Consulting', '2026-08-07', '15:00', '16:00', 'SCHEDULED_TOUR', 'Private Cabin', 1, 'CONFIRMED', 'Looking for a 6-seater cabin with 24/7 access', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Arjun Nair', '+91 98300 34567', 'arjun@growthpe.io', 'GrowthPe', '2026-08-08', '10:00', '10:30', 'WALK_IN', 'Hot Desk', 1, 'COMPLETED', 'Walked in without appointment. Very impressed.', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Sneha Kapoor', '+91 98400 45678', 'sneha@designdash.com', 'DesignDash', '2026-08-11', '13:00', '14:00', 'SCHEDULED_TOUR', 'Meeting Room Pass', 3, 'CONFIRMED', 'Team of 5 designers. Need meeting room access 3x/week', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Vikram Singh', '+91 98500 56789', 'vikram@cloudnine.io', 'CloudNine Tech', '2026-08-13', '16:00', '17:00', 'VIRTUAL', 'Dedicated Desk', 1, 'SCHEDULED', 'Virtual tour requested', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Ananya Gupta', '+91 98600 67890', 'ananya@brightminds.in', 'BrightMinds Academy', '2026-08-15', '12:00', '13:00', 'SCHEDULED_TOUR', 'Private Cabin', 2, 'SCHEDULED', 'Weekend training batches', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Karan Mehta', '+91 98700 78901', 'karan@logiflow.co', 'LogiFlow Logistics', '2026-08-18', '14:00', '15:00', 'FOLLOW_UP', 'Hot Desk', 1, 'SCHEDULED', 'Follow-up visit from July. Ready to sign.', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Deepika Rao', '+91 98800 89012', 'deepika@medtechplus.in', 'MedTechPlus', '2026-08-20', '10:00', '11:00', 'SCHEDULED_TOUR', 'Dedicated Desk', 4, 'CONFIRMED', 'Medical startup. Needs sterile-adjacent environment.', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Rohit Sharma', '+91 98900 90123', 'rohit@bytebloc.com', 'ByteBloc Studios', '2026-08-22', '11:00', '12:00', 'WALK_IN', 'Hot Desk', 1, 'COMPLETED', 'Solo game developer. Signing up today.', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Ishita Jain', '+91 99000 01234', 'ishita@brandcraft.co', 'BrandCraft Agency', '2026-08-25', '15:00', '16:00', 'SCHEDULED_TOUR', 'Private Cabin', 2, 'SCHEDULED', 'Creative agency. Wants cabin near event space.', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Aditya Bose', '+91 99100 11111', 'aditya@quantumleap.io', 'QuantumLeap AI', '2026-08-27', '09:30', '10:30', 'SCHEDULED_TOUR', 'Dedicated Desk', 3, 'CONFIRMED', 'AI startup, 15 people. Needs scaling plan.', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Meera Krishnan', '+91 99200 22222', 'meera@ecobloom.in', 'EcoBloom Sustainable', '2026-08-29', '13:30', '14:30', 'SCHEDULED_TOUR', 'Hot Desk', 1, 'CANCELLED', 'Cancelled — will reschedule for September.', now(), now());

-- September visits
INSERT INTO visits ("id", "centerId", "requestedById", "visitorName", "visitorPhone", "visitorEmail", "company", "visitDate", "startTime", "endTime", "tourType", "interestedPlan", "partySize", "status", "notes", "createdAt", "updatedAt")
VALUES
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Nikhil Agarwal', '+91 99300 33333', 'nikhil@fintechgyan.in', 'FinTechGyan', '2026-09-03', '11:00', '12:00', 'SCHEDULED_TOUR', 'Private Cabin', 2, 'SCHEDULED', 'Fintech startup — 8 people', now(), now()),
(gen_random_uuid(), '57b1a65a-ccce-493d-b64b-84b621623048', '27155b6d-9a6c-449c-ac7d-e7ecc93426a2', 'Pooja Bhatt', '+91 99400 44444', 'pooja@contentfirst.co', 'ContentFirst Media', '2026-09-08', '14:00', '15:00', 'SCHEDULED_TOUR', 'Hot Desk', 1, 'SCHEDULED', 'Freelance content writer', now(), now());

-- ═══════════════════════════════════════════════════
-- BIRTHDAYS — set dob on existing customers for August
-- ═══════════════════════════════════════════════════
UPDATE customers SET dob = '1992-08-05', "centerId" = '57b1a65a-ccce-493d-b64b-84b621623048' WHERE id = '6e76186c-821a-4a6d-aa40-d23ca1af25a6';
UPDATE customers SET dob = '1988-08-12', "centerId" = '57b1a65a-ccce-493d-b64b-84b621623048' WHERE id = 'a94d8558-f930-4ee9-b27a-949fb5ce14b0';
UPDATE customers SET dob = '1995-08-18', "centerId" = '57b1a65a-ccce-493d-b64b-84b621623048' WHERE id = '545b30f2-7044-4704-a387-1b7284d02e1c';
UPDATE customers SET dob = '1990-08-23', "centerId" = '57b1a65a-ccce-493d-b64b-84b621623048' WHERE id = 'ab8c6674-5d88-457d-a178-942758f5477b';
UPDATE customers SET dob = '1993-08-28', "centerId" = '57b1a65a-ccce-493d-b64b-84b621623048' WHERE id = '4bbee18e-ab3f-4970-9ea9-97f6152d38fa';
