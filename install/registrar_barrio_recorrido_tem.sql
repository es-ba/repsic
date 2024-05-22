create or replace function registrar_barrio_recorrido_trg() returns trigger
  language plpgsql
as
$BODY$
declare
begin
    new.recorrido := (select recorrido from areas where area = new.area);
    new.tipo_recorrido := (select tipo_recorrido from recorridos where recorrido = new.recorrido);
    new.comuna_agrupada := (select array_agg(distinct comuna order by comuna)::text 
        from (select comuna
                from recorridos_barrios 
                        left join barrios using (barrio) 
                where recorrido=new.recorrido
                union 
                select comuna
                from lugares 
                where recorrido=new.recorrido
        ) x
    );
    new.barrios_agrupados := (
        select string_agg(nombre,', ' order by barrio) 
            from recorridos_barrios 
                left join barrios using (barrio) 
            where recorrido=new.recorrido
    );
    return new;
end;
$BODY$;

CREATE TRIGGER registrar_barrio_recorrido_trg
  before INSERT OR UPDATE ON tem
  FOR EACH ROW
  EXECUTE PROCEDURE registrar_barrio_recorrido_trg();  
