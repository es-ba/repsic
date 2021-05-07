
set search_path=repsic, dbo, comun;
-- version inicial para tener las funciones de varcal huecas 

drop table if exists "repsic211_grupo_personas_calculada";
drop table if exists "repsic211_personas_calculada";
drop table if exists "repsic211_supervision_calculada";
DROP FUNCTION repsic.generate_fun_varcal_provisorio();

set role repsic211_muleto_admin;

create table "repsic211_grupo_personas_calculada" (
  operativo             text,
  id_caso               text,
 primary key ("operativo", "id_caso")
);
grant select, insert, update, delete, references on "repsic211_grupo_personas_calculada" to "repsic211_muleto_admin";
grant all on "repsic211_grupo_personas_calculada" to "repsic211_muleto_owner";

create table "repsic211_personas_calculada" (
  "operativo" text,
  "id_caso" text,
  "p0" bigint
, primary key ("operativo", "id_caso", "p0")
);
grant select, insert, update, delete, references on "repsic211_personas_calculada" to "repsic211_muleto_admin";
grant all on "repsic211_personas_calculada" to "repsic211_muleto_owner";

create table "repsic211_supervision_calculada" (
  "recorrido" bigint
, primary key ("recorrido")
);
grant select, insert, update, delete, references on "repsic211_supervision_calculada" to "repsic211_muleto_admin";
grant all on "repsic211_supervision_calculada" to "repsic211_muleto_owner";

-- FKs
alter table "repsic211_grupo_personas_calculada" add constraint  "repsic211_grupo_personas_calculada grupo_personas REL" foreign key ("operativo", "id_caso") references "grupo_personas" ("operativo", "id_caso")  on delete cascade on update cascade;
alter table "repsic211_personas_calculada" add constraint  "repsic211_personas_calculada personas REL" foreign key ("operativo", "id_caso", "p0") references "personas" ("operativo", "id_caso", "p0")  on delete cascade on update cascade;
alter table "repsic211_supervision_calculada" add constraint  "repsic211_supervision_calculada supervision REL" foreign key ("recorrido") references "supervision" ("recorrido")  on delete cascade on update cascade;
-- index
create index "operativo,id_caso 4 repsic211_grupo_personas_calculada IDX" ON "repsic211_grupo_personas_calculada" ("operativo", "id_caso");
create index "operativo,id_caso,p0 4 repsic211_personas_calculada IDX" ON "repsic211_personas_calculada" ("operativo", "id_caso", "p0");
create index "recorrido 4 repsic211_supervision_calculada IDX" ON "repsic211_supervision_calculada" ("recorrido");
----
--mejora
            INSERT INTO "repsic211_grupo_personas_calculada" ("operativo","id_caso") 
              SELECT "operativo","id_caso" FROM "grupo_personas";

            INSERT INTO "repsic211_personas_calculada" ("operativo","id_caso","p0") 
              SELECT "operativo","id_caso","p0" FROM "personas";

            INSERT INTO "repsic211_supervision_calculada" ("recorrido") 
              SELECT "recorrido" FROM "supervision";
----

----- SE CREA LA FUNCION PARA LLAMAR ANTES DE CADA CONSISTIR
-----
CREATE OR REPLACE FUNCTION generate_fun_varcal_provisorio() RETURNS TEXT
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
BEGIN

  -- TODO: ver porque funciona v_recorrido y si lo necesitamos
  select u1 into v_recorrido from grupo_personas where operativo=p_operativo AND id_caso=p_id_caso;
  -- Cada vez que se actualizan las variables calculadas, previamente se deben insertar los registros que no existan (on conflict do nothing)
  -- de las tablas base (solo los campos pks), sin filtrar por p_id_caso para update_varcal o con dicho filtro para update_varcal_por_encuesta
    INSERT INTO "repsic211_grupo_personas_calculada" ("operativo","id_caso") 
      SELECT "operativo","id_caso" FROM "grupo_personas" WHERE operativo=p_operativo AND "id_caso"=p_id_caso ON CONFLICT DO NOTHING;
    INSERT INTO "repsic211_personas_calculada" ("operativo","id_caso","p0") 
      SELECT "operativo","id_caso","p0" FROM "personas" WHERE operativo=p_operativo AND "id_caso"=p_id_caso ON CONFLICT DO NOTHING;
    INSERT INTO "repsic211_supervision_calculada" ("recorrido") 
      SELECT "recorrido" FROM "supervision" WHERE recorrido=v_recorrido ON CONFLICT DO NOTHING;
  ----
  --no hay variables calculadas definidas
  RETURN 'OK';
END;
$BODY$;
$THE_FUN$;
begin 
  execute v_sql;
  execute replace(replace(replace(replace(
     v_sql,
     $$update_varcal_por_encuesta("p_operativo" text, "p_id_caso" text) RETURNS TEXT$$, $$update_varcal("p_operativo" text) RETURNS TEXT$$),
     $$grupo_personas.id_caso=p_id_caso$$, $$TRUE$$),
     $$id_caso=p_id_caso$$, $$TRUE$$),
     $$"id_caso"=p_id_caso$$, $$TRUE$$);
  return '2GENERATED';
end;
$GENERATOR$;

SELECT generate_fun_varcal_provisorio();
-----
UPDATE operativos SET calculada=now()::timestamp(0) WHERE operativo='repsic211';
UPDATE tabla_datos SET generada=now()::timestamp(0) WHERE operativo='repsic211' AND tipo='calculada';
-----