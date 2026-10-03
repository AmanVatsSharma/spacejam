--
-- PostgreSQL database dump
--

\restrict 4evROex0G75o1f0BuKzwgGsZrBSj8gpRpGoL7zEEKL0xamibLocMWNHZwhg4Xxl

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--



--
-- Name: bookings_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.bookings_status_enum AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CHECKED_IN',
    'CHECKED_OUT',
    'CANCELLED',
    'COMPLETED'
);


--
-- Name: centers_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.centers_status_enum AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PENDING'
);


--
-- Name: contracts_paymentfrequency_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.contracts_paymentfrequency_enum AS ENUM (
    'Monthly',
    'Quarterly',
    'Half-Yearly',
    'Yearly'
);


--
-- Name: contracts_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.contracts_status_enum AS ENUM (
    'Active',
    'Expiring Soon',
    'Expired',
    'Terminated'
);


--
-- Name: customers_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.customers_status_enum AS ENUM (
    'Active',
    'Inactive',
    'Expiring Soon',
    'Upgraded'
);


--
-- Name: deposits_deposittype_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.deposits_deposittype_enum AS ENUM (
    'Security',
    'Advance',
    'Other'
);


--
-- Name: deposits_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.deposits_status_enum AS ENUM (
    'Held',
    'Released',
    'Refunded',
    'Frozen',
    'Release Requested'
);


--
-- Name: events_eventtype_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.events_eventtype_enum AS ENUM (
    'MEETING',
    'MEETING_ROOM',
    'CONFERENCE',
    'WORKSHOP',
    'TRAINING',
    'SOCIAL',
    'OTHER'
);


--
-- Name: events_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.events_status_enum AS ENUM (
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
    'REJECTED'
);


--
-- Name: invitations_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invitations_role_enum AS ENUM (
    'SUPER_ADMIN',
    'CENTER_MANAGER',
    'EMPLOYEE',
    'COMPANY_ADMIN',
    'MEMBER'
);


--
-- Name: invoices_paymentmethod_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoices_paymentmethod_enum AS ENUM (
    'CARD',
    'UPI',
    'WALLET',
    'BANK_TRANSFER',
    'CASH',
    'CHEQUE',
    'NET_BANKING',
    'ONLINE',
    'QR'
);


--
-- Name: invoices_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoices_status_enum AS ENUM (
    'Draft',
    'Sent',
    'Paid',
    'Overdue',
    'Cancelled'
);


--
-- Name: leads_source_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.leads_source_enum AS ENUM (
    'Website',
    'Referral',
    'Walk-in',
    'Social',
    'Email'
);


--
-- Name: leads_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.leads_status_enum AS ENUM (
    'New',
    'Visited',
    'Negotiation',
    'Converted',
    'Cold'
);


--
-- Name: meeting_rooms_roomtype_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.meeting_rooms_roomtype_enum AS ENUM (
    'BOARDROOM',
    'CONFERENCE',
    'MEETING_ROOM',
    'WORKSHOP',
    'TRAINING'
);


--
-- Name: meeting_rooms_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.meeting_rooms_status_enum AS ENUM (
    'AVAILABLE',
    'OCCUPIED',
    'MAINTENANCE',
    'BOOKED'
);


--
-- Name: notifications_priority_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notifications_priority_enum AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


--
-- Name: notifications_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notifications_type_enum AS ENUM (
    'BOOKING',
    'PAYMENT',
    'DEPOSIT',
    'LEAD',
    'SYSTEM',
    'REQUEST',
    'EVENT'
);


--
-- Name: offers_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.offers_type_enum AS ENUM (
    'PERCENTAGE',
    'FIXED',
    'TOKENS'
);


--
-- Name: onboardings_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.onboardings_status_enum AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED'
);


--
-- Name: payments_method_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payments_method_enum AS ENUM (
    'CARD',
    'UPI',
    'WALLET',
    'BANK_TRANSFER',
    'CASH',
    'CHEQUE',
    'NET_BANKING',
    'ONLINE',
    'QR'
);


--
-- Name: payments_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payments_status_enum AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
);


--
-- Name: plans_billingcycle_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.plans_billingcycle_enum AS ENUM (
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY'
);


--
-- Name: plans_seattype_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.plans_seattype_enum AS ENUM (
    'HOT_DESK',
    'DEDICATED',
    'CABIN',
    'MEETING_ROOM'
);


--
-- Name: plans_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.plans_status_enum AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'ARCHIVED'
);


--
-- Name: print_jobs_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.print_jobs_status_enum AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);


--
-- Name: referrals_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.referrals_status_enum AS ENUM (
    'PENDING',
    'SUCCESSFUL',
    'REWARDED'
);


--
-- Name: requests_requesttype_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.requests_requesttype_enum AS ENUM (
    'PRINTER',
    'UPGRADE',
    'SERVICES',
    'EVENTS',
    'MAINTENANCE',
    'CLEANING',
    'SECURITY',
    'OTHER'
);


--
-- Name: requests_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.requests_status_enum AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'REJECTED'
);


--
-- Name: requests_urgency_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.requests_urgency_enum AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


--
-- Name: seats_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.seats_status_enum AS ENUM (
    'AVAILABLE',
    'OCCUPIED',
    'MAINTENANCE',
    'RESERVED'
);


--
-- Name: subscriptions_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscriptions_status_enum AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'CANCELLED',
    'EXPIRED',
    'PENDING'
);


--
-- Name: support_tickets_category_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.support_tickets_category_enum AS ENUM (
    'BOOKING',
    'PAYMENT',
    'PRINT',
    'OTHER'
);


--
-- Name: support_tickets_priority_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.support_tickets_priority_enum AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


--
-- Name: support_tickets_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.support_tickets_status_enum AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);


--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.users_role_enum AS ENUM (
    'SUPER_ADMIN',
    'CENTER_MANAGER',
    'EMPLOYEE',
    'COMPANY_ADMIN',
    'MEMBER'
);


--
-- Name: visits_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.visits_status_enum AS ENUM (
    'SCHEDULED',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
);


--
-- Name: visits_tourtype_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.visits_tourtype_enum AS ENUM (
    'WALK_IN',
    'SCHEDULED_TOUR',
    'VIRTUAL',
    'FOLLOW_UP'
);


--
-- Name: wallet_transactions_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.wallet_transactions_type_enum AS ENUM (
    'CREDIT',
    'DEBIT'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "group" character varying(40) NOT NULL,
    key character varying(80) NOT NULL,
    value text NOT NULL,
    secret boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid,
    action character varying NOT NULL,
    "entityType" character varying,
    "entityId" uuid,
    "centerId" uuid,
    changes jsonb,
    "ipAddress" character varying,
    "userAgent" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid,
    "customerId" uuid,
    "seatId" uuid,
    "centerId" uuid,
    "planId" uuid,
    "subscriptionId" uuid,
    "startDate" timestamp without time zone,
    "endDate" timestamp without time zone,
    status public.bookings_status_enum DEFAULT 'PENDING'::public.bookings_status_enum NOT NULL,
    "paymentId" uuid,
    "totalPrice" double precision DEFAULT '0'::double precision,
    discount double precision DEFAULT '0'::double precision,
    "discountCode" character varying,
    notes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "meetingRoomId" uuid,
    "eventDate" timestamp without time zone,
    title character varying,
    "requestedById" character varying
);


--
-- Name: calendar_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_connections (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    provider character varying NOT NULL,
    "accessToken" text NOT NULL,
    "refreshToken" text NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL,
    "externalCalendarId" character varying,
    email character varying,
    "syncEnabled" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "lastSyncedAt" timestamp without time zone
);


