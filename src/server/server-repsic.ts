"use strict";

import { emergeAppRepsic } from "./app-repsic";
import { emergeAppMetaEnc, emergeAppRelEnc, emergeAppOperativos, AppBackend} from "meta-enc";
import {OperativoGenerator, emergeAppVarCal, emergeAppDatosExt, emergeAppConsistencias, emergeAppProcesamiento, emergeAppDmEncu, pgWhiteList} from 'dmencu';

OperativoGenerator.mainTD = 'grupo_personas';
OperativoGenerator.mainTDPK = 'id_caso'; // TODO: hacer esto dinámico en paquete consistencias
OperativoGenerator.orderedIngresoTDNames = [OperativoGenerator.mainTD, 'grupo_personas_calculada', 'personas', 'personas_calculada'];
OperativoGenerator.orderedReferencialesTDNames = ['supervision', 'recorridos','supervision_calculada'];

var AppRepsic = emergeAppRepsic(
    emergeAppDmEncu(
        emergeAppProcesamiento(
            emergeAppConsistencias(
                emergeAppDatosExt(
                    emergeAppMetaEnc(
                        emergeAppRelEnc(
                            emergeAppVarCal(
                                emergeAppOperativos(AppBackend)
                            )
                        )
                    )
                )
            )
        )
    )
);

new AppRepsic().start();


/*
var AppOperativos=emergeAppOperativos(AppBackend);
var AppRelEnc=emergeAppRelEnc(AppOperativos);
var AppMetaEnc=emergeAppMetaEnc(AppRelEnc);
var AppDatosExt=emergeAppDatosExt(AppMetaEnc);
var AppVarCal=emergeAppVarCal(AppDatosExt);
var AppConsistencias=emergeAppConsistencias(AppVarCal);
var AppProcesamiento=emergeAppProcesamiento(AppConsistencias);
var AppRepsic2=emergeAppRepsic(AppProcesamiento);
*/
