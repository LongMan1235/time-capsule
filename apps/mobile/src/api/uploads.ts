import * as ImagePicker from "expo-image-picker";
import { api, DEMO_MODE } from "./client";
import { attachDemoMedia } from "./demo";

interface PresignResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export async function pickAndUploadMedia(eventId: string) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission is required to upload memories.");
  }

  const picked = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection: false,
    mediaTypes: ["images", "videos"],
    quality: 0.86
  });

  if (picked.canceled || !picked.assets[0]) return undefined;
  const asset = picked.assets[0];
  const kind = asset.type === "video" ? "VIDEO" : "PHOTO";
  const contentType = kind === "VIDEO" ? "video/mp4" : "image/jpeg";
  const fileName = asset.fileName ?? `${Date.now()}.${kind === "VIDEO" ? "mp4" : "jpg"}`;

  if (DEMO_MODE) {
    const id = `media-${Date.now().toString(36)}`;
    await attachDemoMedia(eventId, {
      id,
      url: asset.uri,
      kind,
      capturedAt: new Date().toISOString()
    });
    return { ok: true };
  }

  const presign = await api<PresignResponse>("/media/presign", {
    method: "POST",
    body: JSON.stringify({ eventId, fileName, contentType, kind })
  });

  const file = await fetch(asset.uri);
  const blob = await file.blob();

  await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "content-type": contentType },
    body: blob
  });

  return api("/media", {
    method: "POST",
    body: JSON.stringify({
      eventId,
      storageKey: presign.key,
      kind,
      caption: "",
      capturedAt: new Date().toISOString(),
      width: asset.width,
      height: asset.height,
      durationMs: asset.duration,
      sizeBytes: asset.fileSize ?? 0
    })
  });
}
