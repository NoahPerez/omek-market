import { redirect } from 'next/navigation';

import { Footer, Header } from '@/components/organisms';
import { TalkJsProvider } from '@/components/providers';
import { retrieveCustomer } from '@/lib/data/customer';
import { checkRegion } from '@/lib/helpers/check-region';

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const APP_ID = process.env.NEXT_PUBLIC_TALKJS_APP_ID;
  const { locale } = await params;

  const user = await retrieveCustomer();
  const isLoggedIn = Boolean(user?.id && user?.email);
  const regionCheck = await checkRegion(locale);

  if (!regionCheck) {
    return redirect('/');
  }

  if (!APP_ID || !isLoggedIn)
    return (
      <>
        <Header
          isLoggedIn={isLoggedIn}
        />
        {children}
        <Footer />
      </>
    );

  const talkJsUser = user!;
  const userName = [talkJsUser.first_name, talkJsUser.last_name].filter(Boolean).join(' ') || 'User';

  return (
    <TalkJsProvider
      appId={APP_ID}
      userId={talkJsUser.id}
      userName={userName}
      userEmail={talkJsUser.email}
    >
      <Header
        isLoggedIn={isLoggedIn}
        showMessaging
      />
      {children}
      <Footer />
    </TalkJsProvider>
  );
}
