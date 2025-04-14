"use strict";

import {TableDefinition, TableContext} from "./types-repsic";
import {coalesce} from "best-globals";
import { tem } from "../../node_modules/dmencu/dist/server/server/table-tem";

export function incompletas_dm_tem(context: TableContext):TableDefinition {
    var tableDef = tem(context, {});
    tableDef = coalesce(tableDef, {
        name: 'incompletas_dm_tem',
        elementName: 'incompleta',
        editable: false,
        detailTables:[],
    });
    tableDef.fields.splice(3,0,
        {name:'borrar', typeName:'text', editable:false, clientSide:'borrarEncuesta'},
    )
    tableDef.sql!.isTable = false;
    tableDef.sql!.where = `"tem".enc_autogenerado_dm is not null and coalesce(("tem".json_encuesta->>'u8')::integer,0) = 0`;
    return tableDef
}
