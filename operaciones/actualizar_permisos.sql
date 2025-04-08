set role postgres;
ALTER TABLE IF EXISTS base.repsic_251_grupo_personas_calculada
    OWNER to repsic251_admin;
ALTER TABLE IF EXISTS base.repsic_251_personas_calculada
    OWNER to repsic251_admin;
ALTER TABLE IF EXISTS base.repsic_251_coordinacion_calculada
    OWNER to repsic251_admin;
    
GRANT ALL ON SCHEMA comun TO repsic251_admin;
GRANT ALL ON SCHEMA comun TO repsic251_owner;
    