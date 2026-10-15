"use strict";

// datos que el mapa pide al servidor (ver /datos/recorrido en app-repsic.ts y mapa.ts)

// un recorrido, con sus lugares y los archivos de cartografía
export const sqlDatosDeRecorrido = `SELECT r.*, 
                                (SELECT jsonb_agg(to_jsonb(x.*)) FROM (SELECT l.*, tl.descripcion as tipo_lugar_descripcion FROM lugares l INNER JOIN tipos_lugar tl USING(tipo_lugar) WHERE l.recorrido = r.recorrido )x) as lugares,
                                (SELECT jsonb_agg(to_jsonb(a.*)) FROM adjuntos a INNER JOIN adjunto_categoria ca USING (id_adjunto) WHERE a.recorrido = r.recorrido AND ca.categoria = 'carto') as adjuntos
                            FROM recorridos r 
                            WHERE recorrido = $1
                            `;

// todos los recorridos juntos: lugares y archivos de cartografía sin recorrido
export const sqlDatosDeTodosLosRecorridos = `SELECT 
                                (SELECT jsonb_agg(to_jsonb(x.*)) FROM (SELECT l.*, tl.descripcion as tipo_lugar_descripcion FROM lugares l INNER JOIN tipos_lugar tl USING(tipo_lugar) )x) as lugares,
                                (SELECT jsonb_agg(to_jsonb(a.*)) FROM adjuntos a INNER JOIN adjunto_categoria ca USING (id_adjunto) WHERE ca.categoria = 'carto') as adjuntos
                            `;
