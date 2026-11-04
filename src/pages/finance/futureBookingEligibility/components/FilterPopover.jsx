import {
  Checkbox,
  Popover,
  PopoverContent,
  PopoverHandler,
  Typography,
} from "@material-tailwind/react";
import { FaFilter } from "react-icons/fa";

export default function FilterPopover({ label, value, options, onChange }) {
  return (
    <Popover placement="bottom-start">
      <PopoverHandler>
        <button type="button" className="flex cursor-pointer items-center">
          <Typography variant="small" className="mr-1 text-[11px] font-bold uppercase text-black">
            {label}
          </Typography>
          <FaFilter className="text-xs text-black" />
        </button>
      </PopoverHandler>
      <PopoverContent className="p-2">
        {options.map((option) => (
          <label key={option.value} className="mb-2 flex items-center">
            <Checkbox
              color="blue"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <Typography color="blue-gray" className="ml-2 font-medium">
              {option.label}
            </Typography>
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}