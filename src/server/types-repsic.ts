/*
import * as backendPlus from "backend-plus";
import { TableDefinition } from "backend-plus";
import { AppOperativos, AppOperativosType } from "./app-instrumentacion";
*/

export * from "meta-enc";
export * from "procesamiento";
// dmencu extiende estos tipos (puede, tareasFields); se usan los suyos para que las tablas de repsic los vean
export type { TableDefinition, TableContext, Puede } from "dmencu";
