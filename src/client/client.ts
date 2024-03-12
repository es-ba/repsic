import * as formStructure from "rel-enc/dist/client/form-structure";
import {html} from "js-to-html";
import * as myOwn from "myOwn";
import * as TypedControls from "typed-controls";

var my = myOwn;

const USAR_GUIONES = true;

function checkIdCasoToGuion(id:string|number){ 
    if(id === null){
        return null
    }
    if(USAR_GUIONES){
        var n = id.toString();
        var corte = n[0] == '9' ? 3 : 2 - n.length % 2; 
        return Number(n.substring(0,corte)) + "-" + Number(n.substring(corte)) 
    }else{
        return Number(id)
    }
}

function checkGuionToIdCaso(idIngresado:string){ 
    if(idIngresado === null){
        return null
    }
    if(USAR_GUIONES){
        var partes = idIngresado.split('-');
        if(partes.length !== 2){
            var mensaje = 'el id caso debe tener la forma "recorrido-numero".';
            alertPromise(mensaje);
            throw Error(mensaje);
        }
        partes[1] = partes[1].length % 2 == 1?'0'.concat(partes[1]):partes[1];
        var nuevoId = partes[0].concat(partes[1]);
        return  nuevoId
    }else{
        return idIngresado
    }
}

var savesClientRepsic={
    validateDepot:formStructure.FormManager.prototype.validateDepot
}
formStructure.SurveyManager.prototype.saveSurvey = function saveSurvey(){
    var self = this;
    return Promise.resolve().then(function(){
        my.setLocalVar(
            self.surveyMetadata.operative +'_survey_'+self.surveyId, 
            self.surveyData
        );
        myOwn.ajax.caso_guardar({
            operativo:self.surveyMetadata.operative, 
            id_caso:self.surveyId, 
            datos_caso: self.surveyData
        });
    });
}

formStructure.FormManager.prototype.validateDepot = function validateDepot(){
    if(!this.variablesAdaptadas){
        if(this.variables.r8){
            this.variables.r8.opciones["2"].salto='r10_1';
        }
        [
            {variable:'o2_esp'   , sub:'o2'   , valor:10 },
            {variable:'o3_esp'   , sub:'o3_5' , valor:1 },
            {variable:'o5_esp'   , sub:'o5'   , valor:5 },
            /*
            {variable:'p9_esp'   , sub:'p9'   , valor:4 },
            {variable:'r4_esp'   , sub:'r4'   , valor:7 },
            {variable:'r7_esp'   , sub:'r7'   , valor:5 },
            {variable:'r9_esp'   , sub:'r9_6' , valor:1 },
            {variable:'r10_esp'  , sub:'r10_5', valor:1 },
            {variable:'r11_esp'  , sub:'r11_6', valor:1 },
            {variable:'r11_esp'  , sub:'r11_6', valor:1 },
            */
        ].forEach(function({variable, sub, valor}){
            if(variable in this.variables){
                this.variables[variable].subordinadaVar=sub
                this.variables[variable].subordinadaValor=valor
            }
        },this)
        this.variablesAdaptadas=true;
    }
    savesClientRepsic.validateDepot.call(this);
}


formStructure.FormManager.prototype.completeCalculatedVars = function completeCalculatedVars(){
    var fm:formStructure.FormManager=this;
    var row=fm.formData;
    var controls=fm.controls;
    var calculatedVars:string[]=[];
    if(fm.formId=='F:F1'){
        var recordables=[
            /*
            {variable: 'u3' },
            {variable: 'u4' },
            {variable: 'u21', previa:'u8'},
            */
            {variable: 'u22', previa:'u8'},
        ];
        recordables.forEach(function(recordableDef){
            var varName=recordableDef.variable;
            var recordableStorage = my.getLocalVar('recordable_'+varName);
            if(recordableStorage && !row[varName] && (!recordableDef.previa || row[recordableDef.previa])){
                row[varName] = recordableStorage;
            }
            controls[varName].addEventListener('update',function(){
                my.setLocalVar('recordable_'+varName, this.getTypedValue());
            });
        });
        // row.cant14 = Number(row.cant11)+Number(row.cant12)+Number(row.cant13)||null;
        // row.cant24 = Number(row.cant21)+Number(row.cant22)+Number(row.cant23)||null;
        // row.cant34 = Number(row.cant31)+Number(row.cant32)+Number(row.cant33)||null;
        // row.cant44 = Number(row.cant41)+Number(row.cant42)+Number(row.cant43)||null;
        // row.cant54 = Number(row.cant51)+Number(row.cant52)+Number(row.cant53)||null;
        // row.cant61 = Number(row.cant11)+Number(row.cant21)+Number(row.cant31)+Number(row.cant41)+Number(row.cant51)||null;
        // row.cant62 = Number(row.cant12)+Number(row.cant22)+Number(row.cant32)+Number(row.cant42)+Number(row.cant52)||null;
        // row.cant63 = Number(row.cant13)+Number(row.cant23)+Number(row.cant33)+Number(row.cant43)+Number(row.cant53)||null;
        // row.cant64 = Number(row.cant61)+Number(row.cant62)+Number(row.cant63)||null;
        calculatedVars = [
            // 'cant14',
            // 'cant24',
            // 'cant34',
            // 'cant44',
            // 'cant54',
            // 'cant61',
            // 'cant62',
            // 'cant63',
            // 'cant64',
            'u22'
        ];
    }
    if(fm.formId=='F:F2'){
        row.p0 = fm.iPosition;
        calculatedVars = [ 'p0' ]; //aqui verificar si esta ok que le asociemos parentesco 1
        if(fm.iPosition == 1){
            row.sc2 = 1;
            calculatedVars.push('sc2');
        }
    }
    calculatedVars.forEach(function(varName){
        this.controls[varName].setTypedValue(row[varName]);
    },this)
}

