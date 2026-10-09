Gopika Birthday Website — Supabase configured

Theme/layout: kept from the supplied BalloonFix ZIP (sage green, cream, blush accents, doctor theme and balloon animation).

Supabase connection
- Project URL is configured in supabase-config.js.
- Browser-safe publishable key is configured there too. Never put a secret/service_role key in frontend files.
- The Save My Wish form now POSTs to public.wishes using the Supabase REST API.
- Run supabase-schema.sql only if the wishes table/policies have not already been created. If you already ran the SQL successfully, do not need to run it again.

Test
1. Upload the contents of this folder to your GitHub Pages repository root (index.html should be at root).
2. Open the website and submit a test wish.
3. Check Supabase Dashboard > Table Editor > wishes.
4. If saving fails, check browser console and Supabase RLS policies/API settings.

Note: This ZIP has not been live-tested against your Supabase project from this environment.
