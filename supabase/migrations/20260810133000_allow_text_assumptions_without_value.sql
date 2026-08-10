-- Text assumptions can describe a qualitative condition without a separate value.

alter table public.assumptions
  drop constraint assumptions_value_check;

alter table public.assumptions
  add constraint assumptions_value_check
  check (
    assumption_type = 'text'
    or char_length(trim(value)) > 0
  );
