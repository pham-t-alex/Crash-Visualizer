import { GoogleMap, LoadScript, Circle } from "@react-google-maps/api";

export default function Map({className, intersections}) {
    
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
            {intersections.map((item) =>
                <Circle
                key={`${item.lat}-${item.lng}`}
                center={{lat: item.lat, lng: item.lng}}
                radius={200}
                options={{ 
                    strokeWeight: 0,
                    fillColor: "#FF0000",
                    fillOpacity: 0.2
                }}
                />
            )}
            </GoogleMap>
        </div>
      </LoadScript>
    );
  }