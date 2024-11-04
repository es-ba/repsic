import { IdFormulario, RespuestasRaiz, ForPk, IdVariable, Formulario, Libre, IdUnidadAnalisis, Respuestas,
    Valor,
    Estructura,
    PlainForPk,
    IdFin,
    CasoState,
    CampoPkRaiz,
    Carga,
    IdCarga,
    InformacionHdr,
    RespuestaLasUA,
    ForPkRaiz,
    IdEnc
} from "dmencu/dist/unlogged/unlogged/tipos";
import {getDatosByPass, persistirDatosByPass, setCalcularVariablesEspecificasOperativo, respuestasForPk, 
    registrarElemento, dispatchByPass, accion_registrar_respuesta, accion_abrir_formulario,
    getEstructura,
    crearEncuesta,
    getFeedbackRowValidator,
    calcularResumenVivienda,
    intentarBackup,
    volcadoInicialElementosRegistrados
} from "dmencu/dist/unlogged/unlogged/bypass-formulario";
import {setDesplegarCarga, setDesplegarLineaResumenUAPrincipal, resumidores, DesplegarTem, DesplegarCitaPactada, DesplegarCitaPactadaYSeleccionadoAnteriorTem, DesplegarLineaResumenUAPrincipal, Button} from "dmencu/dist/unlogged/unlogged/render-formulario";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux"; 
import { dispatchers, getCacheVersion, gotoSincronizar } from "dmencu/dist/unlogged/unlogged/redux-formulario";
import { FormStructureState } from "row-validator";
import likeAr = require("like-ar");
import React = require("react");
import {
    AppBar,
    IconButton,
    Chip,
    Paper, Table, TableBody, TableCell, TableHead, TableRow,
    Toolbar,
    Typography
} from "@mui/material";
import { ICON } from "dmencu/dist/unlogged/unlogged/render-general";

setDesplegarCarga((props:{
    carga:Carga, 
    idCarga:IdCarga, 
    posicion:number,
    informacionHdr:InformacionHdr, 
    respuestas: RespuestaLasUA,
    feedbackRowValidator:{
        [formulario in PlainForPk]:FormStructureState<IdVariable, Valor, IdFin> 
    }
})=>{
    const [newSurvey, setNewSurvey] = useState(0);
    const {carga, idCarga, informacionHdr, respuestas} = props;
    var estructura = getEstructura();
    let cantLineasResumen = likeAr(informacionHdr).filter((informacion)=>informacion.tem.carga==idCarga).array().length;
    const dispatch = useDispatch();
    const cantPerArea = likeAr(informacionHdr).filter((informacion)=>informacion.tem.carga==idCarga).map((_informacion, numVivienda)=>
        respuestas[estructura.uaPpal][numVivienda].u8 || 0
    ).array().reduce((accumulator, currentValue) => accumulator + currentValue,0);
    const cantCuesArea = likeAr(informacionHdr).filter((informacion, numVivienda)=>informacion.tem.carga==idCarga && respuestas[estructura.uaPpal][numVivienda].u8).array().length
    return <Paper className="carga" style={{marginBottom: '10px', padding: '10px'}}>
        <div className="informacion-carga">
            <div className="carga">Área: {idCarga} | cuestionarios: {cantCuesArea} | personas: {cantPerArea}
                
            </div>
            <div className="observaciones">{carga.observaciones}</div>
        </div>
        <div className="informacion-carga">
            <div className="fecha">{carga.fecha}</div>
            {/*
            <ButtonGroup>
            {listaEstadosCarga.map(estado_carga=>
                <Button key={estado_carga} variant={estado_carga==carga.estado_carga?"contained":"outlined"} onClick={
                    ()=>dispatch(dispatchers.ESTADO_CARGA({idCarga, estado_carga}))
                }>{estado_carga}</Button>
            )}
            </ButtonGroup>
            */}
        </div>
        {carga.estado_carga==null && !props.posicion || carga.estado_carga=='relevamiento'?
        <Table className="tabla-carga-hoja-de-ruta">
            <colgroup>
                <col style={{width:"50%"}}/>
                <col style={{width:"25%"}}/>    
                <col style={{width:"25%"}}/>    
            </colgroup>
            {cantLineasResumen?
                <TableHead style={{fontSize: "1.2rem"}}>
                    <TableRow className="tr-carga">
                        <TableCell>personas</TableCell>
                        <TableCell>tarea</TableCell>
                        <TableCell>enc</TableCell>
                    </TableRow>
                </TableHead>
            :null}
            <TableBody>
                <>
                {likeAr(informacionHdr).filter((informacion)=>informacion.tem.carga==idCarga).map((informacion, numVivienda)=>
                    <DesplegarLineaResumenUAPrincipal 
                        key={numVivienda} 
                        numVivienda={numVivienda}
                        tarea={informacion.tarea.tarea}
                        formPrincipal={informacion.tarea.main_form}
                        respuestas={respuestas[estructura.uaPpal][numVivienda] as RespuestasRaiz}
                    />
                ).array()}
                {estructura.permiteGenerarMuestra?
                    <TableRow className="tr-carga-nuevo">
                        <TableCell colSpan={3}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={()=>
                                    crearEncuesta(idCarga,(forPkRaiz:ForPkRaiz)=>{
                                        dispatch(dispatchers.CAMBIAR_FORMULARIO({forPk:forPkRaiz, apilarVuelta:false}));
                                    })
                                }
                            >
                                <ICON.Add/>
                            </Button>
                        </TableCell>
                    </TableRow>
                :null}
                </>
            </TableBody>
        </Table>:
        <Table>
            <TableHead style={{fontSize: "1.2rem"}}>
                <TableRow className="tr-carga">
                    {resumidores.map((resumidor: typeof resumidores[0], i:number)=>
                        <TableCell key={i}>
                            {resumidor.nombre}
                        </TableCell>
                    )}
                </TableRow>
            </TableHead>
        </Table>
        }
    </Paper>
});

