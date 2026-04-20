# Row Level Security (RLS) Policies for New Account Configuration

This document outlines the required Supabase RLS policies to enable the New Account Configuration modal to function properly. These policies allow authenticated users to set up their profiles during first-time login.

## Overview

The New Account Configuration feature requires access to:
1. **Storage Bucket**: `avatars` - for uploading profile pictures
2. **Table**: `public.users` - for storing user profile information
3. **Table**: `public.user_roles` - for storing user role assignments

## Storage Policies

### Avatars Bucket

First, create the `avatars` storage bucket if it doesn't exist:

```sql
-- Create avatars bucket (run in Supabase SQL Editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);
```

#### Policy 1: Allow users to upload their own avatars

```sql
-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 2: Allow users to update their own avatars

```sql
-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 3: Allow public read access to avatars

```sql
-- Allow public to view avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

#### Policy 4: Allow users to delete their own avatars

```sql
-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Table Policies

### public.users Table

First, ensure the `users` table exists with the correct schema:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  institution_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

#### Policy 1: Allow users to insert their own profile

```sql
-- Allow authenticated users to create their own profile
CREATE POLICY "Users can insert their own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```

#### Policy 2: Allow users to update their own profile

```sql
-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

#### Policy 3: Allow users to read their own profile

```sql
-- Allow authenticated users to read their own profile
CREATE POLICY "Users can read their own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

#### Policy 4: (Optional) Allow users to read other profiles

```sql
-- Allow all authenticated users to read other profiles
-- This is useful for displaying user information in the app
CREATE POLICY "Users can read other profiles"
ON public.users
FOR SELECT
TO authenticated
USING (true);
```

---

### public.user_roles Table

First, ensure the `user_roles` table exists:

```sql
-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'adviser', 'coordinator')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

#### Policy 1: Allow users to insert their own role

```sql
-- Allow authenticated users to insert their own role
CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

#### Policy 2: Allow users to read their own roles

```sql
-- Allow authenticated users to read their own roles
CREATE POLICY "Users can read their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

#### Policy 3: (Optional) Allow coordinators to manage roles

```sql
-- Allow coordinators to manage all user roles
CREATE POLICY "Coordinators can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'coordinator'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'coordinator'
  )
);
```

---

## Verification

After applying all policies, verify they work correctly:

### 1. Test Avatar Upload

```javascript
// In browser console or test file
const { data: { user } } = await supabase.auth.getUser();
const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const { error } = await supabase.storage
  .from('avatars')
  .upload(`avatars/${user.id}-test.jpg`, file);
  
console.log('Upload error:', error); // Should be null
```

### 2. Test Profile Upsert

```javascript
const { data: { user } } = await supabase.auth.getUser();
const { error } = await supabase
  .from('users')
  .upsert({
    id: user.id,
    display_name: 'Test User',
    email: user.email,
    avatar_url: null,
    institution_name: 'Test University'
  });
  
console.log('Upsert error:', error); // Should be null
```

### 3. Test Role Insert

```javascript
const { data: { user } } = await supabase.auth.getUser();
const { error } = await supabase
  .from('user_roles')
  .insert({
    user_id: user.id,
    role: 'student'
  });
  
console.log('Insert error:', error); // Should be null
```

---

## Troubleshooting

### Common Issues

#### 1. "new row violates row-level security policy"

**Cause**: The RLS policy is too restrictive or not applied correctly.

**Solution**: 
- Verify the policy exists using: `SELECT * FROM pg_policies WHERE tablename = 'users';`
- Ensure RLS is enabled: `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;`
- Check that `auth.uid()` matches the user ID being inserted

#### 2. "permission denied for table users"

**Cause**: No policies exist for the authenticated role.

**Solution**: 
- Create at least one policy allowing the operation (INSERT/UPDATE/SELECT)
- Grant necessary permissions: `GRANT ALL ON public.users TO authenticated;`

#### 3. Avatar upload fails silently

**Cause**: Storage bucket doesn't exist or policies are misconfigured.

**Solution**:
- Verify bucket exists: Check Storage section in Supabase Dashboard
- Ensure bucket is public: `UPDATE storage.buckets SET public = true WHERE id = 'avatars';`
- Check storage policies are applied

#### 4. "duplicate key value violates unique constraint"

**Cause**: User role already exists (when trying to assign the same role twice).

**Solution**:
- This is expected behavior if the user already has a role
- Use upsert instead of insert if you want to update existing roles
- Check for existing roles before inserting

---

## Security Considerations

1. **Avatar File Size**: Consider adding a file size limit in application code (currently limited to 5MB in the modal)

2. **Avatar File Types**: The storage policies don't restrict file types. Consider adding server-side validation if needed.

3. **Role Validation**: The `user_roles` table uses a CHECK constraint to ensure only valid roles ('student', 'adviser', 'coordinator') can be inserted.

4. **Profile Updates**: Users can only update their own profiles. Consider adding audit logs if needed.

5. **Email Verification**: Consider requiring email verification before allowing profile completion.

---

## Additional Setup

### Enable Realtime (Optional)

If you want to listen to real-time changes:

```sql
-- Enable realtime for users table
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- Enable realtime for user_roles table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
```

### Create Indexes for Performance

```sql
-- Index on user_roles for faster role lookups
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Index on users for faster email lookups
CREATE INDEX idx_users_email ON public.users(email);
```

### Set up Triggers (Optional)

Update `updated_at` automatically:

```sql
-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## Complete Setup Script

Run this script in the Supabase SQL Editor to set up everything at once:

```sql
-- 1. Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  institution_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'adviser', 'coordinator')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 4. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Storage Policies
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6. Users Table Policies
CREATE POLICY "Users can insert their own profile"
ON public.users FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read their own profile"
ON public.users FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can read other profiles"
ON public.users FOR SELECT TO authenticated
USING (true);

-- 7. User Roles Table Policies
CREATE POLICY "Users can insert their own role"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 8. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 9. Create update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## Next Steps

1. Run the complete setup script in your Supabase SQL Editor
2. Test the New Account Configuration modal at `/dev/new-account-modal`
3. Verify all operations work by checking the browser console for errors
4. Monitor the Supabase logs for any policy violations
5. Adjust policies as needed based on your specific security requirements

For more information on RLS policies, see the [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security).
