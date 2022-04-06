
create or replace function desintegrarpk_trg() returns trigger
  language plpgsql as
$body$
begin
  new.id_caso := new.pk_integrada->>'id_caso';
  new.p0 := new.pk_integrada->>'p0';
  return new;
end;
$body$;

create trigger desintegrarpk_trg
  before insert or update 
  of pk_integrada
  on inconsistencias
  for each row
  execute procedure desintegrarpk_trg();

/* TESTEOS:
delete from inconsistencias;
insert into inconsistencias (operativo,pk_integrada,consistencia) values ('repsic221','{"id_caso":"102","p0":1}'::jsonb,'cant_per_u8_a');
select * from inconsistencias;
update inconsistencias set pk_integrada = '{"id_caso":"103","p0":2}'::jsonb 
  where operativo = 'repsic221' and consistencia = 'cant_per_u8_a' and pk_integrada = '{"id_caso":"102","p0":1}'::jsonb;
select * from inconsistencias;
*/  
  