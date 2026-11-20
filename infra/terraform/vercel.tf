resource "vercel_project" "web" {
  name         = var.vercel_project_name
  framework    = "nextjs"
  node_version = var.vercel_node_version
}

resource "vercel_project_environment_variables" "web" {
  project_id = vercel_project.web.id

  variables = [
    {
      key       = "NEXT_PUBLIC_SUPABASE_URL"
      value     = local.supabase_url
      target    = ["production", "preview", "development"]
      sensitive = false
    },
    {
      key       = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      value     = data.supabase_apikeys.main.publishable_key
      target    = ["production", "preview", "development"]
      sensitive = false
    },
  ]
}
