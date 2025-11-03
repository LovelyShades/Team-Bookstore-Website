-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Migrate existing roles from profiles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::app_role
FROM public.profiles
WHERE role IS NOT NULL AND role IN ('admin', 'moderator', 'user')
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Create security definer function (bypasses RLS - no recursion!)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 6. Replace is_admin function to use new system
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(uid, 'admin')
$$;

-- 7. Drop problematic policies on profiles
DROP POLICY IF EXISTS "profiles_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- 8. Create new safe policies for profiles
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 9. Add Open Library fields to items table
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS isbn TEXT,
ADD COLUMN IF NOT EXISTS isbn_10 TEXT,
ADD COLUMN IF NOT EXISTS author TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS publish_year INTEGER,
ADD COLUMN IF NOT EXISTS open_library_id TEXT,
ADD COLUMN IF NOT EXISTS publisher TEXT,
ADD COLUMN IF NOT EXISTS page_count INTEGER;

-- 10. Create indexes for ISBN lookups
CREATE INDEX IF NOT EXISTS idx_items_isbn ON public.items(isbn);
CREATE INDEX IF NOT EXISTS idx_items_open_library_id ON public.items(open_library_id);

-- 11. Remove role column from profiles (after migration)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;