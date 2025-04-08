set role repsic251_owner; --adecuar al entorno 
set search_path=base;
--agregar a tabla variables las variables agregadas een sql del 2024-11-05
insert into variables(operativo, tabla_datos, variable, tipovar, grupo, clase, es_pk, orden, cerrada, activa)
    select (SELECT OPERATIVO FROM PARAMETROS), C.TABLE_NAME, c.column_name,
        case c.data_type
          when 'text'     then 'texto'
          when 'integer'  then 'numero'
          when 'bigint'   then 'numero'
          when 'decimal'  then 'decimal'
          when 'date'     then 'fecha'
          when 'interval' then 'hora'
          when 'boolean'  then 'boolean'
        end,
        case when kcu.ordinal_position is not null then 'claves' else null end,
        'interna',
        kcu.ordinal_position,
        c.ordinal_position,
        true,
        true
      from information_schema.columns c 
          LEFT JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                 ON tc.table_catalog = c.table_catalog
                 AND tc.table_schema = c.table_schema
                 AND tc.table_name = c.table_name
                 AND tc.constraint_type = 'PRIMARY KEY'
          LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                 ON kcu.table_catalog = tc.table_catalog
                 AND kcu.table_schema = tc.table_schema
                 AND kcu.table_name = tc.table_name
                 AND kcu.constraint_name = tc.constraint_name
                 AND kcu.column_name = c.column_name
      where c.table_schema = 'base' and c.table_name = 'personas'
        and (c.table_name,c.column_name) not in (select tabla_datos, variable from variables existentes);

--variables_opciones
insert into variables_opciones (operativo, tabla_datos, variable, opcion, nombre, orden)
select var.operativo, var.tabla_datos, var.variable, o.casillero::integer, string_agg(o.nombre,'/'), min(o.orden)
    from casilleros o join casilleros p on o.operativo=p.operativo and o.padre=(case when p.tipoc='OM' then p.padre||'/'||p.casillero else p.casillero end) and p.var_name is not null and o.tipoc='O'
      join variables var on var.operativo=p.operativo and p.var_name= variable -- tabla_datos ??? es lo que quiero determinar
	where variable ~'^sc(9a1|29|30)$'
    group by 1,2,3,4 --descartar opciones duplicadas por distintos formularios
    order by var.operativo, var.tabla_datos, var.variable;
