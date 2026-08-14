import React, { useEffect, useRef, useState, useCallback } from 'react';
import { themeColors } from '@/theme/colors';
import { useLoadScript, GoogleMap, Polygon, Marker } from '@react-google-maps/api';

// Keep libraries array static outside component.
// The Maps drawing library was removed in v3.65, so polygon creation is handled manually.
const LIBRARIES = ['geometry'];

// Default center (Chennai)
const defaultCenter = { lat: 12.9324523, lng: 79.1377447 };

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '8px'
};

const mapOptions = {
  zoomControl: true,
  mapTypeControl: true,
  mapTypeControlOptions: {
    style: 1, // Default (dropdown menu), or set to 2 for horizontal bar
    position: 3, // TOP_RIGHT (can adjust as needed)
  },
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
  draggableCursor: 'crosshair'
};

const polygonOptions = {
    fillColor: themeColors.mapFill,
    fillOpacity: 0.4,
    strokeWeight: 2,
    strokeColor: themeColors.mapStroke,
    clickable: true,
    editable: true,
    draggable: true,
    zIndex: 1
};

const GoogleMapDrawing = ({
  center = defaultCenter,
  zoom = 12,
  backgroundPolygons = [],
  backgroundPolygonStyle = {},
  existingPolygons = [],
  existingPolygonStyles = [],
  focusPolygons = [],
  initialPolygon = [],
  editablePolygonIndex = null,
  onPolygonComplete,
  onDraftChange,
  onPolygonUpdate,
  onPolygonDelete,
  mapHeight = '500px',
  showDrawingManager = false,
  isEditingExistingPolygon = false
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_KEY_SIT,
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const polygonRefs = useRef([]);
  const [draftPath, setDraftPath] = useState([]);
  const [completedPath, setCompletedPath] = useState([]);
  const hasEditablePolygon = isEditingExistingPolygon && Array.isArray(initialPolygon) && initialPolygon.length >= 3;
  const isCreateMode = showDrawingManager && !hasEditablePolygon;

  const onMapLoad = useCallback((map) => {
    setMap(map);
    map.setCenter(center);
    
  }, [center]);

  useEffect(() => {
    if (map) {
      setIsMapLoaded(true);
    }
  }, [map]);

  useEffect(() => {
    if (!map || !window.google) return;

    const bounds = new window.google.maps.LatLngBounds();
    const polygonsToFit = [];

    const focusSource =
      Array.isArray(focusPolygons) && focusPolygons.length > 0
        ? focusPolygons
        : backgroundPolygons;

    if (Array.isArray(focusSource)) {
      polygonsToFit.push(...focusSource);
    }

    if (!showDrawingManager && Array.isArray(initialPolygon) && initialPolygon.length > 0) {
      polygonsToFit.push(initialPolygon);
    }

    polygonsToFit.forEach((polygon) => {
      if (!Array.isArray(polygon)) return;
      polygon.forEach((point) => {
        if (point && typeof point.lat === 'number' && typeof point.lng === 'number') {
          bounds.extend(point);
        }
      });
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
    }
  }, [map, backgroundPolygons, focusPolygons, initialPolygon, showDrawingManager]);

  const handlePolygonComplete = useCallback((polygon) => {
    console.log('Polygon completed');
    
    // Get the underlying Google Maps polygon instance
    const nativePolygon = polygon;
    if (!nativePolygon) {
      console.error('Could not access polygon instance');
      return;
    }

    const path = nativePolygon.getPath();
    const coordinates = path.getArray().map(coord => ({
      lat: coord.lat(),
      lng: coord.lng()
    }));
    
    if (onPolygonComplete) {
      onPolygonComplete(coordinates);
    }

    setDraftPath([]);
  }, [onPolygonComplete]);

  // Add handlers for polygon path updates
  const handlePolygonPathChange = useCallback((polygon, index) => {
    console.log('Polygon path changed');
    
    // Get the underlying Google Maps polygon instance
    const nativePolygon = polygon;
    if (!nativePolygon) {
      console.error('Could not access polygon instance');
      return;
    }

    const path = nativePolygon.getPath();
    const coordinates = path.getArray().map(coord => ({
      lat: coord.lat(),
      lng: coord.lng()
    }));
    
    console.log('Updated coordinates:', coordinates);
    if (onPolygonUpdate) {
      onPolygonUpdate(coordinates, index);
    }
  }, [onPolygonUpdate]);

  // Add handlers for polygon deletion
  const handlePolygonDelete = useCallback((index) => {
    if (onPolygonDelete) {
      onPolygonDelete(index);
    }
  }, [onPolygonDelete]);

  useEffect(() => {
    if (!showDrawingManager) {
      setDraftPath([]);
      setCompletedPath([]);
    }
  }, [showDrawingManager, map]);

  useEffect(() => {
    if (showDrawingManager && !hasEditablePolygon && Array.isArray(initialPolygon) && initialPolygon.length >= 3) {
      setDraftPath(initialPolygon);
      setCompletedPath([]);
    }
  }, [initialPolygon, showDrawingManager, hasEditablePolygon]);

  useEffect(() => {
    return () => {
      setDraftPath([]);
    };
  }, []);

  const handleMapClick = useCallback((event) => {
    if (!showDrawingManager || hasEditablePolygon || !event?.latLng) return;
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setDraftPath((prev) => {
      const next = [...prev, { lat, lng }];
      if (onDraftChange) {
        onDraftChange(next);
      }
      return next;
    });
  }, [showDrawingManager, hasEditablePolygon, onDraftChange]);

  const handleUndoPoint = useCallback(() => {
    setDraftPath((prev) => {
      const next = prev.slice(0, -1);
      if (onDraftChange) {
        onDraftChange(next);
      }
      return next;
    });
  }, []);

  const handleClearDraft = useCallback(() => {
    setDraftPath([]);
    setCompletedPath([]);
    if (onDraftChange) {
      onDraftChange([]);
    }
  }, [onDraftChange]);

  const handleFinishDraft = useCallback(() => {
    if (draftPath.length < 3) {
      window.alert('Please add at least 3 points before finishing the polygon.');
      return;
    }

    if (onPolygonComplete) {
      onPolygonComplete(draftPath);
    }
    setCompletedPath(draftPath);
    setDraftPath([]);
    if (onDraftChange) {
      onDraftChange(draftPath);
    }
  }, [draftPath, onPolygonComplete]);

  if (loadError) {
    return (
      <div className="h-[500px] w-full flex items-center justify-center bg-red-50 rounded-lg">
        <div className="text-red-500 text-center px-4">
          <div className="font-medium mb-2">Error Loading Maps</div>
          <div className="text-sm">Failed to load Google Maps. Please check your API key and internet connection.</div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[500px] w-full flex items-center justify-center bg-blue-gray-50/30 rounded-lg">
        <div className="text-blue-gray-500 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-gray-500 mx-auto mb-4"></div>
          <div>Loading Google Maps...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isCreateMode && (
        <div className="bg-blue-gray-50 p-3 rounded-lg text-sm text-blue-gray-700">
          <p className="font-medium">Drawing Instructions:</p>
          <ol className="list-decimal ml-4 mt-1 space-y-1">
            <li>Click on the map to add points for the polygon</li>
            <li>Use Undo or Clear if you need to adjust the draft</li>
            <li>Click Finish Drawing once you have at least 3 points</li>
          </ol>
        </div>
      )}
      <div style={{ height: mapHeight }} className="w-full relative">
        {isCreateMode && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-md">
            Draw Tool Active
          </div>
        )}
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={zoom}
          options={mapOptions}
          onLoad={onMapLoad}
          onClick={handleMapClick}
        >
          {isMapLoaded && isCreateMode && completedPath.length > 0 && draftPath.length === 0 && (
            <Polygon
              path={completedPath}
              options={{
                ...polygonOptions,
                editable: false,
                draggable: false,
              }}
            />
          )}

          {isMapLoaded && isCreateMode && draftPath.length > 0 && (
            <Polygon
              path={draftPath}
              options={{
                ...polygonOptions,
                editable: false,
                draggable: false,
              }}
            />
          )}

          {isMapLoaded && (!showDrawingManager || hasEditablePolygon) && Array.isArray(initialPolygon) && initialPolygon.length > 0 && (
            <Polygon
              path={initialPolygon}
              options={{
                ...polygonOptions,
                editable: hasEditablePolygon,
                draggable: hasEditablePolygon,
                zIndex: hasEditablePolygon ? 3 : 1,
              }}
              onLoad={polygon => {
                if (hasEditablePolygon) {
                  polygonRefs.current[0] = polygon;
                }
              }}
              onMouseUp={() => {
                if (hasEditablePolygon && polygonRefs.current[0]) {
                  handlePolygonPathChange(polygonRefs.current[0], 0);
                }
              }}
              onDragEnd={() => {
                if (hasEditablePolygon && polygonRefs.current[0]) {
                  handlePolygonPathChange(polygonRefs.current[0], 0);
                }
              }}
            />
          )}

          {isMapLoaded && Array.isArray(backgroundPolygons) && backgroundPolygons.map((polygonCoords, index) => (
            Array.isArray(polygonCoords) && polygonCoords.length > 0 ? (
              <Polygon
                key={`background-${index}`}
                path={polygonCoords}
                options={{
                  ...polygonOptions,
                  ...backgroundPolygonStyle,
                  fillOpacity: 0.18,
                  strokeWeight: 3,
                  clickable: false,
                  editable: false,
                  draggable: false,
                  zIndex: 0,
                }}
              />
            ) : null
          ))}

          {isMapLoaded && existingPolygons.map((polygonCoords, index) => {
            const isEditablePolygon = editablePolygonIndex === index;
            if (isEditablePolygon) return null;

            return (
              <Polygon
                key={index}
                path={polygonCoords}
                options={{
                  ...polygonOptions,
                  ...(existingPolygonStyles[index] || {}),
                  clickable: !isCreateMode,
                  editable: false,
                  draggable: false,
                  zIndex: 2,
                }}
                onRightClick={() => handlePolygonDelete(index)}
              />
            );
          })}

          {isMapLoaded && editablePolygonIndex !== null && Array.isArray(existingPolygons[editablePolygonIndex]) && existingPolygons[editablePolygonIndex].length > 0 && (
            <Polygon
              key={`editable-${editablePolygonIndex}`}
              path={existingPolygons[editablePolygonIndex]}
              options={{
                ...polygonOptions,
                ...(existingPolygonStyles[editablePolygonIndex] || {}),
                clickable: false,
                editable: true,
                draggable: true,
                zIndex: 3,
              }}
              onLoad={(polygon) => {
                polygonRefs.current[editablePolygonIndex] = polygon;
              }}
              onMouseUp={() => {
                if (polygonRefs.current[editablePolygonIndex]) {
                  handlePolygonPathChange(polygonRefs.current[editablePolygonIndex], editablePolygonIndex);
                }
              }}
              onDragEnd={() => {
                if (polygonRefs.current[editablePolygonIndex]) {
                  handlePolygonPathChange(polygonRefs.current[editablePolygonIndex], editablePolygonIndex);
                }
              }}
              onChange={() => {
                if (polygonRefs.current[editablePolygonIndex]) {
                  handlePolygonPathChange(polygonRefs.current[editablePolygonIndex], editablePolygonIndex);
                }
              }}
              onRightClick={() => handlePolygonDelete(editablePolygonIndex)}
            />
          )}
        </GoogleMap>
        {showDrawingManager && !hasEditablePolygon && (
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 rounded-xl bg-white/95 p-3 shadow-md">
            <div className="text-xs font-medium text-blue-gray-700">
              Click on the map to add points
            </div>
            <div className="flex gap-2">
            <button type="button" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white" onClick={handleFinishDraft}>
              Finish Drawing
            </button>
            <button type="button" className="rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-800" onClick={handleUndoPoint}>
              Undo
            </button>
            <button type="button" className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-700" onClick={handleClearDraft}>
              Clear
            </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleMapDrawing; 
