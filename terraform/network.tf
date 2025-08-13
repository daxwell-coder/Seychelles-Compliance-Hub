# network.tf - Manages the Virtual Private Cloud (VPC) network.

# This provides a private, isolated section of Google Cloud for our resources,
# enhancing security and control as per the business plan's governance goals.
resource "google_compute_network" "vpc_network" {
  project                 = var.project_id
  name                    = "${var.project_id}-vpc"
  auto_create_subnetworks = true # Sufficient for Phase 1; can be customized later.
}

