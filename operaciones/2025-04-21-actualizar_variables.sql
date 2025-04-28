set search_path= base;
set role to repsicparadores251_owner;--repsic251_owner; --adecuar al entorno

alter table personas add column if not exists sc196_esp text; 
alter table "personas" add constraint "sc196_esp<>''" check ("sc196_esp"<>'');

alter table personas 
    drop column if exists sc19_88,
    drop column if exists sc19_99,
    drop column if exists sc20_88,
    drop column if exists sc20_99; 

delete from variables
  where operativo='REPSIC_251' and variable in ('sc19_88','sc19_99','sc20_88','sc20_99') ;   

