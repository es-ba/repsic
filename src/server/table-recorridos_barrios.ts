"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function recorridos_barrios(context:TableContext):TableDefinition {
    var admin = context.user.rol === 'admin'||context.puede.configurar.editar;
    return {
        name: 'recorridos_barrios',
        elementName: 'recorrido - barrio',
        editable: admin,
        fields: [
            { name: "recorrido" , typeName: "integer" },
            { name: "comuna"    , typeName: "text" },
            { name: "barrio"    , typeName: "text" },
        ],
        primaryKey: ['recorrido','comuna','barrio'],
        foreignKeys: [   
            { references: 'barrios'      , fields: ['comuna','barrio']   , displayAllFields:true},    
            { references: 'recorridos'   , fields: ['recorrido'], displayFields:['tipo_recorrido','observaciones','particion'] },    
        ],
    };
}
