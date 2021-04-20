"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function personas(context:TableContext):TableDefinition {
    let permitidoeditar= context.user.rol === 'admin'||context.puede.encuestas.ingresar;
    let def = {
        name: 'personas',
        elementName: 'persona',
        tableName: 'personas',
        editable: permitidoeditar /*|| context.puede.tablas_directas.editar*/, // TODO: FIX: En el dump-db rompe
        fields: [
            { name: "operativo"     , label:'operativo'       , typeName: "text"    },
            { name: "id_caso"       , label:'id'              , typeName: "text"    },
            { name: "p0"            , label:'N orden'         , typeName: 'integer' },
            { name: "p1"            , label:'rel ref'         , typeName: 'integer' },
            { name: "p2"            , label:'sexo'            , typeName: 'integer' },
            { name: "p3"            , label:'edad'            , typeName: 'integer' },
            { name: "p4"            , label:'lugar nac'       , typeName: 'integer' },
            { name: "p5"            , label:'asiste est educ' , typeName: 'integer' },
            { name: "p6"            , label:'nivel'           , typeName: 'integer' },
            { name: "p7"            , label:'nivel completo'  , typeName: 'integer' },
            { name: "p8"            , label:'lugar estab'     , typeName: 'integer' },
            { name: "p9"            , label:'documentacion'   , typeName: 'integer' },
            { name: "p9_esp"        , label:'otra'            , typeName: 'text'    },
        ],
        primaryKey: ['operativo','id_caso', 'p0'],
        foreignKeys:[
            {references:'grupo_personas'    , fields: ['operativo','id_caso'], displayFields:[]},
        ],
        sql:{}
    };
    return def;
}