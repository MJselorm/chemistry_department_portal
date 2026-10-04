"""Small server-only wrapper around the official Google Drive API."""
import io
import json
from collections.abc import Iterator

from fastapi import HTTPException, status
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload

from ..config import get_settings

FOLDER_MIME = "application/vnd.google-apps.folder"
WORKSPACE_EXPORTS = {
    "application/vnd.google-apps.document": ("application/pdf", ".pdf"),
    "application/vnd.google-apps.spreadsheet": ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xlsx"),
    "application/vnd.google-apps.presentation": ("application/vnd.openxmlformats-officedocument.presentationml.presentation", ".pptx"),
}
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]


class GoogleDriveService:
    def __init__(self):
        settings = get_settings()
        try:
            if settings.google_drive_service_account_json:
                info = json.loads(settings.google_drive_service_account_json)
                credentials = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
            elif settings.google_drive_service_account_path:
                credentials = service_account.Credentials.from_service_account_file(settings.google_drive_service_account_path, scopes=SCOPES)
            else:
                raise RuntimeError("Google Drive credentials are not configured.")
            self.client = build("drive", "v3", credentials=credentials, cache_discovery=False)
        except Exception as exc:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Google Drive is unavailable.") from exc

    def list_children(self, folder_id: str) -> list[dict]:
        fields = "nextPageToken,files(id,name,mimeType,size,modifiedTime,parents,webViewLink,webContentLink,trashed)"
        files, page_token = [], None
        try:
            while True:
                result = self.client.files().list(q=f"'{folder_id}' in parents and trashed = false", spaces="drive", fields=fields, pageToken=page_token, pageSize=1000, supportsAllDrives=True, includeItemsFromAllDrives=True).execute()
                files.extend(result.get("files", [])); page_token = result.get("nextPageToken")
                if not page_token: return files
        except HttpError as exc:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Could not read Google Drive folder.") from exc

    def get_metadata(self, file_id: str) -> dict:
        try:
            return self.client.files().get(fileId=file_id, fields="id,name,mimeType,size,modifiedTime,parents,webViewLink,webContentLink,trashed", supportsAllDrives=True).execute()
        except HttpError as exc:
            if exc.resp.status == 404: raise HTTPException(status.HTTP_404_NOT_FOUND, "Resource is no longer available in Google Drive.") from exc
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Could not read Google Drive resource.") from exc

    def folder_path(self, file_metadata: dict, root_folder_id: str | None) -> list[str]:
        """Return known ancestor names below the configured root, without guessing metadata."""
        names: list[str] = []
        parents = file_metadata.get("parents") or []
        visited = {file_metadata["id"]}
        while parents:
            parent_id = parents[0]
            if parent_id in visited:
                raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Google Drive folder hierarchy is cyclic.")
            if root_folder_id and parent_id == root_folder_id:
                return list(reversed(names))
            visited.add(parent_id)
            parent = self.get_metadata(parent_id)
            if parent.get("mimeType") != FOLDER_MIME:
                raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Google Drive parent is not a folder.")
            names.append(parent["name"])
            parents = parent.get("parents") or []
        # A file outside the configured root is still transferable, but only its
        # actual visible ancestors are used; no academic classification is inferred.
        return list(reversed(names))

    def file_chunks(self, file_id: str, mime_type: str | None) -> tuple[Iterator[bytes], str]:
        try:
            if mime_type in WORKSPACE_EXPORTS:
                export_mime, suffix = WORKSPACE_EXPORTS[mime_type]
                request = self.client.files().export_media(fileId=file_id, mimeType=export_mime)
                return self._chunks(request), export_mime
            request = self.client.files().get_media(fileId=file_id, supportsAllDrives=True)
            return self._chunks(request), mime_type or "application/octet-stream"
        except HttpError as exc:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Could not download Google Drive resource.") from exc

    @staticmethod
    def _chunks(request) -> Iterator[bytes]:
        # Drive's client writes each downloaded chunk into this buffer. Yield and discard it
        # immediately, so a large resource is never retained as one application object.
        def generate():
            buffer = io.BytesIO(); downloader = MediaIoBaseDownload(buffer, request, chunksize=1024 * 1024)
            done = False
            while not done:
                _, done = downloader.next_chunk(); data = buffer.getvalue()
                if data: yield data
                buffer.seek(0); buffer.truncate(0)
        return generate()
