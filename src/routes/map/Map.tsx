import { useEffect, useRef, useState } from 'react';
import ArcGISMap from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import Legend, { LegendFilter } from './Legend';

import './Map.css';

const defaultFilters: Record<string, LegendFilter> = {
  Adoptable: {
    label: 'Adopted',
    filterName: 'Adoptable',
    selectMode: 'multi',
    options: [
      {
        label: 'No',
        value: 'N',
        selected: true,
      },
      {
        label: 'Yes',
        value: 'Y',
        selected: true
      }
    ]
  },
  CountyFull: {
    label: 'County',
    filterName: 'CountyFull',
    selectMode: 'multi',
    options: [
      {
        label: 'New Castle',
        value: 'New Castle County',
        selected: true,
      },
      {
        label: 'Kent',
        value: 'Kent County',
        selected: false,
      },
      {
        label: 'Sussex',
        value: 'Sussex County',
        selected: false,
      }
    ]
  },
  SUBMIT_DATE: {
    label: 'Litter',
    filterName: 'SUBMIT_DATE',
    selectMode: 'single' as 'single' | 'multi',
    options: [
      {
        label: 'Past Week',
        value: '7',
        selected: true,
      },
      {
        label: 'Past Month',
        value: '30',
        selected: false,
      },
      {
        label: 'Past Year',
        value: '365',
        selected: false,
      },
    ]
  }
};

const buildFilterExpression = (filter: LegendFilter, operator: string, wrapper?: (value: string) => string) => {
  return filter.options.filter((option) => option.selected)
    .map(option => {
      return `${filter.filterName} ${operator} ${wrapper ? wrapper(option.value) : option.value}`;
    })
    .join(' OR ');
};

const updateFilters = (
  filters: Record<string, any>, filterName: string, optionValue: any
): Record<string, LegendFilter> => {
  const clonedFilters = { ...filters };

  const filter = clonedFilters[filterName];
  if (!filter) {
    return;
  }

  filter.options.forEach((o: any) => {
    if (o.value === optionValue) {
      o.selected = !o.selected;
    } else if (filter.selectMode === 'single') {
      o.selected = false;
    }
  });

  return clonedFilters;
};

export default function Map() {
  const mapContainerRef = useRef();
  const arcGISMapRef = useRef({} as ArcGISMap);

  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaultFilters);

  // Hooks
  useEffect(
    () => {
      arcGISMapRef.current = new ArcGISMap({
        basemap: 'gray-vector'
      });
    
      const view = new MapView({
        map: arcGISMapRef.current,
        container: mapContainerRef.current as any,
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

  useEffect(
    () => {
      const layers = arcGISMapRef.current.layers;
      layers.removeAll();

      const litterDefinitionExpression = buildFilterExpression(
        filters['SUBMIT_DATE'], '>', (val: string) => `CURRENT_TIMESTAMP - INTERVAL '${val}' DAY`
      );

      arcGISMapRef.current.add(new FeatureLayer({
        url: process.env.REACT_APP_LITTER_FEATURE_SERVICE_LAYER_URL,
        definitionExpression: litterDefinitionExpression || '1=1',
        renderer: {
          type: 'simple',
          symbol: {
            type: 'simple-marker',
            color: 'rgba(200,90,0,1)',
            size: 6,
            outline: {
              color: 'black',
              width: '1px'
            }
          }
        } as __esri.RendererProperties
      }));

      const roadsDefinitionExpression = ['Adoptable', 'CountyFull'].map(filterName => {
        const filter = filters[filterName];
        return `(${buildFilterExpression(filter, '=', (val: string) => `'${val}'`)})`;
      }).filter((expr: string) => expr !== '()');

      arcGISMapRef.current.add(new FeatureLayer({
        url: process.env.REACT_APP_ROADS_FEATURE_SERVICE_LAYER_URL,
        definitionExpression: roadsDefinitionExpression.join(' AND ') || '1=1',
      }));
    }, 
    [filters]
  );

  return (
    <div className='route-layout'>
      <div id='ada-map-container'>
        <div className='ada-map' ref={mapContainerRef}></div>
      </div>
      <Legend
        open={false}
        filters={
          Object.values(filters)
        }
        onChange={(e) => {
          const updates = updateFilters(filters, e.filterName, e.optionValue);
          setFilters(updates);
        }}
      />
    </div>
  );
}