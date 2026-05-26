set search_path = base;
set role to repsic261_owner;


alter table "tareas" add column permite_borrar_ua boolean;

update "tareas" set permite_borrar_ua = true where permite_borrar_ua is null;