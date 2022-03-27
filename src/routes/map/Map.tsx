import { useEffect, useRef, useState } from "react";

import { loadModules } from "esri-loader";
import { Icon } from "@aws-amplify/ui-react";

import { Legend } from "./Legend";
import { Modal } from "./Modal";
import { Filter } from "./Filter";
import { onSmallDevice } from "../../utils/on-small-device";

import "./Map.css";

const defaultFilters: Record<string, Filter> = {
  Adoptable: {
    label: "Adopted",
    filterName: "Adoptable",
    selectMode: "multi",
    options: [
      {
        label: "No",
        value: "N",
        selected: true,
      },
      {
        label: "Yes",
        value: "Y",
        selected: true,
      },
    ],
  },
  CountyFull: {
    label: "County",
    filterName: "CountyFull",
    selectMode: "multi",
    options: [
      {
        label: "New Castle",
        value: "New Castle County",
        selected: true,
      },
      {
        label: "Kent",
        value: "Kent County",
        selected: false,
      },
      {
        label: "Sussex",
        value: "Sussex County",
        selected: false,
      },
    ],
  },
  SUBMIT_DATE: {
    label: "Litter",
    filterName: "SUBMIT_DATE",
    selectMode: "single" as "single" | "multi",
    options: [
      {
        label: "Past Week",
        value: "7",
        selected: true,
      },
      {
        label: "Past Month",
        value: "30",
        selected: false,
      },
      {
        label: "Past Year",
        value: "365",
        selected: false,
      },
    ],
  },
};

const buildFilterExpression = (
  filter: Filter,
  operator: string,
  wrapper?: (value: string) => string
) => {
  return filter.options
    .filter((option) => option.selected)
    .map((option) => {
      return `${filter.filterName} ${operator} ${
        wrapper ? wrapper(option.value) : option.value
      }`;
    })
    .join(" OR ");
};

const updateFilters = (
  filters: Record<string, any>,
  filterName: string,
  optionValue: any
): Record<string, Filter> => {
  const clonedFilters = { ...filters };

  const filter = clonedFilters[filterName];
  if (!filter) {
    return;
  }

  filter.options.forEach((o: any) => {
    if (o.value === optionValue) {
      o.selected = !o.selected;
    } else if (filter.selectMode === "single") {
      o.selected = false;
    }
  });

  return clonedFilters;
};

export function Map() {
  const mapContainerRef = useRef();
  const arcGISMapRef = useRef({} as __esri.Map);
  const _Map = useRef();
  const _MapView = useRef();
  const _FeatureLayer = useRef();
  const viewInstance = useRef({});

  const [filters, setFilters] = useState(defaultFilters);
  const [modalOpen, setModalOpen] = useState(false);

  // Hooks
  useEffect(
    () => {
      const loadMapModules = async () => {
        return loadModules(["esri/Map", "esri/views/MapView"]).then(
          ([ArcGISMap, MapView]) => {
            _Map.current = ArcGISMap;
            _MapView.current = MapView;
            return loadMap();
          }
        );
      };

      const loadMap = async () => {
        arcGISMapRef.current = new (_Map.current as any)({
          basemap: "gray-vector",
        });

        viewInstance.current = new (_MapView.current as any)({
          map: arcGISMapRef.current,
          container: mapContainerRef.current as any,
          center: {
            type: "point",
            latitude: 39.723555,
            longitude: -75.658499,
          },
          constraints: {
            geometry: {
              type: "extent",
              xmin: -8436794.6354,
              ymin: 4643205.1946,
              xmax: -8354516.4673,
              ymax: 4842698.0375,
              spatialReference: {
                wkid: 3857,
              },
            },
            minZoom: 10,
          },
          zoom: 10,
        });
      };

      const loadFeatureLayerModule = async () => {
        return loadModules(["esri/layers/FeatureLayer"]).then(
          ([FeatureLayer]) => {
            _FeatureLayer.current = FeatureLayer;
            renderFeatures();
          }
        );
      };


      const renderFeatures = async () => {
        const layers = arcGISMapRef.current.layers;
        layers.removeAll();

        const litterDefinitionExpression = buildFilterExpression(
          filters["SUBMIT_DATE"],
          ">",
          (val: string) => `CURRENT_TIMESTAMP - INTERVAL '${val}' DAY`
        );

        arcGISMapRef.current.add(
          new (_FeatureLayer.current as any)({
            url: process.env.REACT_APP_LITTER_FEATURE_SERVICE_LAYER_URL,
            definitionExpression: litterDefinitionExpression || "1=1",
            renderer: {
              type: "simple",
              symbol: {
                type: "simple-marker",
                color: "rgba(200,90,0,1)",
                size: 6,
                outline: {
                  color: "black",
                  width: "1px",
                },
              },
            } as __esri.RendererProperties,
          })
        );

        const roadsDefinitionExpression = ["Adoptable", "CountyFull"]
          .map((filterName) => {
            const filter = filters[filterName];
            return `(${buildFilterExpression(
              filter,
              "=",
              (val: string) => `'${val}'`
            )})`;
          })
          .filter((expr: string) => expr !== "()");

        arcGISMapRef.current.add(
          new (_FeatureLayer.current as any)({
            url: process.env.REACT_APP_ROADS_FEATURE_SERVICE_LAYER_URL,
            definitionExpression:
              roadsDefinitionExpression.join(" AND ") || "1=1",
          })
        );
      };

      // If on initial map load
      if (!_Map.current || !_MapView.current || !_FeatureLayer.current) {
        loadMapModules()
          .then(() => {
            return loadFeatureLayerModule();
          })
          .then(() => {
            return () => {
              viewInstance.current && (viewInstance.current as any).destroy();
            };
          });
      } else {
        renderFeatures()
          .then(() => {
            return () => {
              viewInstance.current && (viewInstance.current as any).destroy();
            };
          });
      }
    },
    [filters]
  );

  // Render Helpers
  const renderModal = () => (
    <Modal
      open={true}
      onClose={() => setModalOpen(false)}
      filters={Object.values(filters)}
      onChange={(e: any) => {
        const updates = updateFilters(filters, e.filterName, e.optionValue);
        setFilters(updates);
      }}
    />
  );

  const renderFilterIcon = () => (
    <Icon
      className="ada-map-filters-mobile-icon"
      role="button"
      onClick={() => setModalOpen(true)}
      ariaLabel="open-filter-modal"
      pathData="M6.99999 6H17L11.99 12.3L6.99999 6ZM4.24999 5.61C6.26999 8.2 9.99999 13 9.99999 13V19C9.99999 19.55 10.45 20 11 20H13C13.55 20 14 19.55 14 19V13C14 13 17.72 8.2 19.74 5.61C20.25 4.95 19.78 4 18.95 4H5.03999C4.20999 4 3.73999 4.95 4.24999 5.61Z"
      viewBox={{ minX: 0, minY: 0, height: 24, width: 24 }}
    />
  );

  return (
    <div className="route-layout">
      <div id="ada-map-container">
        <div className="ada-map" ref={mapContainerRef}></div>
      </div>
      {onSmallDevice() ? (
        renderFilterIcon()
      ) : (
        <Legend
          filters={Object.values(filters)}
          onChange={(e) => {
            const updates = updateFilters(filters, e.filterName, e.optionValue);
            setFilters(updates);
          }}
        />
      )}
      {onSmallDevice() && modalOpen ? renderModal() : null}
    </div>
  );
}
