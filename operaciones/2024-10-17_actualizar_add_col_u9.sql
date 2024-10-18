set search_path= base;
set role to repsic242_owner; --adecuar al entorno

alter table grupo_personas add column u9 text; 
alter table "grupo_personas" add constraint "u9<>''" check ("u9"<>'');
