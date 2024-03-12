"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function tipos_lugar(context:TableContext):TableDefinition {
    var admin = context.user.rol === 'admin'||context.puede.configurar.editar;
    return {
        name: 'tipos_lugar',
        elementName: 'tipo de lugar',
        editable: admin,
        fields: [
            { name: "tipo_lugar"  , typeName: "integer" },
            { name: "descripcion" , typeName: "text"    },
        ],
        primaryKey: ['tipo_lugar'],
        detailTables:[
            {table:'lugares', fields:['tipo_lugar'], abr:'L'}
        ]
    };
}
