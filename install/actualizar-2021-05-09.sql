set role to repsic211_produc_owner;
set search_path=repsic;
/*
alter table recorridos add column apellido text; 
alter table recorridos add column nombre text;
alter table recorridos add column orden bigint;
*/
update recorridos r
  set orden = recorrido 
  where exists (select 1 from recorridos_puntos p where p.recorrido = r.recorrido)