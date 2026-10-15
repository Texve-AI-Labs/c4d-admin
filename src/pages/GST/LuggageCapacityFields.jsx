import React from "react";
import { Field, ErrorMessage } from "formik";
import { POLICY_CATEGORIES } from "./luggagePolicyConfig.js";

export default function LuggageCapacityFields() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr><th className="p-2">Category</th><th className="p-2">Seats</th><th className="p-2">Luggage</th></tr>
        </thead>
        <tbody>
          {POLICY_CATEGORIES.map(({ category }) => (
            <tr key={category}>
              <th scope="row" className="p-2 text-sm">{category}</th>
              {["seaterCapacity", "luggageCapacity"].map((capacity) => {
                const name = `config.${capacity}.categories.${category}`;
                return (
                  <td key={capacity} className="p-2">
                    <Field name={name} type="number" min={capacity === "seaterCapacity" ? 1 : 0} step="1"
                      aria-label={`${category} ${capacity === "seaterCapacity" ? "seats" : "luggage"}`}
                      className="p-2 w-full min-w-[80px] rounded-md border border-gray-300 shadow-sm" />
                    <ErrorMessage name={name} component="div" className="text-red-500 text-sm" />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
