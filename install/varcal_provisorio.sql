
--set search_path=base, dbo, comun;
-- con variables revisadas por procesamiento 07/05/2021

drop table if exists "repsic_241_grupo_personas_calculada";
drop table if exists "repsic_241_personas_calculada";
drop table if exists "repsic_241_coordinacion_calculada";
DROP FUNCTION if exists gen_fun_var_calc();
DROP FUNCTION if exists update_varcal(text);
DROP FUNCTION if exists update_varcal_por_encuesta(text,text);

--set role repsic241_admin;

create table "repsic_241_grupo_personas_calculada" (
  operativo             text,
  id_caso               text,
  "cant_0a14_mu" bigint, 
  "cant_0a14_no_obs" bigint, 
  "cant_0a14_tot" bigint, 
  "cant_0a14_va" bigint, 
  "cant_15a18_mu" bigint, 
  "cant_15a18_no_obs" bigint, 
  "cant_15a18_tot" bigint, 
  "cant_15a18_va" bigint, 
  "cant_19a59_mu" bigint, 
  "cant_19a59_no_obs" bigint, 
  "cant_19a59_tot" bigint, 
  "cant_19a59_va" bigint, 
  "cant_60ymas_mu" bigint, 
  "cant_60ymas_no_obs" bigint, 
  "cant_60ymas_tot" bigint, 
  "cant_60ymas_va" bigint, 
  "cant_no_obs_mu" bigint, 
  "cant_no_obs_no_obs" bigint, 
  "cant_no_obs_tot" bigint, 
  "cant_no_obs_va" bigint, 
  "cant_tot_mu" bigint, 
  "cant_tot_no_obs" bigint, 
  "cant_tot_tot" bigint, 
  "cant_tot_va" bigint, 
  "cant_per" bigint, 
  "cant_refe" bigint
, primary key ("operativo", "id_caso")
);
--grant select, insert, update, delete, references on "repsic_241_grupo_personas_calculada" to "repsic241_admin";
--grant all on "repsic_241_grupo_personas_calculada" to "repsic241_owner";

create table "repsic_241_personas_calculada" (
  "operativo" text,
  "id_caso" text,
  "persona" bigint, 
  "sexor" bigint,
  "edadr" bigint
, primary key ("operativo", "id_caso", "persona")
);
--grant select, insert, update, delete, references on "repsic_241_personas_calculada" to "repsic241_admin";
--grant all on "repsic_241_personas_calculada" to "repsic241_owner";

create table "repsic_241_coordinacion_calculada" (
  "recorrido" bigint, 
  "cant_form" bigint
, primary key ("recorrido")
);
--grant select, insert, update, delete, references on "repsic_241_coordinacion_calculada" to "repsic241_admin";
--grant all on "repsic_241_coordinacion_calculada" to "repsic241_owner";

-- conss
alter table "repsic_241_grupo_personas_calculada" add constraint "operativo<>''" check ("operativo"<>'');
alter table "repsic_241_grupo_personas_calculada" add constraint "id_caso<>''" check ("id_caso"<>'');
alter table "repsic_241_personas_calculada" add constraint "operativo<>''" check ("operativo"<>'');
alter table "repsic_241_personas_calculada" add constraint "id_caso<>''" check ("id_caso"<>'');

-- FKs
alter table "repsic_241_grupo_personas_calculada" add constraint  "repsic_241_grupo_personas_calculada grupo_personas REL" foreign key ("operativo", "id_caso") references "grupo_personas" ("operativo", "id_caso")  on delete cascade on update cascade;
alter table "repsic_241_personas_calculada" add constraint  "repsic_241_personas_calculada personas REL" foreign key ("operativo", "id_caso", "persona") references "personas" ("operativo", "id_caso", "persona")  on delete cascade on update cascade;
--alter table "repsic_241_coordinacion_calculada" add constraint  "repsic_241_coordinacion_calculada coordinacion REL" foreign key ("recorrido") references "coordinacion" ("recorrido")  on delete cascade on update cascade;
-- index
create index "operativo,id_caso 4 repsic_241_grupo_personas_calculada IDX" ON "repsic_241_grupo_personas_calculada" ("operativo", "id_caso");
create index "operativo,id_caso,persona 4 repsic_241_personas_calculada IDX" ON "repsic_241_personas_calculada" ("operativo", "id_caso", "persona");
create index "recorrido 4 repsic_241_coordinacion_calculada IDX" ON "repsic_241_coordinacion_calculada" ("recorrido");
----
--mejora
            INSERT INTO "repsic_241_grupo_personas_calculada" ("operativo","id_caso") 
              SELECT "operativo","id_caso" FROM "grupo_personas";

            INSERT INTO "repsic_241_personas_calculada" ("operativo","id_caso","persona") 
              SELECT "operativo","id_caso","persona" FROM "personas";

            INSERT INTO "repsic_241_coordinacion_calculada" ("recorrido") 
              SELECT "recorrido" FROM "coordinacion";
----

----- SE CREA LA FUNCION PARA LLAMAR ANTES DE CADA CONSISTIR
-----
CREATE OR REPLACE FUNCTION gen_fun_var_calc()  RETURNS TEXT
  language plpgsql
AS
$GENERATOR$
declare
  v_sql text:=$THE_FUN$
CREATE OR REPLACE FUNCTION update_varcal_por_encuesta("p_operativo" text, "p_id_caso" text) RETURNS TEXT
  LANGUAGE PLPGSQL
AS
$BODY$
declare v_recorrido bigint;
es_por_encuesta boolean;
BEGIN
  -- TODO: mejorar v_recorrido 
  es_por_encuesta=true;
  if es_por_encuesta   then
    select u1 into v_recorrido from grupo_personas where operativo=p_operativo AND id_caso=p_id_caso;
  end if;
  -- Cada vez que se actualizan las variables calculadas, previamente se deben insertar los registros que no existan (on conflict do nothing)
  -- de las tablas base (solo los campos pks), sin filtrar por p_id_caso para update_varcal o con dicho filtro para update_varcal_por_encuesta
    INSERT INTO "repsic_241_grupo_personas_calculada" ("operativo","id_caso") 
      SELECT "operativo","id_caso" FROM "grupo_personas" WHERE operativo=p_operativo AND "id_caso"=p_id_caso ON CONFLICT DO NOTHING;
    INSERT INTO "repsic_241_personas_calculada" ("operativo","id_caso","persona") 
      SELECT "operativo","id_caso","persona" FROM "personas" WHERE operativo=p_operativo AND "id_caso"=p_id_caso ON CONFLICT DO NOTHING;
    INSERT INTO "repsic_241_coordinacion_calculada" ("recorrido") 
      SELECT "recorrido" FROM "coordinacion" WHERE recorrido=v_recorrido ON CONFLICT DO NOTHING;
  ----
    UPDATE repsic_241_grupo_personas_calculada
      SET 
        cant_0a14_mu = personas_agg.cant_0a14_mu,
        cant_0a14_no_obs = personas_agg.cant_0a14_no_obs,
        cant_0a14_tot = personas_agg.cant_0a14_tot,
        cant_0a14_va = personas_agg.cant_0a14_va,
        cant_15a18_mu = personas_agg.cant_15a18_mu,
        cant_15a18_no_obs = personas_agg.cant_15a18_no_obs,
        cant_15a18_tot = personas_agg.cant_15a18_tot,
        cant_15a18_va = personas_agg.cant_15a18_va,
        cant_19a59_mu = personas_agg.cant_19a59_mu,
        cant_19a59_no_obs = personas_agg.cant_19a59_no_obs,
        cant_19a59_tot = personas_agg.cant_19a59_tot,
        cant_19a59_va = personas_agg.cant_19a59_va,
        cant_60ymas_mu = personas_agg.cant_60ymas_mu,
        cant_60ymas_no_obs = personas_agg.cant_60ymas_no_obs,
        cant_60ymas_tot = personas_agg.cant_60ymas_tot,
        cant_60ymas_va = personas_agg.cant_60ymas_va,
        cant_no_obs_mu = personas_agg.cant_no_obs_mu,
        cant_no_obs_no_obs = personas_agg.cant_no_obs_no_obs,
        cant_no_obs_tot = personas_agg.cant_no_obs_tot,
        cant_no_obs_va = personas_agg.cant_no_obs_va,
        cant_tot_mu = personas_agg.cant_tot_mu,
        cant_tot_no_obs = personas_agg.cant_tot_no_obs,
        cant_tot_va = personas_agg.cant_tot_va,
        cant_refe = personas_agg.cant_refe
      FROM "grupo_personas"  
        ,LATERAL (
          SELECT
          count(nullif(CASE WHEN "personas"."sc4">=0 and "personas"."sc4"<=14 and "personas"."sc3"=2 THEN true ELSE NULL END,false)) as cant_0a14_mu,
          count(nullif(CASE WHEN "personas"."sc4">=0 and "personas"."sc4"<=14 and ("personas"."sc3"=88 or "personas"."sc3"=99 or "personas"."sc3"=777) THEN true ELSE NULL END,false)) as cant_0a14_no_obs,
          count(nullif(CASE WHEN "personas"."sc4">=0 and "personas"."sc4"<=14 THEN true ELSE NULL END,false)) as cant_0a14_tot,
          count(nullif(CASE WHEN "personas"."sc4">=0 and "personas"."sc4"<=14 and "personas"."sc3"=1 THEN true ELSE NULL END,false)) as cant_0a14_va,
          count(nullif(CASE WHEN "personas"."sc4">=15 and "personas"."sc4"<=18 and "personas"."sc3"=2 THEN true ELSE NULL END,false)) as cant_15a18_mu,
          count(nullif(CASE WHEN "personas"."sc4">=15 and "personas"."sc4"<=18 and ("personas"."sc3"=88 or "personas"."sc3"=99 or "personas"."sc3"=777) THEN true ELSE NULL END,false)) as cant_15a18_no_obs,
          count(nullif(CASE WHEN "personas"."sc4">=15 and "personas"."sc4"<=18 THEN true ELSE NULL END,false)) as cant_15a18_tot,
          count(nullif(CASE WHEN "personas"."sc4">=15 and "personas"."sc4"<=18 and "personas"."sc3"=1 THEN true ELSE NULL END,false)) as cant_15a18_va,
          count(nullif(CASE WHEN "personas"."sc4">=19 and "personas"."sc4"<=59 and "personas"."sc3"=2 THEN true ELSE NULL END,false)) as cant_19a59_mu,
          count(nullif(CASE WHEN "personas"."sc4">=19 and "personas"."sc4"<=59 and ("personas"."sc3"=88 or "personas"."sc3"=99 or "personas"."sc3"=777) THEN true ELSE NULL END,false)) as cant_19a59_no_obs,
          count(nullif(CASE WHEN "personas"."sc4">=19 and "personas"."sc4"<=59 THEN true ELSE NULL END,false)) as cant_19a59_tot,
          count(nullif(CASE WHEN "personas"."sc4">=19 and "personas"."sc4"<=59 and "personas"."sc3"=1 THEN true ELSE NULL END,false)) as cant_19a59_va,
          count(nullif(CASE WHEN "personas"."sc4">=60 and "personas"."sc4"<=150 and "personas"."sc3"=2 THEN true ELSE NULL END,false)) as cant_60ymas_mu,
          count(nullif(CASE WHEN "personas"."sc4">=60 and "personas"."sc4"<=150 and ("personas"."sc3"=88 or "personas"."sc3"=99 or "personas"."sc3"=777) THEN true ELSE NULL END,false)) as cant_60ymas_no_obs,
          count(nullif(CASE WHEN "personas"."sc4">=60 and "personas"."sc4"<=150 THEN true ELSE NULL END,false)) as cant_60ymas_tot,
          count(nullif(CASE WHEN "personas"."sc4">=60 and "personas"."sc4"<=150 and "personas"."sc3"=1 THEN true ELSE NULL END,false)) as cant_60ymas_va,
          count(nullif(CASE WHEN ("personas"."sc4"=777 or "personas"."sc4"=888 or "personas"."sc4"=999) and "personas"."sc3"=2 THEN true ELSE NULL END,false)) as cant_no_obs_mu,
          count(nullif(CASE WHEN ("personas"."sc4"=777 or "personas"."sc4"=888 or "personas"."sc4"=999) and ("personas"."sc3"=88 or "personas"."sc3"=99 or "personas"."sc3"=777) THEN true ELSE NULL END,false)) as cant_no_obs_no_obs,
          count(nullif(CASE WHEN ("personas"."sc4"=777 or "personas"."sc4"=888 or "personas"."sc4"=999) THEN true ELSE NULL END,false)) as cant_no_obs_tot,
          count(nullif(CASE WHEN ("personas"."sc4"=777 or "personas"."sc4"=888 or "personas"."sc4"=999) and "personas"."sc3"=1 THEN true ELSE NULL END,false)) as cant_no_obs_va,
          count(nullif(CASE WHEN "personas"."sc3"=2 THEN true ELSE NULL END,false)) as cant_tot_mu,
          count(nullif(CASE WHEN ("personas"."sc3"=88 or "personas"."sc3"=99 or "personas"."sc3"=777) THEN true ELSE NULL END,false)) as cant_tot_no_obs,
          count(nullif(CASE WHEN "personas"."sc3"=1 THEN true ELSE NULL END,false)) as cant_tot_va,
          count(nullif(CASE WHEN "personas"."sc2"=1 THEN true ELSE NULL END,false)) as cant_refe
            FROM "personas" JOIN "repsic_241_personas_calculada" using ("operativo","id_caso","persona")
                WHERE "grupo_personas"."operativo"="personas"."operativo" AND "grupo_personas"."id_caso"="personas"."id_caso"
        ) as personas_agg
      WHERE "grupo_personas"."operativo"="repsic_241_grupo_personas_calculada"."operativo" AND "grupo_personas"."id_caso"="repsic_241_grupo_personas_calculada"."id_caso" AND "grupo_personas"."operativo"=p_operativo AND "grupo_personas"."id_caso"=p_id_caso;
    UPDATE repsic_241_grupo_personas_calculada
      SET 
        cant_tot_tot = personas_agg.cant_tot_tot,
        cant_per = personas_agg.cant_per
      FROM "grupo_personas"  
        ,LATERAL (
          SELECT
          count(nullif(true,false)) as cant_tot_tot,
          count(nullif(true,false)) as cant_per
            FROM "personas" JOIN "repsic_241_personas_calculada" using ("operativo","id_caso","persona")
                WHERE "grupo_personas"."operativo"="personas"."operativo" AND "grupo_personas"."id_caso"="personas"."id_caso"
        ) as personas_agg
      WHERE "grupo_personas"."operativo"="repsic_241_grupo_personas_calculada"."operativo" AND "grupo_personas"."id_caso"="repsic_241_grupo_personas_calculada"."id_caso" AND "grupo_personas"."operativo"=p_operativo AND "grupo_personas"."id_caso"=p_id_caso;
    UPDATE repsic_241_personas_calculada
      SET 
          sexor = null2zero(referente.sc3), -- VER QUIZAS QUIERA EL NULL!!!
          edadr = null2zero(referente.sc4)
    FROM personas inner join grupo_personas using (operativo, id_caso) inner join repsic_241_grupo_personas_calculada using (operativo, id_caso)
        LEFT JOIN (
            SELECT operativo, id_caso, persona, referente.sc3, referente.sc4
              FROM personas referente
              WHERE referente.persona=1
        ) referente ON referente.id_caso=personas.id_caso AND referente.operativo=personas.operativo
    WHERE "personas"."operativo"="repsic_241_personas_calculada"."operativo" AND "personas"."id_caso"="repsic_241_personas_calculada"."id_caso" AND "personas"."persona"="repsic_241_personas_calculada"."persona" 
      AND "personas"."operativo"=p_operativo AND "personas"."id_caso"=p_id_caso;
    UPDATE repsic_241_coordinacion_calculada
      SET 
          cant_form = grupo_personas_agg.cant_form
      FROM "coordinacion"  
        ,LATERAL (
          SELECT 
          count(nullif(true,false)) as cant_form
          FROM "grupo_personas" JOIN "repsic_241_grupo_personas_calculada" using ("operativo","id_caso")
          WHERE "coordinacion"."recorrido"="grupo_personas"."u1"
        ) as grupo_personas_agg
      WHERE "coordinacion"."recorrido"="repsic_241_coordinacion_calculada"."recorrido" 
        AND "coordinacion"."recorrido"=v_recorrido;

  --
  RETURN 'OK';
END;
$BODY$;
$THE_FUN$;
begin 
  execute v_sql;
  execute replace(replace(replace(replace(regexp_replace(replace(
  v_sql,
  $$update_varcal_por_encuesta("p_operativo" text, "p_id_caso" text) RETURNS TEXT$$, $$update_varcal("p_operativo" text) RETURNS TEXT$$),
  $$(.* )".*"\."id_caso"=p_id_caso(.*)$$, $$\1TRUE\2$$,'gm'),
  $$"id_caso"=p_id_caso$$, $$TRUE$$),
  $$es_por_encuesta=true$$,$$es_por_encuesta=false$$),
  $$"coordinacion"."recorrido"=v_recorrido$$,$$TRUE$$),
  $$recorrido=v_recorrido$$,$$TRUE$$);
  return '2GENERATED';
end;
$GENERATOR$;

SELECT gen_fun_var_calc();
-----
select update_varcal('REPSIC_241');
UPDATE operativos SET calculada=now()::timestamp(0) WHERE operativo='REPSIC_241';
UPDATE tabla_datos SET generada=now()::timestamp(0) WHERE operativo='REPSIC_241' AND tipo='calculada';
-----