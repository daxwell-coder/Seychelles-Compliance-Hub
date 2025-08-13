# functions.tf - Manages Cloud Functions deployment

locals {
  # Define common exclusion patterns for source code archives to reduce repetition.
  source_archive_excludes = [
    "node_modules",
    ".git",
    ".idea",
    ".vscode",
    "*.log",
    ".eslintrc.js",
    "tsconfig.dev.json"
  ]
}

# Pub/Sub topic for internal platform events (Phase 1 backbone)
resource "google_pubsub_topic" "platform_events" {
  name    = "platform-events"
  project = var.project_id
}

# Debug / development pull subscription for inspecting raw platform events
resource "google_pubsub_subscription" "platform_events_debug" {
  name  = "platform-events-debug"
  topic = google_pubsub_topic.platform_events.id
  ack_deadline_seconds = 20
  message_retention_duration = "604800s" # 7 days retention for debugging
  retain_acked_messages = false
}

# BigQuery dataset for raw event ledger (Phase 1 ingestion foundation)
resource "google_bigquery_dataset" "event_ledger" {
  dataset_id = "event_ledger"
  project    = var.project_id
  location   = var.location
  description = "Raw immutable ledger of platform events (append-only)."
  delete_contents_on_destroy = true
}

# BigQuery table schema kept minimal; payload stored JSON string for flexibility.
resource "google_bigquery_table" "event_log" {
  dataset_id = google_bigquery_dataset.event_ledger.dataset_id
  project    = var.project_id
  table_id   = "event_log"
  deletion_protection = false
  schema = jsonencode([
    { name = "event_id", type = "STRING", mode = "REQUIRED", description = "Deterministic or UUID event id" },
    { name = "type", type = "STRING", mode = "REQUIRED", description = "Event type" },
    { name = "emitted_at", type = "TIMESTAMP", mode = "REQUIRED", description = "Original emission timestamp" },
    { name = "ingested_at", type = "TIMESTAMP", mode = "REQUIRED", description = "Ingestion timestamp" },
    { name = "schema_id", type = "STRING", mode = "NULLABLE", description = "Schema identifier if known" },
    { name = "schema_version", type = "STRING", mode = "NULLABLE", description = "Parsed schema version (e.g. v1)" },
    { name = "payload_hash", type = "STRING", mode = "REQUIRED", description = "SHA256 hash of canonical payload" },
    { name = "payload", type = "STRING", mode = "REQUIRED", description = "Raw JSON payload (escaped)" },
    { name = "source_topic", type = "STRING", mode = "NULLABLE", description = "Origin Pub/Sub topic" }
  ])
  time_partitioning {
    type = "DAY"
    field = "emitted_at"
  }
  clustering = ["type", "event_id"]
}

# View providing deduplicated event stream (first ingestion per event_id)
resource "google_bigquery_table" "event_log_deduped_view" {
  dataset_id = google_bigquery_dataset.event_ledger.dataset_id
  project    = var.project_id
  table_id   = "event_log_deduped"
  deletion_protection = false
  view {
    query = <<EOT
SELECT * EXCEPT(rn) FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY ingested_at ASC) rn
  FROM `${var.project_id}.${google_bigquery_dataset.event_ledger.dataset_id}.event_log`
) WHERE rn = 1
EOT
    use_legacy_sql = false
  }
}
# Step 1: Package the legacy Cloud Functions source code into a zip archive.
data "archive_file" "functions_source" {
  type        = "zip"
  source_dir  = "${path.module}/../functions"
  output_path = "${path.module}/.terraform/source.zip"
  excludes    = local.source_archive_excludes
}

# Step 2: Package the new client-onboarding function source code.
data "archive_file" "onboarding_function_source" {
  type        = "zip"
  source_dir  = "${path.module}/../services/client-onboarding"
  output_path = "${path.module}/.terraform/onboarding-source.zip"
  excludes    = local.source_archive_excludes
}

# Step 3: Upload the zipped source code archives to the Cloud Storage bucket.
resource "google_storage_bucket_object" "functions_source_archive" {
  name   = "source.zip#${data.archive_file.functions_source.output_md5}"
  bucket = google_storage_bucket.functions_source_bucket.name
  source = data.archive_file.functions_source.output_path
}

resource "google_storage_bucket_object" "onboarding_source_archive" {
  name   = "onboarding-source.zip#${data.archive_file.onboarding_function_source.output_md5}"
  bucket = google_storage_bucket.functions_source_bucket.name
  source = data.archive_file.onboarding_function_source.output_path
}

