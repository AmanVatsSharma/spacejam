SELECT 'core_tables' AS check, count(*)::text AS value
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users','bookings','seats','customers','invoices','deposits','contracts','leads','events','meeting_rooms','centers','floors','notifications','wallet_transactions','offers','offer_redemptions','referrals','support_tickets','equipment','audit_logs','requests','plans','subscriptions','otp_requests','app_settings','customer_employees','payments','discounts','recurring_bookings','scheduled_reports','calendar_connections','notification_automations')
UNION ALL SELECT 'bookings.subscriptionId', count(*)::text FROM information_schema.columns WHERE table_name='bookings' AND column_name='subscriptionId'
UNION ALL SELECT 'bookings.discountCode', count(*)::text FROM information_schema.columns WHERE table_name='bookings' AND column_name='discountCode'
UNION ALL SELECT 'bookings.discount', count(*)::text FROM information_schema.columns WHERE table_name='bookings' AND column_name='discount'
UNION ALL SELECT 'customer_employees.userId', count(*)::text FROM information_schema.columns WHERE table_name='customer_employees' AND column_name='userId'
UNION ALL SELECT 'audit_logs.centerId', count(*)::text FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='centerId'
UNION ALL SELECT 'users.customerId', count(*)::text FROM information_schema.columns WHERE table_name='users' AND column_name='customerId';
