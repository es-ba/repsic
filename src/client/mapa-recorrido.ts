const infoKeys: { [key: string]: string } = {
    'id_caso': 'ID Caso',
    'recorrido': 'Recorrido',
    'lugar_nombre': 'Lugar',
    'barrio': 'Barrio',
    'calle': 'Calle',
    'altura': 'Altura',
    'interseccion': 'Intersección',
    'latitud': 'Latitud',
    'longitud': 'Longitud',
    'cprecision': 'Precisión',
    'cuando': 'Cuándo',
}

myOwn.wScreens.maps = async function () {
    var mainLayout = document.getElementById('main_layout')!;

    const style = document.createElement('style');
    style.innerHTML = `
        .map-popup {
            position: absolute;
            background-color: white;
            border: 1px solid black;
            padding: 5px;
            border-radius: 3px;
            width: max-content;
            transition: opacity 0.25s ease;
        }

        .map-popup-field {
            margin-bottom: 1px;
        }
        
        .map-popup-label {
            
        }

        .map-popup-value {
            margin-left: 5px;
        }
    `;
    mainLayout.appendChild(style);

    const mapDiv = document.createElement('div');
    mapDiv.id = 'map-layout';
    mapDiv.style.width = '100%';
    mapDiv.style.height = '500px';
    mainLayout.appendChild(mapDiv);

    const overlayContainer = document.createElement('div');
    overlayContainer.id = 'popup';
    overlayContainer.className = 'map-popup';
    mainLayout.appendChild(overlayContainer);

    const buildOverlayField = (label: string, value: string) => {
        const container = document.createElement('div');
        container.className = 'map-popup-field';

        const labelElem = document.createElement('strong');
        labelElem.className = 'map-popup-label';
        labelElem.innerText = infoKeys[label] + ': ';
        container.appendChild(labelElem);

        const valueElem = document.createElement('span');
        valueElem.className = 'map-popup-value';
        valueElem.innerText = value;
        valueElem.id = label;
        container.appendChild(valueElem);

        return container;
    }

    Object.keys(infoKeys).forEach(key => {
        const fieldElem = buildOverlayField(key, '');
        overlayContainer.appendChild(fieldElem);
    })

    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/ol@v10.7.0/dist/ol.js";
    script.onload = async () => {
        const ol = (window as any).ol;

        // Map
        const map = new ol.Map({
            target: 'map-layout',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([-58.459572, -34.590849]),
                zoom: 12,
            })
        });

        // Markers
        const styleMarker = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 5,
                fill: new ol.style.Fill({
                    color: 'rgba(25, 175, 192, 0.74)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.5)',
                    width: 1
                })
            })
        });

        const buildFeature = (row: any) => {
            const feature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.fromLonLat([row.longitud, row.latitud]))
            });
            feature.setStyle(styleMarker);
            feature.setId(row.id_caso);

            return feature;
        }

        const { indexed: puntos_indexed, iterable: puntos_iterable } = await my.ajax.puntos_gps_indexados_obtener();

        map.addLayer(new ol.layer.Vector({
            source: new ol.source.Vector({
                features: puntos_iterable.map((punto: any) => buildFeature(punto)), // uso el iterable porque una encuesta puede tener varios puntos
            }),
        }));

        // Popup
        const overlay = new ol.Overlay({
            element: document.getElementById('popup')!,
            positioning: 'bottom-center',
        });
        map.addOverlay(overlay);

        const selectPointerMove = new ol.interaction.Select({
            condition: ol.events.condition.pointerMove,
            style: new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: 'rgba(0, 242, 255, 1)'
                        }),
                    }),
            }),
        });
        selectPointerMove.on('select', function (e: any) {
            const feature = e.selected[0];

            if (feature) {
                overlay.setPosition(feature.getGeometry().getCoordinates());
                overlay.getElement()!.style.opacity = '1';
                Object.keys(infoKeys).forEach(key => {
                    const element = document.getElementById(key)!;

                    if (key !== 'cuando') element.innerText = puntos_indexed[feature.getId()][key];
                    else element.innerText = new Date(puntos_indexed[feature.getId()][key]).toLocaleString();
                });
            }
            else {
                overlay.getElement()!.style.opacity = '0';
            }
        });
        map.addInteraction(selectPointerMove);
    };
    mainLayout.appendChild(script);
}