# Step 4: Define all Cloud Functions in a central map for maintainability.
locals {
  functions = {
    regulatory-monitor = {
      entry_point      = "checkRegulatoryChanges"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "1Gi"
      timeout_seconds  = 300
      event_trigger = {
        event_type   = "google.cloud.pubsub.topic.v1.messagePublished"
        pubsub_topic = google_pubsub_topic.regulatory_monitor_topic.id
      }
    },
    onboard-client-function = {
      entry_point      = "onboardClientFunction"
      source_archive   = google_storage_bucket_object.onboarding_source_archive.name
      available_memory = "256Mi"
      timeout_seconds  = 60
      ingress_settings = "ALLOW_ALL"
      # Pass the sanctions API key to the function as a secret environment variable.
      secret_environment_variables = [{
        key        = "SANCTIONS_API_KEY"
        project_id = var.project_id
        secret     = google_secret_manager_secret.sanctions_api_key.secret_id
        version    = "latest" # Always use the latest version of the secret
      }]
    },
    audit-hash-chain = {
      entry_point      = "auditHashChain"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "256Mi"
      timeout_seconds  = 60
      ingress_settings = "ALLOW_INTERNAL_ONLY"
    }
    
    metrics-endpoint = {
      entry_point      = "metricsEndpoint"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "128Mi"
      timeout_seconds  = 30
      ingress_settings = "ALLOW_ALL" # Exposed publicly; protected by METRICS_API_KEY
    }

    events-ingestor = {
      entry_point      = "eventsIngestor"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "256Mi"
      timeout_seconds  = 60
      event_trigger = {
        event_type   = "google.cloud.pubsub.topic.v1.messagePublished"
        pubsub_topic = google_pubsub_topic.platform_events.id
      }
    }
    obligations-load = {
      entry_point      = "loadObligations"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "128Mi"
      timeout_seconds  = 60
      ingress_settings = "ALLOW_INTERNAL_ONLY"
    }
    obligations-list = {
      entry_point      = "listObligations"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "128Mi"
      timeout_seconds  = 60
      ingress_settings = "ALLOW_INTERNAL_ONLY"
    }
    obligations-snapshot = {
      entry_point      = "obligationSnapshot"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "128Mi"
      timeout_seconds  = 60
      ingress_settings = "ALLOW_INTERNAL_ONLY"
    }
    obligations-snapshot-trigger = {
      entry_point      = "obligationSnapshotPubSub"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "128Mi"
      timeout_seconds  = 60
      event_trigger = {
        event_type   = "google.cloud.pubsub.topic.v1.messagePublished"
        pubsub_topic = google_pubsub_topic.obligations_snapshot_topic.id
      }
    }
    obligations-snapshot-verify = {
      entry_point      = "obligationSnapshotVerify"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "128Mi"
      timeout_seconds  = 60
      ingress_settings = "ALLOW_INTERNAL_ONLY"
    }
    obligations-snapshot-verify-daily = {
      entry_point      = "obligationSnapshotVerifyDaily"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "128Mi"
      timeout_seconds  = 60
      ingress_settings = "ALLOW_INTERNAL_ONLY"
      # onSchedule functions in v2 are deployed as event-driven (Scheduler-managed internal) but no explicit event_trigger block needed
    }
    regulatory-classifier = {
      entry_point      = "ingestRegulatoryChange"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "256Mi"
      timeout_seconds  = 120
      ingress_settings = "ALLOW_INTERNAL_ONLY"
    }
    task-engine = {
      entry_point      = "taskHandler"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "256Mi"
      timeout_seconds  = 60
      ingress_settings = "ALLOW_INTERNAL_ONLY"
    }
    task-escalate = {
      entry_point      = "escalateTask"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "128Mi"
      timeout_seconds  = 60
      ingress_settings = "ALLOW_INTERNAL_ONLY"
    }
    task-close = {
      entry_point      = "closeTask"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "128Mi"
      timeout_seconds  = 60
      ingress_settings = "ALLOW_INTERNAL_ONLY"
    }
    critical-task-monitor = {
      entry_point      = "monitorCriticalTasks"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "128Mi"
      timeout_seconds  = 120
      # Scheduled function - no ingress_settings needed
    }
    critical-task-summary = {
      entry_point      = "getCriticalTaskSummary"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "128Mi"
      timeout_seconds  = 60
      # Scheduled function - no ingress_settings needed
    }
    
    # Task #4: External Anchoring Functions
    process-chain-for-anchoring = {
      entry_point      = "processChainForAnchoring"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "256Mi"
      timeout_seconds  = 120
      event_trigger = {
        event_type   = "google.cloud.pubsub.topic.v1.messagePublished"
        pubsub_topic = google_pubsub_topic.platform_events.id
      }
    }
    weekly-anchor-publisher = {
      entry_point      = "weeklyAnchorPublisher"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "128Mi"
      timeout_seconds  = 300
      # Scheduled function - no ingress_settings needed
    }
    publish-anchor-manual = {
      entry_point      = "publishAnchorManual"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "128Mi"
      timeout_seconds  = 300
      ingress_settings = "ALLOW_INTERNAL_ONLY"
    }
    verify-anchor = {
      entry_point      = "verifyAnchor"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "128Mi"
      timeout_seconds  = 60
      ingress_settings = "ALLOW_ALL" # Public verification endpoint
    }
    anchor-status = {
      entry_point      = "anchorStatus"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "128Mi"
      timeout_seconds  = 30
      ingress_settings = "ALLOW_ALL" # Public status endpoint
    }
    
    # Task #3: Encrypted Data Search Functions
    search-encrypted-data = {
      entry_point      = "searchEncryptedData"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "256Mi"
      timeout_seconds  = 60
      ingress_settings = "ALLOW_INTERNAL_ONLY" # Internal search API
    }
    search-health-check = {
      entry_point      = "searchHealthCheck"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "128Mi"
      timeout_seconds  = 30
      ingress_settings = "ALLOW_ALL" # Public health check
    }
    
    # Sprint 2: Semantic Regulatory Classification with ML
    semantic-classify-regulatory = {
      entry_point      = "semanticClassifyRegulatory"
      source_archive   = google_storage_bucket_object.functions_source_archive.name
      available_memory = "512Mi" # Increased for ML processing
      timeout_seconds  = 180     # Increased for semantic analysis
      ingress_settings = "ALLOW_ALL" # External regulatory ingestion
      environment_variables = {
        ENABLE_SEMANTIC_ANALYSIS = "true"
        ML_CONFIDENCE_THRESHOLD  = "0.6"
        TASK_CREATION_THRESHOLD  = "0.7"
      }
    }
  }

  # Create a filtered map of only the functions that should be publicly accessible.
  public_functions = {
    for k, v in local.functions : k => v if try(v.ingress_settings, "") == "ALLOW_ALL"
  }

  # Explicit list of event-triggered functions (static to avoid unknown references in for_each evaluation)
  event_triggered_function_names = [
    "regulatory-monitor",
    "events-ingestor",
    "obligations-snapshot-trigger",
    "process-chain-for-anchoring"
  ]
}

