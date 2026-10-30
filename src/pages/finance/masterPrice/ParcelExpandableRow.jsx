import { Link } from "react-router-dom";
import { Typography } from "@material-tailwind/react";
import { ColorStyles } from "@/utils/constants";

export function ParcelExpandableRow({
  row,
  className,
  hideSubZoneColumn = false,
}) {
  return (
    <>
      <tr className="whitespace-nowrap">
        <td className={className}>
          {hideSubZoneColumn ? (
            <Typography className="text-xs font-semibold text-blue-gray-600">
              <Link to={`/dashboard/finance/master-price/parcel-details/${row.pkgId}`} className="underline text-blue-700">
                {row.zone}
              </Link>
            </Typography>
          ) : (
          <Typography className="text-xs font-semibold text-blue-gray-600">{row.zone}</Typography>
          )}
        </td>
        {!hideSubZoneColumn ? (
        <td className={className}>
          <Typography className="text-xs font-semibold text-blue-gray-600">
            <Link to={`/dashboard/finance/master-price/parcel-details/${row.pkgId}`} className="underline text-blue-700">
              {row.subZoneName || row.subZoneId}
            </Link>
          </Typography>
        </td>
        ) : null}
        <td className={className}>
          <Typography className="text-xs font-semibold text-blue-gray-600">{row.baseFare}</Typography>
        </td>
        <td className={className}>
          <Typography className="text-xs font-semibold text-blue-gray-600">{row.baseKm}</Typography>
        </td>
        <td className={className}>
          <Typography className="text-xs font-semibold text-blue-gray-600">{row.kilometerPrice}</Typography>
        </td>
        <td className={className}>
          <div className="flex items-center gap-2">
            <Link
              to={`/dashboard/finance/master-price/parcel-edit/${row.pkgId}`}
              className={`px-3 py-1 rounded-lg text-xs font-semibold inline-block ${ColorStyles.editButton}`}
            >
            Edit
            </Link>
          </div>
        </td>
      </tr>
    </>
  );
}
