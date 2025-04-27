import { GoogleMap, LoadScript, Circle, InfoWindow } from "@react-google-maps/api";
import { useState, useRef, useEffect } from "react";

export default function Map({className, intersections, onCircleClick, info, onPopupClose, circleScale}) {
    const [center, setCenter] = useState({lat: 37.3387, lng: -121.8853});
    const [map, setMap] = useState(null);
    const circlesRef = useRef([]);
    const mapRef = useRef(null);
    const [mapReady, setMapReady] = useState(false);

    function properCapitalization(phrase) {
        let lower = phrase.toLowerCase().split(' ');
        return lower.map(word => word.charAt(0).toUpperCase() + word.substring(1)).join(' ');
    }

    function updateCircles(data, scale) {
        circlesRef.current.forEach(c => {
            google.maps.event.clearInstanceListeners(c);
            c.setMap(null);
        });
        circlesRef.current = [];

        console.log(data);

        circlesRef.current = data.map(item => {
            console.log('creating circle:', {
                lat: item.lat,
                lng: item.lng,
                radius: item.count * 5,
                mapReady: mapRef.current !== null,
            });

            const circle = new window.google.maps.Circle({
                center: { lat: item.lat, lng: item.lng },
                radius: item.count * 5 * scale,
                map: mapRef.current,
                strokeWeight: 0,
                fillColor: "#FF0000",
                fillOpacity: 0.2,
            });
        
            // attach click listener manually
            circle.addListener('click', () => {
              onCircleClick(item.id, item.lat, item.lng, mapRef.current);
            });
        
            return circle;
        });
    }

    useEffect(() => {
        if (mapReady && intersections.length > 0) {
            updateCircles(intersections, circleScale);
        }
    }, [mapReady, intersections, circleScale]);

    return (
      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
        <div className={className}>
            <GoogleMap
            mapContainerStyle={{width: "100%", height: "100%"}}
            center={center}
            zoom={10}
            onLoad={(mapInstance) => {setMap(mapInstance);
                mapRef.current = mapInstance;
                setMapReady(true);
            }}
            >
            
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