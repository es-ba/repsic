
set role=repsic252_owner; --cambiar por el usuario que corresponda
set search_path = base;

alter table personas drop column  "sc24"; 
alter table personas add column   "sc10a"       integer;
alter table personas add column   "sc10a2_esp"  integer;
alter table personas add column   "sc10b"       integer;
alter table personas add column   "sc10b2_esp"  text;
alter table personas add column   "sc10c"       integer;
alter table personas add column   "sc10d"       integer;
alter table personas add column   "sc25c"       integer;
