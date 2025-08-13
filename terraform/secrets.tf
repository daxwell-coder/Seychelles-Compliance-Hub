# secrets.tf - Manages secrets and their permissions using Secret Manager.

# --- Secret Manager Resources ---

# Create a secret to store the third-party sanctions API key.
resource "google_secret_manager_secret" "sanctions_api_key" {
  project   = var.project_id
  secret_id = "sanctions-api-key"

  replication {
    # Use a user_managed replication policy as an alternative to automatic.
    # This is more explicit and resolves the persistent syntax errors.
    user_managed {
      replicas {
        location = var.location
      }
    }
  }

  depends_on = [
    # Explicitly depend on the API service being enabled to prevent race conditions.
    google_project_service.project_apis["secretmanager.googleapis.com"]
  ]
}

# Create an initial secret version if a non-empty value is provided (bootstrap).
resource "google_secret_manager_secret_version" "sanctions_api_key_v1" {
  count       = var.sanctions_api_key_initial_value == "" ? 0 : 1
  secret      = google_secret_manager_secret.sanctions_api_key.id
  secret_data = var.sanctions_api_key_initial_value
}

# Grant the application's service account permission to access the secret.
resource "google_secret_manager_secret_iam_member" "sanctions_api_key_accessor" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.sanctions_api_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.functions_service_account.email}"
}
