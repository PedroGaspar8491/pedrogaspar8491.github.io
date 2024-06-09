//Variáveis globais
var hull_turf;
var buffer_turf;
var estadios_turf;
var amenities_turf;
var routing_turf;
var estadiosDentroHull;
var ccoordenadas_3857 = [];
var coordsDestino = [];
var geojsonFormat = new ol.format.GeoJSON();
var estadio_select;
var x_dest;
var y_dest;

function update_map(coordsDestino, veiculo, estadiosLayer, amenitiesLayer, layerVetorial, source_routing, source_hull, sourceAmenity, sourceEstadios, coordinates, hull, routing, buffer, source_buffer) {
	if (!isNaN(coordsDestino[0])) {
		hull.setVisible(false);
		routing.setVisible(false);
		estadiosLayer.setVisible(false);
		amenitiesLayer.setVisible(false);
		layerVetorial.setVisible(false);

		var d = $('#sl1').val();
		var hull_url = 'https://routing.gis4cloud.pt/isochrone?json=' +
			'{"locations":[{"lat":' + coordsDestino[1] + ',"lon":' + coordsDestino[0] + '}],' +
			'"costing":"' + veiculo + '","polygons":true,"contours":[{"time":' + d + ',"color":"ff0000"}]}&id=hull inicial';

		$.ajax({
			url: hull_url, async: false, success: function (dados) {
				source_hull.clear();

				sourceAmenity.clear();
				var features = geojsonFormat.readFeatures(dados);
				hull_turf = geojsonFormat.writeFeaturesObject(features);

				source_hull.addFeatures(geojsonFormat.readFeatures(dados, {
					dataProjection: 'EPSG:4326',
					featureProjection: 'EPSG:4326'
				}));
			}
		});

		var routing_url = 'https://routing.gis4cloud.pt/route?json=' +
			'{"locations":[{"lat":' + coordinates[1] + ',"lon":' + coordinates[0] + '},' +
			'{"lat":' + coordsDestino[1] + ',"lon":' + coordsDestino[0] + '}],' +
			'"costing":"auto","costing_options":{"auto":{"country_crossing_penalty":2000.0}},"units":"km","format":"osrm", "shape_format":"geojson"}';
		$.ajax({
			url: routing_url, async: false, success: function (dados) {
				source_routing.clear();
				source_buffer.clear();
				var parser = new jsts.io.OL3Parser();
				parser.inject(
					ol.geom.Point,
					ol.geom.LineString,
					ol.geom.LinearRing,
					ol.geom.Polygon,
					ol.geom.MultiPoint,
					ol.geom.MultiLineString,
					ol.geom.MultiPolygon,
				);
				var features = geojsonFormat.readFeatures(dados['routes'][0]['geometry']);
				source_routing.addFeatures(features, {
					dataProjection: 'EPSG:4326',
					featureProjection: 'EPSG:4326'
				});
				var buffered = turf.buffer(dados['routes'][0]['geometry'], [0.1], { units: 'kilometers' });
				source_buffer.addFeatures(geojsonFormat.readFeatures(buffered, {
					dataProjection: 'EPSG:4326',
					featureProjection: 'EPSG:4326'
				}));
				buffer_turf = geojsonFormat.writeFeaturesObject(geojsonFormat.readFeatures(buffered));
			}
		});

		sourceEstadios.addFeatures(geojsonFormat.readFeatures(estadios_turf, {
			dataProjection: 'EPSG:4326',
			featureProjection: 'EPSG:4326'
		}));
		var amenitiesWithinHull = turf.pointsWithinPolygon(amenities_turf, hull_turf);
		sourceAmenity.addFeatures(geojsonFormat.readFeatures(amenitiesWithinHull, {
			dataProjection: 'EPSG:4326',
			featureProjection: 'EPSG:4326'
		}));
		var amenitiesWithinBuffer = turf.pointsWithinPolygon(amenities_turf, buffer_turf);
		sourceAmenity.addFeatures(geojsonFormat.readFeatures(amenitiesWithinBuffer, {
			dataProjection: 'EPSG:4326',
			featureProjection: 'EPSG:4326'
		}));

		var extent = hull.getSource().getExtent();
		map.getView().fit(extent);
		hull.setVisible(true);
		routing.setVisible(true);
		buffer.setVisible(true);
		estadiosLayer.setVisible(true);
		layerVetorial.setVisible(true);
		amenitiesLayer.setVisible(true);
	}
}

