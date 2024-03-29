"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function personas(context:TableContext):TableDefinition {
    let permitidoeditar= context.user.rol === 'admin'||context.puede.encuestas.ingresar;
    let def:TableDefinition = {
        name: 'personas',
        elementName: 'persona',
        tableName: 'personas',
        editable: permitidoeditar /*|| context.puede.tablas_directas.editar*/, // TODO: FIX: En el dump-db rompe
        fields: [
            { name: "operativo"     , label:'operativo'                  , typeName: "text"    },
            { name: "id_caso"       , label:'id'                         , typeName: "text"    },
            { name: "p0"            , label:'nro persona'                , typeName: 'integer' },
            { name: "sc1"           , label:'nombre'                     , typeName: 'text'    },
            { name: "sc_grupo"      , label:'nro grupo'                  , typeName: 'integer' },
            { name: "sc2"           , label:'parentesco'                 , typeName: 'integer' },
            { name: "sc3"           , label:'sexo'                       , typeName: 'integer' },
            { name: "sc4"           , label:'edad'                       , typeName: 'integer' },
            /*
            { name: "sc5"           , label:'lugar nac'                  , typeName: 'integer' },
            { name: "sc6"           , label:'asiste est educ'            , typeName: 'integer' },
            { name: "sc7"           , label:'nivel'                      , typeName: 'integer' },
            { name: "sc8"           , label:'nivel completo'             , typeName: 'integer' },
            { name: "sc21"          , label:'desde cuando'               , typeName: 'integer' },
            { name: "sc22"          , label:'cuatro o más noches'        , typeName: 'integer' },
            { name: "sc23"          , label:'quedarse en ciudad'         , typeName: 'integer' },
            { name: "sc24"          , label:'lugar anterior'             , typeName: 'integer' },
            { name: "sc9"           , label:'durmio calle'               , typeName: 'integer' },
            { name: "sc9a"          , label:'pasó la noche'              , typeName: 'integer' },
            { name: "sc25"          , label:'durmio parador'             , typeName: 'integer' },
            { name: "sc25a"         , label:'pasó la noche'              , typeName: 'integer' },
            { name: "sc10"          , label:'tiempo sit calle'           , typeName: 'integer' },
            { name: "sc11"          , label:'tiene documento'            , typeName: 'integer' },
            { name: "sc12"          , label:'tuvo dni argentino'         , typeName: 'integer' },
            { name: "sc13"          , label:'documento'                  , typeName: 'integer' },
            { name: "sc14"          , label:'cert disca vig'             , typeName: 'integer' },
            { name: "sc15"          , label:'tuvo cert disca'            , typeName: 'integer' },
            { name: "sc16"          , label:'genero'                     , typeName: 'integer' },
            { name: "sc17_1"        , label:'CESAC'                      , typeName: 'integer' },
            { name: "sc17_2"        , label:'consultorio guardia'        , typeName: 'integer' },
            { name: "sc17_3"        , label:'obra social'                , typeName: 'integer' },
            { name: "sc17_4"        , label:'otro'                       , typeName: 'integer' },
            { name: "sc18"          , label:'act sem pasada'             , typeName: 'integer' },
            { name: "sc19_1"        , label:'cartoneo'                   , typeName: 'integer' },
            { name: "sc19_2"        , label:'venta amb'                  , typeName: 'integer' },
            { name: "sc19_3"        , label:'changas'                    , typeName: 'integer' },
            { name: "sc19_4"        , label:'pide dinero'                , typeName: 'integer' },
            { name: "sc19_5"        , label:'relación dep'               , typeName: 'integer' },
            { name: "sc19_6"        , label:'otro'                       , typeName: 'integer' },
            { name: "sc20_1"        , label:'jubilación pensión'         , typeName: 'integer' },
            { name: "sc20_2"        , label:'prog CP'                    , typeName: 'integer' },
            { name: "sc20_3"        , label:'AUH'                        , typeName: 'integer' },
            { name: "sc20_4"        , label:'sub o plan'                 , typeName: 'integer' },
            { name: "sc20_5"        , label:'otro'                       , typeName: 'integer' },
            { name: "sc20_6"        , label:'No recibió ningún ingreso'  , typeName: 'integer' },
            */
        ],
        primaryKey: ['operativo','id_caso', 'p0'],
        foreignKeys:[
            {references:'grupo_personas'    , fields: ['operativo','id_caso'], displayFields:[]},
        ],
        sql:{}
    };
    return def;
}