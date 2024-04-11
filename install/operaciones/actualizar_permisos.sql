set role postgres;
ALTER TABLE IF EXISTS base.repsic_241_grupo_personas_calculada
    OWNER to repsic241_admin;
ALTER TABLE IF EXISTS base.repsic_241_personas_calculada
    OWNER to repsic241_admin;
ALTER TABLE IF EXISTS base.repsic_241_coordinacion_calculada
    OWNER to repsic241_admin;