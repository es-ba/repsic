set search_path= base;
--set role eah_owner;

ALTER TABLE inconsistencias 
  ADD COLUMN if not exists renglon bigint;

create or replace function desintegrarpk_trg() returns trigger
  language plpgsql SECURITY DEFINER as
$body$
begin
  new.vivienda := new.pk_integrada->>'vivienda';
  new.hogar := new.pk_integrada->>'hogar';
  new.persona := new.pk_integrada->>'persona';
  new.visita := new.pk_integrada->>'visita';
  new.renglon := new.pk_integrada->>'renglon';
  return new;
end;
$body$;

create trigger desintegrarpk_trg
  before insert or update 
  of pk_integrada
  on inconsistencias
  for each row
  execute procedure desintegrarpk_trg();
