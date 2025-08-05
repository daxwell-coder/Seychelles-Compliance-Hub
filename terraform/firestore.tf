# Grants the Cloud Function service account permission to write to Firestore.
resource "google_project_iam_member" "firestore_writer" {
  project = "seychelles-compliance-hub"
  role    = "roles/datastore.user"
  member  = "serviceAccount:seychelles-compliance-hub@appspot.gserviceaccount.com"
}