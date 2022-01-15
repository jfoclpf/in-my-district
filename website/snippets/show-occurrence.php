<!-- snippet to be inserted in the page https://nomeubairro.app/ocorrencia/
     using the plugin Insert PHP Code Snippet -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.js"></script>

<?php
// uuid in the URL
if ( $_GET['uuid'] ) {
  $occurrence_temp = file_get_contents("https://in-my-district.joaopimentel.com/serverapp_get_historic?occurrence_uuid=" . urlencode($_GET['uuid']));
  $oc = json_decode($occurrence_temp, true)[0];
  if ( $oc["anomaly1"] && $oc["anomaly2"] ) {
    echo "<b>Ocorrência</b>: ".$oc["anomaly1"]." - ".$oc["anomaly2"]."<br>";
    echo "<b>Local</b>: ".$oc["data_local"]." n. ".$oc["data_num_porta"].", ".$oc["data_concelho"]."<br>";
    echo "<b>Data</b>: ".date('d/m/Y',strtotime($oc["data_data"]))." às ".date('H:i',strtotime($oc["data_hora"]))."<br>";
    echo "<b>Município</b>: ".$oc["data_concelho"]."<br>";
    echo "<b>Freguesia</b>: ".$oc["data_freguesia"]."<br>";
    echo "<b>Declarada como resolvida pelo munícipe</b>: ".($oc["ocorrencia_resolvida"] ? "Sim" : "Não")."<br><br>";

    $imgurl = "https://in-my-district.joaopimentel.com/image_server/";
    if (!empty($oc["foto1"])) { echo '<img src="'.$imgurl.$oc["foto1"].'">'; }
    if (!empty($oc["foto2"])) { echo '<img src="'.$imgurl.$oc["foto2"].'">'; }
    if (!empty($oc["foto3"])) { echo '<img src="'.$imgurl.$oc["foto3"].'">'; }
    if (!empty($oc["foto4"])) { echo '<img src="'.$imgurl.$oc["foto4"].'">'; }

    echo '<div id="occurrence" data-coord-latit="'.$oc["data_coord_latit"].'" data-coord-long="'.$oc["data_coord_long"].'"></div>';
  } else {
    echo "Ocorrência não encontrada<br>";
  }
}
?>

<br>
<div id="map" style="height: 550px"></div>

<script language="JavaScript">
// fetch lat and lon from html data element
var occurrence = document.getElementById('occurrence');

if (occurrence) {
  var lat = parseFloat(occurrence.getAttribute('data-coord-latit'));
  var lon = parseFloat(occurrence.getAttribute('data-coord-long'));

  var map = L.map('map').setView([lat, lon], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  L.marker([lat, lon]).addTo(map);
}
</script>
