set search_path=repsic;
alter table usuarios add column recorrido integer;
alter table "usuarios" add constraint "usuarios recorridos REL" foreign key ("recorrido") references "recorridos" ("recorrido")  on update cascade;
create index "recorrido 4 usuarios IDX" ON "usuarios" ("recorrido");
