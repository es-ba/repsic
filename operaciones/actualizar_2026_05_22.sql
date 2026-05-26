set search_path = base;
set role to repsic261_owner;


alter table "tareas" add column permite_borrar_ua boolean;

update "tareas" set permite_borrar_ua = true where permite_borrar_ua is null;

insert into permisos(permiso, accion,predeterminado) values
	('encuestas','borrar_ua',false);
insert into roles_permisos(rol, permiso, accion, habilitado)
   select rol ,permiso, accion, case when rol in ('admin','coor_campo', 'coor_proc','procesamiento','subcoor_campo') then true else predeterminado end
     from roles r, permisos p
	      where accion='borrar_ua' and not exists (select 1 from roles_permisos x where x.rol=r.rol and x.permiso=p.permiso and x.accion=p.accion);

