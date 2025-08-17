# Migration Guide: Research → Search

## Overview
This document outlines the changes made to migrate from `/research` to `/search` directory structure.

## Changes Made

### 1. Directory Structure
- `src/app/research/` → `src/app/search/`
- `src/app/api/research/` → `src/app/api/search/`

### 2. URL Changes
- `/research` → `/search`
- `/research/results` → `/search/results`
- `/research/saved` → `/search/saved`
- `/research/saved/[id]` → `/search/saved/[id]`

### 3. API Endpoints
- `/api/research/ebay/search` → `/api/search/ebay/search`
- `/api/research/ebay/search-by-image` → `/api/search/ebay/search-by-image`
- `/api/research/save` → `/api/search/save`
- `/api/research/saved/[id]/delete` → `/api/search/saved/[id]/delete`
- `/api/research/saved/[id]/update-ai` → `/api/search/saved/[id]/update-ai`

### 4. Storage Bucket
- `research-public` → `search-public` (recommended)

## Next Steps

### 1. Update Environment Variables
```bash
# Update your .env file
SUPABASE_STORAGE_BUCKET=search-public
```

### 2. Update Database Storage Bucket
```sql
-- Run this in your Supabase SQL editor
UPDATE storage.buckets SET name = 'search-public' WHERE name = 'research-public';
```

### 3. Test the New Routes
- Visit `/search` to ensure the main search page works
- Test image and text search functionality
- Verify saved searches are accessible at `/search/saved`

### 4. Remove Old Directory (After Testing)
```bash
# Only after confirming everything works
rm -rf src/app/research
rm -rf src/app/api/research
```

## Rollback Plan
If issues arise, you can quickly rollback by:
1. Restoring the old `research/` directories
2. Reverting the middleware changes
3. Updating navigation links back to `/research`

## Benefits of This Change
- Better UX: Users expect "search" functionality
- Clearer intent: Directory name matches functionality
- Consistent naming: Function names already suggested "search"
- Improved discoverability: More intuitive URL structure
