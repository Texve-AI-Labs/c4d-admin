import React from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography } from "@material-tailwind/react";

export default function ApiErrorModal({ open, message, onClose }) {
  return (
    <Dialog open={open} handler={onClose} size="sm">
      <DialogHeader className="text-red-700">Request Failed</DialogHeader>
      <DialogBody divider>
        <Typography className="text-sm font-medium text-gray-800">
          {message || "Something went wrong. Please try again."}
        </Typography>
      </DialogBody>
      <DialogFooter>
        <Button className="bg-red-600" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
