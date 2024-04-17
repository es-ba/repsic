create or replace function registrar_barrio_recorrido_trg() returns trigger
  language plpgsql
as
$BODY$
declare
begin
  new.recorrido := select recorrido from areas where area = new.area;
  return new;
end;
$BODY$;

CREATE TRIGGER registrar_barrio_recorrido_trg
  before INSERT OR UPDATE OF tem
  FOR EACH ROW
  EXECUTE PROCEDURE registrar_barrio_recorrido_trg();  
