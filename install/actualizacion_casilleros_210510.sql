set role repsic231_muleto_owner;
set search_path=repsic;
alter table personas drop column sc13_esp;
alter table personas drop column sc17_esp;
alter table personas drop column sc19_esp;
alter table personas drop column sc20_esp;
delete from variables where operativo='repsic231' and variable in ( 'sc13_esp', 'sc17_esp', 'sc19_esp','sc20_esp');
--volver a hacer el local-dump
delete from casilleros;
-- table data: ..\repsic-data\casilleros.tab
-- tomar info para insertar en casilleros desde el dump.
insert into "casilleros" ("operativo", "id_casillero", "padre", "tipoc", "casillero", "orden", "nombre", "tipovar", "longitud", "tipoe", "aclaracion", "salto", "unidad_analisis", "cantidad_resumen", "irrepetible", "despliegue", "ver_id", "optativo", "formulario_principal", "var_name", "var_name_especial", "expresion_habilitar", "valor_ns_nc", "valor_sin_dato", "leer", "calculada", "libre", "especial") values
...
--326 filas