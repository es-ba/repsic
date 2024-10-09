"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function provisorio_recepcion(context:TableContext):TableDefinition {
    var autorizado = context.user.rol === 'admin'||context.user.rol === 'coor_campo' ||context.user.rol === 'recepcionista';
    return {
        name: 'provisorio_recepcion',
        elementName: 'provisorio_recepcion',
        allow:{
            insert:false,
            delete:false,
            update:autorizado,
            import:false
        },
        //editable: autorizado,
        fields: [
            { name: "operativo"          , typeName: "text"    , editable:false}, 
            { name: "recorrido"          , typeName: "integer" , editable:false, inTable: false},
            { name: "area"               , typeName: "integer" , editable:false}, 
            { name: "relevador"          , typeName: "text"    , editable:false, inTable:false},
            { name: "cues_dm"            , typeName: "integer" , aggregate:'sum', editable:false, defaultDbValue:'0'}, 
            { name: "pers_dm"            , typeName: "integer" , aggregate:'sum', editable:false, defaultDbValue:'0'},
            { name: "cues_papel"         , typeName: "integer" , aggregate:'sum', editable:autorizado, defaultDbValue:'0'}, 
            { name: "pers_papel"         , typeName: "integer" , aggregate:'sum', editable:autorizado, defaultDbValue:'0'},
            { name: "cues_total"         , typeName: "integer" , aggregate:'sum', editable:false, inTable: false}, 
            { name: "pers_total"         , typeName: "integer" , aggregate:'sum', editable:false, inTable: false}, 
            { name: "verificado"         , typeName: "boolean" , editable:autorizado},
            { name: "salida"             , typeName: "interval", editable:autorizado},
            { name: "regreso"            , typeName: "interval", editable:autorizado},
            { name: "tipo_recorrido"     , typeName: "integer" , editable:false, inTable: false}, 
            { name: "comuna"             , typeName: "text"    , editable:false, inTable: false},
            { name: "descripcion_barrio" , typeName: "text"    , editable:false, inTable: false},
        ],
        primaryKey: ['operativo','area'],
        foreignKeys:[
            {references:'areas'    , fields: ['operativo','area']},
        ],
        firstDisplayOverLimit: 200,
        refrescable:true,
        sql:{
            "isReferable": true,
            isTable: true,
            from: `(
                SELECT pr.*, a.recorrido, tr.tipo_recorrido, (
                    select array_agg(distinct comuna order by comuna)::text 
                        from (select comuna
                                from recorridos_barrios 
                                        left join barrios using (barrio) 
                                where recorrido=a.recorrido
                                union 
                                select comuna
                                from lugares 
                                where recorrido=a.recorrido
                        ) x
                    ) as comuna, (
                    select string_agg(nombre,', ' order by barrio) 
                        from recorridos_barrios 
                            left join barrios using (barrio) 
                        where recorrido=a.recorrido
                    ) as descripcion_barrio,
                    (select string_agg(coalesce(nullif(concat_ws(' ', nombre, apellido),''), usuario), ', ' order by usuario) 
                        from tareas_areas ta join usuarios u on (ta.asignado = u.idper and ta.area = a.area and ta.tarea = 'encu')
                    ) as relevador,
                    coalesce(cues_dm,0) + coalesce(cues_papel,0) as cues_total,
                    coalesce(pers_dm,0) + coalesce(pers_papel,0) as pers_total
                    FROM provisorio_recepcion pr 
                        inner join areas a using (operativo, area) 
                        inner join recorridos using (recorrido) 
                        inner join tipos_recorrido tr using (tipo_recorrido)
                        --left join (
                        --    select 
                        --        area, 
                        --        count(*) filter (where enc_autogenerado_dm is not null) as cues_dm,
                        --        sum(coalesce((json_encuesta->>'u8')::integer,0)) filter (where enc_autogenerado_dm is not null and json_encuesta is not null) as pers_dm
                        --        from tem t 
                        --        group by area
                        --) using (area)
                            
            )`
            /*fields:{
                recorrido:{expr:`(
                    select recorrido
                        from areas
                        where area=areas.area
                )`},
                tipo_recorrido:{expr:"recorridos.tipo_recorrido"},                
                comuna:{
                    expr:`(
                            select array_agg(distinct comuna order by comuna)::text 
                                from (select comuna
                                        from recorridos_barrios 
                                             left join barrios using (barrio) 
                                        where recorrido=provisorio_recepcion.recorrido
                                      union 
                                      select comuna
                                        from lugares 
                                        where recorrido=provisorio_recepcion.recorrido
                                ) x
                    )`
                },
                descripcion_barrio:{
                    expr:`(
                        select string_agg(nombre,', ' order by barrio) 
                                from recorridos_barrios 
                                    left join barrios using (barrio) 
                                where recorrido=provisorio_recepcion.recorrido
                    )`
                },
                relevador:{
                    expr:`(
                        select string_agg(coalesce(nullif(concat_ws(' ', nombre, apellido),''), usuario), ', ' order by usuario) 
                                from usuarios 
                                where recorrido=provisorio_recepcion.recorrido
                    )`
                },
                cues_total:{
                    expr:`(
                        select count(*) from tem where area in (select area
                            from areas
                            where recorrido=recorridos.recorrido)
                    )`
                }
            }*/
        }
    };
}