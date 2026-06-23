import React, { useState, useEffect } from 'react';
import { Typography, Button, IconButton, Dialog, DialogBody, DialogFooter, DialogHeader, Select, Option } from '@material-tailwind/react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import ZoneForm from '../ZoneForm';
import GoogleMapDrawing from '../../../components/GoogleMapDrawing';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';

const ZonesTab = () => {
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
    }
  }, [selectedServiceArea]);

  const fetchServiceAreas = async () => {
    try {
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {type: 'Service Area'});
      if (response?.success) {
        setServiceAreas(response.data || []);
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
        setZones(response.data || []);
        setUpdatedZones(response.data || []);
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
    setTimeout(() => setShowDrawingManager(true), 500);
  };

  const handleCancel = () => {
    setShowDrawingManager(false);
    setIsCreating(false);
    setShowForm(false);
    setSelectedPolygon(null);
    setSelectedItem(null);
    setCoordinates(null);
  };

  const handlePolygonUpdate = (newCoordinates, index) => {
    setUpdatedZones(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        coordinates: newCoordinates
      };
      return updated;
    });
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
      if (selectedItem) {
        const index = zones.findIndex(zone => zone.id === selectedItem.id);
        if (index !== -1) {
          const response = await ApiRequestUtils.update(`${API_ROUTES.GEO_MARKINGS}/${selectedItem.id}`, {
            ...selectedItem,
            ...formData,
            coordinates: updatedZones[index].coordinates,
            type: 'Zone',
            parent_id: selectedServiceArea
          });
          
          if (!response?.success) {
            throw new Error(response?.message || 'Failed to update zone');
          }
        }
      } else {
        const response = await ApiRequestUtils.post(API_ROUTES.GEO_MARKINGS, {
          ...formData,
          coordinates: coordinates,
          type: 'Zone',
          parent_id: selectedServiceArea
        });
        
        if (!response?.success) {
          throw new Error(response?.message || 'Failed to create zone');
        }
      }
      
      setShowDrawingManager(false);
      setIsCreating(false);
      setCoordinates(null);
      await fetchZones();
      handleCancel();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (zone) => {
    const index = zones.findIndex(z => z.id === zone.id);
    setSelectedItem(zone);
    setShowForm(true);
    setCoordinates(updatedZones[index].coordinates);
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
    setCoordinates(Array.isArray(coords) ? [...coords] : coords);
  };

  const handleServiceAreaChange = (value) => {
    setSelectedServiceArea(value);
    setError(null);
  };

  const selectedServiceAreaName =
    serviceAreas.find((area) => String(area.id) === String(selectedServiceArea))?.name || '';

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
          <div className="h-[500px] w-full">
            <GoogleMapDrawing
              onPolygonComplete={handlePolygonComplete}
              onPolygonUpdate={handlePolygonUpdate}
              onPolygonDelete={handlePolygonDelete}
              existingPolygons={selectedItem ? updatedZones.map(zone => zone.coordinates) : []}
              hideExistingPolygons={!selectedItem}
              showDrawingManager={showDrawingManager}
              initialPolygon={selectedItem?.coordinates}
              mapHeight="500px"
            />
          </div>
        </div>
        {showForm && (
          <ZoneForm
            onSave={handleSave}
            initialData={selectedItem}
            coordinates={selectedItem ? 
              updatedZones[zones.findIndex(z => z.id === selectedItem.id)]?.coordinates 
              : coordinates}
            serviceAreaId={selectedServiceArea}
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
                  <IconButton
                    color="red"
                    variant="text"
                    onClick={() => setDeleteDialog({ open: true, item: zone })}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} handler={() => setDeleteDialog({ open: false, item: null })}>
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
      </Dialog>
    </div>
  );
};

export default ZonesTab; 