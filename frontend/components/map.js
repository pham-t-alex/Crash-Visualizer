import { GoogleMap, LoadScript, Circle, InfoWindow } from "@react-google-maps/api";

export default function Map({className, intersections, onCircleClick, info, onPopupClose}) {
    
    const center = {
      lat: 37.3387,
      lng: -121.8853
    };
    
    return (
      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
        <div className={className}>
            <GoogleMap
            mapContainerStyle={{width: "100%", height: "100%"}}
            center={center}
            zoom={10}
            >
            {intersections.map(({id, lat, lng, count, severity}) =>
                <Circle
                    key={id}
                    center={{lat: lat, lng: lng}}
                    radius={count * 10}
                    options={{ 
                        strokeWeight: 0,
                        fillColor: "#FF0000",
                        fillOpacity: 0.2
                    }}
                    onClick={(e) => onCircleClick(id, e)}
                />
            )}
            {info && (
                <InfoWindow
                    position={{lat: info.lat, lng: info.lng}}
                    onCloseClick={onPopupClose}
                >
                    <div>
                        <h1 style={{fontSize: "18px"}}>
                            Intersection: 
                        </h1>
                        <p>
                            St1 and St2
                        </p>
                    </div>
                </InfoWindow>
            )}
            </GoogleMap>
        </div>
      </LoadScript>
    );
  }