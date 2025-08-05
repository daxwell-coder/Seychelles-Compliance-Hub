# Define the required providers and their versions.
# We are specifying the Google provider here.
terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Configure the Google Cloud provider.
# This block tells Terraform which project and region to manage.
provider "google" {
  project = "seychelles-compliance-hub"
  region  = "us-central1" # Or your preferred project region
}