myOwn.clientSides.generarRelevamiento={
    update:function(depot:myOwn.Depot, fieldName:string){
    },
    prepare:function(depot:myOwn.Depot, fieldName:string){
        var my=myOwn;
        let td=depot.rowControls[fieldName];
        let boton = html.button('generar').create();
        td.buttonGenerar=boton;
        td.innerHTML="";
        td.appendChild(boton);
        boton.onclick=async function(){
            boton.style.title='generando formularios del recorrido '+depot.row.recorrido
            boton.textContent='generando'
            try{
                await my.ajax.generar_formularios({
                    recorrido:depot.row.recorrido
                });
                boton.textContent='ok';
                setTimeout(function(){
                    boton.textContent='generar';
                },3000);
            }catch(err){
                boton.textContent='error'
                boton.style.title=err.message
                throw err;
            }
        }
    }
}

myOwn.clientSides.parseIDPapel={
    update:function(_depot:myOwn.Depot, _fieldName:string){
    },
    prepare:function(depot:myOwn.Depot, fieldName:string){
        var recorrido = depot.row['id_caso'];
        var idCasoPapel = checkIdCasoToGuion(recorrido)
        depot.rowControls[fieldName].setTypedValue(idCasoPapel);
    }
}

formStructure.globalSaltosABotones.o4={
    1:'boton-nuevo-F2'
}

formStructure.globalSaltosABotones.o5={
    siempre:'devolver-bottom-button'
}

formStructure.globalSaltosABotones.obs={
    siempre:'devolver-bottom-button'
}

formStructure.globalSaltosABotones.p9={
    1:'volver-a-F1-bottom-from-F:F2',
    2:'volver-a-F1-bottom-from-F:F2',
    3:'volver-a-F1-bottom-from-F:F2',
    88:'volver-a-F1-bottom-from-F:F2',
    99:'volver-a-F1-bottom-from-F:F2',
    777:'volver-a-F1-bottom-from-F:F2'
}

formStructure.globalSaltosABotones.r11_6={
    2:'volver-a-F1-bottom-from-F:F3',
    88:'volver-a-F1-bottom-from-F:F3',
    99:'volver-a-F1-bottom-from-F:F3',
    777:'volver-a-F1-bottom-from-F:F3'
}

