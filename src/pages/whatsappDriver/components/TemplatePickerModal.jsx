import React from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

const variablePattern = /{{\s*(\d+)\s*}}/g;

const getVariableIndexes = (text = "") => {
  const indexes = new Set();
  let match;
  while ((match = variablePattern.exec(text))) indexes.add(Number(match[1]));
  return Array.from(indexes).sort((a, b) => a - b);
};

export default function TemplatePickerModal({
  open,
  onClose,
  templates,
  templateDetail,
  loading,
  sending,
  onSelectTemplate,
  onSend,
}) {
  const [selectedId, setSelectedId] = React.useState("");
  const [parameters, setParameters] = React.useState({});
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setSelectedId("");
      setParameters({});
      setSearch("");
    }
  }, [open]);

  if (!open) return null;

  const filteredTemplates = templates.filter((template) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [template.name, template.languageCode, template.body]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
  const variableIndexes = getVariableIndexes(templateDetail?.body || "");

  const handleSelect = async (template) => {
    setSelectedId(template.id);
    setParameters({});
    await onSelectTemplate(template.id);
  };

  const handleSend = () => {
    onSend({
      templateId: selectedId,
      languageCode: templateDetail?.languageCode,
      bodyParameters: variableIndexes.map((index) => parameters[index] || ""),
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-blue-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-blue-gray-900">Reply templates</h2>
            <p className="text-xs text-blue-gray-500">Select a template and fill required variables.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-blue-gray-400 hover:bg-blue-gray-50 hover:text-blue-gray-700" aria-label="Close">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)]">
          <div className="flex min-h-[220px] flex-col border-r border-blue-gray-100">
            <div className="border-b border-blue-gray-100 p-3">
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-blue-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search templates"
                  className="w-full rounded-lg border border-blue-gray-100 bg-blue-gray-50 px-3 py-2 pl-9 text-sm outline-none focus:border-[#00A884] focus:bg-white"
                  aria-label="Search templates"
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading && templates.length === 0 ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-10 animate-pulse rounded-lg bg-blue-gray-50" />
                  ))}
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelect(template)}
                    className={`block w-full border-b border-blue-gray-50 px-4 py-3 text-left text-sm ${
                      selectedId === template.id ? "bg-[#E7FCE3] font-semibold text-[#008069]" : "text-blue-gray-700 hover:bg-blue-gray-50"
                    }`}
                  >
                    <span className="block truncate">{template.name}</span>
                    <span className="text-xs text-blue-gray-400">{template.languageCode}</span>
                  </button>
                ))
              )}
              {!loading && templates.length === 0 && <div className="p-4 text-sm text-blue-gray-500">No templates found</div>}
              {!loading && templates.length > 0 && filteredTemplates.length === 0 && (
                <div className="p-4 text-sm text-blue-gray-500">No matching templates</div>
              )}
            </div>
          </div>
          <div className="min-h-[320px] overflow-y-auto p-5">
            {!templateDetail ? (
              <div className="flex h-full items-center justify-center text-sm text-blue-gray-500">Choose a template</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-gray-400">Preview</p>
                  <div className="mt-2 rounded-xl bg-blue-gray-50 p-4 text-sm leading-relaxed text-blue-gray-800">
                    {templateDetail.body || "No body preview available"}
                  </div>
                </div>
                {variableIndexes.map((index) => (
                  <label key={index} className="block">
                    <span className="text-sm font-medium text-blue-gray-700">Variable {index}</span>
                    <input
                      value={parameters[index] || ""}
                      onChange={(event) => setParameters((prev) => ({ ...prev, [index]: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-blue-gray-100 px-3 py-2 text-sm outline-none focus:border-[#00A884]"
                      placeholder={`Value for {{${index}}}`}
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-blue-gray-100 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-blue-gray-200 px-4 py-2 text-sm font-semibold text-blue-gray-700">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!templateDetail || sending}
            className="rounded-xl bg-[#00A884] px-4 py-2 text-sm font-semibold text-white hover:bg-[#008069] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send template"}
          </button>
        </div>
      </div>
    </div>
  );
}
