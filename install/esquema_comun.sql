drop schema if exists "comun" cascade;
create schema "comun";
grant usage on schema "comun" to "repsic_user";
grant create on schema "comun" to "repsic_user";

CREATE OR REPLACE FUNCTION comun.informado("P_valor" integer)
  RETURNS boolean AS
'SELECT $1 IS NOT NULL'
  LANGUAGE sql IMMUTABLE;


CREATE OR REPLACE FUNCTION comun.informado("P_valor" text)
  RETURNS boolean AS
$BODY$SELECT $1 !~ '^\s*$' AND $1 IS NOT NULL$BODY$
  LANGUAGE sql IMMUTABLE;


CREATE OR REPLACE FUNCTION comun.cadena_normalizar(
    p_cadena text)
    RETURNS text
    LANGUAGE 'sql'
    IMMUTABLE 
AS $BODY$
/*
-- Pruebas:
select entrada, esperado, comun.cadena_normalizar(entrada)
    , esperado is distinct from comun.cadena_normalizar(entrada)
  from (
  select 'hola' as entrada, 'HOLA' as esperado
  union select 'Cañuelas', 'CAÑUELAS'
  union select 'ÁCÉNTÍTÓSÚCü','ACENTITOSUCU'
  union select 'CON.SIGNOS/DE-PUNTUACION    Y MUCHOS ESPACIOS','CON SIGNOS DE-PUNTUACION Y MUCHOS ESPACIOS'
  union select 'CONÁÀÃÄÂáàãäâ   A', 'CONAAAAAAAAAA A'
  union select 'vocalesÁÒöÈÉüÙAeùúÍî?j', 'VOCALESAOOEEUUAEUUII J'
  union select 'ÅåÕõ.e', 'AAOO E'
) casos
  where esperado is distinct from comun.cadena_normalizar(entrada);
*/
  select upper(trim(regexp_replace(translate ($1, 'ÁÀÃÄÂÅÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛáàãäâåéèëêíìïîóòöôõúùüûçÇ¿¡!:;,?¿"./,()_^[]*$', 'AAAAAAEEEEIIIIOOOOOUUUUaaaaaaeeeeiiiiooooouuuu                      '), ' {2,}',' ','g')));
$BODY$;
