"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

import {provisorio_recepcion} from "./table-provisorio_recepcion"

export function coordinacion(context:TableContext):TableDefinition {
    const provisorioRecepcionTableDef = provisorio_recepcion(context);
    var autorizado = context.user.rol === 'admin'||context.user.rol === 'coor_campo';
    return {
        name: 'coordinacion',
        elementName: 'coordinacion',
        editable: autorizado,
        allow:{
            delete:false,
            insert: false,
            import: false
        },
        fields: [
            { name: "operativo"             , typeName: "text"    , editable:false}, 
            { name: "recorrido"             , typeName: "integer" , editable:false},
            { name: "area"                  , typeName: "integer" , editable:false}, 
            { name: "relevador"             , typeName: "text"    , editable:false, inTable:false},
            { name: "cant_papel_provisorio" , typeName: "integer" , aggregate:'sum', editable:false, inTable: false}, 
            { name: "cant_cues_definitivo"  , typeName: "integer" , aggregate:'sum', editable:autorizado},
            { name: "generar"               , typeName: "bigint"  , editable:false, clientSide:'generarRelevamiento', inTable: false},
            { name: "tipo_recorrido"        , typeName: "integer" , editable:false, inTable: false}, 
            { name: "comuna"                , typeName: "text"    , editable:false, inTable: false},
            { name: "descripcion_barrio"    , typeName: "text"    , editable:false, inTable: false},
        ],
        primaryKey: ['operativo','recorrido','area'],
        foreignKeys:[
            {references:'areas'       , fields: ['operativo', 'recorrido','area']},
            //{references:'recorridos'  , fields: ['recorrido']},
        ],
        sql:{
            insertIfNotUpdate: true,
            isTable: true,
            "isReferable": true,
            from: `
            (select 
                operativo,
                recorrido,
                area,
                relevador,
                cues_papel as cant_papel_provisorio,
                (select cant_cues_definitivo from coordinacion where operativo = aux.operativo and recorrido = aux.recorrido and area = aux.area) as cant_cues_definitivo,
                tipo_recorrido,
                comuna,
                descripcion_barrio
            from
                (${provisorioRecepcionTableDef.sql!.from}) aux
            )`
        }
    };
}