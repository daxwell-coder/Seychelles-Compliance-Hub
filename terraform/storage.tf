# storage.tf - Defines the Google Cloud Storage bucket for file uploads.

resource "google_storage_bucket" "transaction_uploads" {
  project  = var.project_id
  name     = "${var.project_id}-uploads" # Bucket names must be globally unique
  location = var.location

  # Enforce uniform bucket-level access for consistent permissions.
  # This is a critical security best practice.
  uniform_bucket_level_access = true

  # Prevent accidental deletion of the bucket in production.
  # Set to `true` only for temporary, non-production environments.
  force_destroy = false

  # Enable versioning to protect against accidental data overwrites or deletions.
  # This provides an invaluable audit trail and disaster recovery capability.
  versioning {
    enabled = true
  }

  # Automatically clean up incomplete multipart uploads after 7 days to save costs.
  lifecycle_rule {
    action {
      type = "AbortIncompleteMultipartUpload"
    }
    condition {
       age = 7
    }
  }

  labels = {
    service     = "compliance-hub"
    environment = "dev" # Change to "prod" as appropriate
  }
}

# Defines a separate GCS bucket to store the zipped source code for Cloud Functions.
# This is a best practice to separate deployment artifacts from application data.
resource "google_storage_bucket" "functions_source_bucket" {
  project                     = var.project_id
  name                        = "${var.project_id}-functions-source"
  location                    = var.location
  uniform_bucket_level_access = true
  force_destroy               = false # Protects source code in production

  labels = {
    service     = "compliance-hub-deploy"
    environment = "dev"
  }
}