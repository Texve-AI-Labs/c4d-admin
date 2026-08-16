import React, { useEffect, useRef, useState, useCallback } from 'react';
import { themeColors } from '@/theme/colors';
import { useLoadScript, GoogleMap, Polygon, Marker } from '@react-google-maps/api';
import { PencilSquareIcon, CursorArrowRaysIcon, ArrowsPointingOutIcon, RectangleGroupIcon, ArrowUturnLeftIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';

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
  onToolChange,
  initialTool = 'draw',
  overlapWarning = '',
  mapHeight = '500px',
  showDrawingManager = false,
  isEditingExistingPolygon = false
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_KEY_UAT,
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const polygonRefs = useRef([]);
  const [draftPath, setDraftPath] = useState([]);
  const [completedPath, setCompletedPath] = useState([]);
  const [activeTool, setActiveTool] = useState(initialTool);
  const [drawShape, setDrawShape] = useState('polygon');
  const [shapeSize, setShapeSize] = useState('medium');
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [toolbarExpanded, setToolbarExpanded] = useState(false);
  const mapWrapperRef = useRef(null);
  const hasEditablePolygon = isEditingExistingPolygon && Array.isArray(initialPolygon) && initialPolygon.length >= 3;
  const isEditMode = showDrawingManager && hasEditablePolygon && activeTool === 'edit';
  const isCreateMode = showDrawingManager && activeTool === 'draw';
  const isPresetShape = activeTool === 'draw' && drawShape !== 'polygon';

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
    // console.log('Polygon completed');
    
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
    // console.log('Polygon path changed');
    
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
    
    // console.log('Updated coordinates:', coordinates);
    if (onPolygonUpdate) {
      onPolygonUpdate(coordinates, index);
    }
  }, [onPolygonUpdate]);

  const getPolygonCoordinates = useCallback((polygon) => {
    if (!polygon?.getPath) return [];
    return polygon.getPath().getArray().map((coord) => ({
      lat: coord.lat(),
      lng: coord.lng(),
    }));
  }, []);

  // Add handlers for polygon deletion
  const handlePolygonDelete = useCallback((index) => {
    if (onPolygonDelete) {
      onPolygonDelete(index);
    }
  }, [onPolygonDelete]);

  const buildPresetPolygon = useCallback((centerPoint, shape) => {
    const lat = centerPoint?.lat;
    const lng = centerPoint?.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number') return [];

    const sizeMultiplier = shapeSize === 'small' ? 0.85 : shapeSize === 'large' ? 2.0 : 1.35;
    const offset = 0.015 * sizeMultiplier;
    if (shape === 'rectangle') {
      return [
        { lat: lat + offset, lng: lng - offset },
        { lat: lat + offset, lng: lng + offset },
        { lat: lat - offset, lng: lng + offset },
        { lat: lat - offset, lng: lng - offset },
      ];
    }

    if (shape === 'triangle') {
      return [
        { lat: lat + offset, lng: lng },
        { lat: lat - offset, lng: lng + offset },
        { lat: lat - offset, lng: lng - offset },
      ];
    }

    return [];
  }, [shapeSize]);

  useEffect(() => {
    if (!showDrawingManager) {
      setDraftPath([]);
      setCompletedPath([]);
      setToolbarExpanded(false);
    }
  }, [showDrawingManager]);

  useEffect(() => {
    setActiveTool(initialTool);
  }, [initialTool]);

  useEffect(() => {
    if (overlapWarning && showDrawingManager) {
      setToolbarExpanded(true);
    }
  }, [overlapWarning, showDrawingManager]);

  useEffect(() => {
    if (!showDrawingManager) {
      setToolbarExpanded(false);
    }
  }, [showDrawingManager]);

  useEffect(() => {
    if (showDrawingManager && !hasEditablePolygon && Array.isArray(initialPolygon) && initialPolygon.length >= 3) {
      setDraftPath(initialPolygon);
      setCompletedPath([]);
    }
  }, [initialPolygon, showDrawingManager, hasEditablePolygon]);

  useEffect(() => {
    if (hasEditablePolygon && activeTool === 'draw') {
      setDraftPath([]);
      setCompletedPath([]);
    }
  }, [activeTool, hasEditablePolygon]);

  useEffect(() => {
    if (typeof onToolChange === 'function') {
      const tool = activeTool;
      const id = window.setTimeout(() => {
        onToolChange(tool);
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [activeTool, onToolChange]);

  useEffect(() => {
    return () => {
      setDraftPath([]);
    };
  }, []);

  const handleMapClick = useCallback((event) => {
    if (!showDrawingManager || hasEditablePolygon || activeTool !== 'draw' || !event?.latLng) return;
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    // console.log('[GoogleMapDrawing] map click', {
    //   activeTool,
    //   drawShape,
    //   isPresetShape,
    //   lat,
    //   lng,
    // });
    if (drawShape === 'rectangle' || drawShape === 'triangle') {
      const presetPath = buildPresetPolygon({ lat, lng }, drawShape);
      if (!presetPath.length) return;
      // console.log('[GoogleMapDrawing] preset polygon created', {
      //   shape: drawShape,
      //   size: shapeSize,
      //   points: presetPath.length,
      //   presetPath,
      // });
      setDraftPath(presetPath);
      setCompletedPath([]);
      if (onDraftChange) {
        onDraftChange(presetPath);
      }
      if (onPolygonComplete) {
        onPolygonComplete(presetPath);
      }
      return;
    }
    setDraftPath((prev) => {
      const next = [...prev, { lat, lng }];
      if (onDraftChange) {
        onDraftChange(next);
      }
      return next;
    });
  }, [activeTool, showDrawingManager, hasEditablePolygon, onDraftChange, drawShape, buildPresetPolygon, onPolygonComplete]);

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
    setActiveTool('draw');
    setDrawShape('polygon');
    setShapeSize('medium');
    setShowMoreTools(false);
    if (onDraftChange) {
      onDraftChange([]);
    }
  }, [onDraftChange]);

  const handleFinishDraft = useCallback(() => {
    // console.log('[GoogleMapDrawing] finish draft clicked', {
    //   draftPoints: draftPath.length,
    //   draftPath,
    //   activeTool,
    //   drawShape,
    // });
    if (draftPath.length < 3) {
      window.alert('Please add at least 3 points before finishing the polygon.');
      return;
    }

    setCompletedPath(draftPath);
    setDraftPath([]);
    setActiveTool('draw');
    if (onDraftChange) {
      onDraftChange(draftPath);
    }
    if (onPolygonComplete) {
      onPolygonComplete(draftPath);
    }
  }, [draftPath, onPolygonComplete, onDraftChange]);

  const handleToggleFullscreen = useCallback(async () => {
    const element = mapWrapperRef.current;
    if (!element) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen?.();
      return;
    }
    await element.requestFullscreen?.();
  }, []);

  const handleToggleToolbar = useCallback(() => {
    setToolbarExpanded((prev) => !prev);
  }, []);

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
        <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-3 py-2 text-xs text-blue-gray-700">
          <div className="flex items-center gap-2 font-medium text-blue-gray-800">
            <PencilSquareIcon className="h-4 w-4 text-blue-600" />
            <span>Drawing mode active</span>
          </div>
          <div className="mt-1 text-[11px] text-blue-gray-600">
            Click points on the map to draw. Use the toolbar for shape presets and save actions.
          </div>
        </div>
      )}
      {isEditMode && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs text-blue-gray-700">
          <div className="flex items-center gap-2 font-medium text-blue-gray-800">
            <ArrowsPointingOutIcon className="h-4 w-4 text-emerald-700" />
            <span>Drag vertices to edit</span>
          </div>
          <div className="mt-1 text-[11px] text-blue-gray-600">
            Move the visible corner handles, then save when finished.
          </div>
        </div>
      )}
      {overlapWarning && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
          {overlapWarning}
        </div>
      )}
      <div ref={mapWrapperRef} style={{ height: mapHeight }} className="w-full relative">
        {showDrawingManager && !toolbarExpanded && (
          <button
            type="button"
            onClick={handleToggleToolbar}
            className="absolute left-1/2 top-2 z-10 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-blue-gray-700 shadow-md ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
          >
            <RectangleGroupIcon className="h-4 w-4" />
            Tools
          </button>
        )}
        {showDrawingManager && toolbarExpanded && (
          <div className="absolute left-1/2 top-2 z-10 w-[min(92vw,460px)] -translate-x-1/2 rounded-xl bg-white/95 p-2 shadow-md ring-1 ring-black/5 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-blue-gray-500">
                <RectangleGroupIcon className="h-4 w-4" />
                <span>Tools</span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={handleToggleToolbar}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-gray-100 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-blue-gray-700 transition hover:bg-blue-gray-200"
                >
                  Collapse
                </button>
                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-gray-100 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-blue-gray-700 transition hover:bg-blue-gray-200"
                >
                  <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
                  Full Screen
                </button>
                <button
                  type="button"
                  onClick={() => setShowMoreTools((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-gray-100 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-blue-gray-700 transition hover:bg-blue-gray-200"
                >
                  More
                </button>
                <div className={`rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide ${isEditMode ? 'bg-emerald-100 text-emerald-800' : activeTool === 'draw' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                  {isEditMode ? 'Edit Existing' : activeTool === 'draw' ? 'Draw New' : 'Idle'}
                </div>
              </div>
            </div>
            {showMoreTools && (
              <div className="mt-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1.5">
                {activeTool === 'draw' && (
                  <>
                    <div className="flex flex-wrap gap-1">
                {[
                  { key: 'polygon', label: 'Polygon' },
                  { key: 'rectangle', label: 'Rectangle' },
                  { key: 'triangle', label: 'Triangle' },
                ].map((shape) => (
                  <button
                    key={shape.key}
                    type="button"
                    onClick={() => setDrawShape(shape.key)}
                    className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide transition ${
                      drawShape === shape.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100'
                    }`}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>
                    {drawShape !== 'polygon' && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                <span className="text-[8px] font-semibold uppercase tracking-wide text-blue-gray-500">
                  Size
                </span>
                {[
                  { key: 'small', label: 'Small' },
                  { key: 'medium', label: 'Medium' },
                  { key: 'large', label: 'Large' },
                ].map((size) => (
                  <button
                    key={size.key}
                    type="button"
                    onClick={() => setShapeSize(size.key)}
                    className={`rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide transition ${
                      shapeSize === size.key
                        ? 'bg-red-600 text-white'
                        : 'bg-white text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {isEditMode && (
              <div className="mt-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-[10px] text-blue-gray-700">
                Edit Existing mode: drag the visible corner handles to reshape the polygon.
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-1">
              <button type="button" className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition ${activeTool === 'draw' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`} onClick={() => setActiveTool('draw')}>
                <PencilSquareIcon className="h-4 w-4" />
                Draw New
              </button>
              <button type="button" className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition ${activeTool === 'edit' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`} onClick={() => setActiveTool('edit')}>
                <ArrowsPointingOutIcon className="h-4 w-4" />
                Edit Existing
              </button>
              {activeTool === 'draw' && (
                  <button type="button" className="inline-flex items-center justify-center gap-1 rounded-md bg-blue-600 px-2 py-1.5 text-[10px] font-medium text-white transition hover:bg-blue-700" onClick={handleFinishDraft}>
                    <CheckIcon className="h-4 w-4" />
                    Save Draft
                  </button>
              )}
            </div>
            {showMoreTools && activeTool === 'draw' && (
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  <button type="button" className="inline-flex items-center justify-center gap-1 rounded-md bg-gray-200 px-2 py-1.5 text-[11px] font-medium text-gray-800 transition hover:bg-gray-300" onClick={handleUndoPoint}>
                    <ArrowUturnLeftIcon className="h-4 w-4" />
                    Undo
                  </button>
                  <button type="button" className="inline-flex items-center justify-center gap-1 rounded-md bg-red-100 px-2 py-1.5 text-[11px] font-medium text-red-700 transition hover:bg-red-200" onClick={handleClearDraft}>
                    <TrashIcon className="h-4 w-4" />
                    Clear
                  </button>
                </div>
            )}
          </div>
        )}
        {isCreateMode && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-md">
            {drawShape === 'polygon' ? 'Draw Tool Active' : `Shape: ${drawShape}`}
          </div>
        )}
        {isEditMode && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-emerald-700 px-3 py-2 text-xs font-semibold bg-primary text-white shadow-lg ring-2 ring-emerald-200">
            Edit Mode: Drag Vertices
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
              onLoad={(polygon) => {
                if (polygon) {
                  polygonRefs.current[0] = polygon;
                }
              }}
              onDragEnd={() => {
                return;
              }}
            />
          )}

          {isMapLoaded && isCreateMode && draftPath.length > 0 && (
            <Polygon
              path={draftPath}
              options={{
                ...polygonOptions,
                editable: isPresetShape,
                draggable: isPresetShape,
              }}
              onLoad={(polygon) => {
                if (isPresetShape) {
                  polygonRefs.current[1] = polygon;
                }
              }}
              onDragEnd={() => {
                if (isPresetShape && polygonRefs.current[1]) {
                  const next = getPolygonCoordinates(polygonRefs.current[1]);
                  setDraftPath(next);
                  if (onDraftChange) {
                    onDraftChange(next);
                  }
                  if (onPolygonComplete) {
                    onPolygonComplete(next);
                  }
                }
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
                clickable: false,
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
              onRightClick={() => handlePolygonDelete(editablePolygonIndex)}
            />
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default GoogleMapDrawing; 
