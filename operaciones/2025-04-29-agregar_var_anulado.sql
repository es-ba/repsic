set search_path= base;

--agregar a tabla variables
  insert into variables(operativo, tabla_datos, variable, tipovar, grupo, clase, es_pk, orden, cerrada, activa)
    select 'REPSIC_251', 'personas', c.column_name,
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
        and ('personas',c.column_name) not in (select tabla_datos, variable from variables existentes);

--completar vars y opciones
update variables v
set nombre ='¿Cuestionario Anulado?'
  where operativo='REPSIC_251' AND variable='anulado' ;

insert into variables_opciones (operativo, tabla_datos, variable, opcion, nombre, orden)
values('REPSIC_251','personas','anulado',1,'Si',1);

