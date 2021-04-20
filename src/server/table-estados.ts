"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function estados(context:TableContext):TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'estados',
        elementName: 'estado',
        editable: admin,
        fields: [
            { name: "estado"      , typeName: "text" },
            { name: "nombre"      , typeName: "text"    ,isName:true},
        ],
        primaryKey: ['estado'],
        detailTables:[
            {table:'estados_roles',fields:['estado'], abr:'R'}
        ],
    };
}
