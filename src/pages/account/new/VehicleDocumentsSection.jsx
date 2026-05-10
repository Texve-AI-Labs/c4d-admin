import React from "react";
import { Card, CardBody, Chip, Typography } from "@material-tailwind/react";

const VehicleDocumentsSection = ({ rows, getStatusChipColor }) => {
  return (
    <Card className="bg-white border border-blue-gray-100 shadow-sm md:col-span-2">
      <CardBody>
        <Typography variant="h5" className="text-blue-gray-900 font-semibold rounded-md px-3 py-2 inline-block">
          Vehicle Documents
        </Typography>
        <div className="border-t border-blue-gray-50 mt-3 mb-3" />
        {rows.length === 0 ? (
          <Typography className="text-black mt-2">-</Typography>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-blue-100 bg-blue-50">
                  {["Type", "Status", "Created At", "Updated At", "Verified By", "Verified At"].map((header) => (
                    <th key={header} className="px-3 py-2">
                      <Typography className="text-blue-700 font-semibold">{header}</Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-blue-gray-50">
                    <td className="px-3 py-2">
                      <Typography className="text-blue-gray-900 font-medium">{row.type}</Typography>
                    </td>
                    <td className="px-3 py-2">
                      <Chip value={row.status} color={getStatusChipColor(row.status)} variant="ghost" className="w-fit" />
                    </td>
                    <td className="px-3 py-2">
                      <Typography className="text-blue-gray-900 font-medium">{row.createdAt}</Typography>
                    </td>
                    <td className="px-3 py-2">
                      <Typography className="text-blue-gray-900 font-medium">{row.updatedAt}</Typography>
                    </td>
                    <td className="px-3 py-2">
                      <Typography className="text-blue-gray-900 font-medium">{row.verifiedBy}</Typography>
                    </td>
                    <td className="px-3 py-2">
                      <Typography className="text-blue-gray-900 font-medium">{row.verifiedAt}</Typography>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default VehicleDocumentsSection;
