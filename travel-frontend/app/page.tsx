'use client';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { clearToken } from '@/lib/redux/authSlice';
import { useRouter } from 'next/navigation';
import Hero from '@/components/hero';
import Features from '@/components/features';
import AppShowcase from '@/components/app-showcase';
import QuoteBanner from '@/components/quote-banner';
import { useToast } from '@/hooks/use-toast';

function HomePage() {
  const token = useSelector((state: RootState) => state.auth.token);
  const rehydrated = useSelector(
    (state: RootState) => state.auth._persist?.rehydrated
  );
  const dispatch = useDispatch();
  const router = useRouter();
  const { showToast } = useToast();

  const handleLogout = () => {
    dispatch(clearToken());
    router.push('/');
    showToast('Logged out successfully.', 'success');
  };

  if (!rehydrated) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {token ? (
        <div className="flex justify-center items-center h-screen">
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <div>
              <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Hero />
          <Features />
          <AppShowcase />
          <QuoteBanner />
        </>
      )}
    </>
  );
}

export default HomePage;
