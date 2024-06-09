<?php

try{

$host = "gis4cloud.com";
$port = "5432";
$dbname = "grupo5_ptas2024";
$user = "grupo5_ptas2024";
$password = "mFhQgfB!Ubr51";

$db_connection = pg_connect("host=" . $host . " port=" . $port . " dbname=" . $dbname . " user=" . $user . " password=" . $password);

if(!$db_connection){
    echo "Erro na conexão à BD!";
}

$result = pg_query($db_connection, "
SELECT jsonb_build_object(
    'type',     'FeatureCollection',
    'features', jsonb_agg(feature)
)
FROM (
  SELECT jsonb_build_object(
    'type',       'Feature',
    'id',         osm_id,
    'geometry',   ST_AsGeoJSON(geom)::jsonb,
    'properties', to_jsonb(inputs)- 'osm_id' - 'geom'
  ) AS feature
  FROM (SELECT * FROM amenities) inputs) features;") or die('Query failed: ' . pg_last_error());

echo pg_fetch_assoc($result)["jsonb_build_object"];

} catch (Exception $e) {
    echo 'Caught exception: ',  $e->getMessage(), "\n";
}
pg_close($db_connection);
?>