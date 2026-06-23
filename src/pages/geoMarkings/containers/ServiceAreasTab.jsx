import React, { useState, useEffect } from 'react';
import { Typography, Button, IconButton, Dialog, DialogBody, DialogFooter, DialogHeader } from '@material-tailwind/react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import ServiceAreaForm from '../ServiceAreaForm';
import GoogleMapDrawing from '../../../components/GoogleMapDrawing';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';

const ServiceAreasTab = () => {
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showDrawingManager, setShowDrawingManager] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [selectedPolygon, setSelectedPolygon] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [updatedServiceAreas, setUpdatedServiceAreas] = useState([]);  // Local copy for updates
  const [zones, setZones] = useState([]);      
  const [zoneAlertOpen, setZoneAlertOpen] = useState(false);        
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

  useEffect(() => {
    fetchServiceAreas();
    fetchZones();                                      
  }, []);

  const fetchServiceAreas = async () => {
    try {
      setIsLoading(true);
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {type: 'Service Area'});
      if (response?.success) {
        setServiceAreas(response.data || []);
        setUpdatedServiceAreas(response.data || []); // Initialize local copy
      } else {
        throw new Error(response?.message || 'Failed to fetch service areas');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchZones = async () => {                      
    try {
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {type: 'Zone'});
      if (response?.success) {
        setZones(response.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNew = () => {
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

  const handleSave = async (formData) => {
    try {
      // If we're editing an existing area
      if (selectedItem) {
        const index = serviceAreas.findIndex(area => area.id === selectedItem.id);
        if (index !== -1) {
          const response = await ApiRequestUtils.update(`${API_ROUTES.GEO_MARKINGS}/${selectedItem.id}`, {
            ...selectedItem,
            ...formData,
            coordinates: updatedServiceAreas[index].coordinates // Always use updatedServiceAreas
          });
          
          if (!response?.success) {
            throw new Error(response?.message || 'Failed to update service area');
          }
        }
      } else {
        // Handle new area creation
        const response = await ApiRequestUtils.post(API_ROUTES.GEO_MARKINGS, {
          ...formData,
          coordinates: coordinates,
          type: 'Service Area'
        });
        
        if (!response?.success) {
          throw new Error(response?.message || 'Failed to create service area');
        }
      }
      
      setShowDrawingManager(false);
      setIsCreating(false);
      setCoordinates(null);
      await fetchServiceAreas(); // Refresh the list
      handleCancel();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (area) => {
    const index = serviceAreas.findIndex(a => a.id === area.id);
    setSelectedItem(area);
    setShowForm(true);
    setCoordinates(updatedServiceAreas[index].coordinates); // Use updatedServiceAreas
    setTimeout(() => setShowDrawingManager(true), 500);
  };

  const handleDeleteClick = (area) => {              
    const hasZone = zones.some(
      (zone) => zone.parent_id === area.id
    );

     if (hasZone) {
    setZoneAlertOpen(true); 
    return;
  }

    setDeleteDialog({ open: true, item: area });
  };

  const handleDelete = async () => {
    try {
      const response = await ApiRequestUtils.delete(`${API_ROUTES.GEO_MARKINGS_DELETE}/${deleteDialog.item.id}`);
      if (response?.success) {
        await fetchServiceAreas(); // Refresh the list
      } else {
        throw new Error(response?.message || 'Failed to delete service area');
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

  const handlePolygonUpdate = (newCoordinates, index) => {
    setUpdatedServiceAreas(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        coordinates: newCoordinates
      };
      console.log("updated on tab", updated);
      return updated;
    });
  };

  const handlePolygonDelete = async (index) => {
    try {
      const areaToDelete = serviceAreas[index];
      setDeleteDialog({ open: true, item: areaToDelete });
    } catch (err) {
      setError(err.message);
    }
  };

  // Show create/edit form with map
  if (isCreating || selectedItem) {
    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h5">
            {selectedItem ? 'Edit Service Area' : 'Create New Service Area'}
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
            Draw a polygon on the map to define your service area boundaries
          </Typography>
          <div className="h-[500px] w-full">
            <GoogleMapDrawing
              onPolygonComplete={handlePolygonComplete}
              onPolygonUpdate={handlePolygonUpdate}
              onPolygonDelete={handlePolygonDelete}
              existingPolygons={selectedItem ? updatedServiceAreas.map(area => area.coordinates) : []}
              hideExistingPolygons={!selectedItem}
              showDrawingManager={showDrawingManager}
              initialPolygon={selectedItem?.coordinates}
              mapHeight="500px"
            />
          </div>
        </div>
        {showForm && (
          <ServiceAreaForm
            onSave={handleSave}
            initialData={selectedItem}
            coordinates={selectedItem ? 
              updatedServiceAreas[serviceAreas.findIndex(a => a.id === selectedItem.id)]?.coordinates 
              : coordinates}
          />
        )}
      </div>
    );
  }

  // Show list view by default
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h5">Service Areas</Typography>
        <Button
          color="blue"
          onClick={handleCreateNew}
        >
          Create New Service Area
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">
          <Typography color="gray">Loading service areas...</Typography>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <Typography>{error}</Typography>
        </div>
      ) : serviceAreas.length === 0 ? (
        <div className="text-center py-8 bg-blue-gray-50/30 rounded-lg">
          <Typography color="gray" className="font-medium">
            No service areas defined yet
          </Typography>
          <Typography color="gray" variant="small" className="mt-1">
            Click 'Create New Service Area' to get started
          </Typography>
        </div>
      ) : (
        <div className="grid gap-4">
          {serviceAreas.map((area) => (
            <div 
              key={area.id} 
              className="p-4 border border-blue-gray-100 rounded-lg hover:border-blue-gray-200 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <Typography variant="h6" color="blue-gray">
                    {area.name}
                  </Typography>
                  {area.description && (
                    <Typography variant="small" color="gray" className="mt-1">
                      {area.description}
                    </Typography>
                  )}
                </div>
                <div className="flex gap-2">
                  <IconButton
                    color="blue"
                    variant="text"
                    onClick={() => handleEdit(area)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    color="red"
                    variant="text"
                    onClick={() => handleDeleteClick(area)} 
                  >
                    <TrashIcon className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog
  open={zoneAlertOpen}
  handler={() => setZoneAlertOpen(false)}
>

  <DialogBody className='text-black'>
    To proceed with deletion, please ensure that the associated zone is deleted first.
  </DialogBody>
  <DialogFooter>
    <Button
      color="red"
      onClick={() => setZoneAlertOpen(false)}
    >
      OK
    </Button>
  </DialogFooter>
</Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} handler={() => setDeleteDialog({ open: false, item: null })}>
        <DialogHeader>Confirm Deletion</DialogHeader>
        <DialogBody>
          Are you sure you want to delete the service area "{deleteDialog.item?.name}"? This action cannot be undone.
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

export default ServiceAreasTab; 