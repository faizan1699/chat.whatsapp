# 🗃 Database Migration Instructions for Hobbies

## Current Issue
The hobbies tables haven't been created in your database yet. The migration files exist but need to be applied.

## Quick Fix - Run Manually

### Option 1: Using Supabase CLI (Recommended)
```bash
# Make sure your database is running
npx supabase start

# Then push migrations
npx supabase db push
```

### Option 2: Direct SQL Script
If Supabase CLI doesn't work, run the SQL script directly:

```bash
# Make script executable and run it
chmod +x create-hobbies-tables.sh
./create-hobbies-tables.sh
```

### Option 3: Using psql directly
```bash
# Connect to your database and run SQL
psql "postgresql://postgres.localhost:5432/nextjs_webrtc" -U faizan169 -f supabase/migrations/20260405030000_create_hobbies_tables.sql
```

## What Will Be Created
✅ `Hobby` table - Stores all available hobbies
✅ `UserHobby` table - Links users to their hobbies  
✅ 50 default hobbies (cricket, football, coding, music, etc.)
✅ Proper indexes and foreign key constraints

## After Migration
Once tables are created, the hobbies feature will work fully:
- ✅ Searchable dropdown in registration/profile
- ✅ Add new hobbies functionality  
- ✅ User hobby management
- ✅ Search users by hobbies

## Troubleshooting
If you get authentication errors, check your database connection settings in:
- `supabase/config.toml` 
- Environment variables for database URL

The migration files are ready, just need to be applied to your database! 🚀
