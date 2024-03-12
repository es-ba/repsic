"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function barrios(context:TableContext):TableDefinition {
    var admin = context.user.rol === 'admin'||context.puede.configurar.editar;
    return {
        name: 'barrios',
        elementName: 'barrio',
        editable: admin,
        fields: [
            { name: "barrio"     , typeName: "integer" },
            { name: "nombre"     , typeName: "text"    ,isName:true},
            { name: "comuna"     , typeName: "integer" },
        ],
        primaryKey: ['barrio'],
        detailTables:[
            {table:'recorridos_barrios',fields:['barrio'], abr:'R'}
        ],
        foreignKeys: [
            { references: 'comunas', fields: ['comuna'], displayAllFields:true},
        ],
    };
}
