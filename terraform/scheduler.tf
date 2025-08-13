# scheduler.tf - Manages scheduled tasks for the platform

# Create a Pub/Sub topic that the scheduler will publish messages to.
# The regulatory_monitor Cloud Function will be triggered by these messages.
resource "google_pubsub_topic" "regulatory_monitor_topic" {
  project = var.project_id
  name    = "regulatory-monitor-topic"
}

# Create the Cloud Scheduler job to run the regulatory check daily.
# This directly implements the "Regulatory Change Monitoring Engine" from the business plan.
resource "google_cloud_scheduler_job" "regulatory_monitor_job" {
  project   = var.project_id
  name      = "daily-regulatory-website-check"
  region    = var.location
  description = "Triggers the regulatory monitor function to check for website updates."
  schedule  = "0 2 * * *" # Runs daily at 2:00 AM UTC
  time_zone = "Etc/UTC"

  pubsub_target {
    topic_name = google_pubsub_topic.regulatory_monitor_topic.id
    # Sending a structured JSON payload is more extensible than a simple string.
    data = base64encode(jsonencode({
      trigger_source = "cloud_scheduler"
      reason         = "daily_regulatory_check_v1"
    }))
  }
}

# A topic for publishing alerts when a regulatory change is detected.
resource "google_pubsub_topic" "change_alerts_topic" {
  project = var.project_id
  name    = "change-alerts-topic"
}

# Removed audit_hash_chain_job placeholder; audit function uses internal schedule (onSchedule).

# Topic & schedule for daily obligations snapshot (integrity hash chain)
resource "google_pubsub_topic" "obligations_snapshot_topic" {
  project = var.project_id
  name    = "obligations-snapshot-topic"
}

resource "google_cloud_scheduler_job" "obligations_snapshot_job" {
  project     = var.project_id
  name        = "daily-obligations-snapshot"
  region      = var.location
  description = "Triggers daily obligations snapshot hash chain computation"
  schedule    = "5 2 * * *" # 02:05 UTC daily (after regulatory monitor)
  time_zone   = "Etc/UTC"

  pubsub_target {
    topic_name = google_pubsub_topic.obligations_snapshot_topic.id
    data = base64encode(jsonencode({
      trigger_source = "cloud_scheduler",
      reason = "daily_obligations_snapshot_v1"
    }))
  }
}