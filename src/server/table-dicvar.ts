"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function dicvar(context:TableContext):TableDefinition {
    var permitidoeditar = context.user.rol === 'admin'/*||context.puede.diccionarios.editar*/;
    return {
        name: 'dicvar',
        elementName: 'dicvar',
        editable: permitidoeditar,
        fields: [
            { name: "diccionario"    , typeName: "text"     , nullable:false  },
            { name: "variable"       , typeName: "text"     , nullable:false  }
        ], 
        primaryKey: ['diccionario', 'variable'],
        foreignKeys:[
            {references:'diccionario' , fields: [{source:'diccionario',target:'diccionario'}],displayFields:[]},
        ]
    };
}