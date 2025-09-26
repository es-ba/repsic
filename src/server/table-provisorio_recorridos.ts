"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

import {provisorio_recepcion} from "./table-provisorio_recepcion"

export function provisorio_recorridos(context:TableContext):TableDefinition {
    const provisorioRecepcionTableDef = provisorio_recepcion(context);
    return {
        name: 'provisorio_recorridos',
        elementName: 'provisorio_recorridos',
        editable: false,
        fields: [
            { name: "operativo"          , typeName: "text"    }, 
            { name: "recorrido"          , typeName: "integer" },
            { name: "cues_dm"            , typeName: "integer" , aggregate:'sum'}, 
            { name: "pers_dm"            , typeName: "integer" , aggregate:'sum'},
            { name: "cues_papel"         , typeName: "integer" , aggregate:'sum'}, 
            { name: "pers_papel"         , typeName: "integer" , aggregate:'sum'},
            { name: "cues_total"         , typeName: "integer" , aggregate:'sum'}, 
            { name: "pers_total"         , typeName: "integer" , aggregate:'sum'}, 
            { name: "verificado"         , typeName: "boolean" },
            { name: "tipo_recorrido"     , typeName: "integer" , title:'tipo rec'}, 
            { name: "descripcion"        , typeName: "text"    }, 
            { name: "comuna"             , typeName: "text"    },
            { name: "descripcion_barrio" , typeName: "text"    },
        ],
        primaryKey: ['operativo','recorrido'],
        foreignKeys:[
            {references:'recorridos'    , fields: ['recorrido'] },
        ],
        firstDisplayOverLimit: 200,
        refrescable:true,
        sql:{
            isTable: false,
            from: `
            (select 
                operativo,
                recorrido,
                sum(cues_dm) as cues_dm,
                sum(pers_dm) as pers_dm,
                sum(cues_papel) as cues_papel,
                sum(pers_papel) as pers_papel,
                sum(cues_total) as cues_total,
                sum(pers_total) as pers_total,
                bool_and(case verificado when verificado then true else false end) as verificado,
                tipo_recorrido,
                descripcion,
                comuna,
                descripcion_barrio
            from
                (${provisorioRecepcionTableDef.sql!.from}) aux
            group by operativo,
                recorrido,
                tipo_recorrido,
                descripcion,
                comuna,
                descripcion_barrio
            )`
        }
    };
}