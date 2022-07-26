<!-- snippet to be inserted in the page https://nomeubairro.app/ocorrencias/ (ocorrencias, plural)
     using the plugin Insert PHP Code Snippet -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.js"></script>

<?php
$municipio = $_GET['municipio'];
$freguesia = $_GET['freguesia'];

if ( $municipio || $freguesia) { // ex.: /ocorrencias/?municipio=Lisboa&freguesia=Lumiar
	$url = "https://servidor.nomeubairro.app/serverapp_get_historic";
	if ( $municipio && $freguesia ) { 
		$url .= "?data_concelho=".urlencode($municipio)."&data_freguesia=".urlencode($freguesia);
		echo '<h3>'.$municipio.', '.$freguesia.'</h3>';
	} else if ( $municipio ) {
		$url .= "?data_concelho=".urlencode($municipio);
		echo '<h3>'.$municipio.'</h3>';
	} else {
		$url .= "?data_freguesia=".urlencode($freguesia);
		echo '<h3>'.$freguesia.'</h3>';
	}

  	$occurence_array = json_decode(file_get_contents($url), true);
	
	echo '<ul class="list-group">';
	
	if (count($occurence_array) == 0) {
		echo 'Sem resultados';
	}
	
	foreach ($occurence_array as $oc) {
		if ( $oc["anomaly1"] && $oc["anomaly2"] && !$oc["ocorrencia_resolvida"]) {
			echo '<div class="list-group-item">';
			echo '<div class="row">';

			echo '<div class="col-lg-8">';
			
			echo '<a href="https://nomeubairro.app/ocorrencia/?uuid='.$oc["table_row_uuid"].'"><b>Ocorrência</b></a>: ';
			echo $oc["anomaly1"]." - ".$oc["anomaly2"]."<br>";

			echo "<b>Local</b>: ".$oc["data_local"]." n. ".$oc["data_num_porta"].", ".$oc["data_concelho"]."<br>";
			echo "<b>Data</b>: ".date('d/m/Y',strtotime($oc["data_data"]))." às ".date('H:i',strtotime($oc["data_hora"]))."<br>";
			echo "<b>Município</b>: ".$oc["data_concelho"]."<br>";
			echo "<b>Freguesia</b>: ".$oc["data_freguesia"]."<br><br>";

			echo "<details><summary><b>Ocorrência resolvida</b>: ".($oc["ocorrencia_resolvida"] ? "Sim" : "Não")."</summary>";
			echo "<b class=\"pl-4\">Declarada como resolvida pelo cidadão que reportou</b>: ".($oc["ocorrencia_resolvida_por_op"] ? "Sim" : "Não")."<br>";
			echo "<b class=\"pl-4\">Declarada como resolvida pelo município</b>: ".($oc["ocorrencia_resolvida_por_municipio"] ? "Sim" : "Não")."<br>";
			echo "<b class=\"pl-4\">Declarada como resolvida pela freguesia</b>: ".($oc["ocorrencia_resolvida_por_freguesia"] ? "Sim" : "Não");
			echo "</details><br>";

			echo "</div>";
			
			echo '<div class="col-lg-4">';
			$imgurl = "https://servidor.nomeubairro.app/image_server/";
			if (!empty($oc["foto1"])) { 
				echo '<a href="https://nomeubairro.app/ocorrencia/?uuid='.$oc["table_row_uuid"].'"><img src="'.$imgurl.rawurlencode($oc["foto1"]).'"></a>'; 
			}
			
			echo "</div>";

			echo '<div class="occurrence" data-occurrence="'.urlencode(json_encode($oc)).'"></div>';
			
			echo "</div>";
			echo "</div>";
		} else {
			echo "Ocorrência não encontrada<br>";
		}
	}
	
	echo "</ul>";
	
} else if (count($_GET) == 0) {
	echo '<label for="select-municipio">Município</label>';
	echo '<select class="form-control" id="select-municipio"></select>';
	echo '<label for="select-freguesia">Junta de Freguesia</label>';
	echo '<select class="form-control" id="select-freguesia"></select><br><br>';
	
	echo '<button type="button" id="btnSeeList" class="btn btn-primary">Ver</button>';
} else {
	http_response_code(404);
	echo 'Pedido inváido';
}
?>

<br>
<div id="map" style="height: 750px"></div>
<br>

