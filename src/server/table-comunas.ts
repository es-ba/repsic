"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function comunas(context:TableContext):TableDefinition {
    var admin = context.user.rol === 'admin'||context.puede.configurar.editar;
    return {
        name: 'comunas',
        elementName: 'comuna',
        editable: admin,
        fields: [
            { name: "comuna", typeName: "integer" },
            { name: "nombre", typeName: "text"    },
        ],
        primaryKey: ['comuna'],
        detailTables:[
            {table:'barrios', fields:['comuna'], abr:'B'}
        ]
    };
}
