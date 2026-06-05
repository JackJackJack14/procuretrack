ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS notify_report boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_contract boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_inspection boolean NOT NULL DEFAULT true;

GRANT INSERT, SELECT, UPDATE ON public.organizations TO authenticated;
GRANT INSERT, SELECT, UPDATE ON public.profiles TO authenticated;