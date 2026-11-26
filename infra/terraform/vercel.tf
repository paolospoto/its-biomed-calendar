resource "vercel_project" "web" {
  name         = var.vercel_project_name
  framework    = "nextjs"
  node_version = var.vercel_node_version
}

resource "random_password" "extract_function_secret" {
  length  = 48
  special = false
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
    {
      key       = "NEXT_PUBLIC_SITE_URL"
      value     = local.app_url
      target    = ["production"]
      sensitive = false
    },
    {
      key       = "EXTRACT_FUNCTION_SECRET"
      value     = random_password.extract_function_secret.result
      target    = ["production", "preview"]
      sensitive = true
    },
  ]
}
