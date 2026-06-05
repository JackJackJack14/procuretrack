-- Grant table-level privileges to authenticated role for inspections table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspections TO authenticated;