function init() {

	// Popup overlay com popupClass=anim
	var popup = new ol.Overlay.Popup({
		popupClass: "default anim", //"tooltips", "warning" "black" "default", "tips", "shadow",
		closeBox: true,
		//onclose: function () { console.log("Fechou o popup"); },
		positioning: $("#positioning").val(),
		autoPan: {
			animation: {
				duration: 100
			}
		}
	});

	//Definição das camadas do "layer switcher"
	var layersBase = [];


	layersBase[1] = new ol.layer.Tile({
		source: new ol.source.OSM({

		})
	});

	layersBase[0] = new ol.layer.Tile({
		source: new ol.source.BingMaps({
			key: 'AvBCehWm6Ep1VVa23v2BM-SsqJ1X3hx7l5CRWAj3ThglltxV7J87lENctywpvfsS',
			imagerySet: 'Aerial'
		})
	});

	//Definição da "view" do mapa
	var view = new ol.View({
		projection: 'EPSG:4326',
		center: [-8.651697, 40.641121],
		//extent: [-982195.7341678787, 4910200.594997236, -909505.2644025753, 5016168.94481226],
		zoom: 12,
		minZoom: 4,
		maxZoom: 22
	})

	//Definição do mapa
	map = new ol.Map({
		layers: layersBase,
		target: 'mapa',
		renderer: 'canvas',
		view: view,
		overlays: [popup]
	});

	//definição da isócrona (inicialamente "vazia" - source "vazia")
	var source_hull = new ol.source.Vector({
	});

	var hull = new ol.layer.Vector({
		title: 'hull',
		source: source_hull
	});

	//definição da camada de routing
	var source_routing = new ol.source.Vector({
	})

	var routing = new ol.layer.Vector({
		title: 'route',
		source: source_routing,
		style: new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: 'blue',
				width: '2'
			}),
		}),
	});

	var source_buffer = new ol.source.Vector({
	})

	var buffer = new ol.layer.Vector({
		title: 'buffer',
		source: source_buffer,
		style: new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: 'blue',
				width: '2'
			}),
		}),
	});


	// Geolocation
	const geolocation = new ol.Geolocation({
		// enableHighAccuracy must be set to true to have the heading value.
		trackingOptions: {
			enableHighAccuracy: true,
		},
		projection: view.getProjection(),
	});

	geolocation.setTracking(true);

	// handle geolocation error.
	geolocation.on('error', function (error) {
		console.log(error.message);
	});

	geolocation.on('change:position', function () {
		coordinates = geolocation.getPosition();
	});

	// Função de estilo para os estadios
	var criarEstilosTipo = (function () {
		var defeito = [
			new ol.style.Style({
				image: new ol.style.Icon({
					anchor: [0.5, 300],
					anchorXUnits: 'fraction',
					anchorYUnits: 'pixels',
					src: './img/stadium.png',
					scale: 0.15
				})
			})
		];
		var styleJI = [new ol.style.Style({
			image: new ol.style.Circle({
				radius: 8,
				fill: new ol.style.Fill({
					color: 'black'
				}),
				stroke: new ol.style.Stroke({
					color: 'black'
				})
			})
		}),
		new ol.style.Style({
			image: new ol.style.Icon(({
				scale: 0.5,
				anchor: [0.5, 0.5],
				anchorXUnits: 'fraction',
				anchorYUnits: 'fraction',
				src: './img/ji.png'
			}))
		})];

		return function (feature, resolution) {
			switch (feature.get('tipo')) {
				case 'cafe':
					return styleJI;
					break;
				case 'restaurante':
					return styleJI;
					break;
				default:
					return defeito;
					break;
			}
		};
	})

	//definição do layer dos estadios
	var sourceEstadios = new ol.source.Vector({
		format: new ol.format.GeoJSON,
		projection: 'EPSG:4326',
	});

	var estadiosLayer = new ol.layer.Vector({
		title: 'Estadios',
		nome: 'estadios_layer',
		source: sourceEstadios,
		style: criarEstilosTipo()
	});

	$.ajax({
		url: 'https://www.gis4cloud.com/grupo5_ptas2024/scripts/estadios_turf.php', async: false, success: function (dados) {
			sourceEstadios.clear();
			var features = geojsonFormat.readFeatures(dados);
			estadios_turf = geojsonFormat.writeFeaturesObject(features);
		}
	});
	sourceEstadios.addFeatures(geojsonFormat.readFeatures(estadios_turf, {
		dataProjection: 'EPSG:4326',
		featureProjection: 'EPSG:4326'
	}));

	map.addLayer(estadiosLayer);

	var sourceAmenity = new ol.source.Vector({
		format: new ol.format.GeoJSON,
		projection: "ESPG:4326",
	});

	var amenitiesLayer = new ol.layer.Vector({
		title: 'Amenities',
		nome: 'amenities_layer',
		source: sourceAmenity,
		style: criarEstilosTipo()
	});

	$.ajax({
		url: 'https://www.gis4cloud.com/grupo5_ptas2024/scripts/amenities_turf.php', async: false, success: function (dados) {
			sourceAmenity.clear();
			var features = geojsonFormat.readFeatures(dados);
			amenities_turf = geojsonFormat.writeFeaturesObject(features);
		}
	});

	map.addLayer(amenitiesLayer);
	// A feature "ponto de partida".
	pontoInicial = new ol.Feature(
	);

	//Estilo a aplicar ao ponto de partida
	var estiloPartida = [
		new ol.style.Style({
			image: new ol.style.Icon({
				opacity: 0.75,
				anchor: [0.5, 300],
				anchorXUnits: 'fraction',
				anchorYUnits: 'pixels',
				src: './img/start.png',
				scale: 0.15
			})
		}),
		new ol.style.Style({
			image: new ol.style.Circle({
				radius: 5,
				fill: new ol.style.Fill({
					color: 'rgba(230,120,30,0.7)'
				})
			})
		})
	];

	pontoInicial.setStyle(estiloPartida);

	// O layer vetorial utilizado para apresentar a entidade ponto de partida
	var layerVetorial = new ol.layer.Vector({
		source: new ol.source.Vector({
			features: [pontoInicial]
		})
	});

	map.addLayer(layerVetorial);

	var opção = $("input[name='options']:checked").val();

	//Controlos
	//Attribution ("referências")
	var omeuControloAttribution = new ol.control.Attribution({
		className: 'ol-attribution', //parâmetro por defeito
		target: null, //parâmetro por defeito. Coloca as referências ("attribution") numa div
	});
	map.addControl(omeuControloAttribution);
	//Full Screen
	var omeuControloFullScreen = new ol.control.FullScreen();
	map.addControl(omeuControloFullScreen);
	//Rodar mapa
	var omeuControloRodarMapa = new ol.control.Rotate()
	map.addControl(omeuControloRodarMapa);
	//Barra de escala
	var omeuControloBarraDeEscala = new ol.control.ScaleLine()
	map.addControl(omeuControloBarraDeEscala);
	//Zoom
	var omeuControloZoom = new ol.control.Zoom();
	map.addControl(omeuControloZoom);


	function switchLayer() {
		var checkedLayer = $('#layerswitcher input[name=layer]:checked').val();
		for (i = 0, ii = layersBase.length; i < ii; ++i) layersBase[i].setVisible(i == checkedLayer);
	}

	$(function () { switchLayer() });
	$("#layerswitcher input[name=layer]").change(function () { switchLayer() });

	// Control Select 
	var select = new ol.interaction.Select({
		condition: ol.events.condition.pointerMove,

		layers: function (layer) {
			return layer.get('selectable') == true;
		}
	});

	//Para o popup
	map.addInteraction(select);
	hull.set('selectable', false);
	routing.set('selectable', false);
	estadiosLayer.set('selectable', true);
	amenitiesLayer.set('selectable', true);

	// On selected => show/hide popup
	select.getFeatures().on(['add'], function (e) {
		var feature = e.element;
		var content = "";
		content += feature.get("nome");
		popup.show(feature.getGeometry().getCoordinates(), content);
	})
	select.getFeatures().on(['remove'], function (e) {
		popup.hide();
	})

	map.addLayer(hull);
	map.addLayer(routing);
	map.addLayer(buffer)

	estadio_select = document.getElementById("estadio");

	estadio_select.addEventListener("change", function () {
		opção = $("input[name='options']:checked").val();
		d = $('#sl1').val();
		estadio = estadio_select.options[estadio_select.selectedIndex].value;
		estadio = estadio.split(",");
		x_dest = parseFloat(estadio[0]);
		y_dest = parseFloat(estadio[1]);

		pontoInicial.setGeometry(null);

		if (pontoInicial.getGeometry() == null) {
			coordsDestino = [x_dest, y_dest];
			pontoInicial.set('geometry', new ol.geom.Point([coordinates[1], coordinates[0]]));

			if (opção == 'carro') {
				update_map(coordsDestino, "auto", estadiosLayer, amenitiesLayer, layerVetorial, source_routing, source_hull, sourceAmenity, sourceEstadios, coordinates, hull, routing, buffer, source_buffer)

			} else if ($("input[name='options']:checked").val() == 'ape') {
				update_map(coordsDestino, "pedestrian", estadiosLayer, amenitiesLayer, layerVetorial, source_routing, source_hull, sourceAmenity, sourceEstadios, coordinates, hull, routing, buffer, source_buffer);

			} else if (opção == 'bicicleta') {
				update_map(coordsDestino, "bicycle", estadiosLayer, amenitiesLayer, layerVetorial, source_routing, source_hull, sourceAmenity, sourceEstadios, coordinates, hull, routing, buffer, source_buffer);
			}
		}
	});

	$("input[type='radio']").on('change', function () {
		opção = $("input[name='options']:checked").val();
		d = $('#sl1').val();
		estadio = estadio_select.options[estadio_select.selectedIndex].value;
		estadio = estadio.split(",");
		x_dest = parseFloat(estadio[0]);
		y_dest = parseFloat(estadio[1]);

		pontoInicial.setGeometry(null);
		hull.setVisible(false);


		if (pontoInicial.getGeometry() == null) {
			coordsDestino = [x_dest, y_dest];
			pontoInicial.set('geometry', new ol.geom.Point([coordinates[1], coordinates[0]]));


			if (opção == 'carro') {
				update_map(coordsDestino, "auto", estadiosLayer, amenitiesLayer, layerVetorial, source_routing, source_hull, sourceAmenity, sourceEstadios, coordinates, hull, routing, buffer, source_buffer)

			} else if ($("input[name='options']:checked").val() == 'ape') {
				update_map(coordsDestino, "pedestrian", estadiosLayer, amenitiesLayer, layerVetorial, source_routing, source_hull, sourceAmenity, sourceEstadios, coordinates, hull, routing, buffer, source_buffer);

			} else if (opção == 'bicicleta') {
				update_map(coordsDestino, "bicycle", estadiosLayer, amenitiesLayer, layerVetorial, source_routing, source_hull, sourceAmenity, sourceEstadios, coordinates, hull, routing, buffer, source_buffer);
			}
		}
	});

	$('#sl1').slider()
		.on('slideStop', function (ev) {
			opção = $("input[name='options']:checked").val();
			d = $('#sl1').val();
			estadio = estadio_select.options[estadio_select.selectedIndex].value;
			estadio = estadio.split(",");
			x_dest = parseFloat(estadio[0]);
			y_dest = parseFloat(estadio[1]);

			pontoInicial.setGeometry(null);

			if (pontoInicial.getGeometry() == null) {
				coordsDestino = [x_dest, y_dest];
				pontoInicial.set('geometry', new ol.geom.Point([coordinates[1], coordinates[0]]));


				if (opção == 'carro') {
					update_map(coordsDestino, "auto", estadiosLayer, amenitiesLayer, layerVetorial, source_routing, source_hull, sourceAmenity, sourceEstadios, coordinates, hull, routing, buffer, source_buffer)

				} else if ($("input[name='options']:checked").val() == 'ape') {
					update_map(coordsDestino, "pedestrian", estadiosLayer, amenitiesLayer, layerVetorial, source_routing, source_hull, sourceAmenity, sourceEstadios, coordinates, hull, routing, buffer, source_buffer);

				} else if (opção == 'bicicleta') {
					update_map(coordsDestino, "bicycle", estadiosLayer, amenitiesLayer, layerVetorial, source_routing, source_hull, sourceAmenity, sourceEstadios, coordinates, hull, routing, buffer, source_buffer);
				}
			}
		});

}

