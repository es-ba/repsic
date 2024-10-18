set search_path= base;
set role to repsic242_owner; --adecuar al entorno

CREATE OR REPLACE FUNCTION sincro_tareas_areas_tareas_tem_trg()
    RETURNS trigger
    LANGUAGE 'plpgsql' 
AS $BODY$
begin
    update tareas_tem tt
        set asignado      = case when new.asignado      is not null and new.asignado      is distinct from old.asignado      then new.asignado      else asignado      end,
            recepcionista = case when new.recepcionista is not null and new.recepcionista is distinct from old.recepcionista then new.recepcionista else recepcionista end
        from tem t   
        where tt.operativo=t.operativo 
            and tt.enc=t.enc 
            and tt.tarea=new.tarea
            and t.area=new.area
            and (t.tarea_actual is null or t.tarea_actual = tt.tarea);          
    return new;
end;
$BODY$;