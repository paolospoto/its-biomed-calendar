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

variable "app_url" {
  description = "Public production URL of the web app. Defaults to https://<vercel_project_name>.vercel.app."
  type        = string
  default     = null
}

variable "auth_additional_redirect_urls" {
  description = "Extra URLs allowed as Supabase Auth redirects (e.g. Vercel preview URLs)."
  type        = list(string)
  default     = ["http://localhost:3000/**"]
}

variable "auth_disable_signup" {
  description = "Prevent self sign-up. Users are created by an admin."
  type        = bool
  default     = true
}

variable "auth_email_autoconfirm" {
  description = "Skip email confirmation on sign up."
  type        = bool
  default     = false
}

variable "auth_password_min_length" {
  description = "Minimum password length."
  type        = number
  default     = 8
}

variable "auth_smtp" {
  description = "Custom SMTP server for Auth emails. Required to deliver password recovery emails to users outside the Supabase team."
  type = object({
    host        = string
    port        = number
    user        = string
    password    = string
    admin_email = string
    sender_name = string
  })
  default   = null
  sensitive = true
}
