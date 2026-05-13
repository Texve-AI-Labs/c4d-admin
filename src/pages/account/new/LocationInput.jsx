import React, { useEffect, useState } from "react";
import { Input, List, ListItem, Typography } from "@material-tailwind/react";

const LocationInput = ({ field, form, suggestions, onSearch, onSelect }) => {
    const [isFocused, setIsFocused] = useState(false);
    const getPrimaryLabel = (suggestion) => {
        if (typeof suggestion === "string") return suggestion;
        if (suggestion && typeof suggestion === "object") {
            return suggestion.title || suggestion.name || suggestion.label || "";
        }
        return "";
    };
    const getSuggestionLabel = (suggestion) => {
        if (typeof suggestion === "string") return suggestion;
        if (suggestion && typeof suggestion === "object") {
            return (
                suggestion.fullText ||
                suggestion.name ||
                suggestion.address ||
                suggestion.label ||
                suggestion.title ||
                suggestion.subtitle ||
                suggestion.formatted_address ||
                suggestion.description ||
                suggestion.display_name ||
                ""
            );
        }
        return "";
    };

    useEffect(() => {
        form.validateField(field.name);
    }, []);

    return (
        <div className="relative">
            <Input
                type="text"
                placeholder="Enter address"
                {...field}
                onChange={(e) => {
                    form.setFieldValue(field.name, e.target.value);
                    onSearch(e.target.value);
                    form.setFieldTouched(field.name, true, false);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => {
                    field.onBlur(e);
                    setTimeout(() => setIsFocused(false), 200);
                    form.validateField(field.name);
                }}
                className="pr-10"
            />
            {suggestions.length > 0 && isFocused && (
                <List className="w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    {suggestions.map((suggestion, index) => (
                        <ListItem
                            key={index}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                const selectedValue = getSuggestionLabel(suggestion);
                                form.setFieldValue(field.name, selectedValue);
                                form.setFieldTouched(field.name, true, false);
                                onSelect(suggestion);
                                setIsFocused(false);
                                form.validateField(field.name);
                            }}
                            className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
                        >
                            <div className="flex flex-col">
                                <Typography variant="small" className="font-semibold text-gray-900">
                                    {getPrimaryLabel(suggestion) || getSuggestionLabel(suggestion)}
                                </Typography>
                                {typeof suggestion === "object" && suggestion?.fullText ? (
                                    <Typography variant="small" className="text-gray-600 text-xs">
                                        {suggestion.fullText}
                                    </Typography>
                                ) : null}
                            </div>
                        </ListItem>
                    ))}
                </List>
            )}
        </div>
    );
};

export default LocationInput;
