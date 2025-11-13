-- Migration: Add missing fields to profiles table
-- Run this in Supabase SQL Editor

-- Add real_name column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS real_name text;

-- Add display_mode column (for leaderboard display)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_mode text DEFAULT 'anonymous';

-- Add show_in_leaderboard column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS show_in_leaderboard boolean DEFAULT true;

-- Add show_account_value column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS show_account_value boolean DEFAULT false;

-- Update existing profiles to have default values
UPDATE public.profiles
SET
  display_mode = COALESCE(display_mode, 'anonymous'),
  show_in_leaderboard = COALESCE(show_in_leaderboard, true),
  show_account_value = COALESCE(show_account_value, false)
WHERE display_mode IS NULL
   OR show_in_leaderboard IS NULL
   OR show_account_value IS NULL;
