const crypto = require('crypto');
const fs = require('fs');

// Generate the SQL
const sql = `BEGIN;
DO $$
DECLARE
  member_id uuid := '62826bb8-eb9d-46b1-aad9-e1c496d94dfd';
BEGIN
  RAISE NOTICE 'Wiping member user: %', member_id;
  DELETE FROM user_sessions            WHERE "userId" = member_id;
  DELETE FROM recovery_codes           WHERE "userId" = member_id;
  DELETE FROM magic_link_tokens        WHERE "userId" = member_id;
  DELETE FROM notifications            WHERE "userId" = member_id;
  DELETE FROM notification_preferences WHERE "userId" = member_id;
  DELETE FROM support_messages         WHERE "userId" = member_id;
  DELETE FROM support_tickets          WHERE "userId" = member_id;
  DELETE FROM wallet_transactions      WHERE "userId" = member_id;
  DELETE FROM calendar_connections     WHERE "userId" = member_id;
  DELETE FROM print_jobs               WHERE "userId" = member_id;
  DELETE FROM scheduled_reports        WHERE "userId" = member_id;
  DELETE FROM offer_redemptions        WHERE "userId" = member_id;
  DELETE FROM event_attendees          WHERE "userId" = member_id;
  DELETE FROM recurring_bookings       WHERE "userId" = member_id;
  DELETE FROM bookings                 WHERE "userId" = member_id;
  DELETE FROM visits                   WHERE "requestedById" = member_id;
  DELETE FROM visits                   WHERE "assignedToId" = member_id;
  DELETE FROM customer_employees       WHERE "userId" = member_id;
  DELETE FROM users WHERE id = member_id;
  RAISE NOTICE 'Cleanup done.';
END $$;
COMMIT;
`;

const encoded = Buffer.from(sql, 'utf8').toString('base64');
fs.writeFileSync('C:/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam/cleanup_b64.txt', encoded);
console.log('Base64 written, length:', encoded.length);
