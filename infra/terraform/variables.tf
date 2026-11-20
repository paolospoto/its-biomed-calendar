variable "vercel_api_token" {
  description = "Vercel API token (https://vercel.com/account/tokens)."
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Vercel team slug or ID. Leave null to use the personal account."
  type        = string
  default     = null
}

variable "vercel_project_name" {
  description = "Vercel project name."
  type        = string
  default     = "its-biomed-calendar"
}

variable "vercel_node_version" {
  description = "Node.js version used by Vercel builds and functions."
  type        = string
  default     = "22.x"
}

variable "supabase_access_token" {
  description = "Supabase personal access token (https://supabase.com/dashboard/account/tokens)."
  type        = string
  sensitive   = true
}

variable "supabase_organization_id" {
  description = "Supabase organization slug."
  type        = string
}

variable "supabase_project_name" {
  description = "Supabase project name."
  type        = string
  default     = "its-biomed-calendar"
}

variable "supabase_region" {
  description = "Supabase project region."
  type        = string
  default     = "eu-central-1"
}

variable "supabase_instance_size" {
  description = "Supabase compute size. Leave null for the plan default."
  type        = string
  default     = null
}

variable "supabase_database_password" {
  description = "Password of the Supabase Postgres database."
  type        = string
  sensitive   = true
}
