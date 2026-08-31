import React from "react";
import { ErrorMessage, Field } from "formik";
import { Button } from "@material-tailwind/react";
import { defaultContent, isNonEmpty } from "../serviceContentFormUtils";

function ServiceContentContentEditor({ values, setFieldValue }) {
  const content = values.content || defaultContent;
  const terms = Array.isArray(content.terms) ? content.terms : [""];

  const updateTerm = (index, value) => {
    const nextTerms = [...terms];
    nextTerms[index] = value;
    setFieldValue("content", { ...content, terms: nextTerms });
  };

  const addTerm = () => setFieldValue("content", { ...content, terms: [...terms, ""] });
  const removeTerm = (index) => {
    const nextTerms = terms.filter((_, itemIndex) => itemIndex !== index);
    setFieldValue("content", { ...content, terms: nextTerms.length ? nextTerms : [""] });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4">
        <div className="text-base font-semibold text-slate-800">Content</div>
        {/* <div className="text-sm text-slate-500">Define the visible content users will see.</div> */}
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <Field
            name="content.title"
            placeholder="e.g. Become a Driver"
            className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
          />
          <ErrorMessage name="content.title" component="div" className="mt-1 text-sm text-red-600" />
        </div>
        <div>
          <label className="block text-sm font-medium">Clari Text</label>
          <Field
            as="textarea"
            name="content.clariText"
            rows="4"
            placeholder="Short explanation shown in the card"
            className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium">Terms</label>
            <Button size="sm" variant="outlined" type="button" onClick={addTerm}>
              Add Term
            </Button>
          </div>
          <div className="space-y-2">
            {terms.map((term, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={term}
                  onChange={(e) => updateTerm(index, e.target.value)}
                  placeholder={`Term ${index + 1}`}
                  className="w-full rounded-md border border-slate-300 bg-white p-2"
                />
                <Button
                  type="button"
                  color="red"
                  variant="outlined"
                  onClick={() => removeTerm(index)}
                  disabled={terms.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-1 text-sm text-red-600">
            {!terms.every((term) => isNonEmpty(term)) ? "All terms must be non-empty." : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServiceContentContentEditor;