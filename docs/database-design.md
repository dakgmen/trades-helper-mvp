# Tradie Helper Database Architecture

## Overview
The Tradie Helper database is designed as a two-sided marketplace connecting tradies (skilled workers) with helpers (laborers) for short-term tasks. The architecture prioritizes security, scalability, and performance for mobile-first users.

## Architecture Principles

### Security First
- Row Level Security (RLS) policies on all tables
- JWT-based authentication with role-based access control
- Audit trails for all critical state changes
- Secure file storage with signed URLs

### Performance Optimized
- Location-based indexing for job matching
- Optimized queries for mobile networks
- Efficient pagination and filtering
- Database connection pooling

### Scalability Design
- Horizontal scaling support
- Proper foreign key relationships
- Normalized data structure
- Prepared for read replicas

## Core Entities

### 1. Users & Authentication
- **Supabase Auth**: Handles signup/login, JWT token generation
- **profiles**: Stores application-specific user data and roles

### 2. Job Management
- **jobs**: Job postings from tradies
- **job_applications**: Helper applications to jobs
- **Job lifecycle**: open → assigned → in_progress → completed → paid

### 3. Payment System
- **payments**: Escrow payment records
- **Integration**: Stripe Connect for platform payments
- **Flow**: Escrow on assignment → Release on completion

### 4. Communication
- **messages**: Job-specific messaging between tradie and helper
- **Real-time**: WebSocket support for instant messaging

### 5. Administration
- **admin_actions**: Audit trail for admin verification and dispute resolution

## Data Flow Architecture

### User Onboarding Flow
```
1. User signs up via Supabase Auth
2. Profile created in profiles table
3. Documents uploaded to Supabase Storage
4. Admin verification process initiated
5. User marked as verified
```

### Job Posting Flow
```
1. Tradie creates job (status: open)
2. Job appears in helper feed
3. Helpers apply (job_applications)
4. Tradie accepts one helper
5. Job status changes to assigned
6. Payment escrow created
7. Work completed, payment released
```

### Payment Flow
```
1. Job accepted → Create payment record (escrow)
2. Tradie pays via Stripe → Update status (paid)
3. Work completed → Mark for release
4. Funds transferred to helper → Update status (released)
```

## Security Model

### Role-Based Access Control (RBAC)
- **tradie**: Can create jobs, accept applications, make payments
- **helper**: Can apply to jobs, receive payments, upload verification docs
- **admin**: Can verify users, resolve disputes, view analytics

### Row Level Security Policies
- Users can only access their own profiles
- Job applications visible to job owner and applicant
- Messages restricted to job participants
- Admin actions require admin role

### File Storage Security
- Private bucket for identity documents
- Public bucket for profile images
- Signed URLs for secure access
- File type validation and size limits

## Performance Optimization

### Indexing Strategy
- **Location-based**: PostGIS for geographic queries
- **Time-based**: Job dates for scheduling
- **Status-based**: Job and payment status for filtering
- **User-based**: Foreign keys for relationship queries

### Query Optimization
- Efficient pagination with cursor-based approach
- Materialized views for complex aggregations
- Query caching for frequently accessed data
- Connection pooling for high concurrency

## Data Integrity

### Constraints
- Foreign key relationships enforced
- Check constraints for valid statuses
- NOT NULL constraints on critical fields
- Unique constraints where applicable

### Audit Trails
- Automatic timestamps (created_at, updated_at)
- State change logging for jobs and payments
- Admin action tracking
- Soft deletes where appropriate

## Backup and Recovery

### Backup Strategy
- Daily automated backups
- Point-in-time recovery capability
- Cross-region backup replication
- Regular backup restoration testing

### Disaster Recovery
- Multi-region deployment ready
- Database replication configuration
- Failover procedures documented
- Recovery time objectives defined

## Compliance and Privacy

### Data Protection
- Personal data encryption at rest
- PII handling procedures
- Data retention policies
- Right to erasure implementation

### Australian Compliance
- Privacy Act 1988 compliance
- Data breach notification procedures
- Consumer Data Right considerations
- Industry-specific requirements

## Monitoring and Analytics

### Performance Monitoring
- Query performance tracking
- Connection pool monitoring
- Storage usage alerts
- Response time metrics

### Business Analytics
- Job completion rates
- Payment processing metrics
- User engagement tracking
- Geographic distribution analysis

## Migration Strategy

### Schema Evolution
- Versioned migration scripts
- Backward compatibility considerations
- Zero-downtime migration procedures
- Rollback strategies

### Data Migration
- Production data handling
- Data validation procedures
- Migration testing protocols
- Performance impact assessment

## Future Enhancements

### Scalability Improvements
- Read replica implementation
- Database sharding strategy
- Cache layer optimization
- API rate limiting

### Feature Extensions
- Rating and review system
- Advanced matching algorithms
- Multi-language support
- Mobile app optimization

This architecture provides a solid foundation for the MVP while being designed to scale with the platform's growth.