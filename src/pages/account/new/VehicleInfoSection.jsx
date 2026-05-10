import React from "react";
import { Card, CardBody, Chip, IconButton, Typography } from "@material-tailwind/react";
import { PencilIcon } from "@heroicons/react/24/solid";

const VehicleInfoSection = ({
  vehicleSections = [],
  getStatusChipColor,
}) => {
  const sections = Array.isArray(vehicleSections) ? vehicleSections : [];

  return (
    <>
      {sections.length === 0 ? (
        <Card className="bg-white border border-blue-gray-100 shadow-sm md:col-span-2">
          <CardBody>
            <Typography variant="h5" className="text-blue-gray-900 font-semibold rounded-md px-3 py-2 inline-block">
              Vehicle Details
            </Typography>
            <div className="border-t border-blue-gray-50 mt-3" />
            <Typography className="text-black mt-2">-</Typography>
          </CardBody>
        </Card>
      ) : (
        sections.map((section) => (
          <React.Fragment key={section.sectionKey || section.id}>
            <Card className="bg-white border border-blue-gray-100 shadow-sm md:col-span-2">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="h5" className="text-blue-gray-900 font-semibold rounded-md px-3 py-2 inline-block">
                      Vehicle Details {section.title ? `(${section.title})` : ""}
                    </Typography>
                    <Typography className="text-xs text-blue-gray-500 px-3 -mt-1">
                      Cab ID: {section.cabId}
                    </Typography>
                  </div>
                  <IconButton variant="text" className="h-9 w-9 rounded-md bg-blue-50 text-blue-600">
                    <PencilIcon className="h-4 w-4" />
                  </IconButton>
                </div>
                <div className="border-t border-blue-gray-50 mt-3" />
                {section.vehicleDetailsRows.length === 0 ? (
                  <Typography className="text-black mt-2">-</Typography>
                ) : (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
                    {section.vehicleDetailsRows.map((row) => (
                      <div key={`${section.id}-${row.label}`} className="flex items-start gap-2">
                        <Typography className="text-blue-gray-400 font-semibold min-w-[170px]">{row.label}:</Typography>
                        {row.label === "Status" || row.label === "Subscription Status" || row.label === "Credit Status" ? (
                          <Chip value={row.value} color={getStatusChipColor(row.value)} variant="ghost" className="w-fit" />
                        ) : (
                          <Typography className="text-blue-gray-900 font-medium break-words">{row.value}</Typography>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card className="bg-white border border-blue-gray-100 shadow-sm md:col-span-2">
              <CardBody>
                <Typography variant="h5" className="text-blue-gray-900 font-semibold  rounded-md px-3 py-2 inline-block">
                  Credit Log {section.title ? `(${section.title})` : ""}
                </Typography>
                <div className="border-t border-blue-gray-50 mt-3 mb-3" />
                {section.creditLogRows.length === 0 ? (
                  <Typography className="text-black mt-2">-</Typography>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1800px] text-left">
                      <thead>
                        <tr className="border-b border-blue-100 bg-blue-50">
                          {[
                            "Type",
                            "Amount",
                            "Transaction Type",
                            "Base Credit",
                            "Bonus Credit",
                            "Utilized Credit",
                            "Nett Credit",
                            "Remaining Credit",
                            "Status",
                            "Cashback Amount",
                            "Created At",
                            "Updated At",
                            "Invoice ID",
                            "Receipt ID",
                            "Subscription ID",
                            "Subscription Start Date",
                            "Subscription End Date",
                          ].map((header) => (
                            <th key={header} className="px-3 py-2">
                              <Typography className="text-blue-700 font-semibold">{header}</Typography>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.creditLogRows.map((row) => (
                          <tr key={row.id} className="border-b border-blue-gray-50">
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.type}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.amount}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.transactionType}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.baseCredit}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.bonusCredit}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.utilizedCredit}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.nettCredit}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.remainingCredit}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Chip value={row.status} color={getStatusChipColor(row.status)} variant="ghost" className="w-fit" />
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.cashbackAmount}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.createdAt}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.updatedAt}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.invoiceId}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.receiptId}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.subscriptionId}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.subscriptionStartDate}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.subscriptionEndDate}</Typography>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </React.Fragment>
        ))
      )}
    </>
  );
};

export default VehicleInfoSection;
