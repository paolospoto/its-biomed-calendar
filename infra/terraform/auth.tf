locals {
  app_url = coalesce(var.app_url, "https://${var.vercel_project_name}.vercel.app")

  auth_smtp = var.auth_smtp == null ? {} : {
    smtp_host        = var.auth_smtp.host
    smtp_port        = tostring(var.auth_smtp.port)
    smtp_user        = var.auth_smtp.user
    smtp_pass        = var.auth_smtp.password
    smtp_admin_email = var.auth_smtp.admin_email
    smtp_sender_name = var.auth_smtp.sender_name
  }
}

resource "supabase_settings" "auth" {
  project_ref = supabase_project.main.id

  auth = jsonencode(merge({
    site_url                              = local.app_url
    uri_allow_list                        = join(",", concat(["${local.app_url}/**"], var.auth_additional_redirect_urls))
    disable_signup                        = var.auth_disable_signup
    external_email_enabled                = true
    mailer_autoconfirm                    = var.auth_email_autoconfirm
    mailer_secure_email_change_enabled    = true
    password_min_length                   = var.auth_password_min_length
    refresh_token_rotation_enabled        = true
    security_refresh_token_reuse_interval = 10
  }, local.auth_smtp))
}
