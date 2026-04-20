import Header from "@/components/app/header";
import { getUser } from "@/lib/dal";

const AppLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const user = await getUser();
  return (
    <div>
      <Header user={user} />
      {children}
    </div>
  );
};

export default AppLayout;