--
-- Name: centers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.centers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    "locationId" uuid NOT NULL,
    status public.centers_status_enum DEFAULT 'ACTIVE'::public.centers_status_enum NOT NULL,
    settings jsonb,
    owner uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contracts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "contractNumber" character varying NOT NULL,
    "customerId" uuid,
    "customerName" character varying NOT NULL,
    "centerId" uuid,
    "planName" character varying,
    "startDate" timestamp without time zone NOT NULL,
    "endDate" timestamp without time zone NOT NULL,
    status public.contracts_status_enum NOT NULL,
    amount numeric(10,2) NOT NULL,
    "paymentFrequency" public.contracts_paymentfrequency_enum NOT NULL,
    "autoRenew" boolean DEFAULT false NOT NULL,
    terms text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customer_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_documents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "customerId" uuid NOT NULL,
    name character varying(255) NOT NULL,
    "documentType" character varying(50) NOT NULL,
    "fileUrl" text NOT NULL,
    "fileSize" bigint,
    "mimeType" character varying(100),
    "uploadedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customer_employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_employees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "customerId" uuid NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50),
    role character varying(100) DEFAULT 'Member'::character varying NOT NULL,
    department character varying(100),
    "seatId" uuid,
    "seatNumber" character varying(50),
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    "userId" uuid,
    "invitedAt" timestamp without time zone,
    "joinedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid,
    name character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    company character varying,
    status public.customers_status_enum DEFAULT 'Active'::public.customers_status_enum NOT NULL,
    "totalBookings" integer DEFAULT 0 NOT NULL,
    "totalSpent" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "lastBooking" timestamp without time zone,
    "centerId" uuid,
    "teamSize" character varying,
    location character varying,
    "joinDate" timestamp without time zone,
    notes text,
    "gstNumber" character varying(100),
    "companyAddress" text,
    "companyType" character varying(50),
    "employeeCount" integer,
    industry character varying(100),
    website character varying(255),
    "planType" character varying(100),
    "alternateEmail" character varying(255),
    "alternatePhone" character varying(50),
    dob date,
    "emergencyContactName" character varying(255),
    "emergencyContactPhone" character varying(50),
    "communicationChannel" character varying(50),
    "autoRechargeEnabled" boolean DEFAULT false NOT NULL,
    "autoRechargeContact" character varying(120),
    "autoRechargeThreshold" integer,
    "refundAccountHolder" character varying(120),
    "refundAccountNumber" character varying(34),
    "refundIfsc" character varying(11),
    "refundBankName" character varying(120),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: deposits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deposits (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "customerId" uuid,
    "customerName" character varying NOT NULL,
    "centerId" uuid,
    amount numeric(10,2) NOT NULL,
    "depositType" public.deposits_deposittype_enum DEFAULT 'Security'::public.deposits_deposittype_enum NOT NULL,
    status public.deposits_status_enum DEFAULT 'Held'::public.deposits_status_enum NOT NULL,
    "referenceNumber" character varying NOT NULL,
    "receivedDate" timestamp without time zone NOT NULL,
    "releasedDate" timestamp without time zone,
    "releaseRequestedDate" timestamp without time zone,
    "releaseReason" text,
    frozen boolean DEFAULT false NOT NULL,
    notes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: discounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discounts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying NOT NULL,
    percentage numeric(5,2) NOT NULL,
    "maxAmount" numeric(10,2),
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "validFrom" timestamp without time zone,
    "validUntil" timestamp without time zone,
    "minOrderAmount" numeric(10,2),
    "usageLimit" integer,
    "usedCount" integer DEFAULT 0 NOT NULL,
    "applicableTo" character varying,
    "centerId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: equipment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    status character varying DEFAULT 'AVAILABLE'::character varying NOT NULL,
    "centerId" uuid NOT NULL,
    "serialNumber" character varying,
    brand character varying,
    model character varying,
    "purchasePrice" numeric(12,2),
    "purchaseDate" timestamp without time zone,
    "warrantyMonths" integer,
    "assignedTo" uuid,
    "assignedAt" timestamp without time zone,
    notes text,
    location character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: event_attendees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_attendees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eventId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "checkedIn" boolean DEFAULT false NOT NULL,
    "checkInTime" timestamp without time zone,
    "ticketTier" character varying,
    "seatNumber" integer,
    notes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: event_ticket_tiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_ticket_tiers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eventId" uuid NOT NULL,
    name character varying NOT NULL,
    price numeric(12,2) NOT NULL,
    quantity integer NOT NULL,
    "soldCount" integer DEFAULT 0 NOT NULL,
    "earlyBirdEndDate" timestamp without time zone,
    description character varying(128),
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "centerId" uuid,
    "meetingRoomId" uuid,
    "requestedById" uuid,
    "recurringBookingId" uuid,
    title character varying NOT NULL,
    description text,
    company character varying,
    "eventDate" timestamp without time zone NOT NULL,
    "startTime" time without time zone NOT NULL,
    "endTime" time without time zone NOT NULL,
    "durationMinutes" integer NOT NULL,
    "attendeesCount" integer DEFAULT 1 NOT NULL,
    "eventType" public.events_eventtype_enum DEFAULT 'MEETING_ROOM'::public.events_eventtype_enum NOT NULL,
    status public.events_status_enum DEFAULT 'PENDING'::public.events_status_enum NOT NULL,
    "specialRequests" text,
    addons json,
    cost double precision DEFAULT '0'::double precision NOT NULL,
    notes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: floors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.floors (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "centerId" uuid NOT NULL,
    name character varying NOT NULL,
    layout jsonb,
    "totalSeats" integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invitations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL,
    role public.invitations_role_enum NOT NULL,
    "centerId" uuid,
    token character varying NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL,
    "acceptedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "invoiceNumber" character varying NOT NULL,
    "customerId" uuid,
    "customerName" character varying NOT NULL,
    "customerEmail" character varying,
    "centerId" uuid,
    "planName" character varying,
    amount numeric(10,2) NOT NULL,
    tax numeric(10,2),
    "totalAmount" numeric(10,2) NOT NULL,
    status public.invoices_status_enum DEFAULT 'Draft'::public.invoices_status_enum NOT NULL,
    "issueDate" timestamp without time zone NOT NULL,
    "dueDate" timestamp without time zone NOT NULL,
    "paidDate" timestamp without time zone,
    "paymentMethod" public.invoices_paymentmethod_enum,
    "paymentReference" character varying(100),
    notes text,
    "contractId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    company character varying,
    status public.leads_status_enum DEFAULT 'New'::public.leads_status_enum NOT NULL,
    source public.leads_source_enum,
    requirement text,
    budget character varying,
    location character varying,
    notes text,
    "assignedToId" uuid,
    "centerId" uuid,
    "customerId" uuid,
    "lastContact" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    city character varying(120) NOT NULL,
    state character varying(120) NOT NULL,
    country character varying(120) NOT NULL,
    "fullAddress" character varying NOT NULL,
    coordinates character varying,
    timezone character varying DEFAULT 'Asia/Kolkata'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: magic_link_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.magic_link_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "tokenHash" character varying(128) NOT NULL,
    "redirectTo" character varying(255),
    "expiresAt" timestamp without time zone NOT NULL,
    "usedAt" timestamp without time zone,
    "ipAddress" character varying(64),
    "userAgent" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: meeting_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meeting_rooms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "centerId" uuid,
    "floorId" character varying,
    name character varying NOT NULL,
    "roomType" public.meeting_rooms_roomtype_enum DEFAULT 'MEETING_ROOM'::public.meeting_rooms_roomtype_enum NOT NULL,
    capacity integer NOT NULL,
    status public.meeting_rooms_status_enum DEFAULT 'AVAILABLE'::public.meeting_rooms_status_enum NOT NULL,
    "locationName" character varying,
    "locationFullAddress" text,
    "minBookingDuration" integer DEFAULT 30 NOT NULL,
    "maxBookingDuration" integer DEFAULT 480 NOT NULL,
    amenities json,
    "hourlyRate" double precision DEFAULT '0'::double precision NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_automations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_automations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "centerId" uuid NOT NULL,
    name character varying(255) NOT NULL,
    "triggerEvent" character varying NOT NULL,
    channel character varying NOT NULL,
    template text NOT NULL,
    variables jsonb,
    "delayMinutes" integer DEFAULT 0 NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_preferences (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "meetingReminders" boolean DEFAULT true NOT NULL,
    "billingAlerts" boolean DEFAULT true NOT NULL,
    "specialOffers" boolean DEFAULT true NOT NULL,
    "eventUpdates" boolean DEFAULT true NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid,
    "centerId" uuid,
    title character varying NOT NULL,
    message text NOT NULL,
    type public.notifications_type_enum DEFAULT 'SYSTEM'::public.notifications_type_enum NOT NULL,
    priority public.notifications_priority_enum DEFAULT 'MEDIUM'::public.notifications_priority_enum NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "actionUrl" character varying,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: offer_redemptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offer_redemptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "offerId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "bookingId" uuid,
    "discountAmount" double precision,
    "redeemedAt" timestamp without time zone NOT NULL
);


--
-- Name: offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    title character varying NOT NULL,
    description text,
    type public.offers_type_enum DEFAULT 'PERCENTAGE'::public.offers_type_enum NOT NULL,
    value double precision NOT NULL,
    "minOrderAmount" double precision,
    "maxDiscount" double precision,
    "validFrom" timestamp without time zone NOT NULL,
    "validUntil" timestamp without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "usageCount" integer DEFAULT 0 NOT NULL,
    "usageLimit" integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: onboardings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboardings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "leadId" uuid,
    "customerId" uuid,
    status public.onboardings_status_enum DEFAULT 'PENDING'::public.onboardings_status_enum NOT NULL,
    "companyName" character varying,
    "companyAddress" text,
    "gstNumber" character varying,
    "planType" character varying,
    "seatCount" integer,
    "contactName" character varying,
    "contactEmail" character varying,
    "contactPhone" character varying,
    "emergencyContact" character varying,
    "emergencyPhone" character varying,
    "idProofUrl" text,
    "agreementUrl" text,
    "completedAt" timestamp without time zone,
    notes text,
    "paymentMethod" character varying(24),
    "paymentStatus" character varying(24) DEFAULT 'NOT_REQUIRED'::character varying NOT NULL,
    "paymentAmount" numeric(12,2),
    "paymentReference" character varying(100),
    "chequeNumber" character varying(20),
    "chequeBank" character varying(120),
    "chequeDate" date,
    "chequeClearedAt" timestamp without time zone,
    "transferDate" date,
    "payerBank" character varying(120),
    "applicationData" jsonb,
    "idempotencyKey" character varying(80),
    "invoiceId" uuid,
    "depositId" uuid,
    "contractId" uuid,
    "submittedById" uuid,
    "verifiedById" uuid,
    "verifiedAt" timestamp without time zone,
    "failureReason" text,
    "cancelledAt" timestamp without time zone,
    "assignedToId" uuid,
    "centerId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: otp_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    phone character varying(30) NOT NULL,
    "codeHash" character varying NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    "consumedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: payment_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    provider character varying(20) DEFAULT 'RAZORPAY'::character varying NOT NULL,
    "providerOrderId" character varying(64) NOT NULL,
    "amountPaise" bigint NOT NULL,
    currency character varying(3) DEFAULT 'INR'::character varying NOT NULL,
    status character varying(16) DEFAULT 'CREATED'::character varying NOT NULL,
    purpose character varying(20) NOT NULL,
    "onboardingId" uuid,
    "invoiceId" uuid,
    "centerId" uuid,
    receipt character varying(64),
    "providerPaymentId" character varying(64),
    "signatureVerifiedAt" timestamp without time zone,
    "paidAt" timestamp without time zone,
    "failureReason" text,
    "createdById" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "bookingId" uuid NOT NULL,
    amount double precision NOT NULL,
    currency character varying DEFAULT 'INR'::character varying NOT NULL,
    method public.payments_method_enum NOT NULL,
    status public.payments_status_enum DEFAULT 'PENDING'::public.payments_status_enum NOT NULL,
    "transactionId" character varying,
    "gatewayRef" character varying,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "centerId" uuid NOT NULL,
    name character varying(120) NOT NULL,
    description text,
    "seatType" public.plans_seattype_enum NOT NULL,
    "billingCycle" public.plans_billingcycle_enum DEFAULT 'MONTHLY'::public.plans_billingcycle_enum NOT NULL,
    price numeric(12,2) NOT NULL,
    currency character varying(8) DEFAULT 'INR'::character varying NOT NULL,
    "minSeats" integer DEFAULT 1 NOT NULL,
    status public.plans_status_enum DEFAULT 'ACTIVE'::public.plans_status_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: print_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.print_jobs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "centerId" uuid,
    "fileUrl" character varying NOT NULL,
    "fileName" character varying NOT NULL,
    pages integer NOT NULL,
    copies integer DEFAULT 1 NOT NULL,
    color boolean DEFAULT false NOT NULL,
    "paperSize" character varying DEFAULT 'A4'::character varying NOT NULL,
    sides character varying DEFAULT 'single'::character varying NOT NULL,
    cost double precision DEFAULT '0'::double precision NOT NULL,
    status public.print_jobs_status_enum DEFAULT 'PENDING'::public.print_jobs_status_enum NOT NULL,
    notes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: recovery_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recovery_codes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "codeHash" character varying(128) NOT NULL,
    "usedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: recurring_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_bookings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying NOT NULL,
    "roomId" uuid NOT NULL,
    "centerId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    pattern character varying NOT NULL,
    "daysOfWeek" integer[],
    "startDate" timestamp without time zone NOT NULL,
    "endDate" timestamp without time zone NOT NULL,
    "startTime" time without time zone NOT NULL,
    "endTime" time without time zone NOT NULL,
    "occurrencesCreated" integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    notes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "referrerId" uuid NOT NULL,
    "referredEmail" character varying NOT NULL,
    "referredUserId" uuid,
    code character varying(50) NOT NULL,
    status public.referrals_status_enum DEFAULT 'PENDING'::public.referrals_status_enum NOT NULL,
    "rewardAmount" double precision DEFAULT '100'::double precision NOT NULL,
    "rewardedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "centerId" uuid,
    "requestedById" uuid,
    "assignedToId" uuid,
    "requestType" public.requests_requesttype_enum NOT NULL,
    title character varying NOT NULL,
    description text NOT NULL,
    urgency public.requests_urgency_enum DEFAULT 'MEDIUM'::public.requests_urgency_enum NOT NULL,
    status public.requests_status_enum DEFAULT 'PENDING'::public.requests_status_enum NOT NULL,
    "dueDate" timestamp without time zone,
    "completedDate" timestamp without time zone,
    resolution text,
    cost double precision DEFAULT '0'::double precision NOT NULL,
    "attachedFile" character varying,
    metadata json,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: revenue_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.revenue_analytics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "centerId" uuid NOT NULL,
    date timestamp without time zone NOT NULL,
    revenue double precision DEFAULT '0'::double precision NOT NULL,
    "occupancyRate" double precision DEFAULT '0'::double precision NOT NULL,
    "newBookings" integer DEFAULT 0 NOT NULL,
    "cancelledBookings" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: scheduled_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduled_reports (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "centerId" uuid NOT NULL,
    "reportType" character varying NOT NULL,
    frequency character varying NOT NULL,
    "dayOfPeriod" integer,
    recipients text[] NOT NULL,
    filters jsonb,
    enabled boolean DEFAULT true NOT NULL,
    "lastSentAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: seats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seats (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "floorId" uuid NOT NULL,
    "centerId" uuid,
    name character varying NOT NULL,
    "seatType" character varying NOT NULL,
    capacity integer,
    amenities jsonb,
    price double precision DEFAULT '0'::double precision NOT NULL,
    status public.seats_status_enum DEFAULT 'AVAILABLE'::public.seats_status_enum NOT NULL,
    location character varying,
    x double precision,
    y double precision,
    w double precision,
    h double precision,
    rotation double precision,
    "minBookingDuration" integer DEFAULT 30 NOT NULL,
    "maxBookingDuration" integer DEFAULT 480 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "customerId" uuid NOT NULL,
    "planId" uuid NOT NULL,
    "centerId" uuid,
    "seatCount" integer NOT NULL,
    "unitPrice" numeric(12,2) NOT NULL,
    amount numeric(14,2) NOT NULL,
    status public.subscriptions_status_enum DEFAULT 'ACTIVE'::public.subscriptions_status_enum NOT NULL,
    "startDate" timestamp without time zone NOT NULL,
    "nextBillingDate" timestamp without time zone NOT NULL,
    "endDate" timestamp without time zone,
    notes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: support_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "ticketId" uuid NOT NULL,
    "userId" uuid,
    "isAdmin" boolean DEFAULT false NOT NULL,
    message text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "centerId" uuid,
    subject character varying NOT NULL,
    description text NOT NULL,
    category public.support_tickets_category_enum DEFAULT 'OTHER'::public.support_tickets_category_enum NOT NULL,
    priority public.support_tickets_priority_enum DEFAULT 'MEDIUM'::public.support_tickets_priority_enum NOT NULL,
    status public.support_tickets_status_enum DEFAULT 'OPEN'::public.support_tickets_status_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    token character varying NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL,
    "ipAddress" character varying,
    "userAgent" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL,
    name character varying NOT NULL,
    role public.users_role_enum DEFAULT 'MEMBER'::public.users_role_enum NOT NULL,
    "centerId" uuid,
    settings jsonb,
    phone character varying,
    avatar character varying,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLogin" timestamp without time zone,
    "tokenBalance" integer DEFAULT 0 NOT NULL,
    "deviceToken" character varying,
    "passwordHash" character varying,
    "twoFactorEnabled" boolean DEFAULT false NOT NULL,
    "twoFactorSecret" character varying,
    "passwordResetToken" character varying,
    "passwordResetExpiresAt" timestamp without time zone,
    "emailVerifyToken" character varying,
    "emailVerifyExpiresAt" timestamp without time zone,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visits (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "centerId" uuid,
    "leadId" uuid,
    "requestedById" uuid,
    "assignedToId" uuid,
    "visitorName" character varying NOT NULL,
    "visitorPhone" character varying NOT NULL,
    "visitorEmail" character varying,
    company character varying,
    "visitDate" timestamp without time zone NOT NULL,
    "startTime" character varying NOT NULL,
    "endTime" character varying NOT NULL,
    "tourType" public.visits_tourtype_enum DEFAULT 'SCHEDULED_TOUR'::public.visits_tourtype_enum NOT NULL,
    "interestedPlan" character varying,
    "partySize" integer DEFAULT 1 NOT NULL,
    status public.visits_status_enum DEFAULT 'SCHEDULED'::public.visits_status_enum NOT NULL,
    notes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: wallet_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    type public.wallet_transactions_type_enum NOT NULL,
    amount integer NOT NULL,
    "balanceAfter" integer NOT NULL,
    reference character varying,
    description character varying(100) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: requests PK_0428f484e96f9e6a55955f29b5f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT "PK_0428f484e96f9e6a55955f29b5f" PRIMARY KEY (id);


--
-- Name: equipment PK_0722e1b9d6eb19f5874c1678740; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT "PK_0722e1b9d6eb19f5874c1678740" PRIMARY KEY (id);


--
-- Name: recovery_codes PK_0723b9e53961e799027d7f7ba32; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recovery_codes
    ADD CONSTRAINT "PK_0723b9e53961e799027d7f7ba32" PRIMARY KEY (id);


--
-- Name: visits PK_0b0b322289a41015c6ea4e8bf30; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT "PK_0b0b322289a41015c6ea4e8bf30" PRIMARY KEY (id);


--
-- Name: customers PK_133ec679a801fab5e070f73d3ea; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY (id);


--
-- Name: payment_orders PK_158dd178010c39759305293a149; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT "PK_158dd178010c39759305293a149" PRIMARY KEY (id);


--
-- Name: payments PK_197ab7af18c93fbb0c9b28b4a59; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY (id);


--
-- Name: audit_logs PK_1bb179d048bbc581caa3b013439; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY (id);


--
-- Name: meeting_rooms PK_1e6747496adb820e5eab5f9a272; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_rooms
    ADD CONSTRAINT "PK_1e6747496adb820e5eab5f9a272" PRIMARY KEY (id);


--
-- Name: recurring_bookings PK_2002148c2a9c90455a4281b370d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_bookings
    ADD CONSTRAINT "PK_2002148c2a9c90455a4281b370d" PRIMARY KEY (id);


--
-- Name: otp_requests PK_265771409bf4605d16150e2d045; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_requests
    ADD CONSTRAINT "PK_265771409bf4605d16150e2d045" PRIMARY KEY (id);


--
-- Name: event_attendees PK_27510e317f002b361d2904d7f0f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT "PK_27510e317f002b361d2904d7f0f" PRIMARY KEY (id);


--
-- Name: support_messages PK_2aa37479e71ef29cbf4dba2b1a2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT "PK_2aa37479e71ef29cbf4dba2b1a2" PRIMARY KEY (id);


--
-- Name: contracts PK_2c7b8f3a7b1acdd49497d83d0fb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT "PK_2c7b8f3a7b1acdd49497d83d0fb" PRIMARY KEY (id);


--
-- Name: plans PK_3720521a81c7c24fe9b7202ba61; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY (id);


--
-- Name: seats PK_3fbc74bb4638600c506dcb777a7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT "PK_3fbc74bb4638600c506dcb777a7" PRIMARY KEY (id);


--
-- Name: events PK_40731c7151fe4be3116e45ddf73; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY (id);


--
-- Name: app_settings PK_4800b266ba790931744b3e53a74; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT "PK_4800b266ba790931744b3e53a74" PRIMARY KEY (id);


--
-- Name: offers PK_4c88e956195bba85977da21b8f4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT "PK_4c88e956195bba85977da21b8f4" PRIMARY KEY (id);


--
-- Name: scheduled_reports PK_4e9443d4280f94e84c7349300a6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_reports
    ADD CONSTRAINT "PK_4e9443d4280f94e84c7349300a6" PRIMARY KEY (id);


--
-- Name: wallet_transactions PK_5120f131bde2cda940ec1a621db; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT "PK_5120f131bde2cda940ec1a621db" PRIMARY KEY (id);


--
-- Name: invitations PK_5dec98cfdfd562e4ad3648bbb07; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT "PK_5dec98cfdfd562e4ad3648bbb07" PRIMARY KEY (id);


--
-- Name: event_ticket_tiers PK_624f71c321f9b115e3a6f69d8aa; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_ticket_tiers
    ADD CONSTRAINT "PK_624f71c321f9b115e3a6f69d8aa" PRIMARY KEY (id);


--
-- Name: invoices PK_668cef7c22a427fd822cc1be3ce; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY (id);


--
-- Name: discounts PK_66c522004212dc814d6e2f14ecc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT "PK_66c522004212dc814d6e2f14ecc" PRIMARY KEY (id);


--
-- Name: centers PK_692e2318139b8148445f33c2880; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.centers
    ADD CONSTRAINT "PK_692e2318139b8148445f33c2880" PRIMARY KEY (id);


--
-- Name: notifications PK_6a72c3c0f683f6462415e653c3a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id);


--
-- Name: revenue_analytics PK_6e3ff4cb8b337900b0beea85fa5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenue_analytics
    ADD CONSTRAINT "PK_6e3ff4cb8b337900b0beea85fa5" PRIMARY KEY (id);


--
-- Name: locations PK_7cc1c9e3853b94816c094825e74; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT "PK_7cc1c9e3853b94816c094825e74" PRIMARY KEY (id);


--
-- Name: support_tickets PK_942e8d8f5df86100471d2324643; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT "PK_942e8d8f5df86100471d2324643" PRIMARY KEY (id);


--
-- Name: customer_employees PK_9cc34df9ba4d8f975293016594b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_employees
    ADD CONSTRAINT "PK_9cc34df9ba4d8f975293016594b" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: offer_redemptions PK_a48942abc9cc81feec975a5c142; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_redemptions
    ADD CONSTRAINT "PK_a48942abc9cc81feec975a5c142" PRIMARY KEY (id);


--
-- Name: notification_automations PK_a5486d183d276f3391f6fffd01c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_automations
    ADD CONSTRAINT "PK_a5486d183d276f3391f6fffd01c" PRIMARY KEY (id);


--
-- Name: print_jobs PK_a581cb9acbf52d919f86445434e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.print_jobs
    ADD CONSTRAINT "PK_a581cb9acbf52d919f86445434e" PRIMARY KEY (id);


--
-- Name: subscriptions PK_a87248d73155605cf782be9ee5e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY (id);


--
-- Name: bookings PK_bee6805982cc1e248e94ce94957; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY (id);


--
-- Name: calendar_connections PK_c2f78ae03c2e2a9389f6d8ddc64; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_connections
    ADD CONSTRAINT "PK_c2f78ae03c2e2a9389f6d8ddc64" PRIMARY KEY (id);


--
-- Name: customer_documents PK_ccc82daa515b50e68a76f343417; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_documents
    ADD CONSTRAINT "PK_ccc82daa515b50e68a76f343417" PRIMARY KEY (id);


--
-- Name: leads PK_cd102ed7a9a4ca7d4d8bfeba406; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "PK_cd102ed7a9a4ca7d4d8bfeba406" PRIMARY KEY (id);


--
-- Name: floors PK_dae78234002afa84842d3a08ee0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.floors
    ADD CONSTRAINT "PK_dae78234002afa84842d3a08ee0" PRIMARY KEY (id);


--
-- Name: user_sessions PK_e93e031a5fed190d4789b6bfd83; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "PK_e93e031a5fed190d4789b6bfd83" PRIMARY KEY (id);


--
-- Name: notification_preferences PK_e94e2b543f2f218ee68e4f4fad2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT "PK_e94e2b543f2f218ee68e4f4fad2" PRIMARY KEY (id);


--
-- Name: magic_link_tokens PK_e97101929b9f3c7afc0920b0f17; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.magic_link_tokens
    ADD CONSTRAINT "PK_e97101929b9f3c7afc0920b0f17" PRIMARY KEY (id);


--
-- Name: referrals PK_ea9980e34f738b6252817326c08; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT "PK_ea9980e34f738b6252817326c08" PRIMARY KEY (id);


--
-- Name: onboardings PK_f062ffd56f2690a957e54bab976; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboardings
    ADD CONSTRAINT "PK_f062ffd56f2690a957e54bab976" PRIMARY KEY (id);


--
-- Name: deposits PK_f49ba0cd446eaf7abb4953385d9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT "PK_f49ba0cd446eaf7abb4953385d9" PRIMARY KEY (id);


--
-- Name: payments UQ_1ead3dc5d71db0ea822706e389d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "UQ_1ead3dc5d71db0ea822706e389d" UNIQUE ("bookingId");


--
-- Name: discounts UQ_8c7cc2340e9ea0fc5a246e63749; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT "UQ_8c7cc2340e9ea0fc5a246e63749" UNIQUE (code);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: notification_preferences UQ_b70c44e8b00757584a393225593; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT "UQ_b70c44e8b00757584a393225593" UNIQUE ("userId");


--
-- Name: offers UQ_cae46299e89e2f0bf3f23b40b70; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT "UQ_cae46299e89e2f0bf3f23b40b70" UNIQUE (code);


--
-- Name: invitations UQ_e577dcf9bb6d084373ed3998509; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT "UQ_e577dcf9bb6d084373ed3998509" UNIQUE (token);


--
-- Name: user_sessions UQ_ff5db00dec0f61218cd0d468df0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "UQ_ff5db00dec0f61218cd0d468df0" UNIQUE (token);


--
-- Name: IDX_00329f10e9e7826e9eceaa8c05; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_00329f10e9e7826e9eceaa8c05" ON public.magic_link_tokens USING btree ("expiresAt");


--
-- Name: IDX_005e0432e3523ffafb9a5e35b0; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_005e0432e3523ffafb9a5e35b0" ON public.magic_link_tokens USING btree ("userId");


--
-- Name: IDX_07770482f484d448acb7eb1444; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_07770482f484d448acb7eb1444" ON public.equipment USING btree (type);


--
-- Name: IDX_07dbce7cd1515fb301f7d98e8e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_07dbce7cd1515fb301f7d98e8e" ON public.support_tickets USING btree ("userId", "createdAt");


--
-- Name: IDX_0a67da2cbdf711ab98132e3e6f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0a67da2cbdf711ab98132e3e6f" ON public.recurring_bookings USING btree ("roomId", active);


--
-- Name: IDX_0ec936941eb8556fcd7a1f0eae; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0ec936941eb8556fcd7a1f0eae" ON public.audit_logs USING btree (action, "createdAt");


--
-- Name: IDX_1aa5b38817b8194d702a0ac245; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1aa5b38817b8194d702a0ac245" ON public.offer_redemptions USING btree ("userId");


--
-- Name: IDX_1d1787d60f0d87c3a980de2628; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1d1787d60f0d87c3a980de2628" ON public.event_attendees USING btree ("eventId", "checkedIn");


--
-- Name: IDX_20ec0b8d942baf73ee61503b01; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_20ec0b8d942baf73ee61503b01" ON public.equipment USING btree ("centerId", status);


--
-- Name: IDX_219aab1e47674b144d2094cfa1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_219aab1e47674b144d2094cfa1" ON public.support_messages USING btree ("ticketId");


--
-- Name: IDX_21e65af2f4f242d4c85a92aff4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_21e65af2f4f242d4c85a92aff4" ON public.notifications USING btree ("userId", "createdAt");


--
-- Name: IDX_289d1eeb8ab03813e2483026f8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_289d1eeb8ab03813e2483026f8" ON public.onboardings USING btree (status);


--
-- Name: IDX_303cd8ccb392ef11946b87f3a5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_303cd8ccb392ef11946b87f3a5" ON public.visits USING btree (status, "visitDate");


--
-- Name: IDX_3329a963e01df4e3cbc0bdbb9a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3329a963e01df4e3cbc0bdbb9a" ON public.onboardings USING btree ("paymentStatus");


--
-- Name: IDX_3a9f96894f24ce87ff8eb2333f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3a9f96894f24ce87ff8eb2333f" ON public.otp_requests USING btree (phone);


--
-- Name: IDX_4760946361d928decab5158603; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4760946361d928decab5158603" ON public.wallet_transactions USING btree ("userId", "createdAt");


--
-- Name: IDX_59de462f9ce130da142e3b5a9f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_59de462f9ce130da142e3b5a9f" ON public.referrals USING btree ("referrerId");


--
-- Name: IDX_5ab5f51b1ca8fcc0073d76fd3d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_5ab5f51b1ca8fcc0073d76fd3d" ON public.recovery_codes USING btree ("userId");


--
-- Name: IDX_5e5acac3cb159e6fc37a5d62d6; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_5e5acac3cb159e6fc37a5d62d6" ON public.equipment USING btree ("assignedTo");


--
-- Name: IDX_5f09b7746ddb262008d5fd2671; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_5f09b7746ddb262008d5fd2671" ON public.notification_automations USING btree ("centerId", enabled);


--
-- Name: IDX_60fd32a45d871041911020ba4f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_60fd32a45d871041911020ba4f" ON public.onboardings USING btree ("customerId");


--
-- Name: IDX_69454773f1e666a14c6a953935; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_69454773f1e666a14c6a953935" ON public.wallet_transactions USING btree ("userId");


--
-- Name: IDX_6e0cfe307010e9be17ba119c9e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_6e0cfe307010e9be17ba119c9e" ON public.notifications USING btree ("centerId", "createdAt");


--
-- Name: IDX_6ea9200e64f7172a68dfdc0e25; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_6ea9200e64f7172a68dfdc0e25" ON public.support_messages USING btree ("ticketId", "createdAt");


--
-- Name: IDX_725764f85be59c89e9e3666fc7; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_725764f85be59c89e9e3666fc7" ON public.calendar_connections USING btree ("userId", provider);


--
-- Name: IDX_7536cba909dd7584a4640cad7d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7536cba909dd7584a4640cad7d" ON public.subscriptions USING btree ("planId");


--
-- Name: IDX_780bbea1414d32c65584b896fc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_780bbea1414d32c65584b896fc" ON public.scheduled_reports USING btree ("userId");


--
-- Name: IDX_78484bf100cf5d17ff683fad67; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_78484bf100cf5d17ff683fad67" ON public.print_jobs USING btree ("userId", "createdAt");


--
-- Name: IDX_8679e2ff150ff0e253189ca025; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8679e2ff150ff0e253189ca025" ON public.support_tickets USING btree ("userId");


--
-- Name: IDX_86ed1e238f61a57a8eb716319d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_86ed1e238f61a57a8eb716319d" ON public.print_jobs USING btree ("userId");


--
-- Name: IDX_8ba4f47fe9b778ee9f2c3d25ee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8ba4f47fe9b778ee9f2c3d25ee" ON public.plans USING btree ("centerId");


--
-- Name: IDX_8c0f29dbe58a6d17686780302f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8c0f29dbe58a6d17686780302f" ON public.onboardings USING btree ("leadId");


--
-- Name: IDX_8ee959087728f17dac81cb93dd; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_8ee959087728f17dac81cb93dd" ON public.recovery_codes USING btree ("userId", "codeHash");


--
-- Name: IDX_975c2db59c65c05fd9c6b63a2a; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_975c2db59c65c05fd9c6b63a2a" ON public.app_settings USING btree (key);


--
-- Name: IDX_99e589da8f9e9326ee0d01a028; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_99e589da8f9e9326ee0d01a028" ON public.audit_logs USING btree ("userId", "createdAt");


--
-- Name: IDX_AUDIT_LOGS_CENTER_ID; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_AUDIT_LOGS_CENTER_ID" ON public.audit_logs USING btree ("centerId");


--
-- Name: IDX_BOOKINGS_SUB; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_BOOKINGS_SUB" ON public.bookings USING btree ("subscriptionId");


--
-- Name: IDX_CE_CUSTOMER; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_CE_CUSTOMER" ON public.customer_employees USING btree ("customerId");


--
-- Name: IDX_INVOICES_PAYMENT_REFERENCE; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_INVOICES_PAYMENT_REFERENCE" ON public.invoices USING btree ("paymentReference");


--
-- Name: IDX_ONBOARDINGS_PAYMENT_STATUS; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ONBOARDINGS_PAYMENT_STATUS" ON public.onboardings USING btree ("paymentStatus");


--
-- Name: IDX_OTP_REQUESTS_PHONE; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_OTP_REQUESTS_PHONE" ON public.otp_requests USING btree (phone);


--
-- Name: IDX_PAYMENT_ORDERS_INVOICE; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_PAYMENT_ORDERS_INVOICE" ON public.payment_orders USING btree ("invoiceId");


--
-- Name: IDX_PAYMENT_ORDERS_ONBOARDING; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_PAYMENT_ORDERS_ONBOARDING" ON public.payment_orders USING btree ("onboardingId");


--
-- Name: IDX_PLANS_CENTER; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_PLANS_CENTER" ON public.plans USING btree ("centerId");


--
-- Name: IDX_SUB_CUSTOMER; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_SUB_CUSTOMER" ON public.subscriptions USING btree ("customerId");


--
-- Name: IDX_SUB_PLAN; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_SUB_PLAN" ON public.subscriptions USING btree ("planId");


--
-- Name: IDX_a233b4e28f1832eb62fbfe206b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a233b4e28f1832eb62fbfe206b" ON public.offer_redemptions USING btree ("offerId");


--
-- Name: IDX_a410ed9fc731f1ab3fac0d790f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a410ed9fc731f1ab3fac0d790f" ON public.recurring_bookings USING btree ("endDate");


--
-- Name: IDX_b1a95cc046a31a3456dbe37323; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b1a95cc046a31a3456dbe37323" ON public.scheduled_reports USING btree ("centerId", enabled);


--
-- Name: IDX_b5e2e058fa483e98c124ed3c50; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b5e2e058fa483e98c124ed3c50" ON public.visits USING btree ("centerId", "visitDate");


--
-- Name: IDX_b70c44e8b00757584a39322559; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_b70c44e8b00757584a39322559" ON public.notification_preferences USING btree ("userId");


--
-- Name: IDX_bf726508e4805b511546a46684; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_bf726508e4805b511546a46684" ON public.offer_redemptions USING btree ("offerId", "userId");


--
-- Name: IDX_c5f5356e8289e84fc04fef5606; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_c5f5356e8289e84fc04fef5606" ON public.magic_link_tokens USING btree ("tokenHash");


--
-- Name: IDX_cae46299e89e2f0bf3f23b40b7; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_cae46299e89e2f0bf3f23b40b7" ON public.offers USING btree (code);


--
-- Name: IDX_d1e487fdd32bef806e846185c5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d1e487fdd32bef806e846185c5" ON public.event_ticket_tiers USING btree ("eventId");


--
-- Name: IDX_d6db7ca8296b7d33fb9e722a36; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d6db7ca8296b7d33fb9e722a36" ON public.customer_employees USING btree ("customerId");


--
-- Name: IDX_d940ef2a01b0f39be5495bba36; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d940ef2a01b0f39be5495bba36" ON public.referrals USING btree ("referredEmail");


--
-- Name: IDX_e0fbe75e9db162a00ecaf7ab56; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e0fbe75e9db162a00ecaf7ab56" ON public.subscriptions USING btree ("customerId");


--
-- Name: IDX_edb4129eb44589ffaccce13f6c; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_edb4129eb44589ffaccce13f6c" ON public.event_attendees USING btree ("eventId", "userId");


--
-- Name: UQ_ONBOARDINGS_IDEMPOTENCY_KEY; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_ONBOARDINGS_IDEMPOTENCY_KEY" ON public.onboardings USING btree ("idempotencyKey") WHERE ("idempotencyKey" IS NOT NULL);


--
-- Name: UQ_PAYMENT_ORDERS_PROVIDER_ORDER; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_PAYMENT_ORDERS_PROVIDER_ORDER" ON public.payment_orders USING btree ("providerOrderId");


--
-- Name: UQ_PAYMENT_ORDERS_PROVIDER_PAYMENT; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_PAYMENT_ORDERS_PROVIDER_PAYMENT" ON public.payment_orders USING btree ("providerPaymentId") WHERE ("providerPaymentId" IS NOT NULL);


--
-- Name: revenue_analytics FK_00708cdfc4245b0d28ea82e5c1c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenue_analytics
    ADD CONSTRAINT "FK_00708cdfc4245b0d28ea82e5c1c" FOREIGN KEY ("centerId") REFERENCES public.centers(id);


--
-- Name: onboardings FK_026f0c9da7442158c6b003e7d28; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboardings
    ADD CONSTRAINT "FK_026f0c9da7442158c6b003e7d28" FOREIGN KEY ("centerId") REFERENCES public.centers(id);


--
-- Name: deposits FK_03939c2b01db50beb9d78aaaad8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT "FK_03939c2b01db50beb9d78aaaad8" FOREIGN KEY ("centerId") REFERENCES public.centers(id);


--
-- Name: events FK_04dc56703f0ae4f528786356532; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT "FK_04dc56703f0ae4f528786356532" FOREIGN KEY ("centerId") REFERENCES public.centers(id);


--
-- Name: event_attendees FK_07eb323a7b08ba51fe4b582f3f4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT "FK_07eb323a7b08ba51fe4b582f3f4" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notification_automations FK_0b9c247c9674f290c051eb605e1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_automations
    ADD CONSTRAINT "FK_0b9c247c9674f290c051eb605e1" FOREIGN KEY ("centerId") REFERENCES public.centers(id) ON DELETE CASCADE;


--
-- Name: onboardings FK_11343da082955491d848b8ea0ba; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboardings
    ADD CONSTRAINT "FK_11343da082955491d848b8ea0ba" FOREIGN KEY ("assignedToId") REFERENCES public.users(id);


--
-- Name: events FK_12f41fe0276b5f738f32142fa70; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT "FK_12f41fe0276b5f738f32142fa70" FOREIGN KEY ("meetingRoomId") REFERENCES public.meeting_rooms(id);


--
-- Name: leads FK_1cc4d3177a1b83286f4382877f5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "FK_1cc4d3177a1b83286f4382877f5" FOREIGN KEY ("customerId") REFERENCES public.customers(id);


--
-- Name: invoices FK_1df049f8943c6be0c1115541efb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "FK_1df049f8943c6be0c1115541efb" FOREIGN KEY ("customerId") REFERENCES public.customers(id);


--
-- Name: payments FK_1ead3dc5d71db0ea822706e389d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_1ead3dc5d71db0ea822706e389d" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id);


--
-- Name: requests FK_201916c45d3781732ee5c90427a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT "FK_201916c45d3781732ee5c90427a" FOREIGN KEY ("centerId") REFERENCES public.centers(id);


--
-- Name: event_attendees FK_21056813ffb169d392d38a40c2d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT "FK_21056813ffb169d392d38a40c2d" FOREIGN KEY ("eventId") REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: contracts FK_22c6e574e547c5b5d79e9c84380; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT "FK_22c6e574e547c5b5d79e9c84380" FOREIGN KEY ("customerId") REFERENCES public.customers(id);


--
-- Name: meeting_rooms FK_2342695aafda4e20e26d9485f1c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_rooms
    ADD CONSTRAINT "FK_2342695aafda4e20e26d9485f1c" FOREIGN KEY ("centerId") REFERENCES public.centers(id);


--
-- Name: bookings FK_38a69a58a323647f2e75eb994de; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "FK_38a69a58a323647f2e75eb994de" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: events FK_3c4b8fb4918645d465103683f7c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT "FK_3c4b8fb4918645d465103683f7c" FOREIGN KEY ("recurringBookingId") REFERENCES public.recurring_bookings(id);


--
-- Name: invoices FK_42d017ec6c4a79ea33cbe9dbfba; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "FK_42d017ec6c4a79ea33cbe9dbfba" FOREIGN KEY ("contractId") REFERENCES public.contracts(id);


--
-- Name: discounts FK_454f7bb4255559a07a0e07b8463; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT "FK_454f7bb4255559a07a0e07b8463" FOREIGN KEY ("centerId") REFERENCES public.centers(id);


--
-- Name: seats FK_4ac1376b13f263f9ec844e93ace; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT "FK_4ac1376b13f263f9ec844e93ace" FOREIGN KEY ("floorId") REFERENCES public.floors(id);


--
-- Name: contracts FK_4c856428f0e47a23b1e4b2a8eba; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT "FK_4c856428f0e47a23b1e4b2a8eba" FOREIGN KEY ("centerId") REFERENCES public.centers(id);


--
-- Name: requests FK_4e37651f0e9992a329976e97631; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT "FK_4e37651f0e9992a329976e97631" FOREIGN KEY ("requestedById") REFERENCES public.users(id);


--
-- Name: leads FK_533da3a3887638192a5dfa2c176; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "FK_533da3a3887638192a5dfa2c176" FOREIGN KEY ("assignedToId") REFERENCES public.users(id);


--
-- Name: user_sessions FK_55fa4db8406ed66bc7044328427; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "FK_55fa4db8406ed66bc7044328427" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: recovery_codes FK_5ab5f51b1ca8fcc0073d76fd3d9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recovery_codes
    ADD CONSTRAINT "FK_5ab5f51b1ca8fcc0073d76fd3d9" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: equipment FK_5e5acac3cb159e6fc37a5d62d64; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT "FK_5e5acac3cb159e6fc37a5d62d64" FOREIGN KEY ("assignedTo") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: onboardings FK_60fd32a45d871041911020ba4f5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboardings
    ADD CONSTRAINT "FK_60fd32a45d871041911020ba4f5" FOREIGN KEY ("customerId") REFERENCES public.customers(id);


--
-- Name: bookings FK_67b9cd20f987fc6dc70f7cd283f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "FK_67b9cd20f987fc6dc70f7cd283f" FOREIGN KEY ("customerId") REFERENCES public.customers(id);


--
-- Name: invoices FK_67dfac70310152d54239071fc68; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "FK_67dfac70310152d54239071fc68" FOREIGN KEY ("centerId") REFERENCES public.centers(id);


--
-- Name: notifications FK_692a909ee0fa9383e7859f9b406; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: equipment FK_7512a3eb81e191ab2f9dd9cbb8c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT "FK_7512a3eb81e191ab2f9dd9cbb8c" FOREIGN KEY ("centerId") REFERENCES public.centers(id) ON DELETE CASCADE;


--
-- Name: subscriptions FK_7536cba909dd7584a4640cad7d5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "FK_7536cba909dd7584a4640cad7d5" FOREIGN KEY ("planId") REFERENCES public.plans(id) ON DELETE RESTRICT;


--
-- Name: scheduled_reports FK_780bbea1414d32c65584b896fca; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_reports
    ADD CONSTRAINT "FK_780bbea1414d32c65584b896fca" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: centers FK_7a96c81a605c1d8daa31393229f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.centers
    ADD CONSTRAINT "FK_7a96c81a605c1d8daa31393229f" FOREIGN KEY (owner) REFERENCES public.users(id);


--
-- Name: users FK_7aff205df2c337240c14e6dd3a3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_7aff205df2c337240c14e6dd3a3" FOREIGN KEY ("centerId") REFERENCES public.centers(id);


--
-- Name: customers FK_7df69ffeb072af1c9b6cbe70dc8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "FK_7df69ffeb072af1c9b6cbe70dc8" FOREIGN KEY ("centerId") REFERENCES public.centers(id);


--
-- Name: seats FK_8315eed37f4ac8bb4f016f5560b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT "FK_8315eed37f4ac8bb4f016f5560b" FOREIGN KEY ("centerId") REFERENCES public.centers(id);


--
-- Name: customer_documents FK_831b9575ae0e77515c9751feeb0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_documents
    ADD CONSTRAINT "FK_831b9575ae0e77515c9751feeb0" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: plans FK_8ba4f47fe9b778ee9f2c3d25eea; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT "FK_8ba4f47fe9b778ee9f2c3d25eea" FOREIGN KEY ("centerId") REFERENCES public.centers(id) ON DELETE SET NULL;


--
-- Name: onboardings FK_8c0f29dbe58a6d17686780302f2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboardings
    ADD CONSTRAINT "FK_8c0f29dbe58a6d17686780302f2" FOREIGN KEY ("leadId") REFERENCES public.leads(id);


--
-- Name: bookings FK_8c1342fb1f40b9fc91abec4f842; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "FK_8c1342fb1f40b9fc91abec4f842" FOREIGN KEY ("seatId") REFERENCES public.seats(id);


--
-- Name: deposits FK_8fcae2811365dc8a4eb39ac1468; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT "FK_8fcae2811365dc8a4eb39ac1468" FOREIGN KEY ("customerId") REFERENCES public.customers(id);


--
-- Name: scheduled_reports FK_91abf631dcca931ad07d1a0dc25; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_reports
    ADD CONSTRAINT "FK_91abf631dcca931ad07d1a0dc25" FOREIGN KEY ("centerId") REFERENCES public.centers(id) ON DELETE CASCADE;


--
-- Name: visits FK_939f5f4d006ccfcc1bd4fc484a1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT "FK_939f5f4d006ccfcc1bd4fc484a1" FOREIGN KEY ("centerId") REFERENCES public.centers(id);


--
-- Name: recurring_bookings FK_abdaaa240b8d241275a689c27d1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_bookings
    ADD CONSTRAINT "FK_abdaaa240b8d241275a689c27d1" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bookings FK_ad4180a9526df053287666b2d96; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "FK_ad4180a9526df053287666b2d96" FOREIGN KEY ("meetingRoomId") REFERENCES public.meeting_rooms(id);


--
-- Name: customer_employees FK_b4ad67659fff0463d40815c8df9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_employees
    ADD CONSTRAINT "FK_b4ad67659fff0463d40815c8df9" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: customers FK_b8512aa9cef03d90ed5744c94d7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "FK_b8512aa9cef03d90ed5744c94d7" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: floors FK_bea1ce63385885a38455849d304; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.floors
    ADD CONSTRAINT "FK_bea1ce63385885a38455849d304" FOREIGN KEY ("centerId") REFERENCES public.centers(id);


--
-- Name: subscriptions FK_c0e348514f6198c687a93a06a85; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "FK_c0e348514f6198c687a93a06a85" FOREIGN KEY ("centerId") REFERENCES public.centers(id) ON DELETE SET NULL;


--
-- Name: centers FK_c5676622e94758fd5f8d9d7690b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.centers
    ADD CONSTRAINT "FK_c5676622e94758fd5f8d9d7690b" FOREIGN KEY ("locationId") REFERENCES public.locations(id);


--
-- Name: events FK_c5ed4b17f22163f801c9b4bef82; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT "FK_c5ed4b17f22163f801c9b4bef82" FOREIGN KEY ("requestedById") REFERENCES public.users(id);


--
-- Name: calendar_connections FK_cd1622c543fece00b3e1212b581; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_connections
    ADD CONSTRAINT "FK_cd1622c543fece00b3e1212b581" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: audit_logs FK_cfa83f61e4d27a87fcae1e025ab; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: event_ticket_tiers FK_d1e487fdd32bef806e846185c5f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_ticket_tiers
    ADD CONSTRAINT "FK_d1e487fdd32bef806e846185c5f" FOREIGN KEY ("eventId") REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: recurring_bookings FK_d5a6345f4c1a0d54831f761a4a7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_bookings
    ADD CONSTRAINT "FK_d5a6345f4c1a0d54831f761a4a7" FOREIGN KEY ("roomId") REFERENCES public.meeting_rooms(id) ON DELETE CASCADE;


--
-- Name: customer_employees FK_d6db7ca8296b7d33fb9e722a367; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_employees
    ADD CONSTRAINT "FK_d6db7ca8296b7d33fb9e722a367" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: bookings FK_d79434033d86545585600e8881c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "FK_d79434033d86545585600e8881c" FOREIGN KEY ("centerId") REFERENCES public.centers(id);


--
-- Name: subscriptions FK_e0fbe75e9db162a00ecaf7ab56a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "FK_e0fbe75e9db162a00ecaf7ab56a" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: notifications FK_e1a1168d514c49f93a9fcfb7a77; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_e1a1168d514c49f93a9fcfb7a77" FOREIGN KEY ("centerId") REFERENCES public.centers(id) ON DELETE SET NULL;


--
-- Name: requests FK_e32dafff32c402bbc9f2b7d43ee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT "FK_e32dafff32c402bbc9f2b7d43ee" FOREIGN KEY ("assignedToId") REFERENCES public.users(id);


--
-- Name: visits FK_eabb047e1cee43735ba20d8c811; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT "FK_eabb047e1cee43735ba20d8c811" FOREIGN KEY ("assignedToId") REFERENCES public.users(id);


--
-- Name: visits FK_ee66134e29166a2c5995ef97e9d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT "FK_ee66134e29166a2c5995ef97e9d" FOREIGN KEY ("leadId") REFERENCES public.leads(id);


--
-- Name: visits FK_f135d755c9c23cccd90c859d180; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT "FK_f135d755c9c23cccd90c859d180" FOREIGN KEY ("requestedById") REFERENCES public.users(id);


--
-- Name: leads FK_f67a383ad0a12248abdccfad09e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "FK_f67a383ad0a12248abdccfad09e" FOREIGN KEY ("centerId") REFERENCES public.centers(id);


--
-- Name: customer_employees FK_f8b90c9a3af2f5418c2e7077b0a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_employees
    ADD CONSTRAINT "FK_f8b90c9a3af2f5418c2e7077b0a" FOREIGN KEY ("seatId") REFERENCES public.seats(id) ON DELETE SET NULL;


--
-- Name: recurring_bookings FK_fe9ea4d0bcc1a6fe0fad6e7647d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_bookings
    ADD CONSTRAINT "FK_fe9ea4d0bcc1a6fe0fad6e7647d" FOREIGN KEY ("centerId") REFERENCES public.centers(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 4evROex0G75o1f0BuKzwgGsZrBSj8gpRpGoL7zEEKL0xamibLocMWNHZwhg4Xxl