setDesplegarLineaResumenUAPrincipal((props:{
    numVivienda:IdEnc,
    formPrincipal:IdFormulario,
    tarea: string,
    respuestas:RespuestasRaiz,
})=>{
    const {numVivienda, respuestas, formPrincipal, tarea} = props;
    const id='viv-'+numVivienda;
    const estructura = getEstructura();
    const forPk:ForPk={formulario:formPrincipal, [estructura.pkAgregadaUaPpal]:Number(numVivienda) as IdEnc} as ForPk; //no quitar el casteo porque viene como texto y necesito que sea número
    var tem = getDatosByPass().informacionHdr[numVivienda].tem;
    const dispatch = useDispatch();
    useEffect(()=>{
        volcadoInicialElementosRegistrados(forPk);
        intentarBackup(forPk)
    })
    registrarElemento({id, direct:true,
        fun:(
            r:Respuestas, 
            _feedbackForm: FormStructureState<IdVariable, Valor, IdFin>, 
            elemento:HTMLDivElement, 
            feedbackAll:{[formulario in PlainForPk]:FormStructureState<IdVariable, Valor, IdFin>}, 
            _estructura:Estructura
        )=>{
            //pregunto si es la misma vivienda porque la funcion se dispara 
            //con todas las combinaciones de respuestas para cada forPk
            //@ts-ignore vivienda existe
            if(r[estructura.pkAgregadaUaPpal] == forPk[estructura.pkAgregadaUaPpal]){
                elemento.setAttribute('resumen-estado',calcularResumenVivienda(forPk, feedbackAll, r).resumenEstado);
            }
        }
            
    })
    return <TableRow key={numVivienda}>
        <TableCell>
            {respuestas.u8?
                null
            :
                <Chip label="informar cantidad de personas" color="secondary" />    
            }
        </TableCell>
        <TableCell>
            {tarea}
        </TableCell>
        <TableCell>
            <Button id={id} onClick={()=> 
                dispatch(dispatchers.CAMBIAR_FORMULARIO({forPk, apilarVuelta:false}))
            }>
                {numVivienda.toString()}
            </Button>
        </TableCell>
    </TableRow>
});

setCalcularVariablesEspecificasOperativo((respuestasRaiz:RespuestasRaiz, forPk:ForPk)=>{
    var estructura = getEstructura();
    delete(respuestasRaiz.vdominio);
    if(forPk.formulario == 'F:F2' as IdFormulario){
        let {respuestas} = respuestasForPk(forPk);
        respuestas['p0' as IdVariable] = forPk.persona;
    }
    let datosByPass = getDatosByPass();
    respuestasRaiz['u1' as IdVariable]=getDatosByPass().informacionHdr[forPk[estructura.pkAgregadaUaPpal]].tem.recorrido;
    respuestasRaiz['u2' as IdVariable]=getDatosByPass().informacionHdr[forPk[estructura.pkAgregadaUaPpal]].tem.tipo_recorrido;
    respuestasRaiz['u3' as IdVariable]=getDatosByPass().informacionHdr[forPk[estructura.pkAgregadaUaPpal]].tem.comuna_agrupada;
    respuestasRaiz['u4' as IdVariable]=getDatosByPass().informacionHdr[forPk[estructura.pkAgregadaUaPpal]].tem.barrios_agrupados;
})