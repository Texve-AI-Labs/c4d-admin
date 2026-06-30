import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
} from '@material-tailwind/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';

const VersionControlList = () => {
  const [versionList, setVersionList] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchVersionList = async () => {
      try {
        const res = await ApiRequestUtils.get(API_ROUTES.GET_VERSIONCONTROL);
        if (res?.data) {
          setVersionList(res.data); 
        }
      } catch (error) {
        console.error('Failed to fetch version list');
      }
    };

    fetchVersionList(); 
  }, [location]);

  return (
    <div className="mb-8 mt-14 flex flex-col gap-12">
      <Card>
        <CardHeader
          variant="gradient"
              className="mb-8 p-6 flex justify-between items-center bg-primary"
        >
          <Typography variant="h6" color="white">
            Version Control List
          </Typography>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                <th className="border-b py-3 px-5 text-left">Name</th>
                <th className="border-b py-3 px-5 text-left">Application For</th>
                <th className="border-b py-3 px-5 text-left">Type</th>
                <th className="border-b py-3 px-5 text-left">Latest Version</th>
                <th className="border-b py-3 px-5 text-left">Current Version</th>
                <th className="border-b py-3 px-5 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {versionList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-3 px-5 text-center">
                    No Version Records Found
                  </td>
                </tr>
              ) : (
                versionList.map((item) => (
                  <tr key={item.id || `${item.name}-${item.applicationFor}`} className="border-b">
                    <td className="py-3 px-5">{item.name}</td>
                    <td className="py-3 px-5">{item.applicationFor}</td>
                    <td className="py-3 px-5">{item.type || '-'}</td>
                    <td className="py-3 px-5">{item.latestVersion}</td>
                    <td className="py-3 px-5">
                      {item.currentVersion === true ? "Active" : "Inactive"}
                    </td>
                    <td className="py-3 px-5">
                      <button
                        onClick={() =>
                          navigate('/dashboard/user/versionControl/edit', {
                            state: item,
                          })
                        }
                           className="bg-primary-500 text-white px-4 py-1 rounded hover:bg-primary-600"
                      >
                        EDIT
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
};

export default VersionControlList;
