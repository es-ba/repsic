set search_path = base;

alter table tem add column "enc_autogenerado_dm_capa" text;

alter table "tem" add constraint "enc_autogenerado_dm_capa<>''" check ("enc_autogenerado_dm_capa"<>'');

alter table "tem" add constraint "autogenerado_dm_capa_uk" unique ("token_autogenerado_dm", "enc_autogenerado_dm_capa");

create table "modos_dm" (
  "modo_dm" text, 
  "descripcion" text
, primary key ("modo_dm")
);
grant select, insert, update, delete on "modos_dm" to repsic251_admin;
grant all on "modos_dm" to repsic251_owner;

insert into "modos_dm" ("modo_dm", "descripcion") values
('produc', 'producción'),
('capa', 'capacitación');

alter table "modos_dm" add constraint "modo_dm<>''" check ("modo_dm"<>'');
alter table "modos_dm" add constraint "descripcion<>''" check ("descripcion"<>'');

alter table "parametros" add constraint "parametros modos_dm REL" foreign key ("modo_dm_defecto") references "modos_dm" ("modo_dm")  on update cascade;