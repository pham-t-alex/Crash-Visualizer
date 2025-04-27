import { GoogleMap, LoadScript, Circle, InfoWindow } from "@react-google-maps/api";
import { useState } from "react";

export default function Map({className, intersections, onCircleClick, info, onPopupClose}) {
    const [center, setCenter] = useState({lat: 37.3387, lng: -121.8853});
    const [map, setMap] = useState(null);

    function properCapitalization(phrase) {
        let lower = phrase.toLowerCase().split(' ');
        return lower.map(word => word.charAt(0).toUpperCase() + word.substring(1)).join(' ');
    }
    
    return (
      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
        <div className={className}>
            <GoogleMap
            mapContainerStyle={{width: "100%", height: "100%"}}
            center={center}
            zoom={10}
            onLoad={(mapInstance) => setMap(mapInstance)}
            >
            {intersections.map(({id, lat, lng, count, severity}) =>
                <Circle
                    key={id}
                    center={{lat: lat, lng: lng}}
                    radius={count * 5}
                    options={{ 
                        strokeWeight: 0,
                        fillColor: "#FF0000",
                        fillOpacity: 0.2
                    }}
                    onClick={() => onCircleClick(id, lat, lng, map)}
                />
            )}
            {info && (
                <InfoWindow
                    position={{lat: info.lat, lng: info.lng}}
                    onCloseClick={onPopupClose}
                >
                    <div>
                        <h1 style={{fontSize: "20px", fontWeight: "bold"}}>
                            Intersection: 
                        </h1>
                        <p>
                            {properCapitalization(info.a_street)} and {properCapitalization(info.b_street)} <br />
                            Crashes: {info.num_crashes} <br />
                            Injuries: {info.total_injuries} <br />
                            Injury Rate: {info.injury_rate} <br />
                            Deaths: {info.deaths}
                        </p>
                    </div>
                </InfoWindow>
            )}
            </GoogleMap>
        </div>
      </LoadScript>
    );
  }