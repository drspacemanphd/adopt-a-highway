import { useEffect, useRef, useState } from "react";

import { loadModules } from "esri-loader";
import { GrFilter } from "react-icons/gr";
import Spinner from "react-bootstrap/Spinner";

import { Legend } from "./Legend";
import { Modal } from "./Modal";
import { Filter } from "./Filter";
import { onSmallDevice } from "../../utils/on-small-device";

import "./Map.css";

const defaultFilters: Record<string, Filter> = {
  Adoptable: {
    label: "Adoptable",
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

const litterPopupTemplate: __esri.PopupTemplate = {
  title: "Litter",
  outFields: ["*"],
  content: (_event: any) => {
    return `
      <ul>
      <li> Submit Date: {SUBMIT_DATE} </li>
      <li> Classification: {CLASSIFICATION_FIRST} </li>
      <li><a target="_blank" href="${process.env.REACT_APP_LITTER_BUCKET_URL}/{IMAGE_KEY}">Image Link</a></li>
      </ul> 
    `;
  },
} as any;

const roadsPopupTemplate: __esri.PopupTemplate = {
  title: "Roads",
  outFields: ["*"],
  content: (_event: any) => {
    let markup = `<ul>`;

    const road: string = _event?.graphic?.attributes?.RdwayName;
    if (road) {
      const camelcase = road
        .split(/\s+/)
        .map((term) => {
          const lowered = term.toLowerCase();
          const cameled = lowered.slice(0, 1).toUpperCase() + lowered.slice(1);
          return cameled;
        })
        .join(" ");
      markup += `<li> Road: ${camelcase}</li>`;
    }

    const adopted: boolean = _event?.graphic?.attributes?.Adoptable === "N";
    if (adopted) {
      markup += `<li>Adopted By:</li>`;
      let adoptedMarkup = `<ul>`;

      const adoptedByMoreThanOne = !!_event?.graphic?.attributes?.GroupNameTwo;

      if (_event?.graphic?.attributes?.GroupNameOne) {
        const firstAdoptee = adoptedByMoreThanOne
          ? `${_event?.graphic?.attributes?.GroupNameOne} (from ${_event?.graphic?.attributes?.FromRoadOne} to ${_event?.graphic?.attributes?.ToRoadOne})`
          : _event?.graphic?.attributes?.GroupNameOne;
        adoptedMarkup += `<li>${firstAdoptee}</li>`;
      }

      if (_event?.graphic?.attributes?.GroupNameTwo) {
        const secondAdoptee = `${_event?.graphic?.attributes?.GroupNameTwo} (from ${_event?.graphic?.attributes?.FromRoadTwo} to ${_event?.graphic?.attributes?.ToRoadTwo})`;
        adoptedMarkup += `<li>${secondAdoptee}</li>`;
      }

      if (_event?.graphic?.attributes?.GroupNameThree) {
        const thirdAdoptee = `${_event?.graphic?.attributes?.GroupNameThree} (from ${_event?.graphic?.attributes?.FromRoadThree} to ${_event?.graphic?.attributes?.ToRoadThree})`;
        adoptedMarkup += `<li>${thirdAdoptee}</li>`;
      }

      const lastCleanups = [
        _event?.graphic?.attributes?.LastCleanupOne || 0,
        _event?.graphic?.attributes?.LastCleanupTwo || 0,
        _event?.graphic?.attributes?.LastCleanupThree || 0,
      ].filter((date) => !!date);
      lastCleanups.sort((a, b) => b - a);
      if (lastCleanups.length) {
        adoptedMarkup += `<li>Last Recorded Cleanup: ${new Date(
          lastCleanups[0]
        ).toDateString()}</li>`;
      }

      adoptedMarkup += "</ul>";
      markup += adoptedMarkup;
    }

    markup += "</ul>";
    return markup;
  },
} as any;

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
  const [loadedLitterLayer, setLoadedLitterLayer] = useState(false);
  const [loadedRoadLayer, setLoadedRoadLayer] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Hooks
  useEffect(() => {
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
      const Map = _Map.current as __esri.MapConstructor;
      const MapView = _MapView.current as __esri.MapViewConstructor;

      arcGISMapRef.current = new Map({
        basemap: "gray-vector",
      });

      viewInstance.current = new MapView({
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
          } as __esri.Extent,
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
      const FeatureLayer =
        _FeatureLayer.current as __esri.FeatureLayerConstructor;

      const oldLayers = arcGISMapRef.current.layers;
      oldLayers.removeAll();

      const litterDefinitionExpression = buildFilterExpression(
        filters["SUBMIT_DATE"],
        ">",
        (val: string) => `CURRENT_TIMESTAMP - INTERVAL '${val}' DAY`
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

      const litterLayer = new FeatureLayer({
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
        popupTemplate: litterPopupTemplate,
      });

      const roadLayer = new FeatureLayer({
        url: process.env.REACT_APP_ROADS_FEATURE_SERVICE_LAYER_URL,
        definitionExpression: roadsDefinitionExpression.join(" AND ") || "1=1",
        popupTemplate: roadsPopupTemplate,
      });

      litterLayer.on("layerview-create", () =>
        setLoadedLitterLayer((l) => true)
      );
      roadLayer.on("layerview-create", () => setLoadedRoadLayer((l) => true));

      arcGISMapRef.current.addMany([litterLayer, roadLayer]);
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
      renderFeatures().then(() => {
        return () => {
          viewInstance.current && (viewInstance.current as any).destroy();
        };
      });
    }
  }, [filters]);

  // Render Helpers
  const renderModal = () => (
    <Modal
      open={true}
      onClose={() => setModalOpen(false)}
      filters={Object.values(filters)}
      onChange={(e: any) => {
        const updates = updateFilters(filters, e.filterName, e.optionValue);
        setLoadedLitterLayer(false);
        setLoadedRoadLayer(false);
        setFilters(updates);
      }}
    />
  );

  const renderFilterIcon = () => {
    return modalOpen ? null : (
      <GrFilter
        className="ada-map-filters-mobile-icon"
        role="button"
        onClick={() => setModalOpen(true)}
        aria-label="open-filter-modal"
      />
    );
  };

  const renderLoader = () => (
    <Spinner
      size="sm"
      className={`ada-map-loader${modalOpen ? "-modal-open" : ""}`}
    />
  );

  return (
    <div className="route-layout">
      {loadedLitterLayer && loadedRoadLayer ? null : renderLoader()}
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
            setLoadedLitterLayer(false);
            setLoadedRoadLayer(false);
            setFilters(updates);
          }}
        />
      )}
      {onSmallDevice() && modalOpen ? renderModal() : null}
    </div>
  );
}
