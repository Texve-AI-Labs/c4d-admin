import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader, Typography } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import DynamicTextFilters from './DynamicTextFilters';

const uiTypeLabel = (value) => String(value || '-').toUpperCase();

const getBadgeClasses = (kind, value) => {
  const normalized = String(value || '').toUpperCase();

  if (kind === 'appScope') {
    if (normalized === 'CUSTOMER') return 'bg-blue-100 text-blue-700';
    if (normalized === 'DRIVER') return 'bg-amber-100 text-amber-700';
    // if (normalized === 'ADMIN') return 'bg-purple-100 text-purple-700';
  }

  if (kind === 'type') {
    if (normalized === 'TEXT') return 'bg-emerald-100 text-emerald-700';
    if (normalized === 'IMAGE') return 'bg-indigo-100 text-indigo-700';
  }

  if (kind === 'status') {
    if (normalized === 'ACTIVE' || value === true) return 'bg-green-100 text-green-700';
    if (normalized === 'INACTIVE' || value === false) return 'bg-red-100 text-red-700';
  }

  return 'bg-gray-100 text-gray-700';
};

export function listDynamicText() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    appScope: '',
    screen: '',
    type: '',
    isActive: '',
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
      );
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_UI_CONTENT, params);
      setItems(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load UI contents:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filters.appScope, filters.screen, filters.type, filters.isActive]);

//   const confirmDelete = async (id) => {
//     const result = await Swal.fire({
//       title: 'Delete UI content?',
//       text: 'This action cannot be undone.',
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonText: 'Delete',
//       cancelButtonText: 'Cancel',
//     });
//     if (!result.isConfirmed) return;

//     const response = await ApiRequestUtils.delete(`${API_ROUTES.DELETE_UI_CONTENT}/${id}`);
//     if (response?.success) {
//       await fetchItems();
//     }
//   };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <DynamicTextFilters
            filters={filters}
            onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          />
        </div>
        <div className="flex justify-end px-6 md:px-0">
          <Button className="rounded-2xl px-3 py-3  bg-primary" onClick={() => navigate('/dashboard/vendors/dynamic-text/add')}>
            Add new
          </Button>
        </div>
      </div>

      <Card className="mt-8">
        <CardHeader variant="gradient" className={`mb-4 p-6 ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">
            Dynamic Text List
          </Typography>
        </CardHeader>
        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">          
          {loading ? (
            <div className="px-6 py-4">Loading...</div>
          ) : (
            <table className="w-full min-w-max table-auto">
              <thead>
                <tr>
                  {['Key', 'App Scope', 'Screen', 'Type', 'Value', 'Status', 'Actions'].map((heading) => (
                    <th key={heading} className="border-b py-3 px-5 text-left text-sm">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-sm text-gray-600" colSpan={7}>
                      No UI content found.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td className="border-b px-5 py-3 text-sm">{item.key}</td>
                      <td className="border-b px-5 py-3 text-sm">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClasses('appScope', item.appScope)}`}>
                          {item.appScope || '-'}
                        </span>
                      </td>
                      <td className="border-b px-5 py-3 text-sm">{item.screen}</td>
                      <td className="border-b px-5 py-3 text-sm">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClasses('type', item.type)}`}>
                          {uiTypeLabel(item.type)}
                        </span>
                      </td>
                      <td className="border-b px-5 py-3 text-sm">{item.value}</td>
                      <td className="border-b px-5 py-3 text-sm">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClasses('status', item.isActive)}`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="border-b px-5 py-3 text-sm">
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => navigate(`/dashboard/vendors/dynamic-text/edit/${item.id}`)}>
                            Edit
                          </Button>
                          {/* <Button size="sm" color="red" onClick={() => confirmDelete(item.id)}>
                            Delete
                          </Button> */}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default listDynamicText;