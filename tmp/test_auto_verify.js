
import { createClient } from '@supabase/supabase-js';

const url = 'https://rfmrqdlizotzxbuiqhrx.supabase.co';
const jwt_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjA4NDEsImV4cCI6MjA5MDAzNjg0MX0.VVxqGqZU9BrzcnyRuN0YIYQC7HAPHDLcOWeOOwqhUnk';

async function testSign() {
  const supabase = createClient(url, jwt_key);
  const email = `test_bypass_${Date.now()}@example.com`;
  
  console.log('Calling auto-verify-signup with:', email);
  const { data, error } = await supabase.functions.invoke('auto-verify-signup', {
    body: { email, password: 'testPassword123!', fullName: 'Bypass Tester' }
  });

  if (error || data?.error) {
    console.error('Error:', error?.message || data?.error);
    return;
  }
  
  console.log('Success! User returned:', data.user?.id);
  
  // Now attempt standard login to see if email confirmation blocks us
  console.log('Attempting standard login...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: 'testPassword123!'
  });
  
  if (signInError) {
    console.error('Login Error:', signInError.message);
  } else {
    console.log('Login Success! Session active:', !!signInData.session);
  }
}
testSign();
