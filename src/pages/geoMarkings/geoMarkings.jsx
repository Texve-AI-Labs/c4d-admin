import React, { useState, useEffect } from 'react';
import { Tabs, Tab, TabsHeader, TabsBody, TabPanel, Typography } from '@material-tailwind/react';
import ServiceAreasTab from './containers/ServiceAreasTab';
import ZonesTab from './containers/ZonesTab';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';

const GeoMarkings = () => {
  const [activeTab, setActiveTab] = useState('serviceAreas');
  const [selectedItem, setSelectedItem] = useState(null);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [zones, setZones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedPolygon, setSelectedPolygon] = useState(null);

  useEffect(() => {
    const fetchGeoMarkings = async () => {
      try {
        const [serviceAreasResponse, zonesResponse] = await Promise.all([
          ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: 'Service Area' }),
          ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: 'Zone' }),
        ]);

        if (serviceAreasResponse?.success) {
          setServiceAreas(Array.isArray(serviceAreasResponse.data) ? serviceAreasResponse.data : []);
        }

        if (zonesResponse?.success) {
          setZones(Array.isArray(zonesResponse.data) ? zonesResponse.data : []);
        }
      } catch (error) {
        console.error('Failed to fetch geo markings:', error);
      }
    };

    fetchGeoMarkings();
  }, []);

  const handlePolygonComplete = (coordinates) => {
    setSelectedPolygon(coordinates);
    setShowForm(true);
  };

  const handleServiceAreaSave = (formData) => {
    if (!selectedPolygon) return;

    const newServiceArea = {
      ...formData,
      coordinates: selectedPolygon,
    };

    // TODO: Save to API
    setServiceAreas([...serviceAreas, newServiceArea]);
    setShowForm(false);
    setSelectedPolygon(null);
  };

  const handleZoneSave = (formData) => {
    if (!selectedPolygon) return;

    const newZone = {
      ...formData,
      coordinates: selectedPolygon,
    };

    // TODO: Save to API
    setZones([...zones, newZone]);
    setShowForm(false);
    setSelectedPolygon(null);
  };

  const tabProps = {
    showForm,
    setShowForm,
    selectedPolygon,
    setSelectedPolygon,
    handlePolygonComplete,
    selectedItem,
    setSelectedItem,
  };

  const data = [
    {
      label: "Service Areas",
      value: "serviceAreas",
      component: (
        <ServiceAreasTab
          {...tabProps}
          handleServiceAreaSave={handleServiceAreaSave}
          serviceAreas={serviceAreas}
        />
      ),
    },
    {
      label: "City Limit",
      value: "zones",
      component: (
        <ZonesTab
          {...tabProps}
          handleZoneSave={handleZoneSave}
          zones={zones}
          onSaveSuccess={() => setActiveTab('zones')}
        />
      ),
    },
  ];

  return (
    <div className="p-4 bg-white rounded shadow">
      <Typography variant="h4" className="mb-6">GeoMarkings</Typography>
      <Tabs value={activeTab} className="overflow-visible">
        <TabsHeader 
          className="bg-blue-gray-50/60 rounded-lg"
          indicatorProps={{
            className: "bg-primary/80 shadow-md shadow-primary/20 ",
          }}
        >
          {data.map(({ label, value }) => (
            <Tab
              key={value}
              value={value}
              onClick={() => {
                setActiveTab(value);
                setSelectedItem(null);
                setShowForm(false);
                setSelectedPolygon(null);
              }}
              className={`${
                activeTab === value 
                  ? "text-white" 
                  : "text-blue-gray-900"
              } font-medium text-base py-4`}
            >
              {label}
            </Tab>
          ))}
        </TabsHeader>
        <TabsBody 
          animate={{
            initial: { opacity: 0, y: 10 },
            mount: { opacity: 1, y: 0 },
            unmount: { opacity: 0, y: 10 },
          }}
          className="mt-8"
        >
          {data.map(({ value, component }) => (
            <TabPanel key={value} value={value} className="p-0">
              {component}
            </TabPanel>
          ))}
        </TabsBody>
      </Tabs>
    </div>
  );
};

export default GeoMarkings; 
