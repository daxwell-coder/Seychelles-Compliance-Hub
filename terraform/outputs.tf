# outputs.tf - Defines the output values from our Terraform configuration.

# This output displays the email of the Google-managed service agent for Eventarc.
output "eventarc_service_agent_email" {
  description = "The email of the Eventarc service agent."
  value       = "service-${data.google_project.project.number}@gcp-sa-eventarc.iam.gserviceaccount.com"
}

# This output displays the email of the Google-managed service agent for Cloud Storage.
output "gcs_service_agent_email" {
  description = "The email of the Cloud Storage service agent."
  value       = "service-${data.google_project.project.number}@gs-project-accounts.iam.gserviceaccount.com"
}

output "project_number" {
  description = "The unique number of the Google Cloud project."
  value       = data.google_project.project.number
}

# Function URLs (helpful for quick manual testing)
output "onboarding_function_url" {
  description = "HTTPS URL of the onboarding function"
  value       = try(google_cloudfunctions2_function.all_functions["onboard-client-function"].service_config[0].uri, null)
}

output "regulatory_monitor_function_url" {
  description = "HTTPS (internal) URL of the regulatory monitor function"
  value       = try(google_cloudfunctions2_function.all_functions["regulatory-monitor"].service_config[0].uri, null)
}

output "audit_hash_chain_function_url" {
  description = "HTTPS (internal) URL of the audit hash chain function"
  value       = try(google_cloudfunctions2_function.all_functions["audit-hash-chain"].service_config[0].uri, null)
}

output "obligations_load_function_url" {
  description = "HTTPS (internal) URL of the obligations load function"
  value       = try(google_cloudfunctions2_function.all_functions["obligations-load"].service_config[0].uri, null)
}

output "obligations_list_function_url" {
  description = "HTTPS (internal) URL of the obligations list function"
  value       = try(google_cloudfunctions2_function.all_functions["obligations-list"].service_config[0].uri, null)
}

output "obligations_snapshot_function_url" {
  description = "HTTPS (internal) URL of the obligations snapshot function"
  value       = try(google_cloudfunctions2_function.all_functions["obligations-snapshot"].service_config[0].uri, null)
}

# Newly added functions (Sprint 1 enhancements & governance)
output "metrics_endpoint_function_url" {
  description = "Public metrics endpoint function URL"
  value       = try(google_cloudfunctions2_function.all_functions["metrics-endpoint"].service_config[0].uri, null)
}

output "events_ingestor_function_url" {
  description = "Events ingestor (Pub/Sub triggered) service URL (internal)"
  value       = try(google_cloudfunctions2_function.all_functions["events-ingestor"].service_config[0].uri, null)
}

output "regulatory_classifier_function_url" {
  description = "Regulatory classifier ingest function URL (internal)"
  value       = try(google_cloudfunctions2_function.all_functions["regulatory-classifier"].service_config[0].uri, null)
}

output "task_engine_function_url" {
  description = "Task engine main handler function URL (internal)"
  value       = try(google_cloudfunctions2_function.all_functions["task-engine"].service_config[0].uri, null)
}

output "task_escalate_function_url" {
  description = "Task escalate function URL (internal)"
  value       = try(google_cloudfunctions2_function.all_functions["task-escalate"].service_config[0].uri, null)
}

output "task_close_function_url" {
  description = "Task close function URL (internal)"
  value       = try(google_cloudfunctions2_function.all_functions["task-close"].service_config[0].uri, null)
}

# Task #3: Search Functions URLs
output "search_encrypted_data_function_url" {
  description = "Search encrypted data function URL (internal)"
  value       = try(google_cloudfunctions2_function.all_functions["search-encrypted-data"].service_config[0].uri, null)
}

output "search_health_check_function_url" {
  description = "Search health check function URL (public)"
  value       = try(google_cloudfunctions2_function.all_functions["search-health-check"].service_config[0].uri, null)
}

# Task #4: External Anchoring Functions URLs
output "anchor_status_function_url" {
  description = "Anchor status function URL (public)"
  value       = try(google_cloudfunctions2_function.all_functions["anchor-status"].service_config[0].uri, null)
}

output "verify_anchor_function_url" {
  description = "Verify anchor function URL (public)"
  value       = try(google_cloudfunctions2_function.all_functions["verify-anchor"].service_config[0].uri, null)
}

output "publish_anchor_manual_function_url" {
  description = "Publish anchor manually function URL (internal)"
  value       = try(google_cloudfunctions2_function.all_functions["publish-anchor-manual"].service_config[0].uri, null)
}
