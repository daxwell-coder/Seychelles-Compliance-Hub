# variables.tf - Defines all input variables for the root module.

variable "project_id" {
  description = "The ID of the Google Cloud project where resources will be deployed."
  type        = string

  validation {
    # Ensure the project ID conforms to GCP naming conventions.
    condition     = length(var.project_id) >= 6 && length(var.project_id) <= 30 && can(regex("^[a-z0-9][a-z0-9-]*[a-z0-9]$", var.project_id))
    error_message = "The project_id must be a valid GCP project ID (6-30 characters, lowercase letters, digits, and hyphens)."
  }
}

variable "location" {
  description = "The primary GCP region for resource deployment (e.g., 'us-central1')."
  type        = string
  default     = "us-central1"
}

variable "sanctions_api_key_initial_value" {
  description = "(Optional) Initial sanctions API key to seed Secret Manager. Leave blank to skip creating a version. Provide via -var or tfvars; do NOT commit sensitive values."
  type        = string
  default     = ""
  sensitive   = true
}

variable "onboarding_api_key" {
  description = "API key required for onboarding HTTP requests (leave blank to disable auth)."
  type        = string
  default     = ""
  sensitive   = true
}

variable "metrics_api_key" {
  description = "API key for protected metrics endpoint (leave blank to disable auth)."
  type        = string
  default     = ""
  sensitive   = true
}


