# eventarc.tf - Manages event-driven triggers.

# NOTE: For Google Cloud Functions (2nd gen), the Eventarc trigger is
# configured directly within the `google_cloudfunctions2_function` resource
# itself (see functions.tf).

# This file is a placeholder for when you need to create more complex triggers
# or route events to other services like Cloud Run, as your platform evolves.
# For example, you could define a `google_eventarc_trigger` here to send
# GCS events to a Cloud Run service for processing.

# Added (in functions.tf) a Pub/Sub topic `platform-events` and a debug pull
# subscription `platform-events-debug` for inspecting emitted platform events.
# Future: consider adding filtering subscriptions (e.g., regulatory-only,
# onboarding-only) and a sink that streams into BigQuery for audit journaling.