import { Respuestas, RespuestasRaiz, TEM, Carga, Valor, IdUnidadAnalisis, ObjetoNumeradoOArray } from "dmencu/dist/unlogged/unlogged/tipos";

// campos propios de repsic que dmencu no declara en sus tipos (IdVariable, TEM, Carga)

type VariablesRepsic = 'u8' | 'anulado' | 'sc1' | 'sc2' | 'sc3' | 'sc4' | 'sc16' | 'sc_grupo';

export type RespuestasRepsic = Respuestas & { [variable in VariablesRepsic]?: Valor };

export type RespuestasRaizRepsic = RespuestasRaiz & { [variable in VariablesRepsic]?: Valor };

export type RespuestaLasUARepsic = {
    [ua in IdUnidadAnalisis]: ObjetoNumeradoOArray<RespuestasRepsic>;
};

export type TEMRepsic = TEM & {
    recorrido?: number
    tipo_recorrido?: string
    comuna_agrupada?: string
    barrios_agrupados?: string
};

export type CargaRepsic = Carga & {
    recorrido?: number
    tipo_recorrido?: string
    comuna_agrupada?: string
    barrios_agrupados?: string
};
