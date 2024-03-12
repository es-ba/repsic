"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function tipos_recorrido(context: TableContext):TableDefinition {
    var admin = context.user.rol === 'admin'||context.puede.configurar.editar;
    return {
        name: 'tipos_recorrido',
        elementName: 'tipo de recorrido',
        editable: admin,
        fields: [
            { name: "tipo_recorrido" , typeName: "integer" },
            { name: "descripcion"    , typeName: "text"    , isName:true   },
            { name: "abr"            , typeName: "text"    , nullable:false},
            { name: "via_p"          , typeName: "boolean" , nullable:false},
            { name: "con_lugares"    , typeName: "boolean" , nullable:false},
        ],
        primaryKey: ['tipo_recorrido'],
        detailTables:[
            {table:'recorridos', fields:['tipo_recorrido'], abr:'R'}
        ],
        constraints:[
            {
                constraintType:'unique', fields:['tipo_recorrido','via_p']
            }
        ]
    };
}
