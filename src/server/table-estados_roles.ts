"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function estados_roles(context:TableContext):TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'estados_roles',
        elementName: 'estado/rol',
        editable: admin,
        fields: [
            { name: "estado"               , typeName: "text"    },
            { name: "rol"                  , typeName: "text"    },
            { name: "puede_ingresar"       , typeName: "boolean" },
            { name: "puede_sacar_estado"   , typeName: "boolean" },
            { name: "puede_poner_estado"   , typeName: "boolean" },
        ],
        primaryKey: ['estado','rol'],
        foreignKeys:[
            {references:'estados'  , fields:['estado'] , onDelete: 'CASCADE'},
            {references:'roles'    , fields:['rol']    , onDelete: 'CASCADE'},
        ],
    };
}
