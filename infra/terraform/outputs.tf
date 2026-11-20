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
