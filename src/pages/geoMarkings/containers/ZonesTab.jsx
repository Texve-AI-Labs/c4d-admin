import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Button, IconButton, Dialog, DialogBody, DialogFooter, DialogHeader, Select, Option } from '@material-tailwind/react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import ZoneForm from '../ZoneForm';
import GoogleMapDrawing from '../../../components/GoogleMapDrawing';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';
import { polygonsOverlap } from '../utils/geoPolygonUtils';

const ZonesTab = ({ onSaveSuccess } = {}) => {
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showDrawingManager, setShowDrawingManager] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [selectedPolygon, setSelectedPolygon] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [zones, setZones] = useState([]);
  const [updatedZones, setUpdatedZones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
  const [serviceAreas, setServiceAreas] = useState([]);
  const [selectedServiceArea, setSelectedServiceArea] = useState(null);
  const [selectedDescription, setSelectedDescription] = useState('');
  const normalizeZoneType = (value) => String(value || '').trim().toLowerCase();
  const getOverlapType = (value) => {
    const type = normalizeZoneType(value);
    if (type === 'city') return 'city';
    if (type === 'prime') return 'prime';
    if (type === 'zone') return 'zone';
    return '';
  };
  const selectedZoneRecord = useMemo(() => {
    return zones.find((zone) => String(zone?.id) === String(selectedItem?.id)) || null;
  }, [selectedItem, zones]);
  const activeZoneId = selectedItem?.id ?? selectedZoneRecord?.id ?? null;
  const activeZoneType = getOverlapType(selectedItem?.description || selectedZoneRecord?.description);
  const findOverlappingZone = (candidateCoordinates, overlapType) => {
    if (!overlapType) return null;
    return zones
      .filter((zone) => String(zone.id) !== String(activeZoneId))
      .filter((zone) => getOverlapType(zone.description) === overlapType)
      .find((zone) => {
        const polygon = zone.coordinates;
        return Array.isArray(polygon) && polygon.length >= 3 && polygonsOverlap(candidateCoordinates, polygon);
      }) || null;
  };
  const visibleZonePolygons = zones.map((zone) => zone.coordinates);
  const editablePolygonIndex = selectedItem
    ? zones.findIndex((zone) => String(zone.id) === String(activeZoneId))
    : null;
  const visibleZonePolygonStyles = zones.map((zone, index) => {
    const description = String(zone?.description || '').trim().toLowerCase();
    const isSelected = !selectedDescription || selectedDescription === description;
    const isActive = index === editablePolygonIndex;
    if (description === 'city') {
      return { fillColor: '#16a34a', strokeColor: '#166534', fillOpacity: isActive ? 0.55 : isSelected ? 0.42 : 0.18 };
    }
    if (description === 'prime') {
      return { fillColor: '#dc2626', strokeColor: '#991b1b', fillOpacity: isActive ? 0.55 : isSelected ? 0.42 : 0.18 };
    }
    if (description === 'zone' || description === 'all') {
      return { fillColor: '#eab308', strokeColor: '#a16207', fillOpacity: isActive ? 0.52 : isSelected ? 0.4 : 0.16 };
    }
    return { fillColor: '#eab308', strokeColor: '#a16207', fillOpacity: isActive ? 0.5 : 0.16 };
  });
  const focusZonePolygons = zones
    .filter((zone) => !selectedDescription || String(zone?.description || '').trim().toLowerCase() === selectedDescription)
    .map((zone) => zone.coordinates);
  const isOverlappingAnyOtherZone = (candidateCoordinates, overlapType = activeZoneType) => {
    return !!findOverlappingZone(candidateCoordinates, overlapType);
  };
  const isServiceAreaRecord = (area) => {
    const type = String(area?.type || '').trim().toLowerCase();
    const description = String(area?.description || '').trim().toLowerCase();
    return type === 'service area' || description === 'service area';
  };
  const isZoneRecord = (zone) => {
    const type = String(zone?.type || '').trim().toLowerCase();
    return type === 'zone';
  };

  // Fetch service areas on component mount and when tab gains focus
  useEffect(() => {
    fetchServiceAreas();

    // Function to handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchServiceAreas();
      }
    };

    // Function to handle focus
    const handleFocus = () => {
      fetchServiceAreas();
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Fetch zones whenever selected service area changes
  useEffect(() => {
    if (selectedServiceArea) {
      fetchZones();
    } else {
      setZones([]);
      setUpdatedZones([]);
      setSelectedItem(null);
      setShowForm(false);
      setIsCreating(false);
      setShowDrawingManager(false);
      setCoordinates(null);
      setSelectedDescription('');
    }
  }, [selectedServiceArea]);

  const fetchServiceAreas = async () => {
    try {
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {type: 'Service Area'});
      if (response?.success) {
        const areas = Array.isArray(response.data) ? response.data : [];
        setServiceAreas(areas.filter(isServiceAreaRecord));
      } else {
        throw new Error(response?.message || 'Failed to fetch service areas');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchZones = async () => {
    if (!selectedServiceArea) return;
    
    try {
      setIsLoading(true);
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {type: 'Zone',parent_id: selectedServiceArea});
      if (response?.success) {
        const records = Array.isArray(response.data) ? response.data : [];
        const filteredZones = records.filter(isZoneRecord);
        setZones(filteredZones);
        setUpdatedZones(filteredZones);
      } else {
        throw new Error(response?.message || 'Failed to fetch zones');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    if (!selectedServiceArea) {
      setError('Please select a service area first');
      return;
    }
    setIsCreating(true);
    setShowForm(true);
    setSelectedPolygon(null);
    setSelectedItem(null);
    setCoordinates(null);
    setError(null);
    setTimeout(() => setShowDrawingManager(true), 500);
  };

  const handleCancel = () => {
    setShowDrawingManager(false);
    setIsCreating(false);
    setShowForm(false);
    setSelectedPolygon(null);
    setSelectedItem(null);
    setCoordinates(null);
    setSelectedDescription('');
    setError(null);
  };

  const handlePolygonUpdate = (newCoordinates, index) => {
    const overlappingZone = index === 0 ? findOverlappingZone(newCoordinates, activeZoneType) : null;
    if (overlappingZone) {
      setError(
        `This ${overlappingZone?.description || activeZoneType || 'zone'} overlaps an existing ${overlappingZone?.description || activeZoneType || 'zone'}${overlappingZone?.name ? `: ${overlappingZone.name}` : ''}${overlappingZone?.description ? ` (${overlappingZone.description})` : ''}`,
      );
      return;
    }
    setError(null);
    if (selectedItem) {
      setUpdatedZones((prev) => {
        const updated = [...prev];
        const selectedIndex = updated.findIndex((zone) => String(zone.id) === String(selectedItem.id));
        if (selectedIndex !== -1) {
          updated[selectedIndex] = {
            ...updated[selectedIndex],
            coordinates: newCoordinates,
          };
        }
        return updated;
      });
    }
    setCoordinates(newCoordinates);
  };

  const handlePolygonDelete = async (index) => {
    try {
      const zoneToDelete = zones[index];
      setDeleteDialog({ open: true, item: zoneToDelete });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async (formData) => {
    try {
      console.log('ZonesTab handleSave called', {
        selectedItemId: selectedItem?.id,
        selectedServiceArea,
        coordinatesLength: Array.isArray(coordinates) ? coordinates.length : 0,
      });
      const overlapType = getOverlapType(formData?.description || selectedItem?.description || activeZoneType);
      const selectedIndex = zones.findIndex((zone) => String(zone.id) === String(selectedItem?.id));
      const candidateCoordinates =
        coordinates ||
        selectedZoneRecord?.coordinates ||
        [];
      const {
        services,
        quickServices,
        parcelSubServices,
        highlightedService,
        driverServices,
        newServices,
        config_data,
        created_at,
        updated_at,
        ...selectedItemRest
      } = selectedItem || {};
      const sanitizedZonePayload = {
        name: formData?.name?.trim?.() || formData?.name || '',
        description: formData?.description || selectedItem?.description || 'Zone',
        coordinates: candidateCoordinates,
        type: 'Zone',
        parent_id: selectedServiceArea,
        config_data: formData?.config_data || selectedItem?.config_data || null,
        services: [],
        highlightedService: [],
        quickServices: [],
        parcelSubServices: [],
        driverServices: [],
        newServices: null,
      };
      const overlappingZone = findOverlappingZone(candidateCoordinates, overlapType);
      if (overlappingZone) {
        console.warn('ZonesTab save blocked by overlap', {
          selectedItemId: selectedItem?.id,
          overlappingZoneId: overlappingZone.id,
          overlappingZoneName: overlappingZone.name,
          overlappingZoneType: overlappingZone.type,
          overlappingZoneDescription: overlappingZone.description,
        });
        setError(
          `This zone overlaps an existing zone${overlappingZone?.name ? `: ${overlappingZone.name}` : ''}${overlappingZone?.description ? ` (${overlappingZone.description})` : ''}${overlappingZone?.type ? ` [${overlappingZone.type}]` : ''}`,
        );
        return;
      }

      if (selectedItem) {
        console.log('ZonesTab updating zone', selectedItem.id);
        const response = await ApiRequestUtils.update(`${API_ROUTES.GEO_MARKINGS}/${selectedItem.id}`, {
          ...selectedItemRest,
          ...sanitizedZonePayload,
        });

        if (!response?.success) {
          throw new Error(response?.message || 'Failed to update zone');
        }
        console.log('ZonesTab update response', response);
      } else {
        console.log('ZonesTab creating zone');
        const response = await ApiRequestUtils.post(API_ROUTES.GEO_MARKINGS, {
          ...sanitizedZonePayload,
        });
        
        if (!response?.success) {
          throw new Error(response?.message || 'Failed to create zone');
        }
        console.log('ZonesTab create response', response);
      }
      
      setShowDrawingManager(false);
      setIsCreating(false);
      setCoordinates(null);
      setSelectedItem(null);
      await fetchZones();
      handleCancel();
      if (typeof onSaveSuccess === 'function') {
        onSaveSuccess();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (zone) => {
    const index = zones.findIndex(z => z.id === zone.id);
    setSelectedItem(zone);
    setShowForm(true);
    setCoordinates(zone.coordinates || []);
    setTimeout(() => setShowDrawingManager(true), 500);
  };

  const handleDelete = async () => {
    try {
      const response = await ApiRequestUtils.delete(`${API_ROUTES.GEO_MARKINGS_DELETE}/${deleteDialog.item.id}`);
      if (response?.success) {
        await fetchZones();
      } else {
        throw new Error(response?.message || 'Failed to delete zone');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteDialog({ open: false, item: null });
    }
  };

  const handlePolygonComplete = (coords) => {
    const nextCoordinates = Array.isArray(coords) ? [...coords] : coords;
    if (isOverlappingAnyOtherZone(nextCoordinates)) {
      setError('This zone overlaps an existing zone');
      setCoordinates(null);
      return;
    }
    setError(null);
    setCoordinates(nextCoordinates);
  };

  const handleDraftChange = (coords) => {
    if (selectedItem) return;
    const nextCoordinates = Array.isArray(coords) ? [...coords] : coords;
    if (!Array.isArray(nextCoordinates)) return;
    setCoordinates(nextCoordinates);
    setError(null);
  };

  const handleServiceAreaChange = (value) => {
    setSelectedServiceArea(value);
    setError(null);
    setSelectedItem(null);
    setShowForm(false);
    setIsCreating(false);
    setShowDrawingManager(false);
    setCoordinates(null);
    setSelectedDescription('');
  };

  const selectedServiceAreaName =
    serviceAreas.find((area) => String(area.id) === String(selectedServiceArea))?.name || '';
  const selectedServiceAreaPolygon =
    serviceAreas.find((area) => String(area.id) === String(selectedServiceArea))?.coordinates || [];
  // Show create/edit form with map
  if (isCreating || selectedItem) {
    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h5">
            {selectedItem ? 'Edit Zone' : 'Create New Zone'}
          </Typography>
          <Button
            color="red"
            variant="text"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
        <div className="mb-6">
          <Typography variant="small" color="gray" className="mb-2">
            Draw a polygon on the map to define your zone boundaries
          </Typography>
          <div className="mb-3 flex flex-wrap gap-2">
            {[
              { key: '', label: 'All' },
              { key: 'city', label: 'City', color: 'green' },
              { key: 'prime', label: 'Prime', color: 'red' },
              { key: 'zone', label: 'Zone', color: 'yellow' },
            ].map((item) => (
              <button
                key={item.key || 'all'}
                type="button"
                onClick={() => setSelectedDescription(item.key)}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                  selectedDescription === item.key
                    ? item.color === 'green'
                      ? 'border-green-600 bg-green-600 text-white'
                      : item.color === 'red'
                        ? 'border-red-600 bg-red-600 text-white'
                        : item.color === 'yellow'
                          ? 'border-yellow-500 bg-yellow-500 text-white'
                          : 'border-blue-600 bg-blue-600 text-white'
                    : item.color === 'green'
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : item.color === 'red'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : item.color === 'yellow'
                          ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
                          : 'border-blue-gray-200 bg-white text-blue-gray-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="h-[500px] w-full">
            <GoogleMapDrawing
              onPolygonComplete={handlePolygonComplete}
              onDraftChange={handleDraftChange}
              onPolygonUpdate={handlePolygonUpdate}
              onPolygonDelete={handlePolygonDelete}
              backgroundPolygons={Array.isArray(selectedServiceAreaPolygon) ? [selectedServiceAreaPolygon] : []}
              backgroundPolygonStyle={{ fillColor: '#60a5fa', strokeColor: '#2563eb', fillOpacity: 0.1 }}
              existingPolygons={visibleZonePolygons}
              existingPolygonStyles={visibleZonePolygonStyles}
              focusPolygons={focusZonePolygons}
              showDrawingManager={showDrawingManager}
              initialPolygon={coordinates || []}
              editablePolygonIndex={editablePolygonIndex}
              isEditingExistingPolygon={!!selectedItem}
              mapHeight="500px"
            />
          </div>
        </div>
        {showForm && (
          <ZoneForm
            onSave={handleSave}
            initialData={selectedItem}
            coordinates={coordinates}
            serviceAreaId={selectedServiceArea}
            serviceAreaName={selectedServiceAreaName}
          />
        )}
      </div>
    );
  }

  // Show list view by default
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h5">Zones</Typography>
        <Button
          color="blue"
          onClick={handleCreateNew}
          disabled={!selectedServiceArea}
        >
          Create New Zone
        </Button>
      </div>

      {/* Service Area Selection */}
      <div className="mb-6">
        <Select
          label="Select Service Area"
          value={selectedServiceArea}
          onChange={handleServiceAreaChange}
          selected={() => selectedServiceAreaName || ''}
          menuProps={{
            className: 'max-h-20 overflow-y-scroll',
          }}
        >
          {serviceAreas.map((area) => (
            <Option key={area.id} value={String(area.id)}>
              {area.name}
            </Option>
          ))}
        </Select>
      </div>

      {error && (
        <div className="text-center py-4 text-red-500 mb-4">
          <Typography>{error}</Typography>
        </div>
      )}
      
      {!selectedServiceArea ? (
        <div className="text-center py-8 bg-blue-gray-50/30 rounded-lg">
          <Typography color="gray" className="font-medium">
            Please select a service area to view or create zones
          </Typography>
        </div>
      ) : isLoading ? (
        <div className="text-center py-8">
          <Typography color="gray">Loading zones...</Typography>
        </div>
      ) : zones.length === 0 ? (
        <div className="text-center py-8 bg-blue-gray-50/30 rounded-lg">
          <Typography color="gray" className="font-medium">
            No zones defined for this service area
          </Typography>
          <Typography color="gray" variant="small" className="mt-1">
            Click 'Create New Zone' to get started
          </Typography>
        </div>
      ) : (
        <div className="grid gap-4">
          {zones.map((zone) => (
            <div 
              key={zone.id} 
              className="p-4 border border-blue-gray-100 rounded-lg hover:border-blue-gray-200 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <Typography variant="h6" color="blue-gray">
                    {zone.name}
                  </Typography>
                  {zone.description && (
                    <Typography variant="small" color="gray" className="mt-1">
                      {zone.description}
                    </Typography>
                  )}
                </div>
                <div className="flex gap-2">
                  <IconButton
                    color="blue"
                    variant="text"
                    onClick={() => handleEdit(zone)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </IconButton>
                  {/* <IconButton
                    color="red"
                    variant="text"
                    onClick={() => setDeleteDialog({ open: true, item: zone })}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </IconButton> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {/* <Dialog open={deleteDialog.open} handler={() => setDeleteDialog({ open: false, item: null })}>
        <DialogHeader>Confirm Deletion</DialogHeader>
        <DialogBody>
          Are you sure you want to delete the zone "{deleteDialog.item?.name}"? This action cannot be undone.
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="gray"
            onClick={() => setDeleteDialog({ open: false, item: null })}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </Dialog> */}
    </div>
  );
};

export default ZonesTab; 
