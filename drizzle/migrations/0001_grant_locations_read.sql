grant select on public.locations, public.location_weeks, public.location_extras to anon, authenticated;
grant execute on function public.location_week_occupancy to anon, authenticated;