# Step 5: Create all functions using a single resource block with for_each.
resource "google_cloudfunctions2_function" "all_functions" {
  for_each = local.functions

  project  = var.project_id
  name     = each.key
  location = var.location

  build_config {
    runtime         = "nodejs22"
    entry_point     = each.value.entry_point
    service_account = google_service_account.functions_service_account.name
    source {
      storage_source {
        bucket = google_storage_bucket.functions_source_bucket.name
        object = each.value.source_archive
      }
    }
  }

  service_config {
    available_memory      = each.value.available_memory
    timeout_seconds       = each.value.timeout_seconds
    service_account_email = google_service_account.functions_service_account.email
    ingress_settings      = try(each.value.ingress_settings, "ALLOW_INTERNAL_ONLY")
    environment_variables = {
      EVENT_TOPIC        = google_pubsub_topic.platform_events.name
      ONBOARDING_API_KEY = var.onboarding_api_key
  METRICS_API_KEY    = var.metrics_api_key
    }

    # Define secret environment variables
    dynamic "secret_environment_variables" {
      for_each = try(each.value.secret_environment_variables, [])
      content {
        key        = secret_environment_variables.value.key
        project_id = secret_environment_variables.value.project_id
        secret     = secret_environment_variables.value.secret
        version    = secret_environment_variables.value.version
      }
    }
  }

  dynamic "event_trigger" {
    for_each = try(each.value.event_trigger, null) != null ? [each.value.event_trigger] : []
    content {
      trigger_region = var.location
      event_type     = event_trigger.value.event_type
      pubsub_topic   = try(event_trigger.value.pubsub_topic, null)
      retry_policy   = "RETRY_POLICY_RETRY"
      dynamic "event_filters" {
        for_each = try(event_trigger.value.event_filters, [])
        content {
          attribute = event_filters.value.attribute
          value     = event_filters.value.value
        }
      }
    }
  }

  depends_on = [
    google_project_service.project_apis,
    google_project_service.eventarc,
    # Ensure secret exists before function that uses it is created.
  google_secret_manager_secret.sanctions_api_key,
  google_pubsub_topic.platform_events,
  google_bigquery_table.event_log
  ]
}

# Allow unauthenticated invocations for HTTPS-triggered functions.
resource "google_cloud_run_service_iam_member" "public_invokers" {
  for_each = local.public_functions

  location = google_cloudfunctions2_function.all_functions[each.key].location
  project  = google_cloudfunctions2_function.all_functions[each.key].project
  service  = google_cloudfunctions2_function.all_functions[each.key].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Grant Eventarc permission to invoke event-driven functions.
resource "google_cloud_run_service_iam_member" "eventarc_invokers" {
  for_each = toset(local.event_triggered_function_names)

  location = google_cloudfunctions2_function.all_functions[each.key].location
  project  = google_cloudfunctions2_function.all_functions[each.key].project
  service  = google_cloudfunctions2_function.all_functions[each.key].name
  role     = "roles/run.invoker"
  member   = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-eventarc.iam.gserviceaccount.com"
}

# Allow functions service account to publish to platform events topic
resource "google_pubsub_topic_iam_member" "events_publisher" {
  topic  = google_pubsub_topic.platform_events.name
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:${google_service_account.functions_service_account.email}"
}
