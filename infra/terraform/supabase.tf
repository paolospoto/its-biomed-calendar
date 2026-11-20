resource "supabase_project" "main" {
  organization_id   = var.supabase_organization_id
  name              = var.supabase_project_name
  database_password = var.supabase_database_password
  region            = var.supabase_region
  instance_size     = var.supabase_instance_size

  lifecycle {
    ignore_changes = [database_password]
  }
}

data "supabase_apikeys" "main" {
  project_ref = supabase_project.main.id
}

locals {
  supabase_url = "https://${supabase_project.main.id}.supabase.co"
}
