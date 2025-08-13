# firestore.tf - Manages Firestore database collections

# Ensures the 'clients' collection is created.
# We create a placeholder document because Firestore collections are created
# implicitly when the first document is added. This makes the creation explicit.
resource "google_firestore_document" "clients_collection_placeholder" {
  project    = var.project_id
  collection = "clients"
  document_id = "--placeholder--"
  fields = jsonencode({
    info = {
      stringValue = "This document is a placeholder to ensure the collection exists."
    }
  })
}

# Ensures the 'str_cases' collection is created.
resource "google_firestore_document" "str_cases_collection_placeholder" {
  project    = var.project_id
  collection = "str_cases"
  document_id = "--placeholder--"
  fields = jsonencode({
    info = {
      stringValue = "This document is a placeholder to ensure the collection exists."
    }
  })
}