import { useEffect, useRef } from 'react';
import ArcGISMap from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';

import './Map.css';

export default function Map() {
  const mapRef = useRef();

  useEffect(
    () => {
      const map = new ArcGISMap({
        basemap: 'gray-vector'
      });
    
      const view = new MapView({
        map: map,
        container: mapRef.current as any,
        center: {
          type: 'point',
          latitude: 39.723555,
          longitude: -75.658499
        },
        constraints: {
          geometry: {
            type: 'extent',
            xmin: -8436794.6354,
            ymin: 4643205.1946,
            xmax: -8354516.4673,
            ymax: 4842698.0375,
            spatialReference: {
              wkid: 3857
            }
          } as __esri.Extent,
          minZoom: 10,
        },
        zoom: 10,
      });

      return () => { view && view.destroy(); };
    }, 
    [] // On initial render
  );

  return (
    <div className='route-layout' id='ada-map'>
      <div className='ada-map' ref={mapRef}></div>
    </div>
  );
}