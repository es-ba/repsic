set role postgres;
ALTER TABLE IF EXISTS base.repsic_242_grupo_personas_calculada
    OWNER to repsic242_admin;
ALTER TABLE IF EXISTS base.repsic_242_personas_calculada
    OWNER to repsic242_admin;
ALTER TABLE IF EXISTS base.repsic_242_coordinacion_calculada
    OWNER to repsic242_admin;
    
GRANT ALL ON SCHEMA comun TO repsic242_admin;
GRANT ALL ON SCHEMA comun TO repsic242_owner;
    