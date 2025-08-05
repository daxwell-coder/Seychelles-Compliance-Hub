# Grants the Cloud Function service account permission to receive events from Eventarc.
resource "google_project_iam_member" "eventarc_receiver" {
  project = "seychelles-compliance-hub"
  role    = "roles/eventarc.eventReceiver"
  member  = "serviceAccount:seychelles-compliance-hub@appspot.gserviceaccount.com"
}