// 📍 /apps/web/src/lib/api/images.ts
//
// Image operations for the seller.
// Upload uses XHR (not fetch) because we need upload progress events.

import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/api";
import type { PropertyImagePublic } from "@property-marketplace/shared-types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export async function listImages(
  propertyId: string,
): Promise<PropertyImagePublic[]> {
  const { images } = await apiFetch<{ images: PropertyImagePublic[] }>(
    `/seller/properties/${propertyId}/images`,
  );
  return images;
}

export async function deleteImage(
  propertyId: string,
  imageId: string,
): Promise<void> {
  await apiFetch<void>(`/seller/properties/${propertyId}/images/${imageId}`, {
    method: "DELETE",
  });
}

export async function setCover(
  propertyId: string,
  imageId: string,
): Promise<void> {
  await apiFetch<void>(
    `/seller/properties/${propertyId}/images/${imageId}/cover`,
    { method: "PATCH" },
  );
}

export async function reorderImages(
  propertyId: string,
  orderedIds: string[],
): Promise<void> {
  await apiFetch<void>(`/seller/properties/${propertyId}/images/reorder`, {
    method: "PATCH",
    body: { orderedIds },
  });
}

/**
 * Upload via XHR so we can report progress.
 * Batch uploads go in one request (backend accepts up to 10 files).
 */
export function uploadImages(
  propertyId: string,
  files: File[],
  onProgress: (percent: number) => void,
): Promise<PropertyImagePublic[]> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${API_BASE}/seller/properties/${propertyId}/images`;

    const form = new FormData();
    for (const f of files) form.append("files", f);

    xhr.open("POST", url);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText) as {
            images: PropertyImagePublic[];
          };
          resolve(body.images);
        } catch {
          reject(new ApiError("Invalid server response", 500));
        }
      } else {
        let message = `Upload failed (${xhr.status})`;
        let errorCode: string | undefined;
        let fieldErrors: Record<string, string[]> | undefined;
        try {
          const body = JSON.parse(xhr.responseText) as {
            message?: string;
            errorCode?: string;
            errors?: Record<string, string[]>;
          };
          message = body.message ?? message;
          errorCode = body.errorCode;
          fieldErrors = body.errors;
        } catch {
          // ignore parse errors
        }
        reject(new ApiError(message, xhr.status, errorCode, fieldErrors));
      }
    };

    xhr.onerror = () => reject(new ApiError("Network error during upload", 0));
    xhr.onabort = () => reject(new ApiError("Upload cancelled", 0));

    xhr.send(form);
  });
}