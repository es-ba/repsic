export const defConfig=`
server:
  port: 3055
  base-url: /repsic212
  session-store: memory
db:
  motor: postgresql
  host: localhost
  database: repsic212_db
  schema: repsic212
  user: repsic212_admin
  search_path: 
  - repsic
  - comun
install:
  dump:
    db:
      owner: repsic212_owner
      apply-generic-user-replaces: true
    admin-can-create-tables: true
    enances: inline
    skip-content: true
    scripts:
      prepare:
      - esquema_comun.sql
      - ../node_modules/operativos/install/rel_tabla_relacionada.sql
      - ../node_modules/meta-enc/install/prepare.sql
      - ../node_modules/varcal/install/wrappers.sql
      - ../node_modules/operativos/install/sql2tabla_datos.sql
      post-adapt: 
      - para-install.sql
      - ../node_modules/pg-triggers/lib/recreate-his.sql
      - ../node_modules/pg-triggers/lib/table-changes.sql
      - ../node_modules/pg-triggers/lib/function-changes-trg.sql
      - ../node_modules/pg-triggers/lib/enance.sql
      - ../node_modules/datos-ext/install/controlar_modificacion_estructura_cerrada.sql
      - ../node_modules/meta-enc/install/casilleros_orden_total_fun.sql
      - ../node_modules/meta-enc/install/casilleros_jerarquizados_fun.sql
      - ../node_modules/consistencias/install/try_sql.sql
      - grant_reference.sql
      - esquema_dbo.sql 
      - varcal_provisorio.sql
      - desintegrarpk.sql
      - actualizar_inconvar.sql
      - agregar_adjunto_carto_trg.sql
      - estados_permisos_trg.sql
      - proximo_estado_posible.sql
login:
  infoFieldList: [usuario, recorrido, rol]
  plus:
    maxAge-5-sec: 5000    
    maxAge: 864000000
    maxAge-10-day: 864000000
    allowHttpLogin: true
    fileStore: false
    skipCheckAlreadyLoggedIn: true
    loginForm:
      formTitle: REPSIC
      usernameLabel: usuario
      passwordLabel: clave
      buttonLabel: entrar
      formImg: img/login-lock-icon.png
    chPassForm:
      usernameLabel: usuario
      oldPasswordLabel: clave anterior
      newPasswordLabel: nueva clave
      repPasswordLabel: repetir nueva clave
      buttonLabel: Cambiar
      formTitle: Cambio de clave
  messages:
    userOrPassFail: el nombre de usuario no existe o la clave no corresponde
    lockedFail: el usuario se encuentra bloqueado
    inactiveFail: es usuario está marcado como inactivo
client-setup:
  title: repsic212
  cursors: true
  lang: es
  menu: true
  operativo: repsic212
`