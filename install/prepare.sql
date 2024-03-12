-- pg-parents

create or replace function armar_id(recorrido integer, orden integer) returns integer
  language sql
as
$SQL$
  SELECT case when orden<100 then recorrido*100 + orden else recorrido*10000 + orden end
$SQL$;
