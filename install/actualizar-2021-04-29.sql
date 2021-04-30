set search_path=repsic;
alter table usuarios add column recorrido integer;
alter table "usuarios" add constraint "usuarios recorridos REL" foreign key ("recorrido") references "recorridos" ("recorrido")  on update cascade;
create index "recorrido 4 usuarios IDX" ON "usuarios" ("recorrido");

insert into roles(rol, superuser) values ('relevador',false);
insert into permisos (permiso, accion, predeterminado) values ('puntos', 'transmitir', false);
insert into roles_permisos(rol, permiso, accion, habilitado)
  select 'relevador' as rol,permiso, accion, false as habilitado from permisos;
update roles_permisos set habilitado=true
  where rol='relevador' and permiso='puntos' and accion='transmitir';




