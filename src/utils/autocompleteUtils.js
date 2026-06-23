import { DISABLE_GLOBAL_AUTOCOMPLETE } from "@/utils/constants";

export const disableAutocompleteForEligibleFields = () => {
  document.querySelectorAll("form").forEach((formEl) => {
    if (!formEl.hasAttribute("data-allow-autocomplete")) {
      formEl.setAttribute("autocomplete", "off");
    }
  });

  document.querySelectorAll("input, textarea").forEach((inputEl) => {
    if (!inputEl.hasAttribute("data-allow-autocomplete")) {
      inputEl.setAttribute("autocomplete", "off");
    }
  });
};

export const setupGlobalAutocompleteOff = () => {
  if (!DISABLE_GLOBAL_AUTOCOMPLETE) {
    return undefined;
  }

  disableAutocompleteForEligibleFields();

  const observer = new MutationObserver(() => {
    disableAutocompleteForEligibleFields();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return () => observer.disconnect();
};
