SET SEARCH_PATH=REPSIC;
set role repsic231_owner;
 
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

--cambiar owner de tablas calculadas y sus funciones (se crearon con user owner)
 ALTER TABLE IF EXISTS repsic.repsic231_grupo_personas_calculada
    OWNER to repsic231_admin;
ALTER TABLE IF EXISTS repsic.repsic231_personas_calculada
    OWNER to repsic231_admin;
ALTER TABLE IF EXISTS repsic.repsic231_supervision_calculada
    OWNER to repsic231_admin; 
    
ALTER FUNCTION repsic.gen_fun_var_calc()
    OWNER TO repsic231_admin;
ALTER FUNCTION repsic.update_varcal(text)
    OWNER TO repsic231_admin;
ALTER FUNCTION repsic.update_varcal_por_encuesta(text, text)
    OWNER TO repsic231_admin;   
    
-- correr varcal_provisorio.sql

select update_varcal('repsic231');
UPDATE operativos SET calculada=now()::timestamp(0) WHERE operativo='repsic231';
UPDATE tabla_datos SET generada=now()::timestamp(0) WHERE operativo='repsic231' AND tipo='calculada';
    
