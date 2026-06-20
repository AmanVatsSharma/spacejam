# SpaceJam Production Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Client Layer (Web/React)                           │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ GraphQL with Apollo Client
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    API Gateway (NestJS)                                │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │        GraphQL API (@nestjs/graphql)                              │ │
│  │    - Authentication Guard                                          │ │
│  │    - Rate Limiting                                                 │ │
│  │    - Request Logging                                               │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ Direct Database/Cache
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Data Layer                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    PostgreSQL (Primary)                             │ │
│  │    • Users, Centers, Bookings, Payments                            │ │
│  │    • Time-series data (revenue, occupancy)                         │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                      Redis (Cache)                                 │ │
│  │    • Session storage                                                │ │
│  │    • API rate limiting                                              │ │
│  │    • Hot data caching                                               │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
apps/api/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── app.controller.ts   # Root controller
│   │   ├── app.service.ts      # Root service
│   │   └── app.module.ts       # Root module
│   ├── config/
│   │   └── module.ts           # Configuration
│   ├── graphql/
│   │   ├── schema.graphql      # GraphQL schema definition
│   │   ├── types/
│   │   │   └── user.type.ts    # GraphQL types
│   │   └── resolvers/
│   │       ├── auth.resolver.ts
│   │       ├── user.resolver.ts
│   │       ├── center.resolver.ts
│   │       ├── booking.resolver.ts
│   │       └── analytics.resolver.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   └── auth.service.ts     # JWT auth service
│   ├── cache/
│   │   ├── cache.module.ts     # Global cache module
│   │   └── cache.service.ts    # Redis caching
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── health/
│   │   └── health.service.ts
│   ├── revenue/
│   │   ├── revenue.controller.ts
│   │   ├── revenue.service.ts
│   │   ├── revenue.interface.ts
│   │   └── revenue.module.ts
│   └── main.ts                 # Application bootstrap
├── .env                        # Environment variables
├── .env.example                # Environment template
├── Dockerfile                  # Production Docker image
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Local Development Setup

1. **Install dependencies:**
```bash
cd apps/api
npm install
```

2. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start PostgreSQL and Redis:**
```bash
docker-compose up -d postgres redis
```

4. **Run database migrations:**
```bash
npm install prisma
npx prisma migrate dev --name init
npx prisma db seed  # Optional: seed sample data
```

5. **Start development server:**
```bash
npm run start:dev
# or
npx nx serve api
```

### GraphQL Playground

Access at: `http://localhost:3001/api/graphql`

## Key Features

### 1. GraphQL API
- Type-safe queries and mutations
- Real-time subscriptions
- Auto-generated schema
- Apollo driver with caching

### 2. Caching Strategy
- Redis-based caching with configurable TTL
- Pattern-based cache invalidation
- Session storage
- Rate limiting

### 3. Authentication
- JWT with refresh token rotation
- Redis session storage
- Role-based access control
- Password hashing with bcrypt

### 4. Database
- Prisma ORM for type-safe queries
- PostgreSQL with proper indexing
- Migration system
- Multi-tenancy ready (center-based)

## Scaling Considerations

1. **Database:**
   - Read replicas for analytics queries
   - Connection pooling with PgBouncer
   - Index optimization

2. **Caching:**
   - Redis cluster for high availability
   - Cache warming for frequently accessed data
   - Gradual cache warming on application startup

3. **API:**
   - Horizontal scaling with multiple API instances
   - Load balancing with Nginx
   - Rate limiting per user/IP

4. **Monitoring:**
   - Prometheus metrics endpoint
   - Grafana dashboards
   - Health check endpoints