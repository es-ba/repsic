set search_path=repsic, dbo, comun;
--set role repsic252_muleto_admin;

update variables set activa=false
  where clase='calculada';

--dejar pocas consistencias para probar
update consistencias
  set activa=false
  where consistencia !~'^u8|^o1'; 
