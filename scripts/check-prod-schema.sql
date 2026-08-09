SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('otp_requests','plans','subscriptions','app_settings')
ORDER BY table_name;
SELECT column_name FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name = 'subscriptionId';
SELECT column_name FROM information_schema.columns
WHERE table_name = 'audit_logs' AND column_name = 'centerId';
SELECT column_name FROM information_schema.columns
WHERE table_name = 'customer_employees' AND column_name = 'userId';
