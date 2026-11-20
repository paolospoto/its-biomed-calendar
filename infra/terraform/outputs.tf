output "vercel_project_id" {
  description = "Vercel project ID, used as VERCEL_PROJECT_ID by the Vercel CLI."
  value       = vercel_project.web.id
}

output "supabase_project_ref" {
  description = "Supabase project reference."
  value       = supabase_project.main.id
}

output "supabase_url" {
  description = "Supabase API URL."
  value       = local.supabase_url
}

output "supabase_publishable_key" {
  description = "Supabase publishable key."
  value       = data.supabase_apikeys.main.publishable_key
  sensitive   = true
}

output "app_url" {
  description = "Production URL used as Supabase Auth site URL."
  value       = local.app_url
}

output "supabase_secret_key" {
  description = "Supabase secret key, used by the admin scripts."
  value       = try(data.supabase_apikeys.main.secret_keys[0].api_key, null)
  sensitive   = true
}
