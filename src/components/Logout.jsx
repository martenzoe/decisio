import { supabase } from '../lib/supabaseClient';

function Logout() {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Fehler beim Logout:', error.message);
    } else {
      console.log('✅ Ausgeloggt');
    }
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}

export default Logout;

