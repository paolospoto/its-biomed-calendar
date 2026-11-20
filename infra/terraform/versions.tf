terraform {
  required_version = ">= 1.10.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 5.27"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.11"
    }
  }
}
