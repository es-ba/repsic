"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function provisorio_recorridos(context:TableContext):TableDefinition {
    return {
        name: 'provisorio_recorridos',
        elementName: 'provisorio_recorridos',
        editable: false,
        fields: [
            { name: "operativo"          , typeName: "text"    }, 
            { name: "recorrido"          , typeName: "integer" },
            { name: "relevador"          , typeName: "text"    },
            { name: "cant_cues_dm"       , typeName: "integer" , aggregate:'sum'}, 
            { name: "cant_cues_papel"    , typeName: "integer" , aggregate:'sum'}, 
            { name: "cant_cues_total"    , typeName: "integer" , aggregate:'sum'}, 
            { name: "cant_per_dm"        , typeName: "integer" , aggregate:'sum'}, 
            { name: "cant_per_papel"     , typeName: "integer" , aggregate:'sum'}, 
            { name: "cant_per_total"     , typeName: "integer" , aggregate:'sum'}, 
            { name: "agregar_cues_papel" , typeName: "integer" },
            { name: "tipo_recorrido"     , typeName: "integer" , inTable: false}, 
            { name: "comuna"             , typeName: "text"    , inTable: false},
            { name: "descripcion_barrio" , typeName: "text"    , inTable: false},
        ],
        primaryKey: ['operativo','recorrido'],
        foreignKeys:[
            {references:'recorridos'    , fields: ['recorrido'] },
        ],
        detailTables:[
            //{table:'areas_asignacion_general'   , fields:['operativo','area'], abr:'A'},
        ],
        sql:{
            isTable: false,
            fields:{
                tipo_recorrido:{expr:"recorridos.tipo_recorrido"},                
                comuna:{
                    expr:`(
                            select array_agg(distinct comuna order by comuna)::text 
                                from (select comuna
                                        from recorridos_barrios 
                                             left join barrios using (barrio) 
                                        where recorrido=coordinacion.recorrido
                                      union 
                                      select comuna
                                        from lugares 
                                        where recorrido=coordinacion.recorrido
                                ) x
                    )`
                },
                descripcion_barrio:{
                    expr:`(
                        select string_agg(nombre,', ' order by barrio) 
                                from recorridos_barrios 
                                    left join barrios using (barrio) 
                                where recorrido=coordinacion.recorrido
                    )`
                },
                relevador:{
                    expr:`(
                        select string_agg(coalesce(nullif(concat_ws(' ', nombre, apellido),''), usuario), ', ' order by usuario) 
                                from usuarios 
                                where recorrido=coordinacion.recorrido
                    )`
                },
                cant_dm:{
                    expr:`(
                        select count(*) from tem where enc_autogenerado_dm is not null and area in (select area
                            from areas
                            where recorrido=recorridos.recorrido)
                    )`
                },
                cant_papel:{
                    expr:`(
                        select count(*) from tem where enc_autogenerado_dm is null and area in (select area
                            from areas
                            where recorrido=recorridos.recorrido)
                    )`
                },
                cant_total:{
                    expr:`(
                        select count(*) from tem where area in (select area
                            from areas
                            where recorrido=recorridos.recorrido)
                    )`
                },
                area:{expr:`(
                    select area
                        from areas
                        where recorrido=recorridos.recorrido
                )`}
            }
        }
    };
}