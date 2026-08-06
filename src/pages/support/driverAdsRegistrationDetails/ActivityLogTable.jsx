import React from "react";
import { Typography } from "@material-tailwind/react";

export default function ActivityLogTable({ rows, headings, renderRow }) {
  const normalizedRows = Array.isArray(rows) ? rows : [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] table-auto">
        <thead className="bg-primary">
          <tr>
            {headings.map((heading) => (
              <th key={heading} className="whitespace-nowrap border-b border-blue-gray-50 py-2 px-5 text-left">
                <Typography variant="small" className="text-[11px] font-bold uppercase text-white">
                  {heading}
                </Typography>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {normalizedRows.length ? (
            normalizedRows.map((row, index) => (
              <tr key={`${row?.id || row?._id || index}`} className="border-b border-blue-gray-50">
                {renderRow(row).map((cell, cellIndex) => (
                  <td key={`${index}-${cellIndex}`} className="whitespace-nowrap px-5 py-3">
                    {typeof cell === "string" || typeof cell === "number" ? <Typography className="text-xs font-semibold text-black">{cell}</Typography> : cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headings.length} className="py-6 text-center text-sm text-blue-gray-600">
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
