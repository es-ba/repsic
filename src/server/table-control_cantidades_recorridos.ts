"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

import { control_cantidades_area } from "./table-control_cantidades_area"
import { FieldDefinition } from "backend-plus";

export function control_cantidades_recorridos(context:TableContext):TableDefinition {
    const tableDef = control_cantidades_area(context);
    const fields: FieldDefinition[] = tableDef.fields.filter(f=>f.name != 'area');
    tableDef.name = 'control_cantidades_recorridos';
    tableDef.elementName= 'control_cantidades_recorridos';
    tableDef.fields = fields;
    tableDef.primaryKey=tableDef.primaryKey.filter(pkFieldName=>pkFieldName != 'area'),
    tableDef.sql={
        isTable: false,
        from: `(
            SELECT 
                operativo,
                recorrido,
                tipo_recorrido,
                descripcion,
                cues_dm,
                pers_dm,
                cues_papel,
                pers_papel,
                SUM(cues_dm + cues_papel) OVER () AS total_cues,
                SUM(pers_dm + pers_papel) OVER () AS total_pers,
                comuna,
                descripcion_barrio
            FROM (
                SELECT
                    (SELECT operativo FROM parametros WHERE unico_registro) AS operativo,
                    r.recorrido,
                    r.tipo_recorrido,
                    descripcion,
                    COUNT(*) FILTER (WHERE enc_autogenerado_dm IS NOT NULL AND COALESCE((json_encuesta->>'u8')::integer,0) > 0 ) AS cues_dm,
                    COALESCE(SUM(COALESCE((json_encuesta->>'u8')::integer,0)) FILTER (WHERE enc_autogenerado_dm IS NOT NULL AND json_encuesta IS NOT NULL),0) AS pers_dm,
                    COUNT(*) FILTER (WHERE enc_autogenerado_dm IS NULL AND enc_autogenerado_dm_capa IS NULL AND COALESCE((json_encuesta->>'u8')::integer,0) > 0 ) AS cues_papel,
                    COALESCE(SUM(COALESCE((json_encuesta->>'u8')::integer,0)) FILTER (WHERE enc_autogenerado_dm IS NULL AND enc_autogenerado_dm_capa IS NULL AND json_encuesta IS NOT NULL),0) AS pers_papel,
                    (SELECT array_agg(DISTINCT comuna ORDER BY comuna)::text 
                        FROM (
                            SELECT comuna
                            FROM recorridos_barrios rb
                            LEFT JOIN barrios USING (comuna, barrio) 
                            WHERE rb.recorrido=r.recorrido
                            UNION 
                            SELECT comuna
                            FROM lugares l
                            WHERE l.recorrido=r.recorrido
                        ) x
                    ) AS comuna, 
                    (SELECT STRING_AGG(nombre,', ' ORDER BY barrio) 
                        FROM (
                            SELECT barrio, nombre
                            FROM recorridos_barrios rb 
                            LEFT JOIN barrios USING (comuna, barrio) 
                            WHERE r.recorrido=rb.recorrido
                            UNION
                            SELECT barrio, nombre
                            FROM lugares l 
                            LEFT JOIN barrios USING (comuna,barrio) 
                            WHERE r.recorrido=l.recorrido
                        ) y
                    ) AS descripcion_barrio
                FROM 
                    recorridos r 
                JOIN 
                    tipos_recorrido tr USING (tipo_recorrido)
                LEFT JOIN 
                    tem t USING (recorrido)
                GROUP BY 
                    operativo,
                    r.recorrido,
                    r.tipo_recorrido,
                    descripcion
                ORDER BY 
                    r.recorrido
            ) AS detalle_recorridos
        )`        
    }
    return tableDef
}