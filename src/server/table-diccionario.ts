"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function diccionario(context:TableContext):TableDefinition {
    var permitidoeditar = context.user.rol === 'admin' /*||context.puede.diccionarios.editar*/;
    return {
        name: 'diccionario',
        elementName: 'diccionario',
        editable: permitidoeditar,
        fields: [
            { name: "diccionario", typeName: "text"    , nullable:false  },
            { name: "completo"   , typeName: "boolean"                   },
        ],
        primaryKey: ['diccionario'],
        detailTables:[
            {table:'dicvar', fields:[{source:'diccionario', target:'diccionario'}], abr:'V', label:'Dicc. Variables' },
            {table:'dictra', fields:[{source:'diccionario', target:'diccionario'}], abr:'T', label:'Dicc. Traducción'}
        ]
    };
}