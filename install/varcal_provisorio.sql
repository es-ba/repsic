drop table if exists "repsic211_grupo_personas_calculada";
drop table if exists "repsic211_personas_calculada";
drop table if exists "repsic211_supervision_calculada";

create table "repsic211_grupo_personas_calculada" (
  operativo             text,
  id_caso               text,
  cant_0a14_mu          bigint,
  cant_0a14_no_obs      bigint,
  cant_0a14_tot         bigint,
  cant_0a14_va          bigint,
  cant_15a18_mu         bigint,
  cant_15a18_no_obs     bigint,
  cant_15a18_tot        bigint,
  cant_15a18_va         bigint,
  cant_19a59_mu         bigint,
  cant_19a59_no_obs     bigint,
  cant_19a59_tot        bigint,
  cant_19a59_va         bigint,
  cant_60ymas_mu        bigint,
  cant_60ymas_no_obs    bigint,
  cant_60ymas_tot       bigint,
  cant_60ymas_va        bigint,
  cant_no_obs_mu        bigint,
  cant_no_obs_no_obs    bigint,
  cant_no_obs_tot       bigint,
  cant_no_obs_va        bigint,
  cant_tot_mu           bigint,
  cant_tot_no_obs       bigint,
  cant_tot_tot          bigint,
  cant_tot_va           bigint,
  cant_per              bigint,
  cant_refe             bigint
, primary key ("operativo", "id_caso")
);
grant select, insert, update, delete, references on "repsic211_grupo_personas_calculada" to "repsic_user";
grant all on "repsic211_grupo_personas_calculada" to "repsic_owner";

create table "repsic211_personas_calculada" (
  "operativo" text,
  "id_caso" text,
  "p0" bigint,
  sexor bigint
, primary key ("operativo", "id_caso", "p0")
);
grant select, insert, update, delete, references on "repsic211_personas_calculada" to "repsic_user";
grant all on "repsic211_personas_calculada" to "repsic_owner";

create table "repsic211_supervision_calculada" (
  "recorrido" bigint,
  cant_form bigint
, primary key ("recorrido")
);
grant select, insert, update, delete, references on "repsic211_supervision_calculada" to "repsic_user";
grant all on "repsic211_supervision_calculada" to "repsic_owner";

-- FKs
alter table "repsic211_grupo_personas_calculada" add constraint  "repsic211_grupo_personas_calculada grupo_personas REL" foreign key ("operativo", "id_caso") references "grupo_personas" ("operativo", "id_caso")  on delete cascade on update cascade;
alter table "repsic211_personas_calculada" add constraint  "repsic211_personas_calculada personas REL" foreign key ("operativo", "id_caso", "p0") references "personas" ("operativo", "id_caso", "p0")  on delete cascade on update cascade;
alter table "repsic211_supervision_calculada" add constraint  "repsic211_supervision_calculada supervision REL" foreign key ("recorrido") references "supervision" ("recorrido")  on delete cascade on update cascade;
-- index
create index "operativo,id_caso 4 repsic211_grupo_personas_calculada IDX" ON "repsic211_grupo_personas_calculada" ("operativo", "id_caso");
create index "operativo,id_caso,p0 4 repsic211_personas_calculada IDX" ON "repsic211_personas_calculada" ("operativo", "id_caso", "p0");
create index "recorrido 4 repsic211_supervision_calculada IDX" ON "repsic211_supervision_calculada" ("recorrido");
----
do $SQL_ENANCE$
 begin
PERFORM enance_table('repsic211_grupo_personas_calculada','operativo,id_caso');
PERFORM enance_table('repsic211_personas_calculada','operativo,id_caso,p0');
PERFORM enance_table('repsic211_supervision_calculada','recorrido');
end
$SQL_ENANCE$;
-----
----- SE CREA LA FUNCION PARA LLAMAR ANTES DE CADA CONSISTIR
-----
CREATE OR REPLACE FUNCTION generate_fun_varcal_provisorio() RETURNS TEXT
  language plpgsql
AS
$GENERATOR$
declare
  v_sql text:=$THE_FUN$
CREATE OR REPLACE FUNCTION varcal_provisorio_por_encuesta("p_operativo" text, "p_id_caso" text) RETURNS TEXT
  LANGUAGE PLPGSQL
