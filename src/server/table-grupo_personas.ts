"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function grupo_personas(context:TableContext):TableDefinition {
    let permitidoeditar= context.user.rol === 'admin'||context.puede.encuestas.ingresar;
    let def: TableDefinition = {
        name: 'grupo_personas',
        elementName: 'vivienda',
        tableName:'grupo_personas',
        editable: permitidoeditar /*|| context.puede.tablas_directas.editar*/, // TODO: FIX: En el dump-db rompe
        fields: [
            { name: "operativo"     , label:'operativo'             , typeName: "text"    , editable:false, visible:false      },
            { name: "id_caso"       , label:'id'                    , typeName: "text"    , editable:false       },
            { name: "id_caso_papel" , label:'id papel'              , typeName: "text"    , editable:false, inTable:false, clientSide:"parseIDPapel"       },
            { name: "u1"            , label:'recorrido'             , typeName: 'integer' },
            { name: "u2"            , label:'tipo'                  , typeName: 'integer' },
            { name: "u3"            , label:'comuna'                , typeName: 'text' },
            { name: "u4"            , label:'barrio'                , typeName: 'text'    },
            { name: "lugar_nombre"  , label:'lugar'                 , typeName: 'text'    },
            { name: "lugar_codigo"  , label:'cod lugar'             , typeName: 'integer' },
            { name: "u5"            , label:'calle'                 , typeName: 'text'    },
            { name: "u6"            , label:'n°'                    , typeName: 'integer' },
            { name: "u7"            , label:'intersección'          , typeName: 'text'    },
            { name: "u8"            , label:'cant.per'              , typeName: 'integer' },
            { name: "u21"           , label:'cod.relev'             , typeName: 'integer' },
            { name: "u22"           , label:'nombre y ape'          , typeName: 'text'    },
            { name: "u23"           , label:'teléfono'              , typeName: 'text'    },  //paradores
            { name: "cant11"        , label:'varon'                 , typeName: 'integer' },
            { name: "cant12"        , label:'mujer'                 , typeName: 'integer' },
            { name: "cant13"        , label:'no se observa'         , typeName: 'integer' },
            { name: "cant14"        , label:'total'                 , typeName: 'integer' },
            { name: "cant21"        , label:'varon'                 , typeName: 'integer' },
            { name: "cant22"        , label:'mujer'                 , typeName: 'integer' },
            { name: "cant23"        , label:'no se observa'         , typeName: 'integer' },
            { name: "cant24"        , label:'total'                 , typeName: 'integer' },
            { name: "cant31"        , label:'varon'                 , typeName: 'integer' },
            { name: "cant32"        , label:'mujer'                 , typeName: 'integer' },
            { name: "cant33"        , label:'no se observa'         , typeName: 'integer' },
            { name: "cant34"        , label:'total'                 , typeName: 'integer' },
            { name: "cant41"        , label:'varon'                 , typeName: 'integer' },
            { name: "cant42"        , label:'mujer'                 , typeName: 'integer' },
            { name: "cant43"        , label:'no se observa'         , typeName: 'integer' },
            { name: "cant44"        , label:'total'                 , typeName: 'integer' },
            { name: "cant51"        , label:'varon'                 , typeName: 'integer' },
            { name: "cant52"        , label:'mujer'                 , typeName: 'integer' },
            { name: "cant53"        , label:'no se observa'         , typeName: 'integer' },
            { name: "cant54"        , label:'total'                 , typeName: 'integer' },
            { name: "cant61"        , label:'varon'                 , typeName: 'integer' },
            { name: "cant62"        , label:'mujer'                 , typeName: 'integer' },
            { name: "cant63"        , label:'no se observa'         , typeName: 'integer' },
            { name: "cant64"        , label:'total'                 , typeName: 'integer' },
            { name: "o2"            , label:'pers asen'             , typeName: 'integer' },
            { name: "o2_esp"        , label:'otro'                  , typeName: 'text'    },
            { name: "o3_1"          , label:'mueb. ens.'            , typeName: 'integer' },
            { name: "o3_2"          , label:'mascotas'              , typeName: 'integer' },
            { name: "o3_3"          , label:'mat. trab.'            , typeName: 'integer' },
            { name: "o3_4"          , label:'const. prec.'          , typeName: 'integer' },
            { name: "o3_5"          , label:'otros'                 , typeName: 'integer' },
            { name: "o3_esp"        , label:'esp'                   , typeName: 'text'    },
            { name: "o4"            , label:'entrev. real.'         , typeName: 'integer' },
            { name: "o5"            , label:'razon no real'         , typeName: 'integer' },
            { name: "o5_esp"        , label:'otra'                  , typeName: 'text'    },
            { name: "totalpers"     , label:'total personas'        , typeName: 'integer' },
            { name: "obs"           , label:'observaciones'         , typeName: 'text'    },
            { name: "estado"        , label:'estado'                , typeName: 'text'    , defaultValue: 'en_ingreso'},
            { name: "consistido"    , label:'consistido'            , typeName: 'timestamp'},
            { name: "modificado"    , label:'modificado'            , typeName: 'timestamp'},
        ],
        primaryKey: ['operativo', 'id_caso'],
        foreignKeys:[
            {references:'recorridos'    , fields: [{source:'u1',target:'recorrido'}], displayFields:[]},
        ],
        detailTables:[
            {table:'personas', fields:['operativo', 'id_caso'], abr:'P', title:'personas'},
        ],
        sql:{
            fields:{},
            "isReferable": true
        }
    };
    return def;
}