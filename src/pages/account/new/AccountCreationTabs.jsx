import React from "react";

export const ACCOUNT_CREATION_STAGES = [
    "Account Creation",
    "Account Document",
    "Vehicle Document",
    "Vehicle Creation",
];

const AccountCreationTabs = ({ activeStage = 1 }) => {
    return (
        <div className="mb-6">
            <div className="flex w-full flex-wrap items-center gap-2 md:gap-3">
                {ACCOUNT_CREATION_STAGES.map((stage, index) => {
                    const stageNumber = index + 1;
                    const isActive = stageNumber === activeStage;
                    const isCompleted = stageNumber < activeStage;

                    return (
                        <div key={stage} className="flex items-center gap-2">
                            <div
                                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm whitespace-nowrap ${isActive
                                        ? "border-blue-600 bg-blue-50 text-blue-700"
                                        : isCompleted
                                            ? "border-green-600 bg-green-50 text-green-700"
                                            : "border-gray-300 bg-white text-gray-500"
                                    }`}
                            >
                                <span
                                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${isActive
                                            ? "bg-blue-600 text-white"
                                            : isCompleted
                                                ? "bg-green-600 text-white"
                                                : "bg-gray-200 text-gray-600"
                                        }`}
                                >
                                    {stageNumber}
                                </span>
                                <span className="font-medium">{stage}</span>
                            </div>
                            {stageNumber < ACCOUNT_CREATION_STAGES.length && (
                                <span
                                    className="mx-1 inline-block h-[2px] w-5 md:w-14 rounded bg-gray-300"
                                    aria-hidden="true"
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AccountCreationTabs;
