import { Spinner } from "@material-tailwind/react";

const DEFAULT_TABS = [
  { label: "Master Subscription", path: "/dashboard/finance/master-subscription" },
  { label: "Joining Bonus", path: "/dashboard/finance/joining-bonus" },
];

export default function FinanceSubscriptionTabs({
  activePath,
  loadingPath = "",
  onTabClick,
  tabs = DEFAULT_TABS,
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2">
      {tabs.map((tab) => {
        const isActive = tab.path === activePath;
        const isLoading = loadingPath === tab.path;

        return (
          <button
            key={tab.path}
            type="button"
            onClick={() => onTabClick(tab.path)}
            disabled={isLoading}
            className={`w-full rounded-lg px-4 py-2 text-sm font-semibold ${
              isActive ? "bg-primary-600 text-white" : "border border-gray-200 bg-white text-gray-700"
            }`}
          >
            {isLoading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Spinner className="h-4 w-4" />
                Loading
              </span>
            ) : (
              tab.label
            )}
          </button>
        );
      })}
    </div>
  );
}