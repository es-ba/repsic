"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function lugares(context:TableContext):TableDefinition {
    var admin = context.user.rol === 'admin'||context.puede.configurar.editar;
    return {
        name: 'lugares',
        elementName: 'lugar',
        editable: admin,
        fields: [
            { name: "lugar"             , typeName: "integer" },
            { name: "calle"             , typeName: "text"    },
            { name: "nro_puerta"        , typeName: "integer" },
            { name: "descripcion"       , typeName: "text"    , nullable:false},
            { name: "tipo_lugar"        , typeName: "integer" , nullable:false}, //parador, hospital o terminal
            { name: "tipo_pob"          , typeName: "text"    }, //hombres o mujeres
            { name: "comuna"            , typeName: "integer" , nullable:false},
            { name: "barrio"            , typeName: "integer" },
            { name: "recorrido"         , typeName: "integer" , nullable:false},
            { name: "orden_recorrido"   , typeName: "integer" },
            { name: "latitud"           , typeName: "decimal" },
            { name: "longitud"          , typeName: "decimal" },
        ],
        primaryKey: ['lugar'],
        foreignKeys: [
            { references: 'recorridos' , fields: ['recorrido'] },
            { references: 'barrios'    , fields: ['barrio']    , displayAllFields:true},
            { references: 'comunas'    , fields: ['comuna']    , displayAllFields:true},
            { references: 'tipos_lugar', fields: ['tipo_lugar'], displayAllFields:true},
        ],
    };
}