<script language="JavaScript">
const requestImageUrl = 'https://servidor.nomeubairro.app/image_server' // folder where all the images are stored
const mapIconsUrl = 'https://raw.githubusercontent.com/jfoclpf/in-my-district/main/app/www/img/map-icons/'
const geoApiUrl = 'https://geoapi.pt'
	
// get request parameters
const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});
let municipio = params.municipio;
let freguesia = params.freguesia;

if (municipio || freguesia) {
	// fetch lat and lon from html data element
	var occurrences = document.getElementsByClassName('occurrence');

	// get coordinates of 1st occurrence just to know where show map
	const ocData0 = JSON.parse(decodeURIComponent(occurrences[0].getAttribute('data-occurrence').replace(/\+/g, ' ')));
	const lat0 = ocData0.data_coord_latit;
	const lon0 = ocData0.data_coord_long;

	var map = L.map('map').setView([lat0, lon0], 10);

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);	

	for (const oc of occurrences) {
		if (oc) {
			const el = JSON.parse(decodeURIComponent(oc.getAttribute('data-occurrence').replace(/\+/g, ' ')));
			const lat = el.data_coord_latit;
			const lon = el.data_coord_long;

			const topicCode = el.anomaly_code.match(/[a-zA-Z]+/)[0] // ex: "PA", "AAU", etc.
			const mapIcon = L.icon({
				iconUrl: `${mapIconsUrl}${topicCode}.png`,
				iconSize: [50, 50],
				iconAnchor: [25, 50]
			})

			const marker = L.marker([lat, lon], { icon: mapIcon });

			let htmlInfoContent =
				'<div>' +
				`<a href="${'https://nomeubairro.app/ocorrencia/?uuid=' + el.table_row_uuid}">Hiperligação direta</a><br>` +
				`<b>Ocorrência</b>: ${el.anomaly1} - ${el.anomaly2}<br>` +
				`<b>Local</b>: ${el.data_local} n. ${el.data_num_porta}, ${el.data_concelho}<br>` +
				`<b>Data</b>: ${(new Date(el.data_data)).toLocaleDateString('pt-PT')} às ${el.data_hora.slice(0, 5)}<br>` +
				`<b>Município</b>: ${el.data_concelho}<br>` +
				`<b>Freguesia</b>: ${el.data_freguesia}<br>`

			for (var photoIndex = 1; photoIndex <= 4; photoIndex++) {
				if (el['foto' + photoIndex]) {
					const photoUrl = requestImageUrl + '/' + el['foto' + photoIndex]
					htmlInfoContent += `<img class="photo-in-popup" width="200px" src="${photoUrl}">`
				}
			}

			htmlInfoContent += '</div>'

			const popup = L.popup({ closeOnClick: false, autoClose: false, autoPan: true, maxHeight: 400 })
				.setContent(htmlInfoContent)

			marker.bindPopup(popup)
			marker.addTo(map)
		}
	}
} else { // when no get request parameters, shows a select dropdown to select município and freguesia
	const selectMunicipality = document.getElementById('select-municipio')
	const selectFreguesia = document.getElementById('select-freguesia')
	const button = document.getElementById('btnSeeList')
	
	button.addEventListener('click', function() {
		window.location.href = `/ocorrencias/?municipio=${selectMunicipality.value}&freguesia=${selectFreguesia.value}`;
	})
	
	selectMunicipality.addEventListener('change', function() {
		fetch(`${geoApiUrl}/municipios/${this.value}/freguesias?json=1`).then(res => res.json())
		.then(function(res) {
			// clean select
			var length = selectFreguesia.options.length;
			for (i = length-1; i >= 0; i--) {
  				selectFreguesia.options[i] = null;
			}
			
			res.freguesias.forEach(el => {
				selectFreguesia.options.add(new Option(el, el))
			})
		})
		.catch(function(err) {
			console.error('error fetching freguesias', err)
		})
	})

	fetch(`${geoApiUrl}/municipios?json=1`).then(res => res.json())
	.then(function(municipios) {	
		municipios.forEach(el => {
			selectMunicipality.options.add(new Option(el, el))
		})
		
		selectMunicipality.dispatchEvent(new Event('change'))
	})
	.catch(function(err) {
		console.error('error fetching municipios', err)
	})
}
</script>
