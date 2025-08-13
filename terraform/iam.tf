# iam.tf - Manages Service Accounts and Permissions

# --- Application Service Account ---

# Create a dedicated service account for our application's Cloud Functions.
resource "google_service_account" "functions_service_account" {
  project      = var.project_id
  account_id   = "sch-functions-sa"
  display_name = "Seychelles Compliance Hub Functions Service Account"
  description  = "Service Account used by the application's Cloud Functions to interact with other GCP services."
}

locals {
  function_roles = {
     # Required to write to Firestore
    "datastore_user" = "roles/datastore.user",
    # Required to receive events from Eventarc triggers
    "event_receiver" = "roles/eventarc.eventReceiver",
    # Required to write logs to Cloud Logging
    "logging_writer" = "roles/logging.logWriter",
    # Required for the service account to be used as a build identity.
  "builds_builder" = "roles/cloudbuild.builds.builder",
  "bq_data_editor" = "roles/bigquery.dataEditor"
  }
}

locals {
  terraform_admin_roles = var.terraform_admin_service_account != "" ? {
    # Core project read / discovery
    project_viewer   = "roles/viewer"
    # Ability to manage IAM for specific service accounts (token creator) if doing impersonation flows
    sa_token_creator = "roles/iam.serviceAccountTokenCreator"
    # Manage Cloud Functions, Pub/Sub, BigQuery, Firestore, Secret Manager, Scheduler, Eventarc, Storage
    functions_admin  = "roles/cloudfunctions.admin"
    pubsub_admin     = "roles/pubsub.admin"
    scheduler_admin  = "roles/cloudscheduler.admin"
    secret_admin     = "roles/secretmanager.admin"
    firestore_admin  = "roles/datastore.owner"
    bigquery_admin   = "roles/bigquery.admin"
    eventarc_admin   = "roles/eventarc.admin"
    storage_admin    = "roles/storage.admin"
    run_admin        = "roles/run.admin"
    artifact_admin   = "roles/artifactregistry.admin"
    build_editor     = "roles/cloudbuild.builds.editor"
    service_usage    = "roles/serviceusage.serviceUsageAdmin"
  } : {}
}

# Apply least-privilege (broad but non-Owner) roles to terraform admin SA when specified
resource "google_project_iam_member" "terraform_admin_bindings" {
  for_each = local.terraform_admin_roles
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${var.terraform_admin_service_account}"
}

# Permit specified user to impersonate the terraform admin service account when configured
resource "google_service_account_iam_member" "terraform_admin_user_impersonation" {
  count  = var.terraform_admin_service_account != "" ? 1 : 0
  service_account_id = "projects/${var.project_id}/serviceAccounts/${var.terraform_admin_service_account}"
  role   = "roles/iam.serviceAccountTokenCreator"
  member = "user:daxwell@tomkingventures.com"
}

# Grant the application service account the necessary roles to perform its tasks.
resource "google_project_iam_member" "functions_iam_bindings" {
  project  = var.project_id
  for_each = local.function_roles
  role     = each.value
  member   = "serviceAccount:${google_service_account.functions_service_account.email}"
}

# Grant storage admin role ONLY on the specific transaction uploads bucket.
resource "google_storage_bucket_iam_member" "functions_storage_admin" {
  bucket = google_storage_bucket.transaction_uploads.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.functions_service_account.email}"
}

# --- Service Agent Permissions & Other IAM Bindings ---

# Grant the Cloud Storage service agent permission to publish Pub/Sub events.
resource "google_project_iam_member" "storage_event_publisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  # Construct the GCS service agent email directly using the project number.
  member  = "serviceAccount:service-${data.google_project.project.number}@gs-project-accounts.iam.gserviceaccount.com"

  depends_on = [
    # Depend on the storage API being enabled, which ensures the service agent exists.
    google_project_service.storage
  ]
}

# Grant the application's service account permission to publish change alerts.
resource "google_pubsub_topic_iam_member" "change_alerts_publisher" {
  project = var.project_id
  topic   = google_pubsub_topic.change_alerts_topic.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.functions_service_account.email}"
}