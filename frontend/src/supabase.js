import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvwilzccesbntpjxszik.supabase.co';
const supabaseKey = 'sb_publishable__RVf67wBL4T0tJ8G28Ae8Q_nglu5H64';

export const supabase = createClient(supabaseUrl, supabaseKey);