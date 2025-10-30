"use strict";

import { FieldDefinition } from "backend-plus";
import {TableDefinition, TableContext} from "./types-repsic";

export function control_cantidades_area(_context:TableContext):TableDefinition {
    return {
        name: 'control_cantidades_area',
        elementName: 'control_cantidades_area',
        editable: false,
        fields: [
            { name: "operativo"          , typeName: "text"    }, 
            { name: "recorrido"          , typeName: "integer" },
            { name: "tipo_recorrido"     , typeName: "integer" , title:'tipo rec'}, 
            { name: "descripcion"        , typeName: "text"    }, 
            { name: "area"               , typeName: "integer" }, 
            { name: "cues_dm"            , typeName: "integer" , aggregate:'sum' }, 
            { name: "pers_dm"            , typeName: "integer" , aggregate:'sum' },
            { name: "cues_papel"         , typeName: "integer" , aggregate:'sum' }, 
            { name: "pers_papel"         , typeName: "integer" , aggregate:'sum' },
            { name: "total_cues"         , typeName: "integer" , aggregate:'sum'}, 
            { name: "total_pers"         , typeName: "integer" , aggregate:'sum'}, 
            { name: "comuna"             , typeName: "text"    },
            { name: "descripcion_barrio" , typeName: "text"    },
        ],
        primaryKey: ['operativo','recorrido','area'],
        firstDisplayOverLimit: 200,
        refrescable:true,
        sql:{
            isTable: false,
            from:`(
                SELECT 
                    operativo,
                    recorrido,
                    tipo_recorrido,
                    descripcion,
                    area,
                    cues_dm,
                    pers_dm,
                    cues_papel,
                    pers_papel,
                    cues_dm + cues_papel AS total_cues,
                    pers_dm + pers_papel AS total_pers,
                    comuna,
                    descripcion_barrio
                FROM (
                    SELECT
                        ar.operativo,
                        ar.recorrido,
                        r.tipo_recorrido,
                        descripcion,
                        ar.area, 
                        COUNT(*) FILTER (WHERE enc_autogenerado_dm IS NOT NULL AND COALESCE((json_encuesta->>'u8')::integer,0) > 0 ) AS cues_dm,
                        COALESCE(SUM(COALESCE((json_encuesta->>'u8')::integer,0)) FILTER (WHERE enc_autogenerado_dm IS NOT NULL AND json_encuesta IS NOT NULL),0) AS pers_dm,
                        COUNT(*) FILTER (WHERE enc_autogenerado_dm IS NULL AND enc_autogenerado_dm_capa IS NULL AND COALESCE((json_encuesta->>'u8')::integer,0) > 0 ) AS cues_papel,
                        COALESCE(SUM(COALESCE((json_encuesta->>'u8')::integer,0)) FILTER (WHERE enc_autogenerado_dm IS NULL AND enc_autogenerado_dm_capa IS NULL AND json_encuesta IS NOT NULL),0) AS pers_papel,
                        (SELECT array_agg(DISTINCT comuna ORDER BY comuna)::text 
                            FROM (SELECT comuna
                                    FROM recorridos_barrios rb
                                    LEFT JOIN barrios USING (comuna, barrio) 
                                    WHERE rb.recorrido=ar.recorrido
                                    UNION 
                                    SELECT comuna
                                    FROM lugares l
                                    WHERE l.recorrido=ar.recorrido
                            ) x
                        ) AS comuna,
                        (SELECT STRING_AGG(nombre,', ' ORDER BY barrio) 
                            FROM (
                                SELECT barrio,nombre
                                FROM recorridos_barrios rb LEFT JOIN barrios USING (comuna, barrio) 
                                WHERE ar.recorrido=rb.recorrido
                                UNION
                                SELECT barrio, nombre
                                FROM lugares l LEFT JOIN barrios USING (comuna,barrio) 
                                WHERE ar.recorrido=l.recorrido
                            ) y
                        ) AS descripcion_barrio
                    FROM 
                        areas ar 
                    JOIN 
                        recorridos r USING (recorrido) 
                    JOIN 
                        tipos_recorrido tr USING (tipo_recorrido)
                    LEFT JOIN 
                        tem t USING (area)
                    GROUP BY 
                        ar.operativo,
                        ar.recorrido,
                        r.tipo_recorrido,
                        descripcion,
                        ar.area
                    ORDER BY 
                        ar.operativo, ar.recorrido, ar.area
                ) AS detalle_por_area
            )`   
        }
    };
}