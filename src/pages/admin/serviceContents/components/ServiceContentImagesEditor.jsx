import React from "react";
import { Button, Typography } from "@material-tailwind/react";
import { defaultImages, isNonEmpty } from "../serviceContentFormUtils";

function ServiceContentImagesEditor({ values, setFieldValue }) {
  const images = Array.isArray(values.images) ? values.images : defaultImages;

  const updateImage = (index, key, value) => {
    const nextImages = [...images];
    nextImages[index] = {
      ...nextImages[index],
      [key]: key === "sortOrder" ? Number(value) : value,
    };
    setFieldValue("images", nextImages);
  };

  const addImage = () => setFieldValue("images", [...images, { url: "", alt: "", title: "", sortOrder: 0 }]);
  const removeImage = (index) => {
    const nextImages = images.filter((_, itemIndex) => itemIndex !== index);
    setFieldValue("images", nextImages.length ? nextImages : defaultImages);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Typography variant="h6" className="text-slate-800">
            Images
          </Typography>
          {/* <Typography variant="small" className="text-slate-500">
            Add one or more image rows.
          </Typography> */}
        </div>
        <Button size="sm" variant="outlined" type="button" onClick={addImage}>
          Add Image
        </Button>
      </div>
      <div className="space-y-4">
        {images.map((image, index) => (
          <div key={`${index}-${image?.url || "image"}`} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <Typography variant="small" className="font-semibold text-slate-700">
                Image {index + 1}
              </Typography>
              <Button
                type="button"
                color="red"
                variant="outlined"
                size="sm"
                onClick={() => removeImage(index)}
                disabled={images.length === 1}
              >
                Remove
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="md:col-span-2">
                <label className="block text-sm font-medium">Preview</label>
                <div className="mt-1 flex items-center gap-3 rounded-md border border-slate-300 bg-slate-50 p-3">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
                    {isNonEmpty(image.url) ? (
                      <img
                        src={image.url}
                        alt={image.alt || image.title || `Image ${index + 1}`}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-xs text-slate-400">No image</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">
                      {image.title || image.alt || `Image ${index + 1}`}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {isNonEmpty(image.url) ? image.url : "Paste an image URL to preview it here."}
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">URL</label>
                <input
                  value={image.url || ""}
                  onChange={(e) => updateImage(index, "url", e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
                />
                {!isNonEmpty(image.url) ? <div className="mt-1 text-sm text-red-600">URL is required for image rows.</div> : null}
              </div>
              <div>
                <label className="block text-sm font-medium">Alt</label>
                <input
                  value={image.alt || ""}
                  onChange={(e) => updateImage(index, "alt", e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input
                  value={image.title || ""}
                  onChange={(e) => updateImage(index, "title", e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Sort Order</label>
                <input
                  type="number"
                  value={image.sortOrder ?? 0}
                  onChange={(e) => updateImage(index, "sortOrder", e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ServiceContentImagesEditor;