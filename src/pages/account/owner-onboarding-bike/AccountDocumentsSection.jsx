import React, { useState } from "react";
import { Button, Card, CardBody, Chip, Dialog, DialogBody, DialogHeader, Typography } from "@material-tailwind/react";

const AccountDocumentsSection = ({ rows, getStatusTextClass, getStatusBgClass }) => {
  const [modalData, setModalData] = useState(null);
  return (
    <Card className="bg-white border border-blue-gray-100 shadow-sm md:col-span-2">
      <CardBody>
        <Typography variant="h5" className="text-blue-gray-900 font-semibold rounded-md px-3 py-2 inline-block">
          Account Documents
        </Typography>
        <div className="border-t border-blue-gray-50 mt-3 mb-3" />
        {rows.length === 0 ? (
          <Typography className="text-black mt-2">-</Typography>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-blue-100 bg-blue-50">
                  {["Type", "Status", "View", "Created At", "Updated At", "Verified By", "Verified At"].map((header) => (
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
                      <Chip
                        value={row.status}
                        color={
                          String(row.status || "").toUpperCase() === "ACTIVE" ||
                          String(row.status || "").toUpperCase() === "APPROVED" ||
                          String(row.status || "").toUpperCase() === "VERIFIED"
                            ? "green"
                            : String(row.status || "").toUpperCase() === "PENDING"
                            ? "amber"
                            : "red"
                        }
                        variant="ghost"
                        className="w-fit"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {row.image1 ? (
                        <button
                          type="button"
                          className="text-blue-700 underline text-sm font-medium"
                          onClick={() =>
                            setModalData({
                              image1: row.image1,
                              image2: row.image2,
                              status: row.status,
                            })
                          }
                        >
                          View
                        </button>
                      ) : (
                        <Typography className="text-blue-gray-400 font-medium">-</Typography>
                      )}
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
        {modalData && (
          <Dialog open={Boolean(modalData)} handler={() => setModalData(null)} size="md">
            <DialogHeader>
              <div className="flex w-full items-center justify-between">
                <div>
                  <Typography variant="h6">Document Preview</Typography>
                  <Typography className="text-xs text-blue-gray-500 mt-0.5">Status: {modalData.status || "-"}</Typography>
                </div>
                <button type="button" className="text-gray-600 hover:text-gray-900" onClick={() => setModalData(null)}>
                  X
                </button>
              </div>
            </DialogHeader>
            <DialogBody divider>
              <div className={`flex ${modalData.image2 ? "flex-row space-x-6" : "flex-col"} justify-center`}>
                {modalData.image1 ? (
                  <iframe src={modalData.image1} className="rounded-lg shadow-md" style={{ height: "45vh", width: "45%" }} />
                ) : null}
                {modalData.image2 ? (
                  <iframe src={modalData.image2} className="rounded-lg shadow-md" style={{ height: "45vh", width: "45%" }} />
                ) : null}
              </div>
              <div className="flex justify-center gap-3 mt-4">
                {modalData.image1 ? (
                  <a href={modalData.image1} download target="_blank" rel="noreferrer">
                    <Button size="sm" className="normal-case bg-primary">Download Image 1</Button>
                  </a>
                ) : null}
                {modalData.image2 ? (
                  <a href={modalData.image2} download target="_blank" rel="noreferrer">
                    <Button size="sm" className="normal-case bg-primary">Download Image 2</Button>
                  </a>
                ) : null}
              </div>
            </DialogBody>
          </Dialog>
        )}
      </CardBody>
    </Card>
  );
};

export default AccountDocumentsSection;