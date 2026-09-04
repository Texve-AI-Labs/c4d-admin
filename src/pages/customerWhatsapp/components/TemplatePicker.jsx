import React, { useMemo, useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

const renderTemplatePreviewText = (text, params) => {
  let output = String(text || "");
  params.forEach((value, index) => {
    output = output.replace(new RegExp(`\\{\\{${index + 1}\\}\\}`, "g"), value || `{{${index + 1}}}`);
  });
  return output;
};

export function TemplatePicker({
  open,
  templates,
  selectedTemplate,
  selectedTemplateId,
  loading,
  detailLoading,
  submitting,
  templatesError,
  detailError,
  values,
  onClose,
  onSelectTemplate,
  onValueChange,
  onSend,
}) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter((template) => {
      const name = String(template?.name || "").toLowerCase();
      const category = String(template?.category || "").toLowerCase();
      const preview = String(template?.previewText || "").toLowerCase();
      return name.includes(term) || category.includes(term) || preview.includes(term);
    });
  }, [filter, templates]);

  const previewText = useMemo(
    () => renderTemplatePreviewText(selectedTemplate?.bodyText || "", values),
    [selectedTemplate?.bodyText, values]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-900/45 px-4">
      <div className="flex max-h-[82vh] w-full max-w-[896px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold leading-5 text-slate-900">Send Template</h3>
            <p className="text-sm text-slate-500">Pick a template and review before sending.</p>
          </div>
          <button className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100" onClick={onClose} title="Close">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[468px_minmax(0,1fr)]">
          <div className="min-h-0 border-r border-slate-200 p-5">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2">
              <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
              <input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Search templates"
              />
            </div>

            <div className="mt-3 max-h-[55vh] space-y-3 overflow-y-auto pr-1">
              {loading ? (
                <p className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">Loading templates...</p>
              ) : templatesError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{templatesError}</p>
              ) : filtered.length === 0 ? (
                <p className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">No templates found.</p>
              ) : (
                filtered.map((template) => {
                  const isSelected = selectedTemplateId === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => onSelectTemplate(template.id)}
                      className={`block w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                        isSelected ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 break-words text-[15px] font-semibold leading-5 text-slate-900">{template.name}</p>
                        {template.category && (
                          <span className="shrink-0 text-[11px] font-bold uppercase text-slate-400">{template.category}</span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Header: {template.headerType || "NONE"}</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">{template.previewText || "No preview available."}</p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-col overflow-hidden bg-slate-50 p-5 pb-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Preview</p>

            {detailLoading ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading template detail...</div>
            ) : detailError ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{detailError}</div>
            ) : !selectedTemplate ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                Select a template to preview and fill variables.
              </div>
            ) : (
              <div className="mt-3 flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-[15px] leading-6 text-slate-700">
                    {selectedTemplate.header?.type === "TEXT" && selectedTemplate.header?.text && (
                      <p className="mb-2 font-semibold text-slate-900">{selectedTemplate.header.text}</p>
                    )}
                    {previewText || "No body preview available."}
                  </div>

                  <div className="min-w-0 break-words text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{selectedTemplate.name}</span>
                    {selectedTemplate.languageCode ? <span> - {selectedTemplate.languageCode}</span> : null}
                    {selectedTemplate.header?.type ? <span> - Header: {selectedTemplate.header.type}</span> : null}
                  </div>

                  {selectedTemplate.variables.map((variable, index) => (
                    <label key={variable} className="block">
                      <span className="text-xs font-semibold text-slate-600">Value for {variable}</span>
                      <input
                        value={values[index] || ""}
                        onChange={(event) => onValueChange(index, event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                        placeholder={`Value for ${variable}`}
                      />
                    </label>
                  ))}
                </div>

                <div className="sticky bottom-0 z-10 mt-4 grid w-full grid-cols-2 gap-3 border-t border-slate-200 bg-slate-50 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-11 min-w-0 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onSend}
                    disabled={submitting}
                    className="flex h-11 min-w-0 items-center justify-center rounded-full bg-[#009b72] px-4 text-sm font-bold text-white shadow-md hover:bg-[#00845f] disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {submitting ? "Sending..." : "Send Template"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplatePicker;
