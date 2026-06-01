export type PhotoFile = {
  name: string;
  type: string;
  dataUrl: string;
};

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function getPhotoDataUrl(photoFile?: PhotoFile | null) {
  if (!photoFile) return undefined;
  if (!allowedTypes.has(photoFile.type)) {
    throw new Error("Formato de imagen no permitido");
  }

  const match = photoFile.dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match || match[1] !== photoFile.type) {
    throw new Error("Imagen invalida");
  }

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > 3 * 1024 * 1024) {
    throw new Error("La imagen no puede superar 3MB");
  }

  return photoFile.dataUrl;
}
