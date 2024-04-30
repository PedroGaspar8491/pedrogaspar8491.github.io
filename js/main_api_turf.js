//Variáveis globais
var coordInicial;
var hull_turf;
var estadios_turf;
var estadiosDentroHull;
varccoordenadas_3857 = [];
var coordenadas_4326 = [];
var geojsonFormat = new ol.format.GeoJSON();
var estadio_select = document.getElementById("estadio");
var x_dest;
var y_dest;

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
		projection: 'EPSG:3857',
		center: ol.proj.transform([-8.651697, 40.641121], 'EPSG:4326', 'EPSG:3857'),
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
		var coordinates = geolocation.getPosition();
		coordinates = ol.proj.transform(coordinates, 'EPSG:3857', 'EPSG:4326');
	});

	// Função de estilo para os estadios
	var criarEstilosTipo = (function () {
		var defeito = [new ol.style.Style({
			image: new ol.style.Circle({
				radius: 8,
				fill: new ol.style.Fill({
					color: 'green'
				}),
				stroke: new ol.style.Stroke({
					color: 'green'
				})
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
				scale: 0.4,
				anchor: [0.5, 0.5],
				anchorXUnits: 'fraction',
				anchorYUnits: 'fraction',
				src: './img/ji.png'
			}))
		})];

		return function (feature, resolution) {
			switch (feature.get('tipo')) {
				case 'A':
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
	//calcular com turf.js os estadios que estão dentro da isócrona
	//estadiosDentroHull = turf.pointsWithinPolygon(estadios_turf, hull_turf);
	sourceEstadios.addFeatures(geojsonFormat.readFeatures(estadios_turf, {
		dataProjection: 'EPSG:4326',
		featureProjection: 'EPSG:3857'
	}));

	map.addLayer(estadiosLayer);

	// A feature "ponto de partida".
	pontoInicial = new ol.Feature();

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

	//chamada inicial à API, no arranque da aplicação
	var opção = $("input[name='options']:checked").val();
	opção = 'ape'
	console.log(opção);
	coordenadas_4326[0] = -8.657054901123049;
	coordenadas_4326[1] = 40.631835142937256;
	pontoInicial.setGeometry(new ol.geom.Point([-963705.332976185, 4958180.85218552]));
	console.log($('#sl1').val());

	$("input[type='radio']").change(function () {
		opção = $("input[name='options']:checked").val();
		d = $('#sl1').val();
		console.log(opção);
		if (opção == 'carro') {
			var routing_url = 'https://routing.gis4cloud.pt/isochrone?json=' +
				'{"locations":[{"lat":' + coordenadas_4326[1] + ',"lon":' + coordenadas_4326[0] + '}],' +
				'"costing":"auto","polygons":true,"contours":[{"time":' + d + ',"color":"ff0000"}]}&id=hull inicial';

			$.ajax({
				url: routing_url, async: false, success: function (dados) {
					source_hull.clear();
					var features = geojsonFormat.readFeatures(dados);
					hull_turf = geojsonFormat.writeFeaturesObject(features);
					estadiosDentroHull = turf.pointsWithinPolygon(estadios_turf, hull_turf);
					sourceEstadios.addFeatures(geojsonFormat.readFeatures(estadios_turf, {
						dataProjection: 'EPSG:4326',
						featureProjection: 'EPSG:3857'
					}));
					source_hull.addFeatures(geojsonFormat.readFeatures(dados, {
						dataProjection: 'EPSG:4326',
						featureProjection: 'EPSG:3857'
					}));
					var extent = hull.getSource().getExtent();
					map.getView().fit(extent);
					hull.setVisible(true);
					estadiosLayer.setVisible(true);

				}
			});
		} else if (opção == 'ape') {
			var routing_url = 'https://routing.gis4cloud.pt/isochrone?json=' +
				'{"locations":[{"lat":' + coordenadas_4326[1] + ',"lon":' + coordenadas_4326[0] + '}],' +
				'"costing":"pedestrian","polygons":true,"contours":[{"time":' + d + ',"color":"ff0000"}]}&id=hull inicial';

			$.ajax({
				url: routing_url, async: false, success: function (dados) {
					source_hull.clear();
					sourceEstadios.clear();
					var features = geojsonFormat.readFeatures(dados);
					hull_turf = geojsonFormat.writeFeaturesObject(features);
					source_hull.addFeatures(geojsonFormat.readFeatures(dados, {
						dataProjection: 'EPSG:4326',
						featureProjection: 'EPSG:3857'
					}));
				}
			});

			estadiosDentroHull = turf.pointsWithinPolygon(estadios_turf, hull_turf);
			sourceEstadios.addFeatures(geojsonFormat.readFeatures(estadios_turf, {
				dataProjection: 'EPSG:4326',
				featureProjection: 'EPSG:3857'
			}));
			var extent = hull.getSource().getExtent();
			map.getView().fit(extent);
			hull.setVisible(true);
			estadiosLayer.setVisible(true);
		}
		else if (opção == 'bicicleta') {
			var routing_url = 'https://routing.gis4cloud.pt/isochrone?json=' +
				'{"locations":[{"lat":' + coordenadas_4326[1] + ',"lon":' + coordenadas_4326[0] + '}],' +
				'"costing":"bicycle","polygons":true,"contours":[{"time":' + d + ',"color":"ff0000"}]}&id=hull inicial';

			$.ajax({
				url: routing_url, async: false, success: function (dados) {
					source_hull.clear();
					sourceEstadios.clear();
					var features = geojsonFormat.readFeatures(dados);
					hull_turf = geojsonFormat.writeFeaturesObject(features);

					source_hull.addFeatures(geojsonFormat.readFeatures(dados, {
						dataProjection: 'EPSG:4326',
						featureProjection: 'EPSG:3857'
					}));
				}
			});
			estadiosDentroHull = turf.pointsWithinPolygon(estadios_turf, hull_turf);
			sourceEstadios.addFeatures(geojsonFormat.readFeatures(estadios_turf, {
				dataProjection: 'EPSG:4326',
				featureProjection: 'EPSG:3857'
			}));
			var extent = hull.getSource().getExtent();
			map.getView().fit(extent);
			hull.setVisible(true);
			estadiosLayer.setVisible(true);
		}
	});

	$('#sl1').slider()
		.on('slideStop', function (ev) {
			console.log($('#sl1').val());
			console.log(opção);
			d = $('#sl1').val();
			if (opção == 'carro') {
				var routing_url = 'https://routing.gis4cloud.pt/isochrone?json=' +
					'{"locations":[{"lat":' + coordenadas_4326[1] + ',"lon":' + coordenadas_4326[0] + '}],' +
					'"costing":"auto","polygons":true,"contours":[{"time":' + d + ',"color":"ff0000"}]}&id=hull inicial';
				$.ajax({
					url: routing_url, async: false, success: function (dados) {
						source_hull.clear();
						sourceEstadios.clear();
						var features = geojsonFormat.readFeatures(dados);
						hull_turf = geojsonFormat.writeFeaturesObject(features);

						source_hull.addFeatures(geojsonFormat.readFeatures(dados, {
							dataProjection: 'EPSG:4326',
							featureProjection: 'EPSG:3857'
						}));
					}
				});
				estadiosDentroHull = turf.pointsWithinPolygon(estadios_turf, hull_turf);
				sourceEstadios.addFeatures(geojsonFormat.readFeatures(estadios_turf, {
					dataProjection: 'EPSG:4326',
					featureProjection: 'EPSG:3857'
				}));
				var extent = hull.getSource().getExtent();
				map.getView().fit(extent);
				hull.setVisible(true);
				estadiosLayer.setVisible(true);
			} else if (opção == 'ape') {
				var routing_url = 'https://routing.gis4cloud.pt/isochrone?json=' +
					'{"locations":[{"lat":' + coordenadas_4326[1] + ',"lon":' + coordenadas_4326[0] + '}],' +
					'"costing":"pedestrian","polygons":true,"contours":[{"time":' + d + ',"color":"ff0000"}]}&id=hull inicial';

				$.ajax({
					url: routing_url, async: false, success: function (dados) {
						source_hull.clear();
						sourceEstadios.clear();
						var features = geojsonFormat.readFeatures(dados);
						hull_turf = geojsonFormat.writeFeaturesObject(features);

						source_hull.addFeatures(geojsonFormat.readFeatures(dados, {
							dataProjection: 'EPSG:4326',
							featureProjection: 'EPSG:3857'
						}));
					}
				});
				estadiosDentroHull = turf.pointsWithinPolygon(estadios_turf, hull_turf);
				sourceEstadios.addFeatures(geojsonFormat.readFeatures(estadios_turf, {
					dataProjection: 'EPSG:4326',
					featureProjection: 'EPSG:3857'
				}));
				var extent = hull.getSource().getExtent();
				map.getView().fit(extent);
				hull.setVisible(true);
				estadiosLayer.setVisible(true);
			} else if (opção == 'bicicleta') {
				var routing_url = 'https://routing.gis4cloud.pt/isochrone?json=' +
					'{"locations":[{"lat":' + coordenadas_4326[1] + ',"lon":' + coordenadas_4326[0] + '}],' +
					'"costing":"bicycle","polygons":true,"contours":[{"time":' + d + ',"color":"ff0000"}]}&id=hull inicial';
				$.ajax({
					url: routing_url, async: false, success: function (dados) {
						source_hull.clear();
						sourceEstadios.clear();
						var features = geojsonFormat.readFeatures(dados);
						hull_turf = geojsonFormat.writeFeaturesObject(features);

						source_hull.addFeatures(geojsonFormat.readFeatures(dados, {
							dataProjection: 'EPSG:4326',
							featureProjection: 'EPSG:3857'
						}));
					}
				});
				estadiosDentroHull = turf.pointsWithinPolygon(estadios_turf, hull_turf);
				sourceEstadios.addFeatures(geojsonFormat.readFeatures(estadios_turf, {
					dataProjection: 'EPSG:4326',
					featureProjection: 'EPSG:3857'
				}));
				var extent = hull.getSource().getExtent();
				map.getView().fit(extent);
				hull.setVisible(true);
				estadiosLayer.setVisible(true);
			}
		});

	
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


	// Isto é apenas uma curiosidade, um addon -> pode fazer drap an drop de ficheiros GeoJoson, KML ou GPX diretamente no mapa
	var dragAndDrop = new ol.interaction.DragAndDrop({
		formatConstructors: [
			ol.format.GPX,
			ol.format.GeoJSON,
			ol.format.KML,
			ol.format.TopoJSON
		]
	});

	dragAndDrop.on('addfeatures', function (event) {
		var vectorSource = new ol.source.Vector({
			features: event.features,
			projection: event.projection
		});
		map.getLayers().push(new ol.layer.Vector({
			source: vectorSource
			//		style: vectorStyle
		}));
		view.fit(vectorSource.getExtent(), map.getSize());

	});

	map.addInteraction(dragAndDrop);

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
	estadiosLayer.set('selectable', true);

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

	estadio_select.addEventListener("change", function () {
		estadio = estadio_select.options[estadio_select.selectedIndex].value;
		estadio = estadio.split(",");
		x_dest = parseFloat(estadio[0]);
		y_dest = parseFloat(estadio[1]);

		pontoInicial.setGeometry(null);
		hull.setVisible(false);
		estadiosLayer.setVisible(false);

		if (pontoInicial.getGeometry() == null) {
			coordenadas_4326 = [x_dest, y_dest]
			console.log(coordenadas_4326);


			if (opção == 'carro') {
				var d = $('#sl1').val();
				var routing_url = 'https://routing.gis4cloud.pt/isochrone?json=' +
					'{"locations":[{"lat":' + coordenadas_4326[1] + ',"lon":' + coordenadas_4326[0] + '}],' +
					'"costing":"auto","polygons":true,"contours":[{"time":' + d + ',"color":"ff0000"}]}&id=hull inicial';

				$.ajax({
					url: routing_url, async: false, success: function (dados) {
						source_hull.clear();
						sourceEstadios.clear();
						var features = geojsonFormat.readFeatures(dados);
						hull_turf = geojsonFormat.writeFeaturesObject(features);

						source_hull.addFeatures(geojsonFormat.readFeatures(dados, {
							dataProjection: 'EPSG:4326',
							featureProjection: 'EPSG:3857'
						}));
					}
				});
				console.log(estadiosDentroHull);
				sourceEstadios.addFeatures(geojsonFormat.readFeatures(estadios_turf, {
					dataProjection: 'EPSG:4326',
					featureProjection: 'EPSG:3857'
				}));
				var extent = hull.getSource().getExtent();
				map.getView().fit(extent);
				hull.setVisible(true);
				estadiosLayer.setVisible(true);
				layerVetorial.setVisible(true);

			} else if ($("input[name='options']:checked").val() == 'ape') {
				var d = $('#sl1').val();
				var routing_url = 'https://routing.gis4cloud.pt/isochrone?json=' +
					'{"locations":[{"lat":' + coordenadas_4326[1] + ',"lon":' + coordenadas_4326[0] + '}],' +
					'"costing":"pedestrian","polygons":true,"contours":[{"time":' + d + ',"color":"ff0000"}]}&id=hull inicial';

				$.ajax({
					url: routing_url, async: false, success: function (dados) {
						source_hull.clear();
						sourceEstadios.clear();
						var features = geojsonFormat.readFeatures(dados);
						hull_turf = geojsonFormat.writeFeaturesObject(features);

						source_hull.addFeatures(geojsonFormat.readFeatures(dados, {
							dataProjection: 'EPSG:4326',
							featureProjection: 'EPSG:3857'
						}));
					}
				});
				sourceEstadios.addFeatures(geojsonFormat.readFeatures(estadios_turf, {
					dataProjection: 'EPSG:4326',
					featureProjection: 'EPSG:3857'
				}));
				var extent = hull.getSource().getExtent();
				map.getView().fit(extent);
				hull.setVisible(true);
				pontoInicial.setGeometry(new ol.geom.Point([coordenadas_3857[0], coordenadas_3857[1]]));
				layerVetorial.setVisible(true);
				estadiosLayer.setVisible(true);

			} else if (opção == 'bicicleta') {
				var d = $('#sl1').val();
				var routing_url = 'https://routing.gis4cloud.pt/isochrone?json=' +
					'{"locations":[{"lat":' + coordenadas_4326[1] + ',"lon":' + coordenadas_4326[0] + '}],' +
					'"costing":"bicycle","polygons":true,"contours":[{"time":' + d + ',"color":"ff0000"}]}&id=hull inicial';

				$.ajax({
					url: routing_url, async: false, success: function (dados) {
						source_hull.clear();
						sourceEstadios.clear();
						var features = geojsonFormat.readFeatures(dados);
						hull_turf = geojsonFormat.writeFeaturesObject(features);

						source_hull.addFeatures(geojsonFormat.readFeatures(dados, {
							dataProjection: 'EPSG:4326',
							featureProjection: 'EPSG:3857'
						}));
					}
				});
				sourceEstadios.addFeatures(geojsonFormat.readFeatures(estadios_turf, {
					dataProjection: 'EPSG:4326',
					featureProjection: 'EPSG:3857'
				}));
				var extent = hull.getSource().getExtent();
				map.getView().fit(extent);
				hull.setVisible(true);
				pontoInicial.setGeometry(new ol.geom.Point([coordenadas_3857[0], coordenadas_3857[1]]));
				layerVetorial.setVisible(true);
				estadiosLayer.setVisible(true);
			}
		}
	})

}

