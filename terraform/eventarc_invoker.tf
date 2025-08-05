# Grants the Eventarc service agent the permission to invoke the Cloud Function.
resource "google_project_iam_member" "eventarc_invoker" {
  project = "seychelles-compliance-hub"
  role    = "roles/run.invoker"
  member  = "serviceAccount:service-66612757710@gcp-sa-eventarc.iam.gserviceaccount.com"
}