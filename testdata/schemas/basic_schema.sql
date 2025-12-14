CREATE TABLE public.orders (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  amount numeric(10,2),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  price numeric(10,2)
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  action text NOT NULL,
  payload jsonb,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE public.migrations (
  id serial PRIMARY KEY,
  name text NOT NULL,
  applied_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE public.sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  expires_at timestamp NOT NULL
);