myOwn.wScreens.ingresarFormulario = async function(addrParams:myOwn.AddrParams){
    let my=myOwn;
    let layout = document.getElementById('main_layout');
    layout.innerHTML="";
    let casoAnterior=checkIdCasoToGuion(my.getSessionVar('surveyId'));
    let resultDiv=html.div({id:'result-div'}).create();
    var consistirFun=async function consistirFun(id_caso){
        if(id_caso){
            resultDiv.textContent='consistiendo...';
            my.ajax.consistir_encuesta({
                operativo: my.config.config.operativo,
                id_caso: id_caso
            }).then(function(result){
                resultDiv.textContent='abriendo '+result+' consistencias.';
                my.tableGrid('inconsistencias',resultDiv,{fixedFields:[{fieldName:'operativo', value:my.config.config.operativo},{fieldName:'id_caso', value:id_caso}]});
            })
        }else{
            alertPromise("ingrese un caso para consistir")
        }
    }
    if(addrParams.consistir){
        consistirFun(addrParams.consistir);
    }
    function lineaCaso(suf_id:string, conAnterior:boolean=false, casoAnterior:string=null){
        let id='id_caso_'+suf_id;
        let inputIdCaso=html.td({
            id, 
            "typed-controls-direct-input":true, 
            contenteditable:true, 
            "type-align":"left", 
            style:"min-width: 50px; background-color: white;"
        }).create();
        TypedControls.adaptElement(inputIdCaso,{typeName:USAR_GUIONES?'text':'integer'});
        let buttonCargarCaso=html.button("cargar").create();
        let buttonConsistir=html.button("consistir").create();
        if(conAnterior){
            if(casoAnterior==null){
                return null;
            }
            inputIdCaso.setTypedValue(casoAnterior);
            inputIdCaso.disable(true);
            inputIdCaso.onclick=function(){
                cargarFun(inputIdCaso.getTypedValue());
            }
            inputIdCaso.style.cursor='pointer';
        }else{
            inputIdCaso.setTypedValue(checkIdCasoToGuion(addrParams.consistir || null))
        }
        var cargarFun=async function cargarFun(idCaso:string){
            resultDiv.textContent='leyendo...'
            let result = await my.ajax.caso_traer({operativo:my.config.config.operativo, id_caso:checkGuionToIdCaso(idCaso)})
            var opts = {buttons:{guardar:false,devolver:true}};
            myOwn.wScreens.proc.result.goToEnc(result, resultDiv, opts)
        }
        inputIdCaso.addEventListener('keypress',function(event){
            if(inputIdCaso.getTypedValue()){
                var tecla = event.which;
                if(tecla==13 && !event.shiftKey && !event.ctrlKey && !event.altKey){
                    cargarFun(inputIdCaso.getTypedValue());
                }
            }
        },false);
        buttonCargarCaso.onclick=function(){
            cargarFun(inputIdCaso.getTypedValue());
        }
        buttonConsistir.onclick= function(){
            var id_caso=inputIdCaso.getTypedValue();
            consistirFun(checkGuionToIdCaso(id_caso));
        }
        return html.tr([
            html.td([html.label({"for":id}),'caso']),
            inputIdCaso,
            conAnterior?html.td({colspan:2},'fue el anterior'):html.td([buttonCargarCaso]),
            conAnterior?null:html.td([buttonConsistir])
        ])
    }
    let content = html.table([
        html.tr([
            html.td({colspan:3},"cargar formularios de relevamiento")
        ]),
        lineaCaso('este'),
        casoAnterior?lineaCaso('ant',true,casoAnterior):null
    ]).create();
    layout.appendChild(content);
    layout.appendChild(resultDiv);
}

myOwn.clientSides.verCaso={
    update: false,
    prepare: function(depot, fieldName){
        var boton = html.button('ver').create();
        depot.rowControls[fieldName].appendChild(boton);
        boton.addEventListener('click', function(){
            my.ajax.caso_traer({operativo:my.config.config.operativo, id_caso:depot.row.id_caso}).then(function(row){
                var div = document.getElementById('main_layout');
                var opts = {buttons:{guardar:false,devolver:true}};
                myOwn.wScreens.proc.result.goToEnc(row, div, opts);
            });
        });
    }
};

myOwn.clientSides.correrConsistencias={
    update:function(depot:myOwn.Depot, fieldName:string){
    },
    prepare:function(depot:myOwn.Depot, fieldName:string){
        var my=myOwn;
        let td=depot.rowControls[fieldName];
        let boton = html.button('consistir').create();
        td.buttonConsistir=boton;
        td.innerHTML="";
        td.appendChild(boton);
        boton.onclick=async function(){
            boton.style.title='consistiendo.... '+depot.row.recorrido
            boton.textContent='00:00';
            var empezo = bestGlobals.datetime.now();
            var actualizador=setInterval(function(){
                var ahora = bestGlobals.datetime.now();
                var demora =ahora.sub(empezo); /* falta definir función sub en best-globals --ahora.sub(empezo); */
                boton.textContent=demora.toHms().replace(/^00:/,'');
            },1000)
            //await bestGlobals.sleep(5000);
            try{
                await my.ajax.consistir_encuesta({
                    operativo: my.config.config.operativo,
                    id_caso: depot.row.id_caso
                });
                clearInterval(actualizador);
                boton.textContent='ok';
                setTimeout(function(){
                    boton.textContent='consistir';
                },3000);
            }catch(err){
                clearInterval(actualizador);
                boton.textContent='error'
                boton.style.title=err.message
                throw err;
            }
        }
        if (depot.row.consistido==null || depot.row.modificado >depot.row.consistido){
            boton.style.backgroundColor='#8CF'
        }
    }
};    

myOwn.clientSides.cambiarEstados={
    update:function(depot:myOwn.Depot, fieldName:string){
        var my=myOwn;
        let td=depot.rowControls[fieldName];
        console.log('Valor td: ' + depot.rowControls[fieldName]);
        td.innerHTML="";
        likeAr(depot.row.cambio_estado).forEach(function(value){
            let boton = html.button(value).create();
            td.appendChild(boton);
            //funcionalidad es efectuar el cambio de estado. 
            boton.onclick=async function(){
                boton.style.title='cambiando...';
                try{
                    await my.ajax.actualizar_estado({
                        operativo: my.config.config.operativo,
                        id_caso:depot.row.id_caso,
                        estado_actual:depot.row.estado,
                        proximo_estado:value,
                    });
                    boton.textContent='ok';
                }catch(err){
                    boton.textContent='error'
                    boton.style.title=err.message
                    throw err;
                }
            }
        });
    },
    prepare:function(depot:myOwn.Depot, fieldName:string){
    }
};