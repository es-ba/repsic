myOwn.wScreens={
    proc:{
        result:{}
    }
}

function getCookie(cookiename) {
  var cookiestring=RegExp(cookiename+"=[^;]+").exec(document.cookie);
  return decodeURIComponent(!!cookiestring ? cookiestring.toString().replace(/^[^=]+./,"") : "");
}

window.addEventListener('load', function(){
    var tl=document.getElementById('total-layout');
    tl.innerHTML='<div id=main_layout>abriendo...</div>';
    let recorrido = getCookie('recorrido');
    if(recorrido && Number(recorrido)){
        myOwn.wScreens.mapa({fullscreen:true, recorrido});
    }else{
        tl.innerHTML='<div id=main_layout>sin recorrido, espere a ser redirigido...</div>';
        setTimeout(()=>{
            history.replaceState(null, null, location.origin+location.pathname+'/../menu#i=mapa');
            location.reload();
        },2000)
    }
    myOwn.autoSetup();
});