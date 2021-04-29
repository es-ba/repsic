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
        tl.innerHTML='<div id=main_layout>sin recorrido <a href="menu#i=mapa">volver<a/></div>';
    }
    myOwn.autoSetup();
});