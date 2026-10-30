import React from "react";

function ServiceContentMetadataEditor({ values, setFieldValue, collapsed, setCollapsed, metadataError, setMetadataError, validateMetadataText }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 hidden">
      <button
        type="button"
        className="mb-3 flex w-full items-center justify-between text-left"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        <div>
          <div className="text-base font-semibold text-slate-800">Advanced Metadata</div>
          <div className="text-sm text-slate-500">Optional technical metadata in JSON.</div>
        </div>
        <span className="text-sm text-slate-500">{collapsed ? "Expand" : "Collapse"}</span>
      </button>
      {!collapsed ? (
        <>
          <textarea
            value={values.metadataText}
            onChange={(e) => {
              setFieldValue("metadataText", e.target.value);
              const check = validateMetadataText(e.target.value);
              setMetadataError(check.ok ? "" : "Metadata must be valid JSON.");
            }}
            rows="8"
            placeholder={'{\n  "source": "admin"\n}'}
            className="w-full rounded-md border border-slate-300 bg-white p-2 font-mono text-sm"
          />
          {metadataError ? <div className="mt-1 text-sm text-red-600">{metadataError}</div> : null}
        </>
      ) : null}
    </div>
  );
}

export default ServiceContentMetadataEditor;