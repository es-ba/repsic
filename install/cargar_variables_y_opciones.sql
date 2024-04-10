with ope as (
  select operativo from operativos limit 1 
)
select sql2tabla_datos('base', 'grupo_personas', operativo) from ope
union select sql2tabla_datos('base', 'personas', operativo) from ope
union select sql2tabla_datos('base', 'comunas', operativo) from ope
union select sql2tabla_datos('base', 'barrios', operativo) from ope
union select sql2tabla_datos('base', 'recorridos', operativo) from ope
union select sql2tabla_datos('base', 'recorridos_barrios', operativo) from ope
union select sql2tabla_datos('base', 'coordinacion', operativo) from ope
union select sql2tabla_datos('base', 'lugares', operativo) from ope
union select sql2tabla_datos('base', 'tipos_lugar', operativo) from ope
union select sql2tabla_datos('base', 'tipos_recorrido', operativo) from ope;

--completar vars y opciones
update variables v
set nombre = c.nombre
from casilleros c
where v.variable=c.var_name and v.clase = 'interna' and v.nombre is null and c.nombre is not null;

-- importar variables.tab desde repsic-data

insert into variables_opciones (operativo, tabla_datos, variable, opcion, nombre, orden)
select var.operativo, var.tabla_datos, var.variable, o.casillero::integer, string_agg(o.nombre,'/'), min(o.orden)
    from casilleros o join casilleros p on o.operativo=p.operativo and o.padre=(case when p.tipoc='OM' then p.padre||'/'||p.casillero else p.casillero end) and p.var_name is not null and o.tipoc='O'
      join variables var on var.operativo=p.operativo and p.var_name= variable -- tabla_datos ??? es lo que quiero determinar
    group by 1,2,3,4 --descartar opciones duplicadas por distintos formularios
    order by var.operativo, var.tabla_datos, var.variable;
	

