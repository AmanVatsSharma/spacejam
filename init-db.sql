-- Database initialization script for SpaceJam

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create role if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'spacejam_user') THEN
        CREATE ROLE spacejam_user WITH LOGIN PASSWORD 'spacejam';
        GRANT CONNECT ON DATABASE spacejam TO spacejam_user;
        GRANT USAGE ON SCHEMA public TO spacejam_user;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO spacejam_user;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL SEQUENCES IN SCHEMA public TO spacejam_user;
    END IF;
END $$;

-- Create initial admin user (password: spacejam123)
INSERT INTO "users" (id, email, name, passwordHash, role, "emailVerified", "isActive", "createdAt", "updatedAt")
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'admin@spacejam.com',
        'Admin User',
        '$2b$10$your-hashed-password-here', -- Replace with bcrypt hash of 'spacejam123'
        'ADMIN',
        true,
        true,
        NOW(),
        NOW()
    )
ON CONFLICT (email) DO NOTHING;

-- Create sample location
INSERT INTO "locations" (id, name, city, state, country, fullAddress, timezone, "createdAt", "updatedAt")
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'SpaceJam Chandigarh',
        'Chandigarh',
        'Punjab',
        'India',
        'Industrial Area Phase II, Chandigarh',
        'Asia/Kolkata',
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO NOTHING;

-- Create sample center
INSERT INTO "centers" (id, name, "locationId", status, owner, "createdAt", "updatedAt")
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'Main Branch',
        '00000000-0000-0000-0000-000000000001',
        'ACTIVE',
        '00000000-0000-0000-0000-000000000001',
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO NOTHING;

-- Create sample floor
INSERT INTO "floors" (id, "centerId", name, "totalSeats", "active", "createdAt", "updatedAt")
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'Ground Floor',
        50,
        true,
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO NOTHING;

-- Create sample seats
INSERT INTO "seats" (id, "floorId", number, type, price, status, "createdAt", "updatedAt")
VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'A01', 'HOT_DESK', 500, 'AVAILABLE', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'A02', 'HOT_DESK', 500, 'AVAILABLE', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'A03', 'DEDICATED', 800, 'AVAILABLE', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'A04', 'DEDICATED', 800, 'AVAILABLE', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'B01', 'CABIN', 1500, 'AVAILABLE', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'B02', 'CABIN', 1500, 'AVAILABLE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;