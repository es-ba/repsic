import { IdFormulario, RespuestasRaiz, ForPk, IdVariable, Formulario, Libre, IdUnidadAnalisis, Respuestas,
    Valor,
    Estructura,
    PlainForPk,
    IdFin,
    CasoState,
    CampoPkRaiz
} from "dmencu/dist/unlogged/unlogged/tipos";
import {getDatosByPass, persistirDatosByPass, setCalcularVariablesEspecificasOperativo, respuestasForPk, 
    registrarElemento, dispatchByPass, accion_registrar_respuesta, accion_abrir_formulario,
    getEstructura
} from "dmencu/dist/unlogged/unlogged/bypass-formulario";
import {setLibreDespliegue} from "dmencu/dist/unlogged/unlogged/render-formulario";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"; 
import { dispatchers } from "dmencu/dist/unlogged/unlogged/redux-formulario";
import { FormStructureState } from "row-validator";

setCalcularVariablesEspecificasOperativo((respuestasRaiz:RespuestasRaiz, forPk:ForPk)=>{
    var estructura = getEstructura();
    delete(respuestasRaiz.vdominio);
    if(forPk.formulario == 'F:F2' as IdFormulario){
        let {respuestas} = respuestasForPk(forPk);
        respuestas['p0' as IdVariable] = forPk.persona;
    }
    let datosByPass = getDatosByPass();
    respuestasRaiz['u1' as IdVariable]=getDatosByPass().informacionHdr[forPk[estructura.mainTDPK]].tem.recorrido;
    respuestasRaiz['u2' as IdVariable]=getDatosByPass().informacionHdr[forPk[estructura.mainTDPK]].tem.tipo_recorrido;
    respuestasRaiz['u3' as IdVariable]=getDatosByPass().informacionHdr[forPk[estructura.mainTDPK]].tem.comuna_agrupada;
    respuestasRaiz['u4' as IdVariable]=getDatosByPass().informacionHdr[forPk[estructura.mainTDPK]].tem.barrios_agrupados;
})