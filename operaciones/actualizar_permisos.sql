set role postgres;
ALTER TABLE IF EXISTS base.repsic_252_grupo_personas_calculada
    OWNER to repsic252_admin;
ALTER TABLE IF EXISTS base.repsic_252_personas_calculada
    OWNER to repsic252_admin;
ALTER TABLE IF EXISTS base.repsic_252_coordinacion_calculada
    OWNER to repsic252_admin;
    
GRANT ALL ON SCHEMA comun TO repsic252_admin;
GRANT ALL ON SCHEMA comun TO repsic252_owner;
    