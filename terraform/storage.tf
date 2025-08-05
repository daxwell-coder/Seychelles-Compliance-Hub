# Defines a Google Cloud Storage bucket
resource "google_storage_bucket" "transaction_uploads" {
  name     = "seychelles-compliance-hub-uploads"
  location = "us-central1"
  
  # The bucket is not public, which means uniform_bucket_level_access is on.
  # This is a security best practice.
  uniform_bucket_level_access = true
}