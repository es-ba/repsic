create or replace function adjunto_carto_trg() returns trigger
  language plpgsql
as
$BODY$
declare
begin
  if new.ext ~* 'KML' and (tg_op='INSERT' or old.ext is null) then
    insert into adjunto_categoria 
      select *
        from (select new.id_adjunto as id_adjunto, 'carto'::text as categoria) x
             left join adjunto_categoria as existe using(id_adjunto, categoria)
        where existe.id_adjunto is null;
  end if;
  return new;
end;
$BODY$;

CREATE TRIGGER adjunto_carto_trg
  AFTER INSERT OR UPDATE OF ext
  ON adjuntos
  FOR EACH ROW
  EXECUTE PROCEDURE adjunto_carto_trg();  
