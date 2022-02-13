import { useEffect, useRef } from 'react';
import ArcGISMap from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

import './Map.css';

export default function Map() {
  const mapRef = useRef();
  const arcGISMapRef = useRef({} as ArcGISMap);
  const featureLayerRefreshInterval = useRef({} as any);

  useEffect(
    () => {
      arcGISMapRef.current = new ArcGISMap({
        basemap: 'gray-vector'
      });
    
      const view = new MapView({
        map: arcGISMapRef.current,
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
   
      arcGISMapRef.current.add(new FeatureLayer({
        url: process.env.REACT_APP_LITTER_FEATURE_SERVICE_LAYER_URL,
        definitionExpression: 'SUBMIT_DATE > CURRENT_TIMESTAMP - INTERVAL \'7\' DAY'
      }));

      return () => { view && view.destroy(); };
    }, 
    [] // On initial render
  );

  useEffect(
    () => {
      featureLayerRefreshInterval.current = setInterval(() => {
        if (arcGISMapRef.current) {
          arcGISMapRef.current.removeAll();
          arcGISMapRef.current.add(new FeatureLayer({
            url: process.env.REACT_APP_LITTER_FEATURE_SERVICE_LAYER_URL,
            definitionExpression: 'SUBMIT_DATE > CURRENT_TIMESTAMP - INTERVAL \'7\' DAY'
          }));
        }
      }, 120000);

      return () => {
        if (featureLayerRefreshInterval.current) {
          clearInterval(featureLayerRefreshInterval.current);
        }
      };
    },
    []
  );

  return (
    <div className='route-layout' id='ada-map'>
      <div className='ada-map' ref={mapRef}></div>
    </div>
  );
}