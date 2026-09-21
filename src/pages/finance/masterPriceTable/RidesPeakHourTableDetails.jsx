import {
    Card,
    CardBody,
    Typography,
} from "@material-tailwind/react";

const RidesPeakHourTable = ({ priceData = []}) => {

    return (
        <>
            <h2 className="text-2xl font-bold mb-4">Peak Hours Table</h2>
            <Card>
                {priceData && priceData.length > 0 ? (
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr className="bg-primary border text-white">
                                    {[
                                        "Start Time",
                                        "End Time",
                                        "Kilometer Price",
                                    ].map((el, index) => (
                                        <th
                                            key={index}
                                            className="border-b border py-3 px-5 text-left"
                                        >
                                            <Typography
                                                variant="small"
                                                className="text-[11px] font-bold uppercase text-white"
                                            >
                                                {el}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                
                                {priceData.map(
                                    (
                                        {
                                            start,
                                            end,
                                            kilometerPrice
                                        },
                                        key
                                    ) => {
                                        const className = `border  py-3 px-5 ${
                                            key === priceData.length - 1
                                                ? ""
                                                : "border-b-4 border-gray-900"
                                        }`;
                                        

                                        return (
                                            <tr key={key}>
                                                <td className={className}>
                                                    <Typography className="text-xs  font-semibold text-blue-gray-600">
                                                        {start}
                                                    </Typography>
                                                </td>
                                                <td className={className}>
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {end}
                                                    </Typography>
                                                </td>
                                                <td className={className}>
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {kilometerPrice || "-"}
                                                    </Typography>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>
                        </table>
                    </CardBody>
                ) : (
                    <h2 className="text-lg font-medium p-4">No Price Data Available</h2>
                )}
            </Card>
        </>
    );
};

export default RidesPeakHourTable;