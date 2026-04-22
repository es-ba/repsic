set role postgres;
ALTER TABLE IF EXISTS base.repsic_261_grupo_personas_calculada
    OWNER to repsic261_admin;
ALTER TABLE IF EXISTS base.repsic_261_personas_calculada
    OWNER to repsic261_admin;
ALTER TABLE IF EXISTS base.repsic_261_coordinacion_calculada
    OWNER to repsic261_admin;
    
GRANT ALL ON SCHEMA comun TO repsic261_admin;
GRANT ALL ON SCHEMA comun TO repsic261_owner;
    