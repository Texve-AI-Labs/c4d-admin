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
  existingPolygons = [],
  initialPolygon = [],
  onPolygonComplete,
  onPolygonUpdate,
  onPolygonDelete,
  mapHeight = '500px',
  showDrawingManager = false
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_KEY_PROD,
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const polygonRefs = useRef([]);
  const [draftPath, setDraftPath] = useState([]);
  const [completedPath, setCompletedPath] = useState([]);

  const onMapLoad = useCallback((map) => {
    setMap(map);
    map.setCenter(center);
    
  }, [center]);

  useEffect(() => {
    if (map) {
      setIsMapLoaded(true);
    }
  }, [map]);

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
    if (showDrawingManager && Array.isArray(initialPolygon) && initialPolygon.length >= 3) {
      setDraftPath(initialPolygon);
      setCompletedPath([]);
    }
  }, [initialPolygon, showDrawingManager]);

  useEffect(() => {
    return () => {
      setDraftPath([]);
    };
  }, []);

  const handleMapClick = useCallback((event) => {
    if (!showDrawingManager || !event?.latLng) return;
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setDraftPath((prev) => [...prev, { lat, lng }]);
  }, [showDrawingManager]);

  const handleUndoPoint = useCallback(() => {
    setDraftPath((prev) => prev.slice(0, -1));
  }, []);

  const handleClearDraft = useCallback(() => {
    setDraftPath([]);
    setCompletedPath([]);
  }, []);

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
      {showDrawingManager && (
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
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={zoom}
          options={mapOptions}
          onLoad={onMapLoad}
          onClick={handleMapClick}
        >
          {isMapLoaded && showDrawingManager && completedPath.length > 0 && draftPath.length === 0 && (
            <Polygon
              path={completedPath}
              options={{
                ...polygonOptions,
                editable: false,
                draggable: false,
              }}
            />
          )}

          {isMapLoaded && showDrawingManager && draftPath.length > 0 && (
            <Polygon
              path={draftPath}
              options={{
                ...polygonOptions,
                editable: false,
                draggable: false,
              }}
            />
          )}

          {isMapLoaded && showDrawingManager && draftPath.map((point, index) => (
            <Marker
              key={`${point.lat}-${point.lng}-${index}`}
              position={point}
              label={`${index + 1}`}
            />
          ))}
          {isMapLoaded && !showDrawingManager && Array.isArray(initialPolygon) && initialPolygon.length > 0 && (
            <Polygon
              path={initialPolygon}
              options={{
                ...polygonOptions,
                editable: false,
                draggable: false,
              }}
            />
          )}

          {isMapLoaded && existingPolygons.map((polygonCoords, index) => (
            <Polygon
              key={index}
              path={polygonCoords}
              options={{ ...polygonOptions }}
              onLoad={polygon => {
                polygonRefs.current[index] = polygon;
              }}
              onMouseUp={() => {
                if (polygonRefs.current[index]) {
                  handlePolygonPathChange(polygonRefs.current[index], index);
                }
              }}
              onDragEnd={() => {
                if (polygonRefs.current[index]) {
                  handlePolygonPathChange(polygonRefs.current[index], index);
                }
              }}
              onChange={() => {
                if (polygonRefs.current[index]) {
                  handlePolygonPathChange(polygonRefs.current[index], index);
                }
              }}
              onRightClick={() => handlePolygonDelete(index)}
            />
          ))}
        </GoogleMap>
        {showDrawingManager && (
          <div className="absolute right-3 top-3 z-10 flex gap-2 rounded-lg bg-white/95 p-2 shadow-md">
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
        )}
      </div>
    </div>
  );
};

export default GoogleMapDrawing; 