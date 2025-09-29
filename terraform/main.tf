# main.tf - Core Terraform and Google Provider Configuration

terraform {
  required_version = ">= 1.1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.4"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.location
  # Use impersonation if a service account email is provided.
  impersonate_service_account = var.deployment_impersonation_service_account != "" ? var.deployment_impersonation_service_account : null
}

provider "google-beta" {
  project = var.project_id
  region  = var.location
  impersonate_service_account = var.deployment_impersonation_service_account != "" ? var.deployment_impersonation_service_account : null
}

# Get the current project's data, including its unique number, for use in outputs.
data "google_project" "project" {
  project_id = var.project_id
}

# --- API Service Enablement ---

# We define the services needed for service agent identities individually
# to create a clear dependency graph for Terraform's planner.
resource "google_project_service" "storage" {
  project            = var.project_id
  service            = "storage.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "eventarc" {
  project            = var.project_id
  service            = "eventarc.googleapis.com"
  disable_on_destroy = false
}

# The remaining APIs can be managed in a loop for conciseness.
resource "google_project_service" "project_apis" {
  project = var.project_id
  for_each = toset([
    "cloudfunctions.googleapis.com",
    "compute.googleapis.com",
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "firestore.googleapis.com",
    "cloudscheduler.googleapis.com",
    "pubsub.googleapis.com",
  "secretmanager.googleapis.com",
  "bigquery.googleapis.com" # Enable the BigQuery API for event ingestion
  ])
  service            = each.key
  disable_on_destroy = false
}

# This block tells Terraform that we have refactored our code, renaming
# `google_project_service.storage_api` to `google_project_service.storage`.
# This avoids a destructive "destroy and create" operation, which was causing errors.
moved {
  from = google_project_service.storage_api
  to   = google_project_service.storage
}
moved {
  from = google_project_service.project_apis["storage.googleapis.com"]
  to   = google_project_service.storage
}