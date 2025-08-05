# Grants the Cloud Function service account permission to manage objects in the bucket.
resource "google_storage_bucket_iam_member" "transaction_uploads_iam" {
  bucket = google_storage_bucket.transaction_uploads.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:seychelles-compliance-hub@appspot.gserviceaccount.com"
}