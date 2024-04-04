"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function coordinacion(context:TableContext):TableDefinition {
    var autorizado = context.user.rol === 'admin'||context.user.rol === 'coor_campo';
    return {
        name: 'coordinacion',
        elementName: 'coordinación',
        editable: autorizado,
        fields: [
            { name: "operativo"          , typeName: "text"    , editable:false, inTable:false}, 
            { name: "recorrido"          , typeName: "integer" },
            { name: "area"               , typeName: "integer" , editable:false, inTable:false}, 
            { name: "relevador"          , typeName: "text"    , editable:false, inTable:false},
            { name: "cant_cues"          , typeName: "integer" , aggregate:'sum'},
            { name: "cant_pers"          , typeName: "integer" , aggregate:'sum'},
            { name: "salida"             , typeName: "interval", aggregate:'count'},
            { name: "regreso"            , typeName: "interval", aggregate:'count'},
            { name: "generar"            , typeName: "bigint"  , editable:false, serverSide:true, clientSide:'generarRelevamiento', inTable: false},
            { name: "tipo_recorrido"     , typeName: "integer" , editable:false, inTable: false}, 
            { name: "comuna"             , typeName: "text"    , editable:false, inTable: false},
            { name: "descripcion_barrio" , typeName: "text"    , editable:false, inTable: false},
        ],
        primaryKey: ['recorrido'],
        foreignKeys:[
            {references:'recorridos'    , fields: ['recorrido'] },
        ],
        hiddenColumns:['operativo'],
        detailTables:[
            //{table:'areas_asignacion_general'   , fields:['operativo','area'], abr:'A'},
        ],
        sql:{
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
                generar:{
                    expr:`(
                        select count(*) from grupo_personas gp where u1 = coordinacion.recorrido
                    )`
                },
                area:{expr:`(
                    select area
                        from areas
                        where recorrido=recorridos.recorrido
                )`},
                operativo:{expr:`(
                    select operativo
                        from areas
                        where recorrido=recorridos.recorrido
                )`}
            }
        }
    };
}