AS
$BODY$
declare v_recorrido bigint;
BEGIN
  --Los inserts siguientes tienen que ir acá porque esta funcion es la que se va a correr 
  -- cuando se ingrese/guarde una encuesta nueva (varcal_provisorio_por_encuesta), ya que cuando se guarda 
  -- una nueva encuesta se consiste, y el consistir llama a esta función, pero como la encuesta es nueva
  -- los registros de la tabla "encuesta_calculada" no existen, entonces se deben insertar

  -- el delete es para poder usar esta misma funcion cuando la encuesta no es nueva, mejorar poniendole
  -- a los inserts una condición, por ej ON CONFLICT DO NOTHING/UPDATE , para sacar los delete

  -- en varcal_provisorio_total comentamos inserts y deletes porque se asume que están todas las encuestas
  -- reflejadas en la tabla calculada, porque al presionar "devolver" en una encuesta la misma se consiste y se
  -- agrega en calculadas si no existe (ver comentario de mas arriba)

  -- TODO: ver porque funciona v_recorrido y si lo necesitamos
  select u1 into v_recorrido from grupo_personas where operativo=p_operativo AND id_caso=p_id_caso;
  DELETE FROM "repsic211_grupo_personas_calculada" WHERE operativo=p_operativo AND id_caso=p_id_caso;
  DELETE FROM "repsic211_personas_calculada" WHERE operativo=p_operativo AND id_caso=p_id_caso;
  DELETE FROM "repsic211_supervision_calculada" WHERE recorrido=v_recorrido;
  ----
  INSERT INTO "repsic211_grupo_personas_calculada" (operativo, id_caso) SELECT operativo, id_caso FROM grupo_personas WHERE operativo=p_operativo AND id_caso=p_id_caso;
  INSERT INTO "repsic211_personas_calculada" (operativo, id_caso, p0) SELECT operativo, id_caso, p0 FROM personas inner join grupo_personas using (operativo, id_caso) inner join repsic211_grupo_personas_calculada using (operativo, id_caso) WHERE grupo_personas.operativo=p_operativo AND grupo_personas.id_caso=p_id_caso;
  INSERT INTO "repsic211_supervision_calculada" (recorrido) SELECT recorrido FROM supervision WHERE recorrido=v_recorrido;
  ----
  UPDATE repsic211_grupo_personas_calculada
    SET cant_per            = repsic211_personas_agg.cant_per,
        cant_refe           = repsic211_personas_agg.cant_refe,
        cant_0a14_va        = repsic211_personas_agg.cant_0a14_va,
        cant_tot_va         = repsic211_personas_agg.cant_tot_va,
        cant_0a14_mu        = repsic211_personas_agg.cant_0a14_mu,
        cant_15a18_va       = repsic211_personas_agg.cant_15a18_va,
        cant_15a18_mu       = repsic211_personas_agg.cant_15a18_mu,
        cant_15a18_no_obs   = repsic211_personas_agg.cant_15a18_no_obs,
        cant_tot_mu         = repsic211_personas_agg.cant_tot_mu,
        cant_15a18_tot      = repsic211_personas_agg.cant_15a18_tot,
        cant_60ymas_va      = repsic211_personas_agg.cant_60ymas_va,
        cant_60ymas_mu      = repsic211_personas_agg.cant_60ymas_mu,
        cant_60ymas_no_obs  = repsic211_personas_agg.cant_60ymas_no_obs,
        cant_60ymas_tot     = repsic211_personas_agg.cant_60ymas_tot,
        cant_19a59_tot      = repsic211_personas_agg.cant_19a59_tot,
        cant_0a14_no_obs    = repsic211_personas_agg.cant_0a14_no_obs,
        cant_19a59_va       = repsic211_personas_agg.cant_19a59_va,
        cant_no_obs_va      = repsic211_personas_agg.cant_no_obs_va,
        cant_19a59_mu       = repsic211_personas_agg.cant_19a59_mu,
        cant_tot_no_obs     = repsic211_personas_agg.cant_tot_no_obs,
        cant_19a59_no_obs   = repsic211_personas_agg.cant_19a59_no_obs,
        cant_no_obs_mu      = repsic211_personas_agg.cant_no_obs_mu,
        cant_no_obs_no_obs  = repsic211_personas_agg.cant_no_obs_no_obs,
        cant_no_obs_tot     = repsic211_personas_agg.cant_no_obs_tot,
        cant_0a14_tot       = repsic211_personas_agg.cant_0a14_tot
    FROM grupo_personas ,
      LATERAL (
        SELECT
            count(nullif(true,false)) as cant_per,
            count(nullif(CASE WHEN personas.p1=1 THEN true ELSE NULL END,false)) as cant_refe,
            count(nullif(CASE WHEN personas.p3>=0 and personas.p3<=14 and personas.p2=1 THEN true ELSE NULL END,false)) as cant_0a14_va,
            count(nullif(CASE WHEN personas.p2=1 THEN true ELSE NULL END,false)) as cant_tot_va,
            count(nullif(CASE WHEN personas.p3>=0 and personas.p3<=14 and personas.p2=2 THEN true ELSE NULL END,false)) as cant_0a14_mu,
            count(nullif(CASE WHEN personas.p3>=15 and personas.p3<=18 and personas.p2=1 THEN true ELSE NULL END,false)) as cant_15a18_va,
            count(nullif(CASE WHEN personas.p3>=15 and personas.p3<=18 and personas.p2=2 THEN true ELSE NULL END,false)) as cant_15a18_mu,
            count(nullif(CASE WHEN personas.p3>=15 and personas.p3<=18 and (personas.p2=88 or personas.p2=99 or personas.p2=777) THEN true ELSE NULL END,false)) as cant_15a18_no_obs,
            count(nullif(CASE WHEN personas.p2=2 THEN true ELSE NULL END,false)) as cant_tot_mu,
            count(nullif(CASE WHEN personas.p3>=15 and personas.p3<=18 THEN true ELSE NULL END,false)) as cant_15a18_tot,
            count(nullif(CASE WHEN personas.p3>=60 and personas.p3<=150 and personas.p2=1 THEN true ELSE NULL END,false)) as cant_60ymas_va,
            count(nullif(CASE WHEN personas.p3>=60 and personas.p3<=150 and personas.p2=2 THEN true ELSE NULL END,false)) as cant_60ymas_mu,
            count(nullif(CASE WHEN personas.p3>=60 and personas.p3<=150 and (personas.p2=88 or personas.p2=99 or personas.p2=777) THEN true ELSE NULL END,false)) as cant_60ymas_no_obs,
            count(nullif(CASE WHEN personas.p3>=60 and personas.p3<=150  THEN true ELSE NULL END,false)) as cant_60ymas_tot,
            count(nullif(CASE WHEN personas.p3>=19 and personas.p3<=59 THEN true ELSE NULL END,false)) as cant_19a59_tot,
            count(nullif(CASE WHEN personas.p3>=0 and personas.p3<=14 and (personas.p2=88 or personas.p2=99 or personas.p2=777) THEN true ELSE NULL END,false)) as cant_0a14_no_obs,
            count(nullif(CASE WHEN personas.p3>=19 and personas.p3<=59 and personas.p2=1 THEN true ELSE NULL END,false)) as cant_19a59_va,
            count(nullif(CASE WHEN (personas.p3=777 or personas.p3=888 or personas.p3=999) and personas.p2=1 THEN true ELSE NULL END,false)) as cant_no_obs_va,
            count(nullif(CASE WHEN personas.p3>=19 and personas.p3<=59 and personas.p2=2 THEN true ELSE NULL END,false)) as cant_19a59_mu,
            count(nullif(CASE WHEN (personas.p2=88 or personas.p2=99 or personas.p2=777) THEN true ELSE NULL END,false)) as cant_tot_no_obs,
            count(nullif(CASE WHEN personas.p3>=19 and personas.p3<=59 and (personas.p2=88 or personas.p2=99 or personas.p2=777) THEN true ELSE NULL END,false)) as cant_19a59_no_obs,
            count(nullif(CASE WHEN (personas.p3=777 or personas.p3=888 or personas.p3=999) and personas.p2=2 THEN true ELSE NULL END,false)) as cant_no_obs_mu,
            count(nullif(CASE WHEN (personas.p3=777 or personas.p3=888 or personas.p3=999) and (personas.p2=88 or personas.p2=99 or personas.p2=777) THEN true ELSE NULL END,false)) as cant_no_obs_no_obs,
            count(nullif(CASE WHEN (personas.p3=777 or personas.p3=888 or personas.p3=999) THEN true ELSE NULL END,false)) as cant_no_obs_tot,
            count(nullif(CASE WHEN personas.p3>=0 and personas.p3<=14 THEN true ELSE NULL END,false)) as cant_0a14_tot
          FROM repsic211_personas_calculada inner join personas USING (operativo,id_caso,p0)
          WHERE grupo_personas.operativo = repsic211_personas_calculada.operativo AND grupo_personas.id_caso = repsic211_personas_calculada.id_caso
      ) repsic211_personas_agg
    WHERE grupo_personas.operativo = repsic211_grupo_personas_calculada.operativo AND grupo_personas.id_caso = repsic211_grupo_personas_calculada.id_caso
      AND grupo_personas.operativo=p_operativo AND grupo_personas.id_caso=p_id_caso;
  UPDATE repsic211_personas_calculada
    SET sexor = null2zero(referente.p2) ----- VER QUIZAS QUIERA EL NULL!!!
    FROM personas inner join grupo_personas using (operativo, id_caso) inner join repsic211_grupo_personas_calculada using (operativo, id_caso)
        LEFT JOIN (
            SELECT operativo, id_caso, p0, referente.p2
              FROM personas referente
              WHERE referente.p1=1
        ) referente ON referente.id_caso=personas.id_caso AND referente.operativo=personas.operativo
    WHERE personas.operativo = repsic211_personas_calculada.operativo and personas.id_caso = repsic211_personas_calculada.id_caso and personas.p0 = repsic211_personas_calculada.p0
      AND grupo_personas.operativo=p_operativo AND grupo_personas.id_caso=p_id_caso;
  UPDATE repsic211_grupo_personas_calculada
    SET cant_tot_tot = repsic211_personas_agg.cant_tot_tot
    FROM grupo_personas , 
      LATERAL (
        SELECT
            count(nullif(true,false)) as cant_tot_tot
          FROM repsic211_personas_calculada inner join personas USING (operativo,id_caso,p0)
          WHERE grupo_personas.operativo = repsic211_personas_calculada.operativo and grupo_personas.id_caso = repsic211_personas_calculada.id_caso
      ) repsic211_personas_agg
    WHERE grupo_personas.operativo = repsic211_grupo_personas_calculada.operativo and grupo_personas.id_caso = repsic211_grupo_personas_calculada.id_caso
      AND grupo_personas.operativo=p_operativo AND grupo_personas.id_caso=p_id_caso;
  UPDATE repsic211_supervision_calculada
    SET cant_form = repsic211_grupo_personas_agg.cant_form
    FROM supervision ,
      LATERAL (
        SELECT
            count(nullif(true,false)) as cant_form
          FROM grupo_personas left join repsic211_grupo_personas_calculada USING (operativo,id_caso)
          WHERE supervision.recorrido = grupo_personas.u1
      ) repsic211_grupo_personas_agg
    WHERE supervision.recorrido = repsic211_supervision_calculada.recorrido
      AND supervision.recorrido=v_recorrido;
  UPDATE tabla_datos SET generada=current_timestamp WHERE operativo=p_operativo AND tipo='calculada';
  RETURN 'OK';
END;
$BODY$;
$THE_FUN$;
begin 
  execute v_sql;
  execute replace(replace(replace(replace(replace(
     v_sql,
     $$varcal_provisorio_por_encuesta("p_operativo" text, "p_id_caso" text) RETURNS TEXT$$, $$varcal_provisorio_total("p_operativo" text) RETURNS TEXT$$),
     $$grupo_personas.id_caso=p_id_caso$$, $$TRUE$$),
     $$id_caso=p_id_caso$$, $$TRUE$$),
     $$DELETE FROM$$, $$--DELETE FROM$$),
     $$INSERT INTO$$, $$--INSERT INTO$$);
  return '2GENERATED';
end;
$GENERATOR$;

SELECT generate_fun_varcal_provisorio();
